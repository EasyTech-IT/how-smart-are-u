# Moss & Letters

**Repository:** `EasyTech-IT/how-smart-are-u`

An original, offline-first word-search game built for phones. It has no login
or account: level progress and hint credits stay on the device. The game has
250 levels across ten themed worlds. Three worlds are fully free (75 levels);
the seven Pass worlds include 33 free preview levels, with the remaining 142
levels unlocked by a one-time Pass purchase.

![Moss & Letters logo](assets/logo.svg)

## Run and test

Requirements: Node.js 22+ and npm.

```powershell
npm install
npm run dev
npm test
npm run build
```

The local Vite server prints its address (usually
[http://localhost:5173](http://localhost:5173)). `npm run build` writes the
static web app to `dist/`; it can also be hosted as a static site.

## Game

- Play offline after the app shell has loaded once.
- Choose from three fully free worlds and preview all seven Pass worlds.
- Progress through 250 increasingly challenging levels.
- Premium previews are five levels per world, except Spicy Secrets (three).
  The category uses a local 18+ self-confirmation, not verified age checking.
- Switch between dark-forest and warm-paper animated backgrounds. Reduced
  motion preferences use a static background.
- Interface effects and a relaxing original ambient progression are generated
  with Web Audio; no third-party music recording is bundled.
- Haptic feedback is available on supported devices and can be turned off in
  Settings.
- Find words by dragging, tapping endpoints, or using the keyboard.
- Levels save locally. Completing a level grants one hint credit.
- Pass and hint-pack purchases use official app-store billing through
  RevenueCat when platform keys and store products are configured.
- AdMob banners are consent-gated, shown only outside active puzzles, and
  hidden for pass owners. Players may opt into a rewarded video for one hint;
  the hint is granted only when the SDK confirms the reward. The Pass disables
  banners and rewarded ads. No interstitial ads interrupt gameplay.

The purchase and ad buttons remain unavailable until their platform
configuration is supplied. No credentials or real store product IDs are
included in this repository.

## Android and iOS

The native app ID is `com.easytechit.mossletters`; the current app version is
`1.0.0` (version code `1`). The Android and iOS projects are included in this
repository:

```powershell
npm run android:debug
```

The Android script rebuilds and synchronizes the web assets. Run
`npx cap sync ios` to refresh the iOS project before opening it in Xcode.

`npm run android:bundle` builds an unsigned release AAB and intentionally
fails until a production AdMob app ID is supplied. Configure Android signing
and validate the bundle in Play Console before distribution. Android SDK and
Java are required. iOS builds and App Store submission require macOS with
Xcode; they cannot be produced on Windows.

## Configure store products

1. Copy `.env.example` to `.env`.
2. Create a non-consumable lifetime product for the pass and a consumable
   20-hint product in both app stores.
3. Configure the RevenueCat entitlement `moss_letters_pass`, a current
   offering with the package IDs `$rc_lifetime` and `hint_pack_20`, and the
   platform public SDK keys in `.env`.
4. Configure AdMob app IDs and banner units. Set `ADMOB_APP_ID` in the
   Android build environment and the matching `VITE_ADMOB_*` values in `.env`;
   set the Xcode `ADMOB_APP_ID` build setting and matching iOS `VITE_ADMOB_*`
   values for iOS. Add rewarded-ad unit IDs for each platform to enable the
   optional hint offer. Create and publish the relevant consent messages in
   Google UMP before enabling ads.
5. Rebuild and test purchases, restore, consent, and ad-free behavior on real
   devices using store sandbox accounts.

RevenueCat SDK keys and AdMob IDs are public app configuration, not server
secrets. Do not put private service credentials in `VITE_*` variables.

## Legal drafts and owner input

The app's **Info** tab links to German-language drafts for the imprint,
privacy notice, and terms under `public/legal/`. They are intentionally
marked as drafts and must not be published as final legal notices. The privacy
notice describes the current offline/local-save design and identifies
RevenueCat, Apple/Google billing, and AdMob/UMP as providers whose final
disclosures depend on the production configuration.

Copy `legal/operator-details.template.md` to the ignored local file
`legal/operator-details.local.md` and complete it on your computer. The local
file is excluded from Git. It lists the publisher, contact, hosting, target
countries, and data-processing facts needed to complete the drafts. Do not
put passwords, private API keys, payment details, or signing keys in it.
Have the final notices reviewed for the publisher's jurisdiction and actual
provider configuration. The provided business label, location, email, website,
and phone number are included. The full legal name and complete postal address
are still needed before the imprint can be finalized.

The existing Stripe account is not needed for mobile-game purchases: the
pass and hint credits are digital app functionality, so the standard Google
Play / Apple distribution uses their in-app billing systems. Stripe could be
considered for a separate web checkout only after deciding how web purchases
are securely verified and made compatible with the no-account, offline-first
design. Do not send Stripe secret keys.

## Release status

This repository contains the playable game, offline progress, native project
configuration, and gated billing/ad adapters. It is **not store-release
ready** until the owner configures store products, RevenueCat and AdMob,
privacy/terms disclosures, real-device consent and purchase tests, native
signing, and final store listings. Check the package name and game name for
trademark/store availability before submission. No PlaySimple code, artwork,
branding, screenshots, or puzzle content is included.

## Project notes

- `src/game-logic.js` contains the deterministic 250-level catalog and puzzle
  generation.
- `src/progress.js` validates and persists local progress and rewards.
- `src/store.js` handles the native lifetime pass, hint pack, and restore.
- `src/ads.js` gates banners on platform configuration and user consent.
- `replica/recon.md` and `replica/features.csv` record the clean-room product
  scope and implementation matrix.
