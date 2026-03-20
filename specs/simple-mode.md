# Simple Mode — Guided Bracket Filling

## Problem
The full bracket view is overwhelming for casual users. 63 games across 4 regions with connector lines and multiple rounds is a lot to take in. Simple Mode provides a step-by-step flow: one matchup at a time.

## UX Flow

### Entry Point
- Button on the bracket page (next to autofill): "Fill Step-by-Step"
- Only shown when bracket is unlocked and has empty picks
- Opens a full-screen modal/overlay (not a new page — preserves bracket state)

### Step-by-Step Interface
- Shows one matchup at a time: two team cards side by side (or stacked on mobile)
- Each card shows: team logo, team name, seed number, region color accent
- User taps a card to pick the winner → auto-advances to next game after a brief highlight (300ms)
- Top bar: progress bar + "Game 12 of 63" label + region name + round name
- Bottom bar: "← Back" button, "Skip →" button, "Exit" button

### Game Order
Games flow in bracket order, round by round within each region, then Final Four:
1. R64: East games 0-7, West 0-7, South 0-7, Midwest 0-7 (32 games)
2. R32: East 0-3, West 0-3, South 0-3, Midwest 0-3 (16 games)
3. S16: East 0-1, West 0-1, South 0-1, Midwest 0-1 (8 games)
4. E8: East 0, West 0, South 0, Midwest 0 (4 games)
5. FF: ff-4-0, ff-4-1 (2 games)
6. Championship: ff-5-0 (1 game)

Total: 63 games. Each game only appears when both feeder teams are resolved (either from prior picks in this session or existing picks).

### Going Back
- "← Back" returns to the previous game. The pick is preserved (shown as selected) but user can change it.
- Changing a pick in an earlier round triggers cascade clearing of downstream picks that depended on the old winner — same logic as the main bracket's `cascadeClear()`.
- After cascade clear, the step counter adjusts: cleared games become the next games to pick. The user doesn't jump forward past unresolved games.

### Skip
- "Skip →" leaves the current game unpicked and moves to the next game whose feeder teams are both known.
- If no more games can be shown (because skipped games block downstream matchups), show a message: "Some games can't be shown yet because earlier matchups are unanswered. Go back to fill them in."

### Existing Picks
- If the bracket already has some picks, Simple Mode skips those games (they're pre-filled).
- User can still go back to change them, which triggers cascade clearing.
- Progress bar reflects total picks made out of 63, including pre-existing ones.

### Mini Bracket Preview
- Small bracket thumbnail in the corner (collapsible) that fills in as the user makes picks.
- Uses the existing MiniBracket component or a simplified version showing just region winners + FF.
- Tapping it expands to show the full bracket so far (read-only).

### Completion
- After game 63 (or all games picked): show tiebreaker prompt ("Predict the total combined score of the championship game").
- Then a "Review & Save" screen showing the completed bracket.
- "Save Bracket" button saves and exits Simple Mode, returning to the normal bracket view.

## Implementation

### Component: `SimpleMode.tsx`
- Lives in `src/components/bracket/SimpleMode.tsx`
- Receives same props as `Bracket`: regions, firstFour, picks, onPick, locked, etc.
- Internal state: `currentStep` (index into the ordered game list), local `picks` copy
- Reuses `cascadeClear()` from Bracket.tsx (extract to a shared util if needed)
- Reuses team logo/name rendering from Matchup component

### Game List Generation
```ts
function buildGameOrder(regions: Region[]): string[] {
  const games: string[] = [];
  // Rounds 0-3 for each region
  for (let round = 0; round <= 3; round++) {
    const count = 8 / Math.pow(2, round);
    for (const region of regions) {
      for (let i = 0; i < count; i++) {
        games.push(`${region.name}-${round}-${i}`);
      }
    }
  }
  // Final Four + Championship
  games.push("ff-4-0", "ff-4-1", "ff-5-0");
  return games; // 63 items
}
```

### Navigation Logic
- `currentStep` tracks position in the game order array
- On "Next" or after picking: find the next game in order where both feeder teams are resolved and no pick exists yet
- On "Back": find the previous game in order that has a pick
- Skip unresolvable games (feeder teams not yet picked)

### Cascade on Back-Change
When user goes back and changes a pick:
1. Run `cascadeClear()` with the old winner
2. Recompute which games are now unpicked
3. Set `currentStep` to the first unpicked game in order

### Saving
- Simple Mode writes to the same `picks` state as the main bracket
- On "Save", calls the same `savePicks` API endpoint
- No separate storage needed

## What NOT to Do
- Do NOT create a separate page/route — it's a modal overlay on the bracket page
- Do NOT duplicate pick-saving logic — reuse existing save flow
- Do NOT persist Simple Mode state — if user exits, picks made so far are in the bracket's unsaved state (same as clicking teams in the normal view)
- Do NOT show Simple Mode after lock time

## Open Questions
- Should we group games by region within each round (all East R64, then all West R64) or interleave (East game 1, West game 1, East game 2...)? Grouping by region feels more natural — you finish one region's round before moving to the next. Proposed: group by region.
- Should the mini bracket preview be shown by default or hidden? On mobile, screen space is tight. Proposed: hidden by default with a "Show bracket" toggle.
