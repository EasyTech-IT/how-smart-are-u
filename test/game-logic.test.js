import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPuzzle,
  canonicalizeFoundWords,
  CATEGORIES,
  getLocalizedCatalog,
  GRID_SIZE,
  LEVELS,
  LEVELS_PER_CATEGORY,
  matchPath,
  localizeFoundWords,
  pathBetween
} from "../src/game-logic.js";

test("the catalog contains 200 stable, playable levels across eight categories", () => {
  assert.equal(LEVELS.length, 200);
  assert.equal(CATEGORIES.length, 8);
  assert.ok(CATEGORIES.filter((category) => category.free).length >= 3);
  assert.equal(new Set(LEVELS.map((level) => level.id)).size, LEVELS.length);

  for (const category of CATEGORIES) {
    const levels = LEVELS.filter((level) => level.categoryId === category.id);
    assert.equal(levels.length, LEVELS_PER_CATEGORY);
    for (const level of levels) {
      const first = buildPuzzle(level);
      assert.deepEqual(buildPuzzle(level), first);
      assert.ok(level.words.every((word) => word.length <= level.gridSize));
      for (const word of level.words) {
        assert.equal(matchPath(first.grid, first.placements[word], [word]), word);
      }
    }
  }
});

test("level size and word count never decrease as difficulty advances", () => {
  for (let index = 1; index < LEVELS.length; index += 1) {
    assert.ok(LEVELS[index].gridSize >= LEVELS[index - 1].gridSize);
    assert.ok(LEVELS[index].words.length >= LEVELS[index - 1].words.length);
  }
  assert.equal(LEVELS[0].gridSize, 8);
  assert.equal(LEVELS.at(-1).gridSize, 13);
});

test("German and Spanish catalogs preserve IDs, progress mapping and grid-safe words", () => {
  for (const language of ["de", "es"]) {
    const localized = getLocalizedCatalog(language);
    assert.deepEqual(localized.categories.map((category) => category.id), CATEGORIES.map((category) => category.id));
    assert.deepEqual(localized.levels.map((level) => level.id), LEVELS.map((level) => level.id));

    for (const category of localized.categories) {
      assert.equal(category.words.length, 30);
      assert.equal(new Set(category.words).size, category.words.length);
      assert.ok(category.words.every((word) => /^[A-Z]+$/.test(word) && word.length <= 13));
    }

    for (const [index, level] of localized.levels.entries()) {
      const source = LEVELS[index];
      assert.deepEqual(level.canonicalWords, source.words);
      assert.equal(level.words.length, source.words.length);
      assert.ok(level.words.every((word) => word.length <= level.gridSize));
      assert.doesNotThrow(() => buildPuzzle(level));
    }
  }
});

test("partial found-word progress survives switching between catalog languages", () => {
  const englishLevel = LEVELS.find((level) => level.categoryId === "hearth" && level.localLevel === 4);
  const germanLevel = getLocalizedCatalog("de").levels.find((level) => level.id === englishLevel.id);
  const spanishLevel = getLocalizedCatalog("es").levels.find((level) => level.id === englishLevel.id);
  const foundGerman = new Set(germanLevel.words.slice(0, 2));
  const savedEnglish = canonicalizeFoundWords(germanLevel, foundGerman);

  assert.deepEqual(savedEnglish, englishLevel.words.slice(0, 2));
  assert.deepEqual(localizeFoundWords(spanishLevel, savedEnglish), new Set(spanishLevel.words.slice(0, 2)));
});

test("early levels use only horizontal and vertical placements", () => {
  for (const level of LEVELS.slice(0, 25)) {
    const puzzle = buildPuzzle(level);
    for (const path of Object.values(puzzle.placements)) {
      const first = path[0];
      const last = path.at(-1);
      const rowDelta = Math.floor(last / level.gridSize) - Math.floor(first / level.gridSize);
      const columnDelta = last % level.gridSize - first % level.gridSize;
      assert.ok(rowDelta === 0 || columnDelta === 0);
    }
  }
});

test("word paths run horizontally, vertically, diagonally and backwards", () => {
  const grid = [
    ["C", "A", "T", "X", "X"],
    ["X", "X", "O", "X", "X"],
    ["X", "X", "G", "O", "X"],
    ["X", "X", "X", "X", "D"],
    ["X", "X", "X", "X", "X"]
  ];

  assert.deepEqual(pathBetween(0, 2, 5), [0, 1, 2]);
  assert.deepEqual(pathBetween(4, 14, 5), [4, 9, 14]);
  assert.deepEqual(pathBetween(10, 14, 5), [10, 11, 12, 13, 14]);
  assert.equal(matchPath(grid, [2, 1, 0], ["CAT"]), "CAT");
});

test("rejects bent paths and out-of-range cells", () => {
  assert.equal(pathBetween(0, 7, 5), null);
  assert.equal(pathBetween(-1, 2, 5), null);
  assert.equal(pathBetween(0, 25, 5), null);
});

test("rejects words longer than the grid instead of silently omitting them", () => {
  assert.throws(
    () => buildPuzzle({ id: "too-long", words: ["TOOLONG"] }, 4),
    /cannot fit this grid/
  );
  assert.equal(GRID_SIZE, 9);
});
