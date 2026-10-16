import { useSessionStore } from "@/state/useSessionStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { locateStep } from "@/game/arrangement";
import { GROOVE_VOICES, describeGrooveEffect, grooveHit, type GrooveVoice } from "@/game/groove";
import { fillCharge, fillReady } from "@/game/combat";

const LABELS: Record<GrooveVoice, string> = {
	kick: "Kick",
	snare: "Snare",
	hat: "Hat",
};

/**
 * In-battle drum display: three non-interactive dots that pulse with the
 * groove so the player feels the beat, plus the one Fill button. Drums are
 * never edited mid-fight — that lives in the Studio.
 */
export function GrooveMeter() {
	const arrangement = useSessionStore((s) => s.arrangement);
	const fight = useSessionStore((s) => s.fight);
	const globalStep = useSessionStore((s) => s.globalStep);
	const playing = useSessionStore((s) => s.playing);
	const fireFill = useSessionStore((s) => s.fireFill);

	const groove = arrangement.groove;
	const { step } = playing ? locateStep(arrangement, globalStep) : { step: -1 };
	const ready = fillReady(fight);
	const charge = Math.round(fillCharge(fight, arrangement) * 100);

	return (
		<section
			aria-label="Groove meter"
			className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/60 px-3.5 py-2.5 backdrop-blur-sm">
			<div className="flex items-center gap-3">
				<div className="flex flex-col">
					<span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
						Groove
					</span>
					<span className="text-xs font-semibold">{groove.name}</span>
				</div>
				<div className="flex items-center gap-2" role="img" aria-label="Drum pulse">
					{GROOVE_VOICES.map((voice) => {
						const on = step >= 0 && grooveHit(groove, voice, step);
						return (
							<span
								key={voice}
								title={LABELS[voice]}
								className={cn(
									"h-3 w-3 rounded-full border transition-all duration-75",
									on
										? "border-primary bg-primary scale-125 shadow-[0_0_10px_rgba(var(--primary),0.8)]"
										: "border-border/60 bg-muted/40 scale-100",
								)}
							/>
						);
					})}
				</div>
				<span className="hidden text-[11px] text-muted-foreground sm:inline">
					{describeGrooveEffect(groove)}
				</span>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-[10px] font-mono text-muted-foreground">
					{ready ? "Fill ready" : `Fill ${charge}%`}
				</span>
				<Button
					variant={ready ? "default" : "outline"}
					size="sm"
					onClick={() => fireFill()}
					disabled={!ready}
					title="Slam the kit: burst damage to every foe and a wider parry opening">
					Fill
				</Button>
			</div>
		</section>
	);
}
