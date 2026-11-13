import { CATEGORIES, LEVELS } from "./game-logic.js";

export const PROGRESS_KEY = "moss-and-letters.progress.v1";
const CATALOG_VERSION = 2;
const levelIds = new Set(LEVELS.map((level) => level.id));
const categoryIds = new Set(CATEGORIES.map((category) => category.id));

export function freshProgress() {
  return {
    catalogVersion: CATALOG_VERSION,
    activeCategoryId: CATEGORIES[0].id,
    activeLevelId: LEVELS[0].id,
    completedLevelIds: [],
    foundByLevel: {},
    hintCredits: 5,
    hasPass: false,
    passHintsGranted: false,
    ageConfirmed: false
  };
}

export function normalizeProgress(value) {
  const fresh = freshProgress();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;

  const completedLevelIds = Array.isArray(value.completedLevelIds)
    ? [...new Set(value.completedLevelIds.filter((id) =>
      typeof id === "string" && levelIds.has(id)
    ))]
    : [];
  const hintCredits = Number.isSafeInteger(value.hintCredits)
    ? Math.max(0, Math.min(9999, value.hintCredits))
    : fresh.hintCredits;
  const foundByLevel = {};
  if (value.catalogVersion === CATALOG_VERSION &&
      value.foundByLevel && typeof value.foundByLevel === "object" &&
      !Array.isArray(value.foundByLevel)) {
    for (const level of LEVELS) {
      const found = value.foundByLevel[level.id];
      foundByLevel[level.id] = Array.isArray(found)
        ? [...new Set(found.filter((word) =>
          typeof word === "string" && level.words.includes(word.toUpperCase())
        ).map((word) => word.toUpperCase()))]
        : [];
    }
  }

  return {
    catalogVersion: CATALOG_VERSION,
    activeCategoryId: categoryIds.has(value.activeCategoryId)
      ? value.activeCategoryId
      : fresh.activeCategoryId,
    activeLevelId: levelIds.has(value.activeLevelId)
      ? value.activeLevelId
      : fresh.activeLevelId,
    completedLevelIds,
    foundByLevel,
    hintCredits,
    hasPass: value.hasPass === true,
    passHintsGranted: value.passHintsGranted === true,
    ageConfirmed: value.catalogVersion === CATALOG_VERSION && value.ageConfirmed === true
  };
}

export function loadProgress(storage) {
  try {
    const raw = storage.getItem(PROGRESS_KEY);
    if (!raw) return { progress: freshProgress(), warning: "" };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TypeError("Saved progress has an unexpected shape.");
    }
    return { progress: normalizeProgress(parsed), warning: "" };
  } catch {
    return {
      progress: freshProgress(),
      warning: "Saved progress could not be read. A new trail is ready on this device."
    };
  }
}

export function saveProgress(storage, progress) {
  storage.setItem(PROGRESS_KEY, JSON.stringify(normalizeProgress(progress)));
}

export function canAccessCategory(categoryId, progress) {
  const category = CATEGORIES.find((item) => item.id === categoryId);
  return Boolean(category && (category.free || progress.hasPass || category.previewLevels > 0));
}

export function isPassRequiredForLevel(level, progress) {
  const category = CATEGORIES.find((item) => item.id === level?.categoryId);
  return Boolean(category && !category.free && !progress.hasPass &&
    level.localLevel > category.previewLevels);
}

export function isLevelUnlocked(level, progress) {
  const category = CATEGORIES.find((item) => item.id === level?.categoryId);
  if (!level || !category || !canAccessCategory(level.categoryId, progress) ||
      (category.ageRestricted && !progress.ageConfirmed) ||
      isPassRequiredForLevel(level, progress)) return false;
  if (level.localLevel === 1) return true;
  const previous = LEVELS.find((item) =>
    item.categoryId === level.categoryId && item.localLevel === level.localLevel - 1
  );
  return Boolean(previous && progress.completedLevelIds.includes(previous.id));
}

export function completeLevel(level, progress) {
  const next = normalizeProgress(progress);
  if (!next.completedLevelIds.includes(level.id)) {
    next.completedLevelIds.push(level.id);
    next.hintCredits = Math.min(9999, next.hintCredits + 1);
  }
  const following = LEVELS.find((item) =>
    item.categoryId === level.categoryId && item.localLevel === level.localLevel + 1
  );
  if (following) {
    next.activeCategoryId = level.categoryId;
    next.activeLevelId = following.id;
  }
  return next;
}

export function grantPass(progress) {
  const next = normalizeProgress(progress);
  next.hasPass = true;
  if (!next.passHintsGranted) {
    next.hintCredits = Math.min(9999, next.hintCredits + 50);
    next.passHintsGranted = true;
  }
  return next;
}

export function grantHintPack(progress) {
  const next = normalizeProgress(progress);
  next.hintCredits = Math.min(9999, next.hintCredits + 20);
  return next;
}

export function grantHintReward(progress) {
  const next = normalizeProgress(progress);
  next.hintCredits = Math.min(9999, next.hintCredits + 1);
  return next;
}
