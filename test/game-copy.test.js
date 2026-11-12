import test from "node:test";
import assert from "node:assert/strict";
import { formatCopy, gameCopy } from "../src/game-copy.js";

test("English, German and Spanish provide the same interface copy keys", () => {
  const expected = Object.keys(gameCopy.en).sort();
  for (const language of ["de", "es"]) {
    assert.deepEqual(Object.keys(gameCopy[language]).sort(), expected);
  }
});

test("translated interface copy substitutes dynamic values", () => {
  assert.equal(formatCopy("de", "playContinue", { level: 8 }), "Weiter · Level 8");
  assert.equal(formatCopy("es", "homeProgress", { completed: 3, hints: 7 }), "3 de 200 caminos encontrados · 7 pistas");
});
