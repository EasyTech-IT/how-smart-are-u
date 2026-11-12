import {
  buildPuzzle,
  CATEGORIES,
  LEVELS,
  matchPath,
  pathBetween
} from "./game-logic.js";
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
let storeState = { ready: false, reason: "Store products are not configured yet.", hasPass: false };
let adsState = { ready: false, bannerId: "" };
let bannerVisible = false;
let bannerUpdate = Promise.resolve();

function setMessage(message, kind = "info") {
  elements.gameMessage.textContent = message;
  elements.gameMessage.dataset.kind = kind;
  elements.liveAnnouncement.textContent = message;
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
    setMessage("Progress could not be saved on this device. Check available storage.", "error");
    announce("Progress could not be saved on this device.");
    return false;
  }
}

function completedCount(categoryId) {
  return progress.completedLevelIds.filter((id) =>
    LEVELS.some((level) => level.id === id && level.categoryId === categoryId)
  ).length;
}

function nextPlayableLevel(categoryId = progress.activeCategoryId) {
  const level = LEVELS.find((item) =>
    item.categoryId === categoryId &&
    !progress.completedLevelIds.includes(item.id) &&
    isLevelUnlocked(item, progress)
  );
  return level || LEVELS.find((item) => item.categoryId === categoryId) || LEVELS[0];
}

function updateWallet() {
  elements.walletCount.textContent = String(progress.hintCredits);
  elements.hintCount.textContent = String(progress.hintCredits);
  elements.hintButton.setAttribute("aria-label", `Use a hint. ${progress.hintCredits} hint credits remaining.`);
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
      currentScreen !== "game" && currentScreen !== "shop";
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
  elements.playLabel.textContent = completed ? `Continue · Level ${level.number}` : "Start your first trail";
  elements.homeProgress.textContent = completed
    ? `${completed} of 200 trails found · ${progress.hintCredits} hint credits`
    : "200 little discoveries are waiting";
  updateWallet();
}

function renderStoreState() {
  const ownsPass = progress.hasPass || storeState.hasPass;
  const passPackage = storeState.passPackage;
  const hintPackage = storeState.hintsPackage;
  elements.buyPassButton.disabled = !storeState.ready || !passPackage || ownsPass;
  elements.buyPassButton.textContent = ownsPass
    ? "Pass owned"
    : passPackage
      ? `Buy pass · ${passPackage.product.priceString}`
      : "Store setup needed";
  elements.passPrice.textContent = passPackage
    ? passPackage.product.priceString
    : "Price set in the app store";
  elements.buyHintsButton.disabled = !storeState.ready || !hintPackage;
  elements.buyHintsButton.textContent = hintPackage
    ? `Get 20 hints · ${hintPackage.product.priceString}`
    : "Store setup needed";
  elements.restorePurchasesButton.disabled = !storeState.ready;
  elements.storeNote.textContent = storeState.reason ||
    (storeState.ready
      ? "Purchases use the official Apple App Store or Google Play billing."
      : "Store products will be enabled after native store setup.");
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

  for (const [index, category] of CATEGORIES.entries()) {
    const count = completedCount(category.id);
    const accessible = canAccessCategory(category.id, progress);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    card.dataset.categoryId = category.id;
    card.dataset.locked = String(!accessible);
    card.style.setProperty("--card-order", String(index));
    card.setAttribute("aria-label",
      `${category.name}, ${accessible ? `${count} of 25 levels complete` : "locked with the one-time pass"}`);

    const emblem = document.createElement("span");
    emblem.className = "category-emblem";
    emblem.setAttribute("aria-hidden", "true");
    emblem.textContent = symbols[category.id];
    const copy = document.createElement("span");
    copy.className = "category-copy";
    const title = document.createElement("strong");
    title.textContent = category.name;
    const subtitle = document.createElement("small");
    subtitle.textContent = accessible ? `${count} / 25 trails` : "Pass chapter";
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
  const category = CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return;
  if (!canAccessCategory(category.id, progress)) {
    showScreen("shop");
    elements.storeNote.textContent = `${category.name} is part of the one-time pass. Store products are not configured yet.`;
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
  const levels = LEVELS.filter((level) => level.categoryId === selectedCategoryId);
  const category = CATEGORIES.find((item) => item.id === selectedCategoryId);
  const completed = completedCount(selectedCategoryId);
  elements.chapterCount.textContent = `${completed} / ${levels.length}`;
  elements.levelPath.replaceChildren();
  elements.levelPath.style.setProperty("--level-count", String(levels.length));

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
    button.setAttribute("aria-label",
      `${category.name}, level ${level.localLevel}${isComplete ? ", completed" : unlocked ? ", ready" : ", locked"}`);
    button.addEventListener("click", () => startLevel(level));
    elements.levelPath.append(button);
  }
}

function showLevelsForCurrentCategory() {
  if (!selectedCategoryId) selectedCategoryId = progress.activeCategoryId;
  const category = CATEGORIES.find((item) => item.id === selectedCategoryId) || CATEGORIES[0];
  elements.levelsKicker.textContent = category.name.toUpperCase();
  elements.levelsTitle.textContent = category.name;
  renderLevels();
  showScreen("levels");
}

function startLevel(level) {
  if (!isLevelUnlocked(level, progress)) {
    setMessage("Finish the previous trail to open this one.", "warning");
    return;
  }

  clearTimeout(hintTimer);
  currentLevel = level;
  selectedCategoryId = level.categoryId;
  progress.activeCategoryId = level.categoryId;
  progress.activeLevelId = level.id;
  const replaying = progress.completedLevelIds.includes(level.id);
  foundWords = replaying ? new Set() : new Set(progress.foundByLevel[level.id] || []);
  if (replaying) progress.foundByLevel[level.id] = [];
  generatedPuzzle = buildPuzzle(level);
  focusIndex = 0;
  selectionPath = [];
  tapAnchor = null;
  hintedWord = null;
  elements.puzzleCategory.textContent = level.categoryName.toUpperCase();
  elements.puzzleTitle.textContent = `Level ${level.localLevel}`;
  elements.puzzleDifficulty.textContent = level.difficulty;
  showScreen("game");
  renderGrid();
  renderWordTargets();
  updateWallet();
  setMessage("Drag a line through a word.");
  persistProgress();
  cellButtons[0]?.focus({ preventScroll: true });
}

function renderGrid() {
  const size = currentLevel.gridSize;
  elements.grid.replaceChildren();
  elements.grid.style.setProperty("--board-size", String(size));
  elements.grid.setAttribute("aria-rowcount", String(size));
  elements.grid.setAttribute("aria-colcount", String(size));
  elements.grid.setAttribute("aria-label", `${currentLevel.categoryName}, level ${currentLevel.localLevel} letter grid`);
  cellButtons = [];

  generatedPuzzle.grid.forEach((row, rowIndex) => {
    row.forEach((letter, columnIndex) => {
      const index = rowIndex * size + columnIndex;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "letter-cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter}`);
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
  setMessage("Not on this list. Try another line.", "warning");
  window.setTimeout(() => elements.grid.classList.remove("has-invalid-selection"), 260);
}

function finishLevel() {
  const firstCompletion = !progress.completedLevelIds.includes(currentLevel.id);
  progress.foundByLevel[currentLevel.id] = [...foundWords];
  progress = completeLevel(currentLevel, progress);
  persistProgress();
  renderHome();
  renderCategories();
  renderLevels();
  elements.completionTitle.textContent = firstCompletion ? "A lovely find." : "Trail complete.";
  elements.completionCopy.textContent = firstCompletion
    ? "Every word found. There is another little path ahead."
    : "You found every word on this trail again.";
  elements.rewardLine.textContent = firstCompletion ? "+1 hint credit" : "No new credit this time";
  const next = LEVELS.find((level) =>
    level.categoryId === currentLevel.categoryId &&
    level.localLevel === currentLevel.localLevel + 1
  );
  elements.nextLevelButton.textContent = next ? "Continue the trail →" : "Choose another path";
  elements.nextLevelButton.dataset.nextLevelId = next?.id || "";
  if (!elements.completionDialog.open) elements.completionDialog.showModal();
}

function acceptPath(path) {
  const remaining = currentLevel.words.filter((word) => !foundWords.has(word));
  const word = matchPath(generatedPuzzle.grid, path, remaining);
  if (!word) {
    invalidSelection();
    return;
  }

  foundWords.add(word);
  progress.foundByLevel[currentLevel.id] = [...foundWords];
  selectionPath = [];
  tapAnchor = null;
  hintedWord = null;
  clearTimeout(hintTimer);
  renderGridStates();
  renderWordTargets();
  updateWallet();
  persistProgress();
  setMessage(`${word} found. ${currentLevel.words.length - foundWords.size} left.`, "success");

  if (foundWords.size === currentLevel.words.length) finishLevel();
}

function handleTap(index) {
  if (tapAnchor === null) {
    tapAnchor = index;
    updateSelection([index]);
    setMessage("First letter marked. Tap the last letter.");
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
  setMessage("First letter marked. Tap the last letter.");
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
      setMessage("Selection cleared.");
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
    setMessage("No hint credits left. Visit the Pass shop for more.", "warning");
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
  setMessage("A warm trace points to one of the words.", "success");
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
    const level = LEVELS.find((item) => item.id === elements.nextLevelButton.dataset.nextLevelId);
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
  window.addEventListener("pagehide", persistProgress);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persistProgress();
  });
}

async function buyPass() {
  elements.buyPassButton.disabled = true;
  elements.storeNote.textContent = "Opening the app store...";
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
    elements.storeNote.textContent = "Your pass is active on this device.";
  } catch (error) {
    console.error("Pass purchase failed.", error);
    renderStoreState();
    elements.storeNote.textContent = `Purchase not completed: ${error instanceof Error ? error.message : "Store error."}`;
  }
}

async function buyHintPack() {
  elements.buyHintsButton.disabled = true;
  elements.storeNote.textContent = "Opening the app store...";
  try {
    await purchaseStorePackage(storeState.hintsPackage);
    progress = grantHintPack(progress);
    persistProgress();
    updateWallet();
    renderStoreState();
    elements.storeNote.textContent = "20 hint credits were added to your wallet.";
  } catch (error) {
    console.error("Hint pack purchase failed.", error);
    renderStoreState();
    elements.storeNote.textContent = `Purchase not completed: ${error instanceof Error ? error.message : "Store error."}`;
  }
}

async function restorePass() {
  elements.restorePurchasesButton.disabled = true;
  elements.storeNote.textContent = "Checking purchases with the app store...";
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
      resultMessage = "Your pass has been restored.";
    } else {
      resultMessage = "No Moss & Letters Pass was found for this store account.";
    }
  } catch (error) {
    console.error("Purchase restore failed.", error);
    resultMessage = `Restore failed: ${error instanceof Error ? error.message : "Store error."}`;
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
    storeState = { ready: false, reason: "The store could not be reached. You can keep playing offline." };
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
  renderHome();
  renderCategories();
  renderStoreState();
  updateWallet();
  if (loaded.warning) announce(loaded.warning);
  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    navigator.serviceWorker.register(new URL("./service-worker.js", window.location.href)).catch(() => {
      announce("Offline caching could not start. The game still works while this page is open.");
    });
  }
  if (loaded.warning) {
    window.setTimeout(() => {
      elements.storeNote.textContent = loaded.warning;
    }, 0);
  }
  void initializeNativeFeatures();
}

initialize();
