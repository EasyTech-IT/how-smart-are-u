# Architecture: Moss & Letters

## Stack

- **Game UI:** Vite, semantic HTML, CSS, and vanilla JavaScript modules. The
  game remains a small static bundle with no runtime server.
- **Native shell:** Capacitor 8 with app ID `com.easytechit.mossletters`.
- **Progress:** versioned localStorage record. No login, custom backend, or
  cloud account is used.
- **Billing:** RevenueCat Capacitor SDK maps the lifetime pass entitlement and
  consumable hint pack to official Apple/Google store products. It is disabled
  until the owner configures public SDK keys and products.
- **Ads:** AdMob Capacitor SDK; banners appear only in menu screens for free
  players after UMP consent. Ads are disabled until app/unit IDs and consent
  messages are configured.
- **Offline:** deterministic puzzles are bundled locally; the service worker
  caches the web app shell. Native builds include the static bundle directly.

## Local model and invariants

`src/progress.js` owns the persisted shape and validates IDs and values when
loading. Each of the ten worlds has 25 levels; levels unlock sequentially. The
three free worlds are fully open, and seven Pass worlds each include five
preview levels except Spicy Secrets, which includes three. First
completion grants one hint credit, replay grants none, the pass grants 50
bonus credits once, and a hint pack grants 20 credits after a successful
store transaction. The pass permanently unlocks the seven premium worlds and
disables ads. Spicy Secrets also requires local 18+ self-confirmation.

There is no SQL schema or REST API by design. Store purchases are verified by
RevenueCat; local progress can continue offline after a purchase. Store restore
requires an internet connection and the same platform store account.

## Native configuration

| setting | development state | release requirement |
| --- | --- | --- |
| App ID | `com.easytechit.mossletters` | Verify availability and legal rights before submission |
| Version | `1.0.0`, code `1` | Increment code/name on every store upload |
| RevenueCat pass | entitlement `moss_letters_pass`, package `$rc_lifetime` | Map non-consumable lifetime products in both stores |
| Hint pack | package `hint_pack_20` | Map consumable product in both stores |
| AdMob | no production IDs in repository | App IDs, banner unit IDs, UMP consent and privacy disclosures |
| Android | Capacitor project generated with `npx cap add android` | Configure release signing; validate signed AAB in Play Console |
| iOS | Capacitor project generated with `npx cap add ios` | Xcode/macOS build, signing, sandbox tests, and App Store validation |

## Build order

1. [x] Generate the offline-first game, local progress, and 250-level catalog.
2. [x] Add static Vite build, PWA shell, Capacitor identifiers, and native
   billing/ad adapters with explicit configuration gates.
3. [x] Test deterministic puzzle generation, progression, pass rewards,
   hint packs, and invalid local data.
4. [ ] Generate and build Android/iOS projects; verify gameplay on physical
   devices and screen-size/rotation edge cases.
5. [ ] Configure products, SDK IDs, consent/privacy disclosures, signing, and
   store listing; run purchase/restore and ad-free sandbox tests.

Release remains blocked until the owner supplies store configuration,
developer accounts, legal disclosures, and signing credentials.
