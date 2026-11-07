import { useSessionStore } from "@/state/useSessionStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardPreviewButton } from "@/components/CardPreviewButton";
import { setGroove } from "@/game/arrangement";
import { MAX_SWING, countGrooveHits, describeGrooveEffect } from "@/game/groove";
import { MAX_GROOVE_CARDS } from "@/game/loadout";
import { GrooveMatrix } from "@/components/GrooveMatrix";
import { rigsForBank } from "@/data/beats";

/**
 * Pick: page the matrix to a bank and tap pads, or load a curated rig. Save
 * the result as a bottle. Tweak: nudge the swing feel. Compose lives in the
 * Studio.
 */
export function GroovePicker() {
	const arrangement = useSessionStore((s) => s.arrangement);
	const groove = arrangement.groove;
	const pendingGroove = useSessionStore((s) => s.pendingGroove);
	const loadout = useSessionStore((s) => s.loadout);
	const selectGrooveCard = useSessionStore((s) => s.selectGrooveCard);
	const toggleLoadoutGroove = useSessionStore((s) => s.toggleLoadoutGroove);
	const tweakGroove = useSessionStore((s) => s.tweakGroove);
	const toStudio = useSessionStore((s) => s.toStudio);

	const view = pendingGroove ?? groove;
	const presets = rigsForBank(view.bankId);
	const bagged = (id: string) => loadout.grooves.includes(id);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Drum Rig · Bag {loadout.grooves.length}/{MAX_GROOVE_CARDS}
				</span>
				<Button variant="outline" size="sm" onClick={toStudio} className="text-xs">
					Studio · Compose ✎
				</Button>
			</div>

			<GrooveMatrix />

			{/* Curated rigs for the bank on screen */}
			<div className="flex flex-col gap-2">
				<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
					Ready-made rigs
				</span>
				<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
					{presets.map((g) => {
						const equipped = groove.id === g.id;
						const pending = pendingGroove?.id === g.id;
						const inBag = bagged(g.id);
						const silent = countGrooveHits(g) === 0;
						return (
							<div
								key={g.id}
								className={cn(
									"flex flex-col gap-2 rounded-lg border p-2.5 transition-all",
									equipped
										? "border-primary bg-primary/10 ring-1 ring-primary/60"
										: pending
											? "border-primary/60 bg-primary/5"
											: "border-border/60 bg-card/40",
								)}>
								<button
									type="button"
									onClick={() => selectGrooveCard(g.id)}
									title={g.blurb}
									className="flex flex-col items-start gap-1 text-left">
									<span className="flex w-full items-center justify-between">
										<span className="text-sm font-semibold">{g.name}</span>
										{pending ? (
											<span className="text-[10px] font-mono uppercase text-primary">
												next loop
											</span>
										) : null}
									</span>
									<span className="text-[11px] leading-snug text-muted-foreground">
										{silent ? "Silent rig" : describeGrooveEffect(g)}
									</span>
								</button>
								<div className="flex items-center gap-1.5">
									<CardPreviewButton
										id={`groove:${g.id}`}
										arrangement={setGroove(arrangement, g)}
										layers="drums"
									/>
									<Button
										type="button"
										variant={inBag ? "secondary" : "outline"}
										size="sm"
										className="h-6 px-2 text-[11px]"
										onClick={() => toggleLoadoutGroove(g.id)}
										title="Carry this rig into combat">
										{inBag ? "In bag ✓" : "+ Bag"}
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Swing feel */}
			<div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
				<label className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
					<span>Swing: {view.swing.toFixed(2)}</span>
					<input
						type="range"
						min={0}
						max={MAX_SWING}
						step={0.05}
						value={view.swing}
						onChange={(e) => tweakGroove({ swing: Number(e.target.value) })}
						className="w-28 accent-primary"
					/>
				</label>
				<span className="text-[11px] text-muted-foreground">
					Every odd sixteenth lags a little. Banks seed their own feel.
				</span>
			</div>
		</div>
	);
}
