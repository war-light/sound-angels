import { useState } from "react";
import { useSessionStore } from "@/state/useSessionStore";
import { FoePanel } from "@/components/FoePanel";
import { PartyCorner } from "@/components/PartyCorner";
import { PhaseStrip } from "@/components/PhaseStrip";
import { LoadoutBar } from "@/components/LoadoutBar";
import { QtePanel } from "@/components/QtePanel";
import { StepGrid } from "@/components/StepGrid";
import { GrooveMatrix } from "@/components/GrooveMatrix";
import { VoiceBar } from "@/components/VoiceBar";
import { CombatLog } from "@/components/CombatLog";
import { CombatFeedback } from "@/components/CombatFeedback";
import { ChordPicker } from "@/components/ChordPicker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export function CombatScreen() {
	const fight = useSessionStore((s) => s.fight);
	const bpm = useSessionStore((s) => s.arrangement.bpm);
	const togglePlay = useSessionStore((s) => s.togglePlay);
	const encounters = useSessionStore((s) => s.encounters);
	const currentEncounterId = useSessionStore((s) => s.currentEncounterId);
	const [modulateOpen, setModulateOpen] = useState(false);

	const encounter = encounters.find((e) => e.id === currentEncounterId);

	return (
		<div className="relative flex flex-col gap-4 p-4 sm:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
			<CombatFeedback />
			{/* Combat Header */}
			<header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
				<div className="flex items-center gap-3">
					<div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
					<div>
						<h1 className="text-xl font-bold tracking-tight">
							{encounter ? encounter.name : "Combat Arena"}
						</h1>
						<p className="text-xs text-muted-foreground font-mono">
							Key:{" "}
							<span className="text-primary font-semibold">
								{fight.key.tonic} {fight.key.scale}
							</span>{" "}
							(locked) · Tempo: {bpm} bpm · Tick: {fight.tick}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => togglePlay()}
						className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive">
						Halt / Retreat ✕
					</Button>
				</div>
			</header>

			{/* 3-Column Combat Stage */}
			<main className="grid flex-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
				{/* Left: Enemies */}
				<section aria-label="Enemies">
					<FoePanel />
					<div className="border border-border/80 max-h-44 overflow-y-auto rounded-md p-3 bg-muted/10 font-mono text-xs mt-5">
						<CombatLog />
					</div>
				</section>

				{/* Center: Harmonic Loop & Action QTE */}
				<section
					aria-label="Melody Loop and Performance"
					className="flex min-w-0 flex-col gap-4">
					<div className="flex items-start gap-2">
						<div className="min-w-0 flex-1">
							<PhaseStrip />
						</div>
						<Dialog open={modulateOpen} onOpenChange={setModulateOpen}>
							<DialogTrigger asChild>
								<Button variant="outline" size="sm" className="shrink-0 text-xs font-semibold">
									Modulate ♪
								</Button>
							</DialogTrigger>
							<DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-4 overflow-y-auto p-5">
								<DialogHeader>
									<DialogTitle>Modulate the harmony</DialogTitle>
									<DialogDescription>
										Picking a progression opens a chart. The soloists mute while you play it, then
										the new harmony lands on the next bar.
									</DialogDescription>
								</DialogHeader>
								<ChordPicker onApplied={() => setModulateOpen(false)} />
							</DialogContent>
						</Dialog>
					</div>
					<GrooveMatrix compact />
					<StepGrid />
					<VoiceBar />
					<LoadoutBar />
					<QtePanel />
				</section>

				{/* Right: Party Cards */}
				<section aria-label="Party Formation">
					<PartyCorner />
				</section>
			</main>
		</div>
	);
}
