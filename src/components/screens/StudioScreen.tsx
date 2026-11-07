import { useState } from "react";
import { useSessionStore } from "@/state/useSessionStore";
import { Button } from "@/components/ui/button";
import { GrooveMatrix } from "@/components/GrooveMatrix";
import { countGrooveHits } from "@/game/groove";

/**
 * Compose: page the banks, tap pads, pick a kit, then bottle the rig under a
 * name. Bottles equip like any curated rig.
 */
export function StudioScreen() {
	const groove = useSessionStore((s) => s.arrangement.groove);
	const pendingGroove = useSessionStore((s) => s.pendingGroove);
	const grooveBottles = useSessionStore((s) => s.grooveBottles);
	const toPrep = useSessionStore((s) => s.toPrep);
	const saveGrooveBottle = useSessionStore((s) => s.saveGrooveBottle);
	const selectGrooveCard = useSessionStore((s) => s.selectGrooveCard);
	const deleteGrooveBottle = useSessionStore((s) => s.deleteGrooveBottle);
	const [bottleName, setBottleName] = useState("");

	const view = pendingGroove ?? groove;
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
							Tap one pattern per voice, pick a kit, then bottle the rig to carry it.
						</p>
					</div>
				</div>
				<div className="flex flex-col items-end">
					<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
						Editing
					</span>
					<span className="text-sm font-semibold">
						{view.name}{" "}
						<span className="text-xs font-normal text-muted-foreground">
							({view.source} · {countGrooveHits(view)} hits)
						</span>
					</span>
				</div>
			</header>

			<GrooveMatrix />

			{/* Bottling + bottle shelf */}
			<section className="grid gap-4 md:grid-cols-2">
				<div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/60 p-3.5">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Bottle it
					</span>
					<p className="text-[11px] text-muted-foreground">
						Save this bank, pad selection, kit and swing as a bottle. Bottles equip
						just like the curated rigs.
					</p>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={bottleName}
							onChange={(e) => setBottleName(e.target.value)}
							placeholder="Rig name…"
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
							No bottles yet. Tap a few pads above and bottle the result.
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
											<span className="text-muted-foreground"> · {countGrooveHits(b)} hits</span>
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
