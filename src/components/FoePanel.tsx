import { Meter } from "@/components/Meter";
import { isDown } from "@/game/units";
import { useSessionStore } from "@/state/useSessionStore";

const FOE_AVATAR: Record<string, string> = {
	echo: "🪞",
	mite: "🪲",
	carapace: "🐢",
	mirror: "👹",
	moth: "🦋",
};

const FOE_TITLES: Record<string, string> = {
	echo: "Echo of Dissonance",
	mite: "Swarming Staccato",
	carapace: "Armored Resonance",
	mirror: "Inverted Reflector",
	moth: "Track-Weaver Moth",
};

export function FoePanel() {
	const fight = useSessionStore((s) => s.fight);

	return (
		<section
			aria-label="Enemies"
			className="flex flex-col gap-3">
			<div className="flex items-center justify-between border-b border-border/40 pb-1.5">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Hostile Dissonance ({fight.enemies.filter((e) => !isDown(e)).length}/
					{fight.enemies.length} Alive)
				</h2>
			</div>

			<div className="flex flex-col gap-3">
				{fight.enemies.map((foe, i) => {
					const profile = fight.enemyProfiles[foe.id];
					const gauge = fight.gauges[i] ?? 0;
					const baseId = foe.id.replace(/-\d+$/, "");
					const dead = isDown(foe);
					const isStriker = fight.parrySchedule?.foeId === foe.id && !dead;
					const readyToStrike = (gauge >= 100 || isStriker) && !dead;
					const chargingStrike = (gauge >= 75 || isStriker) && !dead;

					const hpPercent = Math.max(0, Math.min(100, (foe.hp / foe.max) * 100));
					const shieldPercent =
						foe.maxShield > 0 ? Math.min(100, (foe.shield / foe.maxShield) * 100) : 0;

					return (
						<div
							key={foe.id}
							className={`relative rounded-xl border p-3.5 transition-all ${
								dead
									? "border-border/30 bg-muted/10 opacity-40 grayscale"
									: readyToStrike
										? "border-rose-500 bg-rose-950/20 shadow-[0_0_18px_rgba(244,63,94,0.35)] animate-enemy-shake"
										: chargingStrike
											? "border-amber-500/70 bg-amber-950/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
											: "border-border/70 bg-card/60 hover:border-border"
							}`}>
							{/* Header row: Avatar + Name + Title */}
							<div className="flex items-start justify-between gap-2 mb-2">
								<div className="flex items-center gap-2">
									<span
										className={`text-2xl p-1 rounded-lg bg-background/80 border border-border/40 shrink-0 ${
											readyToStrike ? "scale-110 rotate-6" : ""
										}`}>
										{FOE_AVATAR[baseId] ?? "👾"}
									</span>
									<div>
										<div className="flex items-center gap-1.5">
											<h3 className="font-bold text-sm tracking-tight">{foe.name}</h3>
											{dead && (
												<span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 font-mono font-bold">
													DOWN
												</span>
											)}
										</div>
										<p className="text-[10px] text-muted-foreground">
											{FOE_TITLES[baseId] ?? "Discordant Being"}
										</p>
									</div>
								</div>

								{/* HP / Shield Numbers */}
								<div className="text-right font-mono">
									<span className="text-sm font-bold text-foreground">
										{Math.max(0, foe.hp)}
										<span className="text-xs text-muted-foreground font-normal">/{foe.max}</span>
									</span>
									{foe.shield > 0 && (
										<span className="block text-[10px] text-cyan-400 font-bold">
											+{foe.shield} 🛡
										</span>
									)}
								</div>
							</div>

							{/* Health Meter with Shield overlay */}
							<div className="space-y-1.5 mb-2.5">
								<div className="relative">
									<Meter
										value={hpPercent}
										barClass={
											dead
												? "bg-muted"
												: hpPercent > 40
													? "bg-rose-600"
													: "bg-rose-500 animate-pulse"
										}
										className="h-2 rounded-full bg-muted/40">
										{foe.shield > 0 && (
											<div
												className="absolute inset-y-0 left-0 bg-cyan-400/80 rounded-full transition-all duration-300"
												style={{ width: `${shieldPercent}%` }}
											/>
										)}
									</Meter>
								</div>

								{/* ATB Gauge Meter */}
								{!dead && (
									<div className="space-y-0.5">
										<div className="flex justify-between text-[9px] font-mono text-muted-foreground">
											<span>🗡️</span>
											<span>{Math.round(gauge)}%</span>
										</div>
										<Meter
											value={gauge}
											barClass={
												readyToStrike
													? "bg-rose-500"
													: chargingStrike
														? "bg-amber-400"
														: "bg-primary/80"
											}
											className="h-1 rounded-full bg-muted/30"
										/>
									</div>
								)}
							</div>

							{/* Trait & Weakness Pills */}
							<div className="flex flex-wrap gap-1 text-[10px] font-mono">
								<span className="px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground uppercase font-bold">
									{profile.archetype}
								</span>

								{profile.reflect && (
									<span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-bold">
										Reflects {profile.reflect}
									</span>
								)}

								{profile.trackWipe && (
									<span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-bold">
										Track Wipe
									</span>
								)}

								{profile.weaknesses.instruments.map((inst) => (
									<span
										key={inst}
										className="px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/30">
										Weak: {inst}
									</span>
								))}

								{profile.resists.instruments.map((inst) => (
									<span
										key={inst}
										className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300/80 border border-rose-800/30">
										Resists: {inst}
									</span>
								))}

								{/* Buff indicators */}
								{foe.buffs.map((b) => (
									<span
										key={b.id}
										className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-bold">
										{b.id === "poison" ? "☠ Poison" : b.id === "exposed" ? "! Exposed" : b.id} (
										{b.ticksLeft}t)
									</span>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
