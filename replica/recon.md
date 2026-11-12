# Word-search game recon

Scope: An original mobile word-search game based on broad public gameplay
patterns, not a visual or content copy. Platforms: Android and iOS via
Capacitor, with a static web build for local testing. Audience: casual players
who want a calm game that works without an account or network.

## Sources

| source | URL | use and limits |
| --- | --- | --- |
| Word Search Explorer public Google Play listing | https://play.google.com/store/apps/details?id=in.playsimple.wordsearch&hl=en-US | Used to understand the high-level word-search loop and offline positioning only. No listing art, screenshots, text, source, puzzle data, or private APIs are reused. |
| Public review feedback (small sample) | https://play.google.com/store/apps/details?id=in.playsimple.wordsearch&hl=en-US | Public reviews mention relaxing play as a strength and intrusive ads, small letters, lag/freezes, and weak late-game difficulty as pain points. This is a limited, nonrepresentative sample, not a market-wide finding. |

No authenticated account or private content was accessed. The app uses its own
name, logo, landscapes, UI, and generated puzzles.

## Core loop

Open the game, pick a landscape and unlocked level, trace listed words in the
grid, earn a hint credit on first completion, then continue along the level
path. It remains playable offline and never asks for an account.

## Screens

| ID | screen | how to reach | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | App launch / Home navigation | Resume or start a level | Logo, progress, hint wallet, play CTA | New game, returning player, offline |
| S02 | Landscapes | Levels navigation | Choose a free or pass-locked category | Landscape cards, completion counts, lock state | Free, locked, completed |
| S03 | Level path | Choose a landscape | Continue the sequential chapter | 25 level nodes, back action, completion count | Ready, current, completed, locked |
| S04 | Puzzle | Start or resume a level | Find every listed word | Grid, word list, hint, progress, back action | Idle, drag/tap selection, found, invalid, hinted, complete |
| S05 | Shop | Pass navigation or locked landscape | Buy the lifetime pass or hint pack; restore pass | Pass card, hint pack, localized prices, restore | Unconfigured, available, purchasing, owned, error |
| S06 | Level complete | Find the final word | Celebrate and continue or return to map | Completion dialog, hint reward, next-level action | First completion, replay |

## Flows

```text
F01 Start or resume a puzzle
    S01 -> S04, or S01 -> S02 -> S03 -> S04
    edge: no network; storage unavailable; landscape locked

F02 Find words and earn progression
    S04 trace/tap a straight path -> S04 update progress -> S06 -> next S04
    edge: backwards/diagonal word, invalid selection, interrupted session, replay

F03 Use a hint
    S04 use hint -> highlight one remaining word -> S04
    edge: no credits; all words found

F04 Buy or restore
    S05 choose pass/hint pack -> native store purchase -> S05 updated wallet/access
    edge: missing store setup, offline, cancellation, purchase pending, restore with no pass
```

## Components and local model

| component | variants / states | used on |
| --- | --- | --- |
| Landscape card | free, pass-locked, progress count | S02 |
| Level node | unlocked, current, completed, locked | S03 |
| Letter grid | idle, selected, found, hinted, invalid | S04 |
| Hint action | credits available, exhausted | S01, S04 |
| Store card | configured, unavailable, purchasing, owned | S05 |
| Completion dialog | first completion, replay | S06 |

```text
LocalProgress
  activeCategoryId, activeLevelId, completedLevelIds,
  foundByLevel, hintCredits, hasPass, passHintsGranted
  storage: versioned localStorage record
  confidence: high; directly represented by src/progress.js

StoreEntitlement
  lifetime pass and consumable hint pack
  authority: Apple App Store / Google Play via RevenueCat
  local cache: pass entitlement and hint balance for offline play
  confidence: high; purchase flow requires owner product configuration
```

There is deliberately no account, user table, custom API, or cloud save.

## Feature matrix

See `features.csv`. Must-have rows cover the core loop, offline progress,
accessibility, 200-level progression, and original content. Billing and ads
remain configuration-gated.

## Out of scope

- PlaySimple branding, artwork, screenshots, exact copy, code, private APIs,
  and proprietary puzzle content.
- Accounts, cloud sync, leaderboards, multiplayer, live events, and push
  notifications.
- Real store credentials, AdMob IDs, privacy/legal documents, signing keys,
  and store account setup; these must be supplied by the app owner.

## Size and risks

Six screens, four user flows, one local progress record, and two native
platforms. Size: M. Hard parts: keeping the 200 generated puzzles solvable,
maintaining offline progress while validating lifetime purchases, and
consent-safe native ads that never interrupt a puzzle.
