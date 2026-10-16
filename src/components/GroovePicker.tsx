import { useSessionStore } from "@/state/useSessionStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardPreviewButton } from "@/components/CardPreviewButton";
import { drumOnly } from "@/game/arrangement";
import { MAX_SWING, describeGrooveEffect } from "@/game/groove";
import { MAX_GROOVE_CARDS } from "@/game/loadout";

/**
 * Pick: equip one groove card (or bottle) before battle. Tweak: nudge the
 * equipped groove's swing and density. Compose lives in the Studio.
 */
export function GroovePicker() {
	const arrangement = useSessionStore((s) => s.arrangement);
	const groove = arrangement.groove;
	const grooveChoices = useSessionStore((s) => s.grooveChoices);
	const loadout = useSessionStore((s) => s.loadout);
	const pendingGrooveId = useSessionStore((s) => s.pendingGrooveId);
	const selectGrooveCard = useSessionStore((s) => s.selectGrooveCard);
	const toggleLoadoutGroove = useSessionStore((s) => s.toggleLoadoutGroove);
	const tweakGroove = useSessionStore((s) => s.tweakGroove);
	const toStudio = useSessionStore((s) => s.toStudio);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Groove Card · Bag {loadout.grooves.length}/{MAX_GROOVE_CARDS}
				</span>
				<Button variant="outline" size="sm" onClick={toStudio} className="text-xs">
					Studio · Compose ✎
				</Button>
			</div>

			<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
				{grooveChoices.map((g) => {
					const equipped = groove.id === g.id;
					const pending = pendingGrooveId === g.id;
					const bagged = loadout.grooves.includes(g.id);
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
										<span className="text-[10px] font-mono uppercase text-primary">next loop</span>
									) : g.source === "bottle" ? (
										<span className="text-[10px] font-mono uppercase text-muted-foreground">
											bottle
										</span>
									) : null}
								</span>
								<span className="text-[11px] leading-snug text-muted-foreground">
									{describeGrooveEffect(g)}
								</span>
							</button>
							<div className="flex items-center gap-1.5">
								<CardPreviewButton id={`groove:${g.id}`} arrangement={drumOnly(arrangement, g)} />
								<Button
									type="button"
									variant={bagged ? "secondary" : "outline"}
									size="sm"
									className="h-6 px-2 text-[11px]"
									onClick={() => toggleLoadoutGroove(g.id)}
									title="Carry this card into combat">
									{bagged ? "In bag ✓" : "+ Bag"}
								</Button>
							</div>
						</div>
					);
				})}
			</div>

			{/* Tweak knobs */}
			<div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
				<label className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
					<span>Swing: {groove.swing.toFixed(2)}</span>
					<input
						type="range"
						min={0}
						max={MAX_SWING}
						step={0.05}
						value={groove.swing}
						onChange={(e) => tweakGroove({ swing: Number(e.target.value) })}
						className="w-28 accent-primary"
					/>
				</label>
				<label className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
					<span>Density: {groove.density.toFixed(2)}</span>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={groove.density}
						onChange={(e) => tweakGroove({ density: Number(e.target.value) })}
						className="w-28 accent-primary"
					/>
				</label>
				<span className="text-[11px] text-muted-foreground">
					Quarter notes always hold; off-beat detail thins out as density falls.
				</span>
			</div>
		</div>
	);
}
