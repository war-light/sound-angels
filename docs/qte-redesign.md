QTE panel redesign plan — full rebuild, bottom receptors, always-visible
1. Why it feels laggy/weird today
Evidence from src/components/QtePanel.tsx, src/game/qte.ts, src/audio/player.ts:
- QtePanel.tsx:130-147 — RAF loop re-subscribes on every fight.tick. Each 16th (~166ms @90bpm) it tears down requestAnimationFrame, resets lastTickTimeRef, and restarts. frac jumps instead of interpolating.
- QtePanel.tsx:142 — setFrac() 60fps re-renders the entire panel (header, 4 receptors, all notes, progress bar). Click targets + classes churn every frame.
- Playhead fight.tick - startedTick + frac uses a stale fight.tick closure + integer ticks from Tone.Draw (player.ts:100). No audio-clock anchor, so scroll stutters on GC / tab throttle.
- Notes positioned via style={{top}} (QtePanel.tsx:300) — layout, not compositor. No transform: translateY, no culling animation, pop-in at delta > 8.
- Double feedback: lastFeedback absolute popup (QtePanel.tsx:181) + centered splash (QtePanel.tsx:235), both on 600ms setTimeout. Miss path also plays playQteMiss() on qte.misses change — feels doubled and late.
- Receptor hot (QtePanel.tsx:246) is fight.tick - lastRating.tick <= 1 — tick granularity (~2 steps sticky), waits for store roundtrip instead of instant keydown flash. No active:scale, no press state independent of rating.
- Progress bar + {remaining}t left (QtePanel.tsx:154-156) steps per-tick, not smooth.
- Active vs standby returns two different <section> heights (QtePanel.tsx:170 vs 328) — full unmount/remount, layout shift when parry opens.
Engine is fine, don't touch it: qte.ts:375-378 (sick ≤0.5 steps, good ≤1, bad ≤window), ghost-tap vs strict-miss logic (qte.ts:448-461), missOverdueNotes per-tick — matches FNF post-WeekEnd1 behavior.
2. What other games do (from FNF wiki fetch + genre standards)
- FNF / DDR: fixed receptors, notes scroll into overlap. Judgements Sick 45ms / Good 90ms / Bad 135ms / Shit 160ms. Perfect = splash effect. Combo breaks only on dropped note, not ghost tap. Combo counter appears after streak, purely cosmetic.
- Guitar Hero / Rock Band: receptors at bottom, notes fall down. Long lookahead, color-coded lanes, beat-pulse on receptors, miss = shake + sound cut, not full UI flash.
- Osu!: approach circles + per-note timing rings so player anticipates without reading numbers.
- Classic QTEs (God of War, RE): single large prompt + tight deadline + screen urgency (red vignette, shake), never a scrolling list. Lesson: parry should feel different from sing-along charts.
- Common anti-lag pattern: animate on audio clock (Tone.Transport.seconds or wall-clock anchored at chart start), update note layer via refs/transform, keep React state to judgement events only.
3. Proposed design (per your picks)
Always-visible single container, fixed height (~320px), no remount:
+------------------------------------------------+
| [●] PARRY — ECHO GATHERING      x4 COMBO  87%  |
| progress bar (smooth, beat ticks)              |
|                                                |
|   highway (4 lanes, notes fall ↓)              |
|                                                |
|  [←] [↑] [↓] [→]  receptors at bottom          |
|  judgement popup floats above receptor hit     |
+------------------------------------------------+
- Standby mode: same shell, empty highway with idle beat pulse (bpm from store), threat radar line (hottest% logic already in QtePanel.tsx:318-326 moves into header). No collapse.
- Active mode: crossfade content only. Notes fall top→bottom receptors. STEP_PX → ms-anchored px/sec derived from stepMs(bpm), lookahead ~8 steps.
- Parry urgency: amber/red theme, foe name, pulsing border + subtle shake on miss, telegraph sound stays (QtePanel.tsx:118-127).
- Feedback: one judgement popup per hit anchored to lane receptor (SICK!/GOOD/BAD/MISS + combo), hit explosion scale + lane flash on keydown instantly (local state), engine rating confirms color. Miss = lane dim + shake, not global flash.
4. Implementation steps
1. src/components/QtePanel.tsx — split into QteShell (always mounted) + QteHighway + QteReceptors. Stable LANES config kept.
2. New src/hooks/useQtePlayhead.ts — single RAF per QTE id, anchored to performance.now() at startedTick, returns ref for highway layer. Updates via el.style.transform, no setState per frame. Falls back to Tone.getTransport().seconds if available.
3. Highway notes memoized by note.id, transform: translateY(y) only, cull delta < -2 || > lookahead. Add SICK-window band above receptors + per-note opacity by distance.
4. Receptors: onPointerDown + useWasd instant pressed visual, active:scale-90 via Tailwind/cn(). Keep press() → performDown path unchanged (useSessionStore.ts:384-398).
5. Judgements: replace lastFeedback + splash dual system with single lastRating-driven popup queue keyed by qte.hits+qte.misses, aria-live="polite".
6. Progress: smooth bar driven by same playhead ref + beat dots, text 2/4 hit · 87% instead of {remaining}t left.
7. Standby idle: CSS pulse at stepMs(bpm) interval, no RAF when !qte.
No changes to src/game/, src/audio/, shadcn theme. Tailwind classes + cn() only, no inline styles except transform on note layer.
5. Verify
- pnpm vitest run src/game/combatQte.test.ts — engine untouched, still green.
- pnpm build — typecheck first.
- Manual: 90bpm + 120bpm parry, chord swap, preset recall — scroll smooth, press flash <50ms perceived, no layout jump on open/close, miss shake only on parry.