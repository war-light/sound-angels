import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/state/useSessionStore";
import {
	CLIP_TIERS,
	DRUM_VOICES,
	countGrooveHits,
	type ClipSteps,
	type DrumVoice,
} from "@/game/groove";

const VOICE_LABELS: Record<DrumVoice, string> = {
	kick: "Kick",
	snare: "Snare",
	hat: "Hats",
	perc: "Perc",
};

/** 16 tiny ticks: the clip's shape at a glance, accented where it lands hard. */
function Sparkline({ steps }: { steps: ClipSteps }) {
	return (
		<span
			className="flex h-4 items-end gap-px"
			aria-hidden>
			{steps.map((hit, i) => {
				const vel = hit?.vel ?? 0;
				return (
					<span
						key={i}
						className={cn(
							"w-[3px] rounded-[1px]",
							vel <= 0
								? "h-[3px] bg-muted-foreground/30"
								: vel >= 1
									? "h-4 bg-primary"
									: vel >= 0.7
										? "h-3 bg-primary/80"
										: "h-2 bg-primary/50",
							hit?.roll && "bg-accent",
						)}
					/>
				);
			})}
		</span>
	);
}

/**
 * The 4x4 groove matrix: columns are voices, rows are complexity tiers, and
 * each pad is one voice's complete 16-step bar. Tapping a pad swaps that
 * column's clip. Banks page the whole grid; kits recolor it.
 */
export function GrooveMatrix({ compact = false }: { compact?: boolean }) {
	const arrangement = useSessionStore((s) => s.arrangement);
	const banks = useSessionStore((s) => s.banks);
	const kits = useSessionStore((s) => s.kits);
	const pendingGroove = useSessionStore((s) => s.pendingGroove);
	const selectPad = useSessionStore((s) => s.selectPad);
	const selectBank = useSessionStore((s) => s.selectBank);
	const selectKit = useSessionStore((s) => s.selectKit);

	// Edits queue in combat: the grid previews what lands on the next loop.
	const view = pendingGroove ?? arrangement.groove;
	const bank = banks.find((b) => b.id === view.bankId) ?? banks[0];
	const kit = kits.find((k) => k.id === view.kitId) ?? kits[0];
	const queued = pendingGroove != null;
	const silent = countGrooveHits(view) === 0;

	return (
		<section
			aria-label="Groove matrix"
			className={cn(
				"flex flex-col gap-3 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm",
				compact ? "p-2.5" : "p-3.5",
			)}>
			{/* Bank pages */}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-1">
					{banks.map((b) => {
						const active = b.id === view.bankId;
						return (
							<Button
								key={b.id}
								type="button"
								variant={active ? "default" : "outline"}
								size="sm"
								className="h-6 px-2 text-[11px]"
								title={`${b.archetype} · ${b.bpmHint} bpm · ${b.genres.join(", ")}`}
								onClick={() => selectBank(b.id)}>
								{b.name}
							</Button>
						);
					})}
				</div>
				<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
					{queued ? "next loop" : `${bank.bpmHint} bpm`}
				</span>
			</div>

			{/* 4x4 pads: voice columns x complexity tiers */}
			<div className="grid grid-cols-[3.5rem_repeat(4,minmax(0,1fr))] gap-1">
				<span />
				{DRUM_VOICES.map((voice) => (
					<span
						key={voice}
						className="text-center text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
						{VOICE_LABELS[voice]}
					</span>
				))}

				{CLIP_TIERS.map((tierLabel, tier) => (
					<span
						key={tierLabel}
						className="contents">
						<span className="flex items-center text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
							{tierLabel}
						</span>
						{DRUM_VOICES.map((voice) => {
							const clip = bank?.clips[voice][tier];
							const active = view.picks[voice] === tier;
							return (
								<Button
									key={voice}
									type="button"
									variant={active ? "default" : "outline"}
									size="sm"
									aria-label={`${VOICE_LABELS[voice]} ${tierLabel} pattern`}
									aria-pressed={active}
									title={`${VOICE_LABELS[voice]} · ${tierLabel}`}
									onClick={() => selectPad(voice, tier as 0 | 1 | 2 | 3)}
									className={cn(
										"h-9 justify-center px-1",
										active && queued && "ring-1 ring-primary/60",
									)}>
									<Sparkline steps={clip?.steps ?? []} />
								</Button>
							);
						})}
					</span>
				))}
			</div>

			{/* Kits: timbre + combat effect */}
			<div className="flex flex-wrap items-center gap-1 border-t border-border/60 pt-2.5">
				<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
					Kit
				</span>
				{kits.map((k) => (
					<Button
						key={k.id}
						type="button"
						variant={k.id === view.kitId ? "secondary" : "ghost"}
						size="sm"
						className="h-6 px-2 text-[11px]"
						title={k.blurb}
						onClick={() => selectKit(k.id)}>
						{k.name}
					</Button>
				))}
			</div>

			{silent && (
				<p className="text-[11px] text-muted-foreground">
					Silent rig: every column rests. The kit still parries.
				</p>
			)}
			{kit && !silent && <span className="sr-only">Equipped kit: {kit.name}</span>}
		</section>
	);
}
