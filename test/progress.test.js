import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, LEVELS } from "../src/game-logic.js";
import {
  canAccessCategory,
  completeLevel,
  freshProgress,
  grantHintPack,
  grantPass,
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

test("the pass unlocks premium categories and grants its bonus credits once", () => {
  const premium = CATEGORIES.find((category) => !category.free);
  const progress = freshProgress();
  assert.equal(canAccessCategory(premium.id, progress), false);
  assert.equal(isLevelUnlocked(LEVELS.find((level) => level.categoryId === premium.id), progress), false);

  const withPass = grantPass(progress);
  assert.equal(withPass.hasPass, true);
  assert.equal(withPass.hintCredits, 55);
  assert.equal(canAccessCategory(premium.id, withPass), true);
  assert.equal(isLevelUnlocked(LEVELS.find((level) => level.categoryId === premium.id), withPass), true);
  assert.equal(grantPass(withPass).hintCredits, 55);
});

test("hint packs add 20 credits and clamp at the supported maximum", () => {
  assert.equal(grantHintPack(freshProgress()).hintCredits, 25);
  assert.equal(grantHintPack({ ...freshProgress(), hintCredits: 9999 }).hintCredits, 9999);
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
