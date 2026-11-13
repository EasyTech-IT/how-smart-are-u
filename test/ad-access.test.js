import test from "node:test";
import assert from "node:assert/strict";
import {
  canOfferRewardHint,
  hasEarnedAdReward,
  shouldShowAdBanner
} from "../src/ad-access.js";
import { freshProgress, grantPass } from "../src/progress.js";

const banner = { ready: true, bannerId: "banner", screen: "home" };

test("banner ads show only outside gameplay and only before the Pass is owned", () => {
  assert.equal(shouldShowAdBanner({ ...banner, hasPass: false }), true);
  for (const screen of ["game", "shop", "info"]) {
    assert.equal(shouldShowAdBanner({ ...banner, screen, hasPass: false }), false);
  }
  assert.equal(shouldShowAdBanner({ ...banner, hasPass: true }), false);
  assert.equal(shouldShowAdBanner({ ...banner, bannerId: "", hasPass: false }), false);
  const passOwned = grantPass(freshProgress()).hasPass;
  assert.equal(shouldShowAdBanner({ ...banner, hasPass: passOwned }), false);
});

test("rewarded hints are opt-in, gameplay-only and unavailable to Pass owners", () => {
  const rewardAd = {
    ready: true,
    rewardedId: "rewarded",
    hasPass: false,
    screen: "game"
  };
  assert.equal(canOfferRewardHint(rewardAd), true);
  assert.equal(canOfferRewardHint({ ...rewardAd, hasPass: true }), false);
  assert.equal(canOfferRewardHint({ ...rewardAd, screen: "home" }), false);
  assert.equal(canOfferRewardHint({ ...rewardAd, rewardedId: "" }), false);
  assert.equal(canOfferRewardHint({ ...rewardAd, ready: false }), false);
});

test("only a positive reward returned by the ad SDK earns a hint", () => {
  assert.equal(hasEarnedAdReward({ type: "hint", amount: 1 }), true);
  for (const reward of [undefined, null, {}, { amount: 0 }, { amount: -1 }, { amount: NaN }]) {
    assert.equal(hasEarnedAdReward(reward), false);
  }
});
