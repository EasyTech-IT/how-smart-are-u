export function shouldShowAdBanner({ ready, bannerId, hasPass, screen }) {
  return Boolean(ready && bannerId && !hasPass &&
    screen !== "game" && screen !== "shop" && screen !== "info");
}

export function canOfferRewardHint({ ready, rewardedId, hasPass, screen }) {
  return Boolean(ready && rewardedId && !hasPass && screen === "game");
}

export function hasEarnedAdReward(reward) {
  return Number.isFinite(reward?.amount) && reward.amount > 0;
}
