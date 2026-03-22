# Medium/Tablet Bracket Layout Spec

## Problem
The desktop bracket requires ~1500px width (two regions side-by-side + Final Four center). On tablets and medium screens (768–1200px), users must scroll horizontally. The mobile tab view works but hides context. We need a middle ground.

## Breakpoints
- Mobile: <768px → MobileBracket (round tabs, existing)
- Medium: 768–1199px → MediumBracket (this spec)
- Desktop: ≥1200px → Full bracket (existing)

## Design: Vertically Stacked Regions

Each region is shown as a full horizontal strip (R64 → R32 → S16 → E8, left to right) using the existing `RegionBracket` component with `direction="left"`. All 4 regions stack vertically. Final Four and Championship are shown below the regions.

At 768px, a single region strip is ~668px wide (4 rounds × 155px + 3 connectors × 16px), which fits comfortably. Users see one complete region at a time while scrolling vertically — no horizontal scroll needed.

### Layout
```
┌──────────────────────────────────┐
│ Region 1 (R64 → E8)             │
├──────────────────────────────────┤
│ Region 2 (R64 → E8)             │
├──────────────────────────────────┤
│ Region 3 (R64 → E8)             │
├──────────────────────────────────┤
│ Region 4 (R64 → E8)             │
├──────────────────────────────────┤
│      Final Four + Championship   │
└──────────────────────────────────┘
```

### Key Decisions
- All regions use `direction="left"` (seeds flow left-to-right, high seed on top) for consistent reading direction.
- Final Four is rendered inline below the regions (not absolutely positioned like desktop).
- Reuses existing `RegionBracket` and `FinalFour` components — no new rendering logic needed.

## Implementation
1. Create `src/components/bracket/MediumBracket.tsx` — renders 4 `RegionBracket` stacked vertically + `FinalFour` below.
2. Update `Bracket.tsx` to add a `isMedium` breakpoint and render `MediumBracket` between mobile and desktop.

## What NOT to do
- Don't create new matchup rendering — reuse `RegionBracket` and `FinalFour`.
- Don't change the desktop or mobile layouts.
