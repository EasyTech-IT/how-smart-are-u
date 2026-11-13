import test from "node:test";
import assert from "node:assert/strict";
import {
  freshSettings,
  loadSettings,
  normalizeSettings,
  saveSettings,
  SETTINGS_KEY
} from "../src/game-settings.js";

test("settings accept only supported languages, themes and boolean toggles", () => {
  assert.deepEqual(normalizeSettings({
    language: "es",
    theme: "paper",
    sound: false,
    haptics: false,
    ambience: true,
    unexpected: "ignored"
  }), {
    language: "es",
    theme: "paper",
    sound: false,
    haptics: false,
    ambience: true
  });
  assert.deepEqual(normalizeSettings({
    language: "fr",
    theme: "neon",
    sound: "yes",
    ambience: 1
  }), freshSettings());
});

test("settings load and save independently of game progress", () => {
  let savedKey = "";
  let savedValue = "";
  const storage = {
    getItem(key) {
      return key === SETTINGS_KEY ? savedValue : null;
    },
    setItem(key, value) {
      savedKey = key;
      savedValue = value;
    }
  };

  saveSettings(storage, { language: "de", theme: "paper", sound: true, ambience: false });
  assert.equal(savedKey, SETTINGS_KEY);
  assert.deepEqual(loadSettings(storage), {
    settings: { language: "de", theme: "paper", sound: true, haptics: true, ambience: false },
    warning: ""
  });
});
