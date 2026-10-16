import { useState } from "react";
import { useSessionStore } from "@/state/useSessionStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playDrumHit } from "@/audio/sfx";
import {
	GROOVE_STEPS,
	GROOVE_VOICES,
	keepsHit,
	type GrooveVoice,
} from "@/game/groove";

const LABELS: Record<GrooveVoice, string> = {
	kick: "Kick",
	snare: "Snare",
	hat: "Hat",
};

/**
 * Compose: the full step sequencer, outside combat. Build the equipped groove
 * a step at a time, bottle it under a name, and equip bottles like any card.
 */
export function StudioScreen() {
	const groove = useSessionStore((s) => s.arrangement.groove);
	const grooveBottles = useSessionStore((s) => s.grooveBottles);
	const toPrep = useSessionStore((s) => s.toPrep);
	const toggleGrooveStep = useSessionStore((s) => s.toggleGrooveStep);
	const saveGrooveBottle = useSessionStore((s) => s.saveGrooveBottle);
	const selectGrooveCard = useSessionStore((s) => s.selectGrooveCard);
	const deleteGrooveBottle = useSessionStore((s) => s.deleteGrooveBottle);
	const [bottleName, setBottleName] = useState("");

	const toggle = (voice: GrooveVoice, step: number) => {
		const wasOn = groove.cell[voice].includes(step);
		toggleGrooveStep(voice, step);
		if (!wasOn) playDrumHit(voice);
	};

	const bottle = () => {
		saveGrooveBottle(bottleName);
		setBottleName("");
	};

	return (
		<div className="flex flex-col gap-6 p-4 sm:p-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
			<header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={toPrep}
						className="text-muted-foreground hover:text-foreground">
						← Prep
					</Button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Studio</h1>
						<p className="text-xs text-muted-foreground">
							Compose the groove beat by beat, then bottle it to equip like a card.
						</p>
					</div>
				</div>
				<div className="flex flex-col items-end">
					<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
						Editing
					</span>
					<span className="text-sm font-semibold">
						{groove.name}{" "}
						<span className="text-xs font-normal text-muted-foreground">
							({groove.source})
						</span>
					</span>
				</div>
			</header>

			{/* Step sequencer */}
			<section
				aria-label="Groove step sequencer"
				className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/60 p-3.5 backdrop-blur-sm">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Groove Steps
					</span>
					<span className="text-[11px] text-muted-foreground">
						Click to place hits · faded hits are thinned out by Density
					</span>
				</div>

				{GROOVE_VOICES.map((voice) => (
					<div key={voice} className="flex items-center gap-2">
						<span className="w-12 shrink-0 text-left font-mono text-[10px] font-semibold text-muted-foreground">
							{LABELS[voice]}
						</span>
						<div className="grid flex-1 grid-cols-16 gap-1">
							{Array.from({ length: GROOVE_STEPS }, (_, step) => {
								const placed = groove.cell[voice].includes(step);
								const sounds = placed && keepsHit(step, groove.density);
								const isQuarter = step % 4 === 0;
								return (
									<button
										key={step}
										type="button"
										onClick={() => toggle(voice, step)}
										title={`${LABELS[voice]} step ${step + 1}`}
										className={cn(
											"h-7 rounded border transition-all",
											sounds
												? "border-primary bg-primary shadow-xs"
												: placed
													? "border-primary/40 bg-primary/25"
													: isQuarter
														? "border-border bg-background/80 hover:bg-muted"
														: "border-border/40 bg-background/40 hover:bg-muted/50",
										)}
									/>
								);
							})}
						</div>
					</div>
				))}
			</section>

			{/* Bottling + bottle shelf */}
			<section className="grid gap-4 md:grid-cols-2">
				<div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/60 p-3.5">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Bottle it
					</span>
					<p className="text-[11px] text-muted-foreground">
						Save the current groove as a bottle. Bottles equip just like the cards.
					</p>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={bottleName}
							onChange={(e) => setBottleName(e.target.value)}
							placeholder="Groove name…"
							className="min-w-0 flex-1 rounded border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
						/>
						<Button size="sm" onClick={bottle} disabled={bottleName.trim().length === 0}>
							Bottle
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/60 p-3.5">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Bottle shelf ({grooveBottles.length})
					</span>
					{grooveBottles.length === 0 ? (
						<p className="text-[11px] text-muted-foreground">
							No bottles yet. Compose a groove above and bottle it.
						</p>
					) : (
						<ul className="flex flex-col gap-1.5">
							{grooveBottles.map((b) => {
								const equipped = groove.id === b.id;
								return (
									<li key={b.id} className="flex items-center justify-between gap-2">
										<span className="truncate text-xs font-mono">
											{equipped ? "● " : ""}
											{b.name}
										</span>
										<div className="flex shrink-0 items-center gap-1">
											<Button
												variant="outline"
												size="sm"
												disabled={equipped}
												onClick={() => selectGrooveCard(b.id)}>
												Equip
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-muted-foreground hover:text-destructive"
												onClick={() => deleteGrooveBottle(b.id)}>
												✕
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>
		</div>
	);
}
