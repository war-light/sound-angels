import { useState, type DragEvent as ReactDragEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Meter } from "@/components/Meter";
import { deckIds, slotOf } from "@/game/positions";
import type { SlotId } from "@/game/positions";
import { isDown, type Fighter } from "@/game/units";
import { useSessionStore } from "@/state/useSessionStore";
import { RosterSelectModal } from "@/components/RosterSelectModal";

const FIGHTER_MIME = "application/x-fighter-id";

const INSTRUMENT_ICON: Record<string, string> = {
	strings: "🎻",
	piano: "🎹",
	brass: "🎺",
};

const INSTRUMENT_TRAIT: Record<string, string> = {
	strings: "Keen · Poison on Hit",
	piano: "Bright · 30% Crit x2.0",
	brass: "Heavy · High Armor Penetration",
};

type DropZone = SlotId | "deck";

function Card({
	f,
	role,
	performing,
	onLead,
	numberBadge,
}: {
	f: Fighter;
	role: string;
	performing: boolean;
	onLead: () => void;
	numberBadge?: number;
}) {
	const dead = isDown(f);
	const icon = f.avatar ?? INSTRUMENT_ICON[f.instrument ?? "strings"] ?? "🎵";
	const trait = f.trait ?? INSTRUMENT_TRAIT[f.instrument ?? "strings"] ?? "Balanced Voice";

	return (
		<div
			draggable={!dead}
			onDragStart={(e) => {
				e.dataTransfer.setData(FIGHTER_MIME, f.id);
				e.dataTransfer.effectAllowed = "move";
			}}
			className={cn(
				"relative flex cursor-grab flex-col gap-1.5 rounded-xl border p-2.5 transition-all active:cursor-grabbing select-none",
				dead
					? "border-border/30 bg-muted/10 opacity-40 grayscale"
					: performing
						? "border-primary bg-primary/15 shadow-[0_0_15px_rgba(var(--primary),0.25)] ring-1 ring-primary/60"
						: "border-border/80 bg-card/70 hover:border-border hover:bg-card",
			)}>
			{/* Top row: Instrument Icon + Name + Role */}
			<div className="flex items-center justify-between text-left">
				<div className="flex items-center gap-1.5 min-w-0">
					{numberBadge != null && (
						<span
							className={cn(
								"text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0",
								performing
									? "bg-primary text-primary-foreground border-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"
									: "bg-muted/70 text-muted-foreground border-border/60",
							)}
							title={`Press ${numberBadge} to select`}>
							{numberBadge}
						</span>
					)}
					<span className="text-lg shrink-0 p-0.5 rounded bg-background/80 border border-border/40">
						{icon}
					</span>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5">
							<span className="text-xs font-bold truncate block">
								{f.name}{" "}
								{performing && (
									<span className="text-primary font-black ml-0.5 animate-pulse">♪</span>
								)}
							</span>
							{f.element && (
								<span className="text-[9px] font-mono px-1 rounded bg-muted/60 text-muted-foreground uppercase border border-border/30">
									{f.element}
								</span>
							)}
						</div>
						<span className="text-[10px] text-muted-foreground font-mono block leading-none">
							{f.title ? f.title : `${f.instrument} · ${role}`}
						</span>
					</div>
				</div>

				{/* Lead Button */}
				{!dead && (
					<Button
						size="sm"
						variant={performing ? "default" : "outline"}
						className="h-5 text-[10px] px-1.5 shrink-0 font-medium"
						onClick={onLead}>
						{performing ? "leading" : "take the lead"}
					</Button>
				)}
			</div>

			{/* Trait subtext */}
			<span
				className="text-[9px] text-muted-foreground font-mono truncate"
				title={trait}>
				{trait}
			</span>

			{/* HP + Shield Bar */}
			<div className="space-y-0.5">
				<div className="flex items-center justify-between text-[10px] font-mono">
					<span className="text-muted-foreground">HP</span>
					<span className="font-semibold">
						{Math.max(0, f.hp)}/{f.max}
						{f.shield > 0 && <span className="text-cyan-400 font-bold ml-1">+{f.shield} 🛡</span>}
					</span>
				</div>
				<Meter
					value={(Math.max(0, f.hp) / f.max) * 100}
					barClass={dead ? "bg-muted" : "bg-primary"}
					className="h-1.5 rounded-full">
					{f.shield > 0 && (
						<div
							className="absolute inset-y-0 left-0 bg-cyan-400/80 rounded-full"
							style={{ width: `${Math.min(100, (f.shield / f.max) * 100)}%` }}
						/>
					)}
				</Meter>
			</div>

			{/* Active Buffs */}
			{f.buffs.length > 0 && (
				<div className="flex flex-wrap gap-1 pt-0.5">
					{f.buffs.map((b) => (
						<span
							key={b.id}
							className="text-[9px] font-mono px-1 py-0.2 rounded bg-accent/60 text-accent-foreground font-bold">
							{b.id === "poison"
								? "☠ Poison"
								: b.id === "regen"
									? "+ Regen"
									: b.id === "warded"
										? "🛡 Warded"
										: b.id}{" "}
							({b.ticksLeft}t)
						</span>
					))}
				</div>
			)}
		</div>
	);
}

/**
 * Party corner: deck + back row (chord/beat) + front row (attackers).
 * Cards move by drag-and-drop between seats.
 */
export function PartyCorner() {
	const fight = useSessionStore((s) => s.fight);
	const moveFighter = useSessionStore((s) => s.moveFighter);
	const performerId = useSessionStore((s) => s.performerId);
	const setPerformer = useSessionStore((s) => s.setPerformer);
	const playing = useSessionStore((s) => s.playing);
	const [dragOver, setDragOver] = useState<DropZone | null>(null);
	const [rosterOpen, setRosterOpen] = useState<boolean>(false);

	const byId = new Map(fight.party.map((f) => [f.id, f]));
	const deck = deckIds(
		fight.party.map((f) => f.id),
		fight.slots,
	);

	const drop = (e: ReactDragEvent, slot: SlotId | null) => {
		e.preventDefault();
		const id = e.dataTransfer.getData(FIGHTER_MIME) || e.dataTransfer.getData("text/plain");
		if (id && byId.has(id)) moveFighter(id, slot);
		setDragOver(null);
	};

	const dropProps = (zone: DropZone, slot: SlotId | null) => ({
		onDragOver: (e: ReactDragEvent) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			setDragOver(zone);
		},
		onDragLeave: () => setDragOver((z) => (z === zone ? null : z)),
		onDrop: (e: ReactDragEvent) => drop(e, slot),
	});

	const slotRow = (label: string, slot: SlotId, ids: (string | null)[]) => (
		<div
			className={cn(
				"flex flex-col gap-1.5 rounded-lg p-2 transition-colors",
				dragOver === slot && "bg-accent/40 outline-dashed outline-2 outline-primary",
			)}
			{...dropProps(slot, slot)}>
			{ids.map((id) =>
				id && byId.get(id) ? (
					<Card
						key={id}
						f={byId.get(id)!}
						role={slotOf(fight.slots, id) ?? slot}
						performing={
							performerId === id ||
							(performerId == null && slot === "front" && fight.slots.front[0] === id)
						}
						onLead={() => setPerformer(id)}
					/>
				) : (
					<div
						key={`${slot}-empty`}
						className={cn(
							"border-border/60 rounded-xl border border-dashed text-muted-foreground bg-muted/5 h-26 flex items-center justify-center",
							dragOver === slot && "border-primary text-foreground bg-primary/10",
						)}>
						{label}
					</div>
				),
			)}
		</div>
	);

	return (
		<section
			aria-label="party"
			className="flex flex-col gap-3">
			<div className="flex items-center justify-between border-b border-border/40 pb-1.5">
				{!playing && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setRosterOpen(true)}
						className="h-6 text-[10px] px-2 font-semibold gap-1">
						<span>Roster</span>
						<span>👥</span>
					</Button>
				)}
			</div>

			{slotRow("chords", "chord", [fight.slots.chord])}
			{slotRow("beat", "beat", [fight.slots.beat])}

			<div
				className={cn(
					"flex flex-col gap-1.5 rounded-lg p-2 transition-colors",
					dragOver === "front" && "bg-accent/40 outline-dashed outline-2 outline-primary",
				)}
				{...dropProps("front", "front")}>
				{/* Three fixed seats: lane i in the loop sounds through seat i. */}
				{[0, 1, 2].map((seat) => {
					const id = fight.slots.front[seat];
					const f = id ? byId.get(id) : undefined;
					return (
						<div
							key={seat}
							className="min-h-24">
							{f ? (
								<Card
									f={f}
									role="front"
									numberBadge={seat + 1}
									performing={
										performerId === id || (performerId == null && fight.slots.front[0] === id)
									}
									onLead={() => setPerformer(f.id)}
								/>
							) : (
								<div
									className={cn(
										"border-border/60 flex h-full min-h-24 items-center justify-center rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground bg-muted/5",
										dragOver === "front" && "border-primary text-foreground bg-primary/10",
									)}>
									attackers
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div
				className={cn(
					"flex flex-col gap-1.5 rounded-lg p-2 transition-colors h-52 outline-dashed outline-1 outline-border overflow-y-auto",
					dragOver === "deck" && "bg-accent/40 outline-dashed outline-2 outline-primary",
				)}
				{...dropProps("deck", null)}>
				<span className="text-muted-foreground text-[10px] tracking-widest uppercase font-semibold font-mono">
					deck
				</span>
				{deck.length === 0 && (
					<p className="text-muted-foreground text-[11px] font-mono px-2">everyone is placed.</p>
				)}
				{deck.map((id) =>
					byId.get(id) ? (
						<Card
							key={id}
							f={byId.get(id)!}
							role="deck"
							performing={false}
							onLead={() => setPerformer(id)}
						/>
					) : null,
				)}
			</div>

			<RosterSelectModal
				isOpen={rosterOpen}
				onClose={() => setRosterOpen(false)}
			/>
		</section>
	);
}
