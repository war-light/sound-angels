import { DEFAULT_KEY, degreeToMidi, romanToChord, type Key } from "./theory.ts";

export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type MelodyStyle =
	| "fast-busy"
	| "slow-lyrical"
	| "pop-balanced"
	| "arpeggio"
	| "spacious-ambient"
	| "undertale-anthem"
	| "undertale-boss"
	| "undertale-lullaby";

export interface MelodyNote {
	bar: number;
	step: number;
	degree: ScaleDegree;
	midi: number; // Explicit pitch for voice leading
	len: number;
	style: MelodyStyle;
}

export const STEPS_PER_BAR = 16;

/* ---------------------------------------------------------
 * Transition Matrices
 * --------------------------------------------------------- */

const STEPWISE_DEGREE_TRANSITIONS: Record<ScaleDegree, Partial<Record<ScaleDegree, number>>> = {
	1: { 2: 0.35, 3: 0.2, 5: 0.15, 7: 0.25, 1: 0.05 },
	2: { 1: 0.4, 3: 0.4, 5: 0.1, 2: 0.1 },
	3: { 4: 0.35, 2: 0.3, 5: 0.2, 1: 0.1, 3: 0.05 },
	4: { 3: 0.6, 5: 0.25, 2: 0.15 },
	5: { 6: 0.3, 4: 0.25, 1: 0.25, 3: 0.1, 5: 0.1 },
	6: { 5: 0.5, 7: 0.3, 1: 0.2 },
	7: { 1: 0.7, 6: 0.2, 5: 0.1 },
};

const ARPEGGIO_DEGREE_TRANSITIONS: Record<ScaleDegree, Partial<Record<ScaleDegree, number>>> = {
	1: { 3: 0.45, 5: 0.35, 2: 0.1, 7: 0.1 },
	2: { 1: 0.5, 4: 0.5 },
	3: { 5: 0.45, 1: 0.35, 4: 0.1, 2: 0.1 },
	4: { 6: 0.5, 1: 0.3, 2: 0.2 },
	5: { 1: 0.4, 3: 0.35, 7: 0.15, 5: 0.1 },
	6: { 1: 0.5, 4: 0.5 },
	7: { 2: 0.5, 5: 0.5 },
};

/** High-energy JRPG transitions: bold 5->1 and 1->5 leaps followed by cascading runs */
const UNDERTALE_DEGREE_TRANSITIONS: Record<ScaleDegree, Partial<Record<ScaleDegree, number>>> = {
	1: { 5: 0.35, 2: 0.25, 3: 0.2, 7: 0.1, 6: 0.1 },
	2: { 1: 0.45, 3: 0.35, 5: 0.2 },
	3: { 2: 0.35, 5: 0.35, 4: 0.15, 6: 0.15 },
	4: { 3: 0.7, 5: 0.2, 2: 0.1 },
	5: { 1: 0.45, 6: 0.3, 4: 0.15, 3: 0.1 },
	6: { 5: 0.6, 1: 0.25, 7: 0.15 },
	7: { 1: 0.8, 6: 0.2 },
};

/** Pentatonic-focused transitions for music box / nostalgic themes (His Theme / Memory) */
const PENTATONIC_DEGREE_TRANSITIONS: Record<ScaleDegree, Partial<Record<ScaleDegree, number>>> = {
	1: { 2: 0.35, 3: 0.3, 5: 0.25, 6: 0.1 },
	2: { 1: 0.5, 3: 0.5 },
	3: { 5: 0.4, 2: 0.3, 1: 0.3 },
	4: { 3: 1.0 }, // 4 acts strictly as an unstable neighbor resolving down to 3
	5: { 6: 0.4, 3: 0.3, 1: 0.3 },
	6: { 5: 0.6, 1: 0.4 },
	7: { 1: 1.0 }, // 7 resolves directly up to 1
};

/* ---------------------------------------------------------
 * Style Configurations
 * --------------------------------------------------------- */

export interface StyleConfig {
	rhythmTransitions: Record<number, Partial<Record<number, number>>>;
	degreeTransitions: Record<ScaleDegree, Partial<Record<ScaleDegree, number>>>;
	chordTonePull: number;
	restChance: number;
	defaultLen: number;
	minPitch: number;
	maxPitch: number;
	useMotifs?: boolean;
}

export const STYLES: Record<MelodyStyle, StyleConfig> = {
	"fast-busy": {
		rhythmTransitions: {
			1: { 1: 0.5, 2: 0.4, 4: 0.1 },
			2: { 1: 0.4, 2: 0.45, 4: 0.15 },
			4: { 2: 0.7, 1: 0.3 },
		},
		degreeTransitions: STEPWISE_DEGREE_TRANSITIONS,
		chordTonePull: 1.5,
		restChance: 0.04,
		defaultLen: 2,
		minPitch: 60,
		maxPitch: 84,
	},
	"slow-lyrical": {
		rhythmTransitions: {
			4: { 4: 0.3, 8: 0.5, 12: 0.2 },
			8: { 4: 0.4, 8: 0.4, 16: 0.2 },
			12: { 4: 0.8, 8: 0.2 },
			16: { 8: 0.6, 16: 0.4 },
		},
		degreeTransitions: STEPWISE_DEGREE_TRANSITIONS,
		chordTonePull: 3.0,
		restChance: 0.18,
		defaultLen: 8,
		minPitch: 57,
		maxPitch: 79,
	},
	"pop-balanced": {
		rhythmTransitions: {
			2: { 2: 0.5, 4: 0.4, 6: 0.1 },
			4: { 4: 0.4, 2: 0.35, 8: 0.25 },
			6: { 2: 0.7, 4: 0.3 },
			8: { 4: 0.6, 2: 0.4 },
		},
		degreeTransitions: STEPWISE_DEGREE_TRANSITIONS,
		chordTonePull: 1.8,
		restChance: 0.1,
		defaultLen: 4,
		minPitch: 60,
		maxPitch: 81,
		useMotifs: true,
	},
	arpeggio: {
		rhythmTransitions: {
			1: { 1: 0.7, 2: 0.3 },
			2: { 1: 0.5, 2: 0.5 },
		},
		degreeTransitions: ARPEGGIO_DEGREE_TRANSITIONS,
		chordTonePull: 3.5,
		restChance: 0.02,
		defaultLen: 1,
		minPitch: 55,
		maxPitch: 84,
	},
	"spacious-ambient": {
		rhythmTransitions: {
			4: { 8: 0.6, 12: 0.4 },
			8: { 8: 0.4, 16: 0.4, 4: 0.2 },
			12: { 8: 0.5, 16: 0.5 },
			16: { 16: 0.5, 8: 0.5 },
		},
		degreeTransitions: STEPWISE_DEGREE_TRANSITIONS,
		chordTonePull: 2.2,
		restChance: 0.35,
		defaultLen: 8,
		minPitch: 55,
		maxPitch: 79,
	},
	"undertale-anthem": {
		rhythmTransitions: {
			2: { 3: 0.6, 2: 0.25, 4: 0.15 },
			3: { 3: 0.65, 2: 0.35 },
			4: { 3: 0.6, 2: 0.4 },
		},
		degreeTransitions: UNDERTALE_DEGREE_TRANSITIONS,
		chordTonePull: 2.5,
		restChance: 0.04,
		defaultLen: 3,
		minPitch: 60,
		maxPitch: 84,
		useMotifs: true,
	},
	"undertale-boss": {
		rhythmTransitions: {
			1: { 1: 0.85, 2: 0.15 },
			2: { 1: 0.7, 2: 0.3 },
		},
		degreeTransitions: UNDERTALE_DEGREE_TRANSITIONS,
		chordTonePull: 2.0,
		restChance: 0.02,
		defaultLen: 1,
		minPitch: 57,
		maxPitch: 81,
		useMotifs: true,
	},
	"undertale-lullaby": {
		rhythmTransitions: {
			2: { 2: 0.4, 4: 0.45, 8: 0.15 },
			4: { 2: 0.35, 4: 0.45, 8: 0.2 },
			8: { 4: 0.7, 8: 0.3 },
		},
		degreeTransitions: PENTATONIC_DEGREE_TRANSITIONS,
		chordTonePull: 3.2,
		restChance: 0.12,
		defaultLen: 4,
		minPitch: 67,
		maxPitch: 88,
		useMotifs: true,
	},
};

/* ---------------------------------------------------------
 * Music Theory Helpers
 * --------------------------------------------------------- */

function wrapDegree(d: number): ScaleDegree {
	const mod = (((d - 1) % 7) + 7) % 7;
	return (mod + 1) as ScaleDegree;
}

function findDegreeForPitchClass(key: Key, pc: number): ScaleDegree {
	for (let d = 1; d <= 7; d++) {
		const midi = degreeToMidi(key, d as ScaleDegree);
		if (((midi % 12) + 12) % 12 === pc) {
			return d as ScaleDegree;
		}
	}
	return 1;
}

/** Determines whether the melodic step between two degrees is intended to ascend or descend */
function getDiatonicDirection(from: ScaleDegree, to: ScaleDegree): 1 | -1 | 0 {
	if (from === to) return 0;
	// Idiomatic melodic directions
	if (from === 1 && to === 7) return -1; // Downward leading tone
	if (from === 7 && to === 1) return 1; // Upward leading tone resolution
	if (from === 1 && to === 5) return 1; // Bold ascending leap
	if (from === 4 && to === 3) return -1; // Tendency resolution
	if (from === 6 && to === 5) return -1; // Tendency resolution
	if (from === 2 && to === 1) return -1; // Stepwise resolution
	return to > from ? 1 : -1;
}

interface MotifMemoryItem {
	degreeOffsetFromRoot: number;
	len: number;
	isRest: boolean;
}

/* ---------------------------------------------------------
 * Generator
 * --------------------------------------------------------- */

export class MarkovMelodyGenerator {
	private rng: () => number;
	private currentDegree: ScaleDegree = 1;
	private currentMidi = 60;
	private currentLen = 4;
	private lastMidiInterval = 0; // Tracks previous leap for leap-recovery
	public style: MelodyStyle = "pop-balanced";

	constructor(style: MelodyStyle = "pop-balanced", rng: () => number = Math.random) {
		this.rng = rng;
		this.setStyle(style);
	}

	public setStyle(style: MelodyStyle): void {
		this.style = style;
		this.currentLen = STYLES[style].defaultLen;
	}

	private pickWeighted<T extends number>(
		row: Partial<Record<T, number>> | undefined,
		fallbackDefault: T,
		weightMultiplier?: (candidate: T) => number,
	): T {
		if (!row) return fallbackDefault;

		let total = 0;
		for (const keyStr in row) {
			const candidate = Number(keyStr) as T;
			const weight = row[candidate] ?? 0;
			const mult = weightMultiplier ? weightMultiplier(candidate) : 1;
			total += weight * mult;
		}

		if (total <= 0) return fallbackDefault;

		let roll = this.rng() * total;
		for (const keyStr in row) {
			const candidate = Number(keyStr) as T;
			const weight = row[candidate] ?? 0;
			const mult = weightMultiplier ? weightMultiplier(candidate) : 1;
			roll -= weight * mult;
			if (roll <= 0) return candidate;
		}

		return fallbackDefault;
	}

	/**
	 * Voice-leading resolver: Preserves intended leap direction (preventing 1->5 from inverting downward)
	 * and bounds melodies within an expressive, singable tessitura.
	 */
	private resolveNearestMidi(
		key: Key,
		targetDegree: ScaleDegree,
		minPitch: number,
		maxPitch: number,
		intendedDirection: 1 | -1 | 0,
	): number {
		const baseMidi = degreeToMidi(key, targetDegree);
		const targetPitchClass = ((baseMidi % 12) + 12) % 12;

		const candidates: number[] = [];
		for (let midi = targetPitchClass; midi <= 127; midi += 12) {
			if (midi >= minPitch && midi <= maxPitch) {
				candidates.push(midi);
			}
		}

		if (candidates.length === 0) return baseMidi;

		const registerCenter = (minPitch + maxPitch) / 2;

		return candidates.reduce((best, curr) => {
			const scoreCandidate = (pitch: number) => {
				const diff = pitch - this.currentMidi;
				let cost = Math.abs(diff);

				// Direction matching: prevent leaps from inverting into awkward intervals
				if (intendedDirection > 0 && diff < 0) cost += 8.0;
				if (intendedDirection < 0 && diff > 0) cost += 8.0;

				// Gentle pull toward the center of the register to prevent extreme edge hugging
				cost += Math.abs(pitch - registerCenter) * 0.15;

				return cost;
			};

			return scoreCandidate(curr) < scoreCandidate(best) ? curr : best;
		});
	}

	/** Generates rhythm lengths cleanly filling 16 steps without awkward end-of-bar limps. */
	private barRhythms(config: StyleConfig): number[] {
		const lengths: number[] = [];
		let remaining = STEPS_PER_BAR;

		while (remaining > 0) {
			const validTransitions: Partial<Record<number, number>> = {};
			const rawTransitions =
				config.rhythmTransitions[this.currentLen] ??
				config.rhythmTransitions[config.defaultLen] ??
				{};

			for (const lenStr in rawTransitions) {
				const candidateLen = Number(lenStr);
				if (candidateLen <= remaining) {
					validTransitions[candidateLen] = rawTransitions[candidateLen];
				}
			}

			// Clean fallback: avoid stray 16th-note blips at the barline
			if (Object.keys(validTransitions).length === 0) {
				// If remaining cleanly matches a standard length in the style, use it
				if (remaining in config.rhythmTransitions || remaining === 2 || remaining === 4) {
					lengths.push(remaining);
					this.currentLen = remaining;
					break;
				}

				// Otherwise, sustain the previous note to fill the bar naturally
				if (lengths.length > 0) {
					lengths[lengths.length - 1] += remaining;
					break;
				}

				lengths.push(remaining);
				break;
			}

			const nextLen = this.pickWeighted(validTransitions, remaining as any);
			lengths.push(nextLen);
			this.currentLen = nextLen;
			remaining -= nextLen;
		}

		return lengths;
	}

	generate(
		chords: string[],
		key: Key = DEFAULT_KEY,
		loops = 1,
		overrideStyle?: MelodyStyle,
	): MelodyNote[] {
		if (chords.length === 0 || loops <= 0) return [];
		if (overrideStyle) this.setStyle(overrideStyle);

		const config = STYLES[this.style];
		const notes: MelodyNote[] = [];
		let bar = 0;
		let cachedMotif: MotifMemoryItem[] = [];

		for (let loop = 0; loop < loops; loop++) {
			for (const chord of chords) {
				const chordMidis = romanToChord(key, chord);
				const chordTones = new Set(chordMidis.map((m) => ((m % 12) + 12) % 12));

				// Extract root pitch class and scale degree for harmonic alignment
				const rootPc = chordMidis.length > 0 ? ((chordMidis[0] % 12) + 12) % 12 : 0;
				const chordRootDegree = findDegreeForPitchClass(key, rootPc);

				// 4-Bar Phrasing: 0 = Statement, 1 = Response, 2 = Departure, 3 = Cadence
				const phraseBar = bar % 4;

				let rhythms: number[];
				const isMotifResponse = config.useMotifs && phraseBar === 1 && cachedMotif.length > 0;

				if (isMotifResponse) {
					// Bar 1: Re-use Bar 0's rhythmic motif
					rhythms = cachedMotif.map((m) => m.len);
				} else {
					rhythms = this.barRhythms(config);
					if (config.useMotifs && phraseBar === 0) {
						cachedMotif = [];
					}
				}

				let step = 0;
				for (let noteIdx = 0; noteIdx < rhythms.length; noteIdx++) {
					const len = rhythms[noteIdx];
					const isPrimaryBeat = step === 0 || step === 8;
					const isSecondaryBeat = step === 4 || step === 12;
					const isCadenceStep = config.useMotifs && phraseBar === 3 && step >= 8;

					let isRest = false;
					if (isMotifResponse) {
						isRest = cachedMotif[noteIdx]?.isRest ?? false;
					} else {
						isRest = step > 0 && this.rng() < config.restChance;
					}

					if (!isRest) {
						let metricWeight = isPrimaryBeat
							? config.chordTonePull * 1.8
							: isSecondaryBeat
								? config.chordTonePull * 1.3
								: config.chordTonePull;

						if (isCadenceStep) metricWeight *= 2.5;

						// Leap recovery: if previous note leaped wide (>= 5 semitones), favor stepping back
						const isLeapRecovery = Math.abs(this.lastMidiInterval) >= 5;
						const recoveryDir = this.lastMidiInterval > 0 ? -1 : 1;

						// In Bar 1, sequence the motif by transposing Bar 0's contour to the current chord
						const motifTargetDegree = isMotifResponse
							? wrapDegree(chordRootDegree + cachedMotif[noteIdx].degreeOffsetFromRoot)
							: null;

						this.currentDegree = this.pickWeighted(
							config.degreeTransitions[this.currentDegree],
							1,
							(candidateDegree) => {
								const candidateMidi = degreeToMidi(key, candidateDegree);
								const pc = ((candidateMidi % 12) + 12) % 12;
								let mult = 1.0;

								// Chord tone vs non-chord tone weighting
								if (chordTones.has(pc)) {
									mult *= metricWeight;
								} else if (isPrimaryBeat) {
									// Strongly suppress non-chord tones on main downbeats (eliminates avoid-note clashes)
									mult *= 0.15;
								} else if (isSecondaryBeat) {
									mult *= 0.4;
								}

								// Motif melodic sequence reinforcement
								if (motifTargetDegree !== null) {
									if (candidateDegree === motifTargetDegree) mult *= 3.5;
									else if (Math.abs(candidateDegree - motifTargetDegree) === 1) mult *= 1.5;
								}

								// Cadence bias: resolve to the chord's root or tonic degree if harmonic
								if (isCadenceStep) {
									if (pc === rootPc) mult *= 4.0;
									else if (candidateDegree === 1 && chordTones.has(pc)) mult *= 3.0;
								}

								// Leap recovery: bias toward stepwise motion in the opposite direction of the leap
								if (isLeapRecovery) {
									const stepDir = getDiatonicDirection(this.currentDegree, candidateDegree);
									if (stepDir === recoveryDir) mult *= 1.8;
								}

								return mult;
							},
						);

						// Determine expected diatonic direction to prevent leap inversion
						const intendedDir = getDiatonicDirection(this.currentDegree, this.currentDegree);
						const nextMidi = this.resolveNearestMidi(
							key,
							this.currentDegree,
							config.minPitch,
							config.maxPitch,
							intendedDir,
						);

						this.lastMidiInterval = nextMidi - this.currentMidi;
						this.currentMidi = nextMidi;

						notes.push({
							bar,
							step,
							degree: this.currentDegree,
							midi: this.currentMidi,
							len,
							style: this.style,
						});

						if (config.useMotifs && phraseBar === 0) {
							cachedMotif.push({
								degreeOffsetFromRoot: this.currentDegree - chordRootDegree,
								len,
								isRest: false,
							});
						}
					} else {
						if (config.useMotifs && phraseBar === 0) {
							cachedMotif.push({
								degreeOffsetFromRoot: 0,
								len,
								isRest: true,
							});
						}
					}

					step += len;
				}
				bar += 1;
			}
		}

		return notes;
	}
}
