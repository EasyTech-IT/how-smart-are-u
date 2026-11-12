import { gameLocales } from "./game-locales.js";

export const GRID_SIZE = 9;
export const LEVELS_PER_CATEGORY = 25;

const categoryDefinitions = [
  {
    id: "grove",
    name: "The Grove",
    subtitle: "Moss, leaves and forest paths",
    free: true,
    words: ["MOSS", "FERN", "PINE", "OAK", "BIRCH", "MAPLE", "CEDAR", "WILLOW", "ROOT", "LEAF", "BARK", "ACORN", "SEED", "SHADE", "GROVE", "MUSHROOM", "DEER", "OWL", "FOX", "BADGER", "ROBIN", "BRANCH", "FOREST", "CANOPY", "THICKET", "CLOVER", "IVY", "BLOSSOM", "NEST", "TRAIL"]
  },
  {
    id: "shore",
    name: "Tidepool Bay",
    subtitle: "Shells, salt air and sea life",
    free: true,
    words: ["SHELL", "TIDE", "WAVE", "SAND", "CORAL", "REEF", "KELP", "PEARL", "CRAB", "SEAL", "OTTER", "DOLPHIN", "HARBOR", "ANCHOR", "OCEAN", "COAST", "SHORE", "FISH", "STARFISH", "LAGOON", "DRIFT", "SURF", "BEACH", "BUOY", "SAIL", "CLAM", "OYSTER", "PUFFIN", "CURRENT", "SEAGLASS"]
  },
  {
    id: "hearth",
    name: "The Hearth",
    subtitle: "Comforts from the kitchen",
    free: true,
    words: ["BREAD", "HONEY", "APPLE", "PEAR", "SOUP", "THYME", "BASIL", "CINNAMON", "GINGER", "LEMON", "OLIVE", "PASTA", "OAT", "COCOA", "BERRY", "PUMPKIN", "VANILLA", "TEAPOT", "KETTLE", "PLATE", "SPOON", "BUTTER", "CHEESE", "PICKLE", "MUFFIN", "PEPPER", "ROSEMARY", "APRICOT", "WALNUT", "PANTRY"]
  },
  {
    id: "wilds",
    name: "Wild Country",
    subtitle: "Tracks, feathers and wild creatures",
    free: false,
    words: ["BADGER", "BISON", "COYOTE", "EAGLE", "FALCON", "HARE", "LYNX", "MOOSE", "OTTER", "RAVEN", "SALMON", "WOLF", "BEAVER", "BOBCAT", "BUFFALO", "COUGAR", "HERON", "MARMOT", "OSPREY", "PANTHER", "PRAIRIE", "RANGER", "TURTLE", "VULTURE", "WILDCAT", "ANTELOPE", "CARIBOU", "PORCUPINE", "WOLVERINE", "WOODPECKER"]
  },
  {
    id: "starlight",
    name: "Starlight",
    subtitle: "Planets, constellations and night skies",
    free: false,
    words: ["MOON", "COMET", "ORBIT", "NOVA", "NEBULA", "PLANET", "SATURN", "JUPITER", "VENUS", "MARS", "GALAXY", "ECLIPSE", "METEOR", "COSMOS", "STARLIGHT", "TELESCOPE", "ASTEROID", "AURORA", "SOLAR", "LUNAR", "QUASAR", "ROCKET", "CRATER", "EQUINOX", "MILKYWAY", "SUPERNOVA", "CONSTELLATION", "LIGHTYEAR", "GRAVITY", "ZENITH"]
  },
  {
    id: "market",
    name: "Lantern Market",
    subtitle: "Colors and flavors from faraway stalls",
    free: false,
    words: ["SAFFRON", "CLOVE", "MANGO", "PAPAYA", "COCONUT", "CARDAMOM", "JASMINE", "CUMIN", "FIG", "DATE", "MELON", "CHILI", "TURMERIC", "LYCHEE", "TAMARIND", "POMELO", "CITRON", "NUTMEG", "MARIGOLD", "OLIVE", "ANISE", "GUAVA", "PERSIMMON", "CASSAVA", "POMEGRANATE", "STARANISE", "LEMONGRASS", "PINEAPPLE", "DRAGONFRUIT", "MARKET"]
  },
  {
    id: "highlands",
    name: "Cloud Highlands",
    subtitle: "Ridges, rivers and mountain air",
    free: false,
    words: ["SUMMIT", "RIDGE", "VALLEY", "GLACIER", "CANYON", "RIVER", "STREAM", "WATERFALL", "MEADOW", "ALPINE", "PONDEROSA", "SLOPE", "PEAK", "CLIFF", "CIRQUE", "BOULDER", "TUNDRA", "FOOTHILL", "RAPIDS", "PASS", "CLOUD", "ECHO", "SNOWCAP", "RAVINE", "PLATEAU", "WILDFLOWER", "MOUNTAIN", "HORIZON", "CASCADES", "OVERLOOK"]
  },
  {
    id: "wonder",
    name: "Wonderworks",
    subtitle: "Little curiosities and clever discoveries",
    free: false,
    words: ["RIDDLE", "PUZZLE", "SECRET", "MIRROR", "POCKET", "COMPASS", "POSTCARD", "JOURNAL", "TREASURE", "KEYHOLE", "CURIOSITY", "DAYDREAM", "MAGIC", "WHISPER", "FOOTPRINT", "HIDDEN", "PATTERN", "MYSTERY", "LANTERN", "TINKER", "GIGGLE", "INVENT", "WONDER", "DISCOVER", "IMAGINE", "ODDITY", "TALISMAN", "WHIMSY", "LOCKET", "DAYLIGHT"]
  }
];

export const CATEGORIES = categoryDefinitions.map(({ words, ...category }) => ({
  ...category,
  levelCount: LEVELS_PER_CATEGORY,
  words
}));

function gridSizeForLevel(levelNumber) {
  return Math.min(13, 8 + Math.floor((levelNumber - 1) / 30));
}

function wordCountForLevel(levelNumber) {
  return Math.min(8, 4 + Math.floor((levelNumber - 1) / 28));
}

function wordsForLevel(category, localLevel, size, count) {
  const words = [];
  const start = (localLevel - 1) * 3;
  for (let offset = 0; offset < category.words.length && words.length < count; offset += 1) {
    const word = category.words[(start + offset) % category.words.length];
    if (word.length <= size && !words.includes(word)) words.push(word);
  }
  if (words.length !== count) {
    throw new Error(`Not enough words fit level ${localLevel} in ${category.name}.`);
  }
  return words;
}

function difficultyForLevel(levelNumber) {
  if (levelNumber <= 25) return "Easy";
  if (levelNumber <= 75) return "Gentle";
  if (levelNumber <= 125) return "Steady";
  if (levelNumber <= 175) return "Tricky";
  return "Hard";
}

export const LEVELS = CATEGORIES.flatMap((category, categoryIndex) =>
  Array.from({ length: LEVELS_PER_CATEGORY }, (_, index) => {
    const localLevel = index + 1;
    const number = categoryIndex * LEVELS_PER_CATEGORY + localLevel;
    const gridSize = gridSizeForLevel(number);
    return {
      id: `${category.id}-${String(localLevel).padStart(2, "0")}`,
      categoryId: category.id,
      categoryName: category.name,
      categoryFree: category.free,
      localLevel,
      number,
      gridSize,
      difficulty: difficultyForLevel(number),
      words: wordsForLevel(category, localLevel, gridSize, wordCountForLevel(number))
    };
  })
);

export const PUZZLES = LEVELS;

export function getLocalizedCatalog(language) {
  const localized = gameLocales[language];
  if (!localized) return { categories: CATEGORIES, levels: LEVELS };

  const categories = CATEGORIES.map((category, index) => ({
    ...category,
    ...localized[index]
  }));
  const levels = LEVELS.map((level) => {
    const categoryIndex = CATEGORIES.findIndex((category) => category.id === level.categoryId);
    const sourceWords = CATEGORIES[categoryIndex].words;
    const localizedCategory = categories[categoryIndex];
    return {
      ...level,
      categoryName: localizedCategory.name,
      canonicalWords: level.words,
      words: level.words.map((word) =>
        localizedCategory.words[sourceWords.indexOf(word)]
      )
    };
  });
  return { categories, levels };
}

export function canonicalizeFoundWords(level, words) {
  const found = new Set(words);
  const canonicalWords = level.canonicalWords || level.words;
  return level.words.flatMap((word, index) =>
    found.has(word) ? [canonicalWords[index]] : []
  );
}

export function localizeFoundWords(level, words) {
  const found = new Set(words);
  const canonicalWords = level.canonicalWords || level.words;
  return new Set(level.words.filter((_, index) => found.has(canonicalWords[index])));
}

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],            [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function seededRandom(seed) {
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function directionsForLevel(levelNumber) {
  if (levelNumber < 26) {
    return DIRECTIONS.filter(([row, column]) =>
      row >= 0 && column >= 0 && (row === 0 || column === 0)
    );
  }
  if (levelNumber < 76) return DIRECTIONS.filter(([row, column]) => row >= 0);
  return DIRECTIONS;
}

export function buildPuzzle(puzzle, size = puzzle?.gridSize || GRID_SIZE) {
  if (!Number.isInteger(size) || size < 2) {
    throw new RangeError("Grid size must be an integer of at least two.");
  }
  if (!puzzle || !Array.isArray(puzzle.words) || puzzle.words.length === 0) {
    throw new TypeError("A puzzle must include at least one word.");
  }

  const random = seededRandom(`${puzzle.id}:${size}`);
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const placements = {};
  const words = [...new Set(puzzle.words.map((word) => word.toUpperCase()))]
    .sort((left, right) => right.length - left.length);
  const directions = directionsForLevel(puzzle.number || 76);

  for (const word of words) {
    if (!/^[A-Z]+$/.test(word) || word.length > size) {
      throw new RangeError(`Word "${word}" cannot fit this grid.`);
    }

    let placed = false;
    for (let attempt = 0; attempt < 1600 && !placed; attempt += 1) {
      const [rowStep, columnStep] = directions[Math.floor(random() * directions.length)];
      const row = Math.floor(random() * size);
      const column = Math.floor(random() * size);
      const path = Array.from({ length: word.length }, (_, offset) => [
        row + rowStep * offset,
        column + columnStep * offset
      ]);

      const fits = path.every(([r, c], offset) =>
        r >= 0 && r < size && c >= 0 && c < size &&
        (!grid[r][c] || grid[r][c] === word[offset])
      );
      if (!fits) continue;

      path.forEach(([r, c], offset) => {
        grid[r][c] = word[offset];
      });
      placements[word] = path.map(([r, c]) => r * size + c);
      placed = true;
    }

    if (!placed) {
      throw new Error(`Could not place "${word}" in a ${size}×${size} grid.`);
    }
  }

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (!grid[row][column]) {
        grid[row][column] = LETTERS[Math.floor(random() * LETTERS.length)];
      }
    }
  }

  return { grid, placements };
}

export function pathBetween(startIndex, endIndex, size = GRID_SIZE) {
  const cellCount = size * size;
  if (![startIndex, endIndex].every((index) =>
    Number.isInteger(index) && index >= 0 && index < cellCount
  )) {
    return null;
  }

  const startRow = Math.floor(startIndex / size);
  const startColumn = startIndex % size;
  const endRow = Math.floor(endIndex / size);
  const endColumn = endIndex % size;
  const rowDelta = endRow - startRow;
  const columnDelta = endColumn - startColumn;

  if (rowDelta !== 0 && columnDelta !== 0 &&
      Math.abs(rowDelta) !== Math.abs(columnDelta)) {
    return null;
  }

  const length = Math.max(Math.abs(rowDelta), Math.abs(columnDelta)) + 1;
  const rowStep = Math.sign(rowDelta);
  const columnStep = Math.sign(columnDelta);

  return Array.from({ length }, (_, offset) =>
    (startRow + rowStep * offset) * size + startColumn + columnStep * offset
  );
}

export function matchPath(grid, path, words) {
  if (!Array.isArray(path) || path.length < 2) return null;
  const size = grid.length;
  if (!grid.every((row) => Array.isArray(row) && row.length === size)) {
    throw new TypeError("Grid must be square.");
  }
  if (!path.every((index) =>
    Number.isInteger(index) && index >= 0 && index < size * size
  )) {
    return null;
  }

  const letters = path.map((index) => grid[Math.floor(index / size)][index % size]).join("");
  const reversed = [...letters].reverse().join("");
  const normalizedWords = new Set(words.map((word) => word.toUpperCase()));
  return normalizedWords.has(letters) ? letters :
    normalizedWords.has(reversed) ? reversed : null;
}
