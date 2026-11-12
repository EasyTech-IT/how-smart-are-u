# Interface components

## Design intent

- **Human:** a casual puzzle player opening the game for a short break, usually on a phone.
- **Task:** scan a word list, trace a straight path through a letter grid, and see progress at a glance.
- **Feel:** a quiet field notebook—warm paper, dark green ink, and one terracotta marker for the active trail.
- **Domain:** letter grids, word lists, pencil marks, field notes, trails, waypoints, hints, found paths.
- **Color world:** parchment, forest ink, faded leaf, terracotta, chalk, and quiet stone.
- **Signature:** a small route of puzzle waypoints paired with a hand-marked word grid; found paths become the trail's checkpoints.
- **Rejected defaults:** full-bleed tropical game art becomes an abstract paper-and-ink scene; neon gradients become a restrained paper palette; oversized currency/coin counters become clear hint allowances and puzzle progress.

## Hierarchy and system

- The letter board is the focal point; the list and hint action form a narrower companion rail on wide screens and stack below it on phones.
- Type uses a Georgia display face for the notebook title and rounded system sans for grid labels and controls; no remote font or asset fetches.
- Spacing follows a 4px base, with card padding at 24px and major section gaps at 32–48px.
- Surfaces use warm tonal separation and a single soft card shadow, not thick outlines or layered gradients.
- The active trail uses terracotta; found words use deep green; hint guidance uses a pale amber surface.
- The grid uses real buttons and a 44px minimum cell target at compact widths where available. Arrow keys move focus; Enter/Space choose tap endpoints; pointer drag supports touch and mouse.

## Button

- Variants: primary, quiet, hint.
- States: hover, active, focus-visible, disabled, busy.
- Accessibility: native button, visible focus ring, disabled while an async request is pending.
- Used on: S01, S02, S03.

## Trail selector

- Variants: selected, completed, available.
- States: hover, focus-visible, selected, completed.
- Accessibility: native buttons with `aria-pressed` and a visible selected state.
- Used on: S01.

## Letter grid cell

- Variants: idle, selected, found, hinted.
- States: hover, focus-visible, pointer drag, tap anchor, found, hint pulse, invalid path.
- Accessibility: native buttons named by coordinate and letter, grouped in a labeled grid; focus is roving via arrow keys.
- Used on: S01.

## Word row and progress

- Variants: remaining, found, hinted.
- States: not found, found, temporarily hinted.
- Accessibility: found state is conveyed in text and via the live status, not by color alone.
- Used on: S01, S02.

## Account dialog

- Variants: register, sign in, account details.
- States: open, submitting, validation error, network error, signed in.
- Accessibility: native `<dialog>`, labeled inputs, Escape-to-close and focus restoration.
- Used on: S03.
