export const SETTINGS_KEY = "moss-and-letters.settings.v1";

const languages = new Set(["en", "de", "es"]);
const themes = new Set(["dark", "paper"]);

export function freshSettings() {
  return {
    language: "en",
    theme: "dark",
    sound: true,
    haptics: true,
    ambience: false
  };
}

export function normalizeSettings(value) {
  const fresh = freshSettings();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;

  return {
    language: languages.has(value.language) ? value.language : fresh.language,
    theme: themes.has(value.theme) ? value.theme : fresh.theme,
    sound: typeof value.sound === "boolean" ? value.sound : fresh.sound,
    haptics: typeof value.haptics === "boolean" ? value.haptics : fresh.haptics,
    ambience: typeof value.ambience === "boolean" ? value.ambience : fresh.ambience
  };
}

export function loadSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { settings: freshSettings(), warning: "" };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TypeError("Saved settings have an unexpected shape.");
    }
    return { settings: normalizeSettings(parsed), warning: "" };
  } catch {
    return { settings: freshSettings(), warning: "Saved settings could not be read." };
  }
}

export function saveSettings(storage, settings) {
  storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}
