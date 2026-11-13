import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, LEVELS } from "../src/game-logic.js";
import {
  canAccessCategory,
  completeLevel,
  freshProgress,
  grantHintPack,
  grantHintReward,
  grantPass,
  isPassRequiredForLevel,
  isLevelUnlocked,
  loadProgress,
  normalizeProgress,
  PROGRESS_KEY,
  saveProgress
} from "../src/progress.js";

test("level completion unlocks only the next level and rewards hints once", () => {
  const first = LEVELS[0];
  const second = LEVELS[1];
  const progress = freshProgress();
  assert.equal(isLevelUnlocked(first, progress), true);
  assert.equal(isLevelUnlocked(second, progress), false);

  const completed = completeLevel(first, progress);
  assert.equal(completed.hintCredits, 6);
  assert.equal(isLevelUnlocked(second, completed), true);
  assert.equal(completeLevel(first, completed).hintCredits, 6);
});

test("premium worlds offer their previews before the pass unlocks the rest", () => {
  const premium = CATEGORIES.find((category) => !category.free && !category.ageRestricted);
  const levels = LEVELS.filter((level) => level.categoryId === premium.id);
  const progress = freshProgress();
  assert.equal(premium.previewLevels, 5);
  assert.equal(canAccessCategory(premium.id, progress), true);
  assert.equal(isLevelUnlocked(levels[0], progress), true);
  assert.equal(isPassRequiredForLevel(levels[4], progress), false);
  assert.equal(isPassRequiredForLevel(levels[5], progress), true);

  let throughPreview = progress;
  for (const level of levels.slice(0, premium.previewLevels)) {
    throughPreview = completeLevel(level, throughPreview);
  }
  assert.equal(isLevelUnlocked(levels[5], throughPreview), false);

  const withPass = grantPass(throughPreview);
  assert.equal(withPass.hasPass, true);
  assert.equal(withPass.hintCredits, 60);
  assert.equal(canAccessCategory(premium.id, withPass), true);
  assert.equal(isLevelUnlocked(levels[5], withPass), true);
  assert.equal(grantPass(withPass).hintCredits, 60);
});

test("Spicy Secrets requires local age confirmation, even when the pass is owned", () => {
  const adult = CATEGORIES.find((category) => category.ageRestricted);
  const firstAdultLevel = LEVELS.find((level) => level.categoryId === adult.id);
  const progress = freshProgress();
  assert.equal(canAccessCategory(adult.id, progress), true);
  assert.equal(isLevelUnlocked(firstAdultLevel, progress), false);
  assert.equal(isLevelUnlocked(firstAdultLevel, grantPass(progress)), false);
  assert.equal(
    isLevelUnlocked(firstAdultLevel, normalizeProgress({ ...progress, ageConfirmed: true })),
    true
  );
});

test("catalog migration keeps completions, hints, and pass but resets partial words and age confirmation", () => {
  const firstLevel = LEVELS[0];
  const legacy = {
    ...freshProgress(),
    catalogVersion: 1,
    completedLevelIds: [firstLevel.id],
    foundByLevel: { [firstLevel.id]: [firstLevel.words[0]] },
    hintCredits: 12,
    hasPass: true,
    passHintsGranted: true,
    ageConfirmed: true
  };
  const migrated = normalizeProgress(legacy);
  assert.deepEqual(migrated.completedLevelIds, [firstLevel.id]);
  assert.equal(migrated.hintCredits, 12);
  assert.equal(migrated.hasPass, true);
  assert.equal(migrated.passHintsGranted, true);
  assert.deepEqual(migrated.foundByLevel, {});
  assert.equal(migrated.ageConfirmed, false);
});

test("hint packs add 20 credits and clamp at the supported maximum", () => {
  assert.equal(grantHintPack(freshProgress()).hintCredits, 25);
  assert.equal(grantHintPack({ ...freshProgress(), hintCredits: 9999 }).hintCredits, 9999);
});

test("a completed rewarded ad adds exactly one hint and respects the credit cap", () => {
  assert.equal(grantHintReward(freshProgress()).hintCredits, 6);
  assert.equal(grantHintReward({ ...freshProgress(), hintCredits: 9999 }).hintCredits, 9999);
});

test("progress loading handles invalid data and storage failures", () => {
  const corrupted = loadProgress({
    getItem: () => "{not json"
  });
  assert.notEqual(corrupted.warning, "");
  assert.deepEqual(corrupted.progress, freshProgress());

  const unavailable = loadProgress({
    getItem: () => { throw new Error("storage denied"); }
  });
  assert.notEqual(unavailable.warning, "");
  assert.deepEqual(unavailable.progress, freshProgress());
});

test("progress saves only known level and category identifiers", () => {
  let savedKey = "";
  let savedValue = "";
  const storage = {
    setItem(key, value) {
      savedKey = key;
      savedValue = value;
    }
  };
  saveProgress(storage, {
    ...freshProgress(),
    activeCategoryId: "unknown",
    completedLevelIds: ["grove-01", "forged-level"]
  });
  assert.equal(savedKey, PROGRESS_KEY);
  assert.deepEqual(JSON.parse(savedValue).completedLevelIds, ["grove-01"]);
  assert.equal(normalizeProgress({}).activeCategoryId, CATEGORIES[0].id);
});
