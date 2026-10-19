import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { STEPS_PER_BAR, onsetKey, type NoteEvent } from "@/game/arrangement";
import {
	advanceSeqCursor,
	clampSeqCursor,
	digitToDegree,
	HOME_SEQ_CURSOR,
	moveSeqCursor,
} from "@/game/sequencer";
import { degreeToMidi } from "@/game/theory";
import { auditionNote } from "@/audio/perform";
import { performSlot } from "@/game/combat";
import { CardPreviewButton } from "@/components/CardPreviewButton";
import { useSessionStore } from "@/state/useSessionStore";

/** Steps covered by a held note starting at each onset (for span shading). */
function coverage(row: (NoteEvent | null)[]): boolean[] {
	const covered = Array(row.length).fill(false) as boolean[];
	row.forEach((e, s) => {
		if (e == null) return;
		for (let k = 0; k < e.len && s + k < row.length; k++) covered[s + k] = true;
	});
	return covered;
}

/**
 * Loop sequencer grid. On the prep screen (`editable`) the number row plays
 * scale degrees 1..8 of the current key into the selected cell and steps on,
 * Space skips a cell (silence), and the arrows scrub. In combat the grid is
 * view-only so WASD/QTE keep the keyboard.
 */
export function StepGrid({ editable = false }: { editable?: boolean }) {
	const arrangement = useSessionStore((s) => s.arrangement);
	const fight = useSessionStore((s) => s.fight);
	const performerId = useSessionStore((s) => s.performerId);
	const globalStep = useSessionStore((s) => s.globalStep);
	const playing = useSessionStore((s) => s.playing);
	const toggleNote = useSessionStore((s) => s.toggleNote);
	const [slot] = useState(0);
	const [degree] = useState(1);
	const [len] = useState(1);

	const front = fight.slots.front;
	const byId = new Map(fight.party.map((f) => [f.id, f]));
	const recordingLane = performSlot(fight, performerId);
	const activeLane = Math.min(slot, Math.max(0, front.length - 1));

	const lanes = front.length;
	const bars = arrangement.bars;

	// Keyboard cursor: the cell the number row / Space act on. Kept in a ref so
	// the bound handler always reads the latest position without re-registering.
	const [rawCursor, setRawCursor] = useState(HOME_SEQ_CURSOR);
	const cursorRef = useRef(rawCursor);
	const placeCursor = (next: typeof rawCursor) => {
		cursorRef.current = next;
		setRawCursor(next);
	};
	const cursor = clampSeqCursor(rawCursor, lanes, bars);

	useEffect(() => {
		if (!editable) return;
		const isTyping = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			return t != null && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
		};
		// A modal (e.g. the tutorial guide) owns the keyboard while open.
		const inDialog = () =>
			typeof document !== "undefined" &&
			document.querySelector('[data-slot="dialog-content"]') != null;
		const at = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e) || inDialog()) return null;
			const isArrow = e.key === "ArrowLeft" || e.key === "ArrowRight";
			if (e.repeat && !isArrow) return null;
			const st = useSessionStore.getState();
			const lanesNow = st.fight.slots.front.length;
			if (lanesNow === 0) return null;
			const arr = st.arrangement;
			const barsNow = arr.bars;
			const cur = clampSeqCursor(cursorRef.current, lanesNow, barsNow);
			return { st, arr, cur, lanesNow, barsNow };
		};

		const down = (e: KeyboardEvent) => {
			const ctx = at(e);
			if (!ctx) return;
			const { st, arr, cur, lanesNow, barsNow } = ctx;

			const deg = digitToDegree(e.key);
			if (deg != null) {
				e.preventDefault();
				st.toggleNote(cur.lane, cur.bar, cur.step, { degree: deg, len: 1 });
				const instrument = st.fight.party.find((f) => f.id === st.fight.slots.front[cur.lane])?.instrument;
				auditionNote(degreeToMidi(arr.key, deg, 5), instrument);
				placeCursor(advanceSeqCursor(cur, lanesNow, barsNow));
				return;
			}
			if (e.key === " ") {
				e.preventDefault();
				st.toggleNote(cur.lane, cur.bar, cur.step, null);
				placeCursor(advanceSeqCursor(cur, lanesNow, barsNow));
				return;
			}
			if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
				e.preventDefault();
				placeCursor(moveSeqCursor(cur, e.key === "ArrowRight" ? 1 : -1, lanesNow, barsNow));
			}
		};

		window.addEventListener("keydown", down);
		return () => window.removeEventListener("keydown", down);
	}, [editable]);

	const totalSteps = bars * STEPS_PER_BAR;
	const activeGlobal = playing ? globalStep % totalSteps : -1;

	return (
		<section
			aria-label="Step sequencer"
			className="flex flex-col gap-3.5 border border-border/80 rounded-xl p-3.5 bg-card/60 backdrop-blur-sm">
			{/* Loop audition — the transport is free only outside combat. */}
			<div className="flex items-center justify-end">
				<CardPreviewButton
					id="sequencer"
					arrangement={arrangement}
					layers="all"
					disabled={playing}
					label="Preview"
				/>
			</div>

			{/* Voice & Tooling Selector Bar */}

			{front.length === 0 && (
				<p className="text-muted-foreground text-xs font-mono py-2">
					No attackers placed — seat voices in the front row to activate melody tracks.
				</p>
			)}

			{/* Melody Tracks Grid */}
			<div className="space-y-3">
				{front.map((id, lane) => {
					const attacker = byId.get(id);
					const track = arrangement.tracks[lane];
					if (!attacker || !track) return null;

					return (
						<div
							key={id}
							className={cn(
								"rounded-lg border p-2 transition-all space-y-2",
								lane === recordingLane
									? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)] ring-1 ring-primary/60"
									: lane === activeLane
										? "border-primary/50 bg-primary/5"
										: "border-border/40 bg-muted/5 opacity-70",
							)}>
							<div className="flex items-center justify-between text-xs font-mono">
								<span className="font-bold flex items-center gap-1.5">
									<span className="px-1.5 py-0.5 rounded text-[10px] bg-muted/80 border border-border/60">
										[{lane + 1}]
									</span>
									{attacker.name}{" "}
									<span className="text-muted-foreground font-normal">({attacker.instrument})</span>
								</span>
							</div>

							{track.map((row, bar) => {
								const covered = coverage(row);
								return (
									<div
										key={bar}
										className="flex items-center gap-2">
										<span className="w-12 shrink-0 text-left font-mono text-[10px] text-muted-foreground font-semibold">
											Bar {bar + 1}
										</span>

										<div className="grid flex-1 grid-cols-16 gap-1">
											{row.map((v, step) => {
												const g = bar * STEPS_PER_BAR + step;
												const isPlayhead = g === activeGlobal;
												const isCursor =
													editable && cursor.lane === lane && cursor.bar === bar && cursor.step === step;
												const isQuarter = step % 4 === 0;

												// Potency calculation for note
												let opacityClass = "opacity-100";
												if (v != null) {
													const k = onsetKey(lane, bar, step, v);
													const pot = fight.potency[k] ?? 1;
													if (pot <= 0.3) opacityClass = "opacity-50";
													else if (pot <= 0.6) opacityClass = "opacity-75";
												}

												return (
													<button
														key={step}
														type="button"
														onClick={() => {
															if (editable) placeCursor({ lane, bar, step });
															toggleNote(lane, bar, step, v == null ? { degree, len } : null);
														}}
														title={`${attacker.name} Bar ${bar + 1} Step ${step + 1}${
															v != null ? `: Degree ${v.degree} (hold ${v.len}t)` : ""
														}`}
														className={cn(
															"h-7 rounded border font-mono text-[10px] font-bold transition-all relative flex items-center justify-center cursor-pointer",
															v != null
																? `border-primary bg-primary text-primary-foreground shadow-sm ${opacityClass}`
																: covered[step]
																	? "border-primary/40 bg-primary/20 text-primary-foreground/70"
																	: isQuarter
																		? "border-border bg-background/80 hover:bg-muted"
																		: "border-border/40 bg-background/40 hover:bg-muted/50",
															isCursor &&
																"ring-2 ring-foreground ring-offset-2 ring-offset-background z-20",
															isPlayhead &&
																"ring-2 ring-primary ring-offset-1 ring-offset-background scale-105 z-10",
															isPlayhead &&
																v != null &&
																"animate-target-pulse shadow-[0_0_12px_rgba(var(--primary),0.8)]",
														)}>
														{v != null ? (v.len > 1 ? `${v.degree}·${v.len}` : v.degree) : ""}
														{isPlayhead && (
															<span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
														)}
													</button>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		</section>
	);
}
