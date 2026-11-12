import {
  buildPuzzle,
  canonicalizeFoundWords,
  CATEGORIES,
  getLocalizedCatalog,
  LEVELS,
  localizeFoundWords,
  matchPath,
  pathBetween
} from "./game-logic.js";
import { formatCopy } from "./game-copy.js";
import { playUiSound, setAmbience } from "./game-audio.js";
import { loadSettings, saveSettings } from "./game-settings.js";
import {
  canAccessCategory,
  completeLevel,
  freshProgress,
  grantHintPack,
  grantPass,
  isLevelUnlocked,
  loadProgress,
  saveProgress
} from "./progress.js";
import { hideAdBanner, initializeAds, showAdBanner } from "./ads.js";
import {
  hasPassEntitlement,
  initializeStore,
  purchaseStorePackage,
  restoreStorePurchases
} from "./store.js";

const elements = {
  app: document.querySelector("#app"),
  adSlot: document.querySelector("#ad-slot"),
  bottomNav: document.querySelector("#bottom-nav"),
  walletCount: document.querySelector("#wallet-count"),
  walletLabel: document.querySelector("#wallet-label"),
  homeTitleFirst: document.querySelector("#home-title-first"),
  homeTitleSecond: document.querySelector("#home-title-second"),
  playButton: document.querySelector("#play-button"),
  playLabel: document.querySelector("#play-label"),
  homeProgress: document.querySelector("#home-progress"),
  categoryGrid: document.querySelector("#category-grid"),
  backCategories: document.querySelector("#back-categories"),
  levelsKicker: document.querySelector("#levels-kicker"),
  levelsTitle: document.querySelector("#levels-title"),
  chapterCount: document.querySelector("#chapter-count"),
  levelPath: document.querySelector("#level-path"),
  backLevels: document.querySelector("#back-levels"),
  puzzleCategory: document.querySelector("#puzzle-category"),
  puzzleTitle: document.querySelector("#puzzle-title"),
  puzzleDifficulty: document.querySelector("#puzzle-difficulty"),
  puzzleProgress: document.querySelector("#puzzle-progress"),
  puzzleProgressFill: document.querySelector("#puzzle-progress-fill"),
  grid: document.querySelector("#letter-grid"),
  wordTargets: document.querySelector("#word-targets"),
  gameMessage: document.querySelector("#game-message"),
  hintButton: document.querySelector("#hint-button"),
  hintCount: document.querySelector("#hint-count"),
  completionDialog: document.querySelector("#completion-dialog"),
  completionTitle: document.querySelector("#completion-title"),
  completionCopy: document.querySelector("#completion-copy"),
  rewardLine: document.querySelector("#reward-line"),
  nextLevelButton: document.querySelector("#next-level-button"),
  returnMapButton: document.querySelector("#return-map-button"),
  buyPassButton: document.querySelector("#buy-pass-button"),
  buyHintsButton: document.querySelector("#buy-hints-button"),
  restorePurchasesButton: document.querySelector("#restore-purchases-button"),
  passPrice: document.querySelector("#pass-price"),
  storeNote: document.querySelector("#store-note"),
  languageSetting: document.querySelector("#language-setting"),
  themeSetting: document.querySelector("#theme-setting"),
  soundSetting: document.querySelector("#sound-setting"),
  ambienceSetting: document.querySelector("#ambience-setting"),
  settingsNote: document.querySelector("#settings-note"),
  liveAnnouncement: document.querySelector("#live-announcement")
};

let storage = null;
let loaded;
try {
  storage = window.localStorage;
  loaded = loadProgress(storage);
} catch {
  loaded = {
    progress: freshProgress(),
    warning: "Device storage is unavailable. Progress may not survive closing the game."
  };
}
let progress = loaded.progress;
const loadedSettings = loadSettings(storage);
let settings = loadedSettings.settings;
let catalog = getLocalizedCatalog(settings.language);
let currentScreen = "home";
let selectedCategoryId = progress.activeCategoryId;
let currentLevel = null;
let generatedPuzzle = null;
let foundWords = new Set();
let cellButtons = [];
let focusIndex = 0;
let selectionPath = [];
let tapAnchor = null;
let pointerStartIndex = null;
let activePointerId = null;
let hintedWord = null;
let hintTimer = null;
let storeState = { ready: false, reason: "", hasPass: false };
let adsState = { ready: false, bannerId: "" };
let bannerVisible = false;
let bannerUpdate = Promise.resolve();

function setMessage(message, kind = "info") {
  elements.gameMessage.textContent = message;
  elements.gameMessage.dataset.kind = kind;
  elements.liveAnnouncement.textContent = message;
}

function t(key, values) {
  return formatCopy(settings.language, key, values);
}

function saveGameSettings() {
  try {
    if (!storage) throw new Error("Device storage is unavailable.");
    saveSettings(storage, settings);
    elements.settingsNote.textContent = t("settingsSaved");
  } catch (error) {
    console.error("Settings could not be saved.", error);
    elements.settingsNote.textContent = t("settingsSaveError");
  }
}

function applyTranslations() {
  document.documentElement.lang = settings.language;
  const targets = [
    ["#offline-label", "offlineReady"],
    ["#home-eyebrow", "homeEyebrow"],
    ["#home-description", "homeDescription"],
    ["#categories-eyebrow", "categoriesEyebrow"],
    ["#categories-title", "categoriesTitle"],
    ["#categories-description", "categoriesDescription"],
    ["#back-categories", "backToCategories", "aria-label"],
    ["#back-levels", "backToLevels", "aria-label"],
    ["#puzzle-progress", "puzzleProgressAria", "aria-label"],
    ["#shop-eyebrow", "shopEyebrow"],
    ["#shop-title", "shopTitle"],
    ["#shop-description", "shopDescription"],
    ["#pass-eyebrow", "passEyebrow"],
    ["#pass-title", "passTitle"],
    ["#pass-description", "passDescription"],
    ["#pass-benefits", "passBenefits"],
    ["#hints-eyebrow", "hintsEyebrow"],
    ["#hints-title", "hintsTitle"],
    ["#hints-description", "hintsDescription"],
    ["#info-eyebrow", "infoEyebrow"],
    ["#info-title", "infoTitle"],
    ["#info-description", "infoDescription"],
    ["#settings-title", "settingsTitle"],
    ["#language-label", "languageLabel"],
    ["#theme-label", "themeLabel"],
    ["#theme-dark", "themeDark"],
    ["#theme-paper", "themePaper"],
    ["#sound-label", "soundLabel"],
    ["#ambience-label", "ambienceLabel"],
    ["#privacy-title", "privacyTitle"],
    ["#privacy-description", "privacyDescription"],
    ["#imprint-title", "imprintTitle"],
    ["#imprint-description", "imprintDescription"],
    ["#terms-title", "termsTitle"],
    ["#terms-description", "termsDescription"],
    ["#legal-links", "legalInformation", "aria-label"],
    ["#legal-draft", "legalDraft"],
    ["#nav-home", "navHome"],
    ["#nav-levels", "navLevels"],
    ["#nav-pass", "navPass"],
    ["#nav-info", "navInfo"],
    ["#hint-label", "hintButton"],
    ["#completion-eyebrow", "completeEyebrow"],
    ["#return-map-button", "backToMap"]
  ];
  for (const [selector, key, attribute] of targets) {
    const node = document.querySelector(selector);
    if (!node) continue;
    if (attribute) node.setAttribute(attribute, t(key));
    else node.textContent = t(key);
  }
  const [firstLine, secondLine] = t("homeTitle").split("\n");
  elements.homeTitleFirst.textContent = firstLine;
  elements.homeTitleSecond.textContent = secondLine;
  elements.walletLabel.setAttribute("aria-label", t("ariaWallet"));
  elements.bottomNav.setAttribute("aria-label", t("mainNavigation"));
  elements.categoryGrid.setAttribute("aria-label", t("ariaCategories"));
  elements.wordTargets.setAttribute("aria-label", t("wordsToFind"));
  elements.languageSetting.value = settings.language;
  elements.themeSetting.value = settings.theme;
  elements.soundSetting.checked = settings.sound;
  elements.ambienceSetting.checked = settings.ambience;
  elements.app.dataset.theme = settings.theme;
}

function announce(message) {
  elements.liveAnnouncement.textContent = message;
}

function persistProgress() {
  try {
    if (!storage) throw new Error("Device storage is unavailable.");
    saveProgress(storage, progress);
    return true;
  } catch {
    setMessage(t("progressSaveWarning"), "error");
    announce(t("progressSaveWarning"));
    return false;
  }
}

function playSound(kind) {
  if (!settings.sound) return;
  try {
    if (!playUiSound(kind)) {
      elements.settingsNote.textContent = t("audioUnavailable");
    }
  } catch (error) {
    console.error("Interface sound could not be played.", error);
    elements.settingsNote.textContent = t("audioError");
  }
}

function completedCount(categoryId) {
  return progress.completedLevelIds.filter((id) =>
    LEVELS.some((level) => level.id === id && level.categoryId === categoryId)
  ).length;
}

function nextPlayableLevel(categoryId = progress.activeCategoryId) {
  const level = catalog.levels.find((item) =>
    item.categoryId === categoryId &&
    !progress.completedLevelIds.includes(item.id) &&
    isLevelUnlocked(item, progress)
  );
  return level || catalog.levels.find((item) => item.categoryId === categoryId) || catalog.levels[0];
}

function updateWallet() {
  elements.walletCount.textContent = String(progress.hintCredits);
  elements.hintCount.textContent = String(progress.hintCredits);
  elements.hintButton.setAttribute("aria-label", t("hintButtonAria", { count: progress.hintCredits }));
}

function showScreen(screen) {
  currentScreen = screen;
  document.querySelectorAll(".screen").forEach((section) => {
    const active = section.dataset.screen === screen;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  });
  elements.bottomNav.hidden = screen === "game";
  document.querySelectorAll(".nav-button").forEach((button) => {
    const active = button.dataset.route === screen ||
      (screen === "levels" && button.dataset.route === "categories");
    button.classList.toggle("is-current", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  syncAdBanner();
}

function syncAdBanner() {
  bannerUpdate = bannerUpdate.then(async () => {
    const shouldShow = adsState.ready && !progress.hasPass &&
      currentScreen !== "game" && currentScreen !== "shop" && currentScreen !== "info";
    if (shouldShow && !bannerVisible) {
      elements.app.classList.add("has-ad");
      elements.adSlot.hidden = false;
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const bottomInset = Number.parseFloat(getComputedStyle(elements.app).paddingBottom) || 0;
      const margin = Math.ceil(elements.bottomNav.getBoundingClientRect().height + bottomInset);
      bannerVisible = await showAdBanner(adsState.bannerId, margin);
      if (!bannerVisible) {
        elements.app.classList.remove("has-ad");
        elements.adSlot.hidden = true;
      }
    } else if (!shouldShow && bannerVisible) {
      await hideAdBanner();
      bannerVisible = false;
      elements.app.classList.remove("has-ad");
      elements.adSlot.hidden = true;
    }
  }).catch((error) => {
    console.error("Ad banner could not be updated.", error);
    bannerVisible = false;
    elements.app.classList.remove("has-ad");
    elements.adSlot.hidden = true;
  });
}

function renderHome() {
  const level = nextPlayableLevel();
  const completed = progress.completedLevelIds.length;
  elements.playLabel.textContent = completed
    ? t("playContinue", { level: level.number })
    : t("playStart");
  elements.homeProgress.textContent = completed
    ? t("homeProgress", { completed, hints: progress.hintCredits })
    : t("homeStartProgress");
  updateWallet();
}

function renderStoreState() {
  const ownsPass = progress.hasPass || storeState.hasPass;
  const passPackage = storeState.passPackage;
  const hintPackage = storeState.hintsPackage;
  elements.buyPassButton.disabled = !storeState.ready || !passPackage || ownsPass;
  elements.buyPassButton.textContent = ownsPass
    ? t("passOwned")
    : passPackage
      ? t("buyPass", { price: passPackage.product.priceString })
      : t("storeSetupNeeded");
  elements.passPrice.textContent = passPackage
    ? passPackage.product.priceString
    : t("priceInStore");
  elements.buyHintsButton.disabled = !storeState.ready || !hintPackage;
  elements.buyHintsButton.textContent = hintPackage
    ? t("buyHints", { price: hintPackage.product.priceString })
    : t("storeSetupNeeded");
  elements.restorePurchasesButton.disabled = !storeState.ready;
  elements.restorePurchasesButton.textContent = t("restorePurchases");
  elements.storeNote.textContent = localizedStoreReason() ||
    (storeState.ready ? t("storeReady") : t("storeNotReady"));
}

function localizedStoreReason() {
  const reason = storeState.reason;
  if (!reason) return "";
  if (reason.includes("Purchases are available in the Android and iOS apps.")) return t("storeNativeOnly");
  if (reason.includes("Add the RevenueCat public SDK key")) return t("storeKeyMissing");
  if (reason.includes("No current RevenueCat offering")) return t("storeOfferMissing");
  if (reason.includes("The store could not be reached.")) return t("storeUnavailable");
  return reason;
}

function renderCategories() {
  elements.categoryGrid.replaceChildren();
  const symbols = {
    grove: "♧",
    shore: "≈",
    hearth: "⌂",
    wilds: "✧",
    starlight: "☾",
    market: "✿",
    highlands: "△",
    wonder: "◇"
  };

  for (const [index, category] of catalog.categories.entries()) {
    const count = completedCount(category.id);
    const accessible = canAccessCategory(category.id, progress);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    card.dataset.categoryId = category.id;
    card.dataset.locked = String(!accessible);
    card.style.setProperty("--card-order", String(index));
    card.setAttribute("aria-label", t("categoryAria", {
      name: category.name,
      progress: accessible ? t("categoryProgress", { completed: count }) : t("categoryLocked")
    }));

    const emblem = document.createElement("span");
    emblem.className = "category-emblem";
    emblem.setAttribute("aria-hidden", "true");
    emblem.textContent = symbols[category.id];
    const copy = document.createElement("span");
    copy.className = "category-copy";
    const title = document.createElement("strong");
    title.textContent = category.name;
    const subtitle = document.createElement("small");
    subtitle.textContent = accessible
      ? t("categoryProgress", { completed: count })
      : t("categoryLocked");
    copy.append(title, subtitle);
    const marker = document.createElement("span");
    marker.className = "category-marker";
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = accessible ? "→" : "⌑";
    card.append(emblem, copy, marker);
    elements.categoryGrid.append(card);
  }
}

function openCategory(categoryId) {
  const category = catalog.categories.find((item) => item.id === categoryId);
  if (!category) return;
  if (!canAccessCategory(category.id, progress)) {
    showScreen("shop");
    elements.storeNote.textContent = t("storeSetupMessage", { category: category.name });
    return;
  }
  selectedCategoryId = category.id;
  progress.activeCategoryId = category.id;
  elements.levelsKicker.textContent = category.name.toUpperCase();
  elements.levelsTitle.textContent = category.name;
  showScreen("levels");
  renderLevels();
  persistProgress();
}

function renderLevels() {
  const levels = catalog.levels.filter((level) => level.categoryId === selectedCategoryId);
  const category = catalog.categories.find((item) => item.id === selectedCategoryId);
  const completed = completedCount(selectedCategoryId);
  elements.chapterCount.textContent = t("levelCount", { completed, total: levels.length });
  elements.levelPath.replaceChildren();
  elements.levelPath.style.setProperty("--level-count", String(levels.length));
  elements.levelPath.setAttribute("aria-label", t("levelsAria"));

  for (const level of levels) {
    const isComplete = progress.completedLevelIds.includes(level.id);
    const unlocked = isLevelUnlocked(level, progress);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-node";
    button.dataset.completed = String(isComplete);
    button.dataset.locked = String(!unlocked);
    button.dataset.current = String(level.id === progress.activeLevelId);
    button.disabled = !unlocked;
    button.textContent = isComplete ? "✓" : unlocked ? String(level.localLevel) : "·";
    button.setAttribute("aria-label", t("levelAria", {
      category: category.name,
      level: level.localLevel,
      state: isComplete ? t("levelCompleted") : unlocked ? t("levelReady") : t("levelLocked")
    }));
    button.addEventListener("click", () => startLevel(level));
    elements.levelPath.append(button);
  }
}

function showLevelsForCurrentCategory() {
  if (!selectedCategoryId) selectedCategoryId = progress.activeCategoryId;
  const category = catalog.categories.find((item) => item.id === selectedCategoryId) || catalog.categories[0];
  elements.levelsKicker.textContent = category.name.toUpperCase();
  elements.levelsTitle.textContent = category.name;
  renderLevels();
  showScreen("levels");
}

function startLevel(level) {
  if (!isLevelUnlocked(level, progress)) {
    setMessage(t("lockedTrail"), "warning");
    return;
  }

  clearTimeout(hintTimer);
  currentLevel = level;
  selectedCategoryId = level.categoryId;
  progress.activeCategoryId = level.categoryId;
  progress.activeLevelId = level.id;
  const replaying = progress.completedLevelIds.includes(level.id);
  const foundCanonical = replaying ? [] : progress.foundByLevel[level.id] || [];
  foundWords = localizeFoundWords(level, foundCanonical);
  if (replaying) progress.foundByLevel[level.id] = [];
  generatedPuzzle = buildPuzzle(level);
  focusIndex = 0;
  selectionPath = [];
  tapAnchor = null;
  hintedWord = null;
  elements.puzzleCategory.textContent = level.categoryName.toUpperCase();
  elements.puzzleTitle.textContent = `${t("levelTitle")} ${level.localLevel}`;
  elements.puzzleDifficulty.textContent = t(`difficulty${level.difficulty}`);
  showScreen("game");
  renderGrid();
  renderWordTargets();
  updateWallet();
  setMessage(t("dragWord"));
  persistProgress();
  cellButtons[0]?.focus({ preventScroll: true });
}

function renderGrid() {
  const size = currentLevel.gridSize;
  elements.grid.replaceChildren();
  elements.grid.style.setProperty("--board-size", String(size));
  elements.grid.setAttribute("aria-rowcount", String(size));
  elements.grid.setAttribute("aria-colcount", String(size));
  elements.grid.setAttribute("aria-label", t("puzzleGridAria", {
    category: currentLevel.categoryName,
    level: currentLevel.localLevel
  }));
  cellButtons = [];

  generatedPuzzle.grid.forEach((row, rowIndex) => {
    row.forEach((letter, columnIndex) => {
      const index = rowIndex * size + columnIndex;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "letter-cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", t("cellAria", {
        row: rowIndex + 1,
        column: columnIndex + 1,
        letter
      }));
      cell.dataset.cellIndex = String(index);
      cell.tabIndex = index === focusIndex ? 0 : -1;
      cell.textContent = letter;
      cellButtons.push(cell);
      elements.grid.append(cell);
    });
  });
  renderGridStates();
  updatePuzzleProgress();
}

function renderGridStates() {
  if (!currentLevel || !generatedPuzzle) return;
  const foundCells = new Set();
  for (const word of foundWords) {
    for (const index of generatedPuzzle.placements[word] || []) foundCells.add(index);
  }
  const hintedCells = new Set(hintedWord ? generatedPuzzle.placements[hintedWord] || [] : []);
  const selectedCells = new Set(selectionPath);

  for (const [index, button] of cellButtons.entries()) {
    button.classList.toggle("is-found", foundCells.has(index));
    button.classList.toggle("is-hinted", hintedCells.has(index));
    button.classList.toggle("is-selected", selectedCells.has(index));
  }
}

function updatePuzzleProgress() {
  const found = foundWords.size;
  const total = currentLevel.words.length;
  elements.puzzleProgress.setAttribute("aria-valuemax", String(total));
  elements.puzzleProgress.setAttribute("aria-valuenow", String(found));
  elements.puzzleProgressFill.style.setProperty("--progress", String(found / total));
}

function renderWordTargets() {
  elements.wordTargets.replaceChildren();
  for (const word of currentLevel.words) {
    const target = document.createElement("span");
    target.className = "word-target";
    target.dataset.found = String(foundWords.has(word));
    target.textContent = word;
    elements.wordTargets.append(target);
  }
  updatePuzzleProgress();
}

function saveFoundWords() {
  progress.foundByLevel[currentLevel.id] = canonicalizeFoundWords(currentLevel, foundWords);
}

function updateSelection(path) {
  selectionPath = path || [];
  elements.grid.classList.remove("has-invalid-selection");
  renderGridStates();
}

function invalidSelection() {
  selectionPath = [];
  tapAnchor = null;
  renderGridStates();
  elements.grid.classList.add("has-invalid-selection");
  setMessage(t("invalidSelection"), "warning");
  window.setTimeout(() => elements.grid.classList.remove("has-invalid-selection"), 260);
}

function finishLevel() {
  const firstCompletion = !progress.completedLevelIds.includes(currentLevel.id);
  saveFoundWords();
  progress = completeLevel(currentLevel, progress);
  persistProgress();
  renderHome();
  renderCategories();
  renderLevels();
  elements.completionTitle.textContent = firstCompletion ? t("completeTitle") : t("completeReplayTitle");
  elements.completionCopy.textContent = firstCompletion
    ? t("completeCopy")
    : t("completeReplayCopy");
  elements.rewardLine.textContent = firstCompletion ? t("completeReward") : t("noReward");
  const next = catalog.levels.find((level) =>
    level.categoryId === currentLevel.categoryId &&
    level.localLevel === currentLevel.localLevel + 1
  );
  elements.nextLevelButton.textContent = next ? t("continueTrail") : t("choosePath");
  elements.nextLevelButton.dataset.nextLevelId = next?.id || "";
  if (!elements.completionDialog.open) elements.completionDialog.showModal();
  playSound("complete");
}

function acceptPath(path) {
  const remaining = currentLevel.words.filter((word) => !foundWords.has(word));
  const word = matchPath(generatedPuzzle.grid, path, remaining);
  if (!word) {
    invalidSelection();
    return;
  }

  foundWords.add(word);
  saveFoundWords();
  selectionPath = [];
  tapAnchor = null;
  hintedWord = null;
  clearTimeout(hintTimer);
  renderGridStates();
  renderWordTargets();
  updateWallet();
  persistProgress();
  setMessage(t("wordFound", {
    word,
    left: currentLevel.words.length - foundWords.size
  }), "success");
  playSound("found");

  if (foundWords.size === currentLevel.words.length) finishLevel();
}

function handleTap(index) {
  if (tapAnchor === null) {
    tapAnchor = index;
    updateSelection([index]);
    setMessage(t("firstLetter"));
    return;
  }
  const path = pathBetween(tapAnchor, index, currentLevel.gridSize);
  if (!path) {
    invalidSelection();
    return;
  }
  acceptPath(path);
}

function cellIndexFromTarget(target) {
  const cell = target instanceof Element ? target.closest("[data-cell-index]") : null;
  return cell ? Number(cell.dataset.cellIndex) : null;
}

function onPointerDown(event) {
  const index = cellIndexFromTarget(event.target);
  if (index === null || (event.button !== undefined && event.button !== 0)) return;
  event.preventDefault();
  activePointerId = event.pointerId;
  pointerStartIndex = index;
  updateSelection([index]);
}

function onPointerMove(event) {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  const target = document.elementFromPoint(event.clientX, event.clientY) || event.target;
  const index = cellIndexFromTarget(target);
  if (index === null) return;
  const path = pathBetween(pointerStartIndex, index, currentLevel.gridSize);
  if (path) updateSelection(path);
}

function onPointerUp(event) {
  if (activePointerId === null || event.pointerId !== activePointerId) return;
  const start = pointerStartIndex;
  const target = document.elementFromPoint(event.clientX, event.clientY) || event.target;
  const end = cellIndexFromTarget(target);
  activePointerId = null;
  pointerStartIndex = null;
  const path = end === null ? null : pathBetween(start, end, currentLevel.gridSize);
  if (!path) {
    invalidSelection();
    return;
  }
  if (path.length > 1) {
    tapAnchor = null;
    acceptPath(path);
    return;
  }
  if (tapAnchor !== null && tapAnchor !== start) {
    const tapPath = pathBetween(tapAnchor, start, currentLevel.gridSize);
    if (tapPath) acceptPath(tapPath);
    else invalidSelection();
    return;
  }
  tapAnchor = start;
  updateSelection([start]);
  setMessage(t("firstLetter"));
}

function onGridKeyDown(event) {
  const index = cellIndexFromTarget(event.target);
  if (index === null || !currentLevel) return;
  const size = currentLevel.gridSize;
  const row = Math.floor(index / size);
  const column = index % size;
  const offsets = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  };
  const offset = offsets[event.key];
  if (!offset) {
    if (event.key === "Escape") {
      tapAnchor = null;
      updateSelection([]);
      setMessage(t("selectionCleared"));
    }
    return;
  }

  event.preventDefault();
  const nextRow = Math.max(0, Math.min(size - 1, row + offset[0]));
  const nextColumn = Math.max(0, Math.min(size - 1, column + offset[1]));
  focusIndex = nextRow * size + nextColumn;
  cellButtons[index].tabIndex = -1;
  cellButtons[focusIndex].tabIndex = 0;
  cellButtons[focusIndex].focus();
}

function useHint() {
  if (!currentLevel || foundWords.size === currentLevel.words.length) return;
  if (progress.hintCredits < 1) {
    setMessage(t("noHints"), "warning");
    return;
  }
  const word = currentLevel.words.find((candidate) => !foundWords.has(candidate));
  if (!word) return;

  progress.hintCredits -= 1;
  hintedWord = word;
  selectionPath = [];
  renderGridStates();
  updateWallet();
  persistProgress();
  setMessage(t("hintMessage"), "success");
  playSound("hint");
  clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => {
    hintedWord = null;
    renderGridStates();
  }, 1600);
}

function setupEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const route = button.dataset.route;
      if (route === "home") {
        renderHome();
        showScreen("home");
      } else if (route === "categories") {
        renderCategories();
        showScreen("categories");
      } else if (route === "shop") {
        showScreen("shop");
      } else if (route === "info") {
        showScreen("info");
      }
    });
  });
  elements.playButton.addEventListener("click", () => {
    const level = nextPlayableLevel();
    startLevel(level);
  });
  elements.categoryGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-id]");
    if (button) openCategory(button.dataset.categoryId);
  });
  elements.backCategories.addEventListener("click", () => showScreen("categories"));
  elements.backLevels.addEventListener("click", showLevelsForCurrentCategory);
  elements.grid.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", () => {
    activePointerId = null;
    pointerStartIndex = null;
    tapAnchor = null;
    updateSelection([]);
  });
  elements.grid.addEventListener("click", (event) => {
    if (event.detail === 0) {
      const index = cellIndexFromTarget(event.target);
      if (index !== null) handleTap(index);
    }
  });
  elements.grid.addEventListener("keydown", onGridKeyDown);
  elements.hintButton.addEventListener("click", useHint);
  elements.nextLevelButton.addEventListener("click", () => {
    const level = catalog.levels.find((item) => item.id === elements.nextLevelButton.dataset.nextLevelId);
    elements.completionDialog.close();
    if (level && isLevelUnlocked(level, progress)) startLevel(level);
    else showLevelsForCurrentCategory();
  });
  elements.returnMapButton.addEventListener("click", () => {
    elements.completionDialog.close();
    showLevelsForCurrentCategory();
  });
  elements.buyPassButton.addEventListener("click", () => {
    void buyPass();
  });
  elements.buyHintsButton.addEventListener("click", () => {
    void buyHintPack();
  });
  elements.restorePurchasesButton.addEventListener("click", () => {
    void restorePass();
  });
  elements.languageSetting.addEventListener("change", () => {
    settings.language = elements.languageSetting.value;
    catalog = getLocalizedCatalog(settings.language);
    applyTranslations();
    elements.gameMessage.textContent = t("dragWord");
    elements.liveAnnouncement.textContent = "";
    renderHome();
    renderCategories();
    renderStoreState();
    if (currentScreen === "levels") showLevelsForCurrentCategory();
    if (currentScreen === "game" && currentLevel) {
      const localizedLevel = catalog.levels.find((level) => level.id === currentLevel.id);
      if (localizedLevel) startLevel(localizedLevel);
    }
    saveGameSettings();
  });
  elements.themeSetting.addEventListener("change", () => {
    settings.theme = elements.themeSetting.value;
    elements.app.dataset.theme = settings.theme;
    saveGameSettings();
  });
  elements.soundSetting.addEventListener("change", () => {
    settings.sound = elements.soundSetting.checked;
    saveGameSettings();
    if (settings.sound) playSound("hint");
  });
  elements.ambienceSetting.addEventListener("change", () => {
    void changeAmbience(elements.ambienceSetting.checked);
  });
  window.addEventListener("pagehide", persistProgress);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persistProgress();
      void setAmbience(false);
    } else if (settings.ambience) {
      void setAmbience(true).catch((error) => {
        console.error("Ambient sound could not resume.", error);
        elements.settingsNote.textContent = t("audioError");
      });
    }
  });
}

async function changeAmbience(enabled) {
  try {
    await setAmbience(enabled);
    settings.ambience = enabled;
    saveGameSettings();
  } catch (error) {
    console.error("Ambient sound could not be changed.", error);
    settings.ambience = false;
    elements.ambienceSetting.checked = false;
    const message = !window.AudioContext && !window.webkitAudioContext
      ? t("audioUnavailable")
      : t("audioError");
    saveGameSettings();
    elements.settingsNote.textContent = message;
  }
}

async function buyPass() {
  elements.buyPassButton.disabled = true;
  elements.storeNote.textContent = t("openingStore");
  try {
    const customerInfo = await purchaseStorePackage(storeState.passPackage);
    if (!hasPassEntitlement(customerInfo)) {
      throw new Error("The purchase completed without the pass entitlement. Check the RevenueCat product mapping.");
    }
    progress = grantPass(progress);
    storeState.hasPass = true;
    persistProgress();
    renderHome();
    renderCategories();
    renderStoreState();
    syncAdBanner();
    elements.storeNote.textContent = t("passActive");
  } catch (error) {
    console.error("Pass purchase failed.", error);
    renderStoreState();
    elements.storeNote.textContent = t("purchaseFailed", {
      error: error instanceof Error ? error.message : "Store error."
    });
  }
}

async function buyHintPack() {
  elements.buyHintsButton.disabled = true;
  elements.storeNote.textContent = t("openingStore");
  try {
    await purchaseStorePackage(storeState.hintsPackage);
    progress = grantHintPack(progress);
    persistProgress();
    updateWallet();
    renderStoreState();
    elements.storeNote.textContent = t("hintsAdded");
  } catch (error) {
    console.error("Hint pack purchase failed.", error);
    renderStoreState();
    elements.storeNote.textContent = t("purchaseFailed", {
      error: error instanceof Error ? error.message : "Store error."
    });
  }
}

async function restorePass() {
  elements.restorePurchasesButton.disabled = true;
  elements.storeNote.textContent = t("checkingPurchases");
  let resultMessage = "";
  try {
    const customerInfo = await restoreStorePurchases();
    if (hasPassEntitlement(customerInfo)) {
      progress = grantPass(progress);
      storeState.hasPass = true;
      persistProgress();
      renderHome();
      renderCategories();
      syncAdBanner();
      resultMessage = t("passRestored");
    } else {
      resultMessage = t("noPassFound");
    }
  } catch (error) {
    console.error("Purchase restore failed.", error);
    resultMessage = t("restoreFailed", {
      error: error instanceof Error ? error.message : "Store error."
    });
  }
  renderStoreState();
  elements.storeNote.textContent = resultMessage;
}

async function initializeNativeFeatures() {
  try {
    storeState = await initializeStore();
    if (storeState.hasPass) {
      progress = grantPass(progress);
      persistProgress();
      renderHome();
      renderCategories();
    }
    renderStoreState();
  } catch (error) {
    console.error("Store initialization failed.", error);
    storeState = { ready: false, reason: t("storeUnavailable") };
    renderStoreState();
  }

  try {
    adsState = await initializeAds();
    if (adsState.ready) syncAdBanner();
  } catch (error) {
    console.error("AdMob initialization failed.", error);
    adsState = { ready: false, bannerId: "" };
  }
}

function initialize() {
  setupEvents();
  applyTranslations();
  elements.settingsNote.textContent = loadedSettings.warning
    ? t("settingsLoadWarning")
    : t("settingsSaved");
  renderHome();
  renderCategories();
  renderStoreState();
  updateWallet();
  if (loaded.warning) {
    announce(loaded.warning.includes("Device storage")
      ? t("storageWarning")
      : t("progressLoadWarning"));
  }
  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    navigator.serviceWorker.register(new URL("./service-worker.js", window.location.href)).catch(() => {
      announce(t("offlineCacheWarning"));
    });
  }
  if (loaded.warning) {
    window.setTimeout(() => {
      elements.storeNote.textContent = loaded.warning.includes("Device storage")
        ? t("storageWarning")
        : t("progressLoadWarning");
    }, 0);
  }
  if (settings.ambience) {
    void setAmbience(true).catch((error) => {
      console.error("Ambient sound could not start.", error);
      elements.settingsNote.textContent = t("audioError");
    });
  }
  void initializeNativeFeatures();
}

initialize();
