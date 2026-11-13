import { gameLocales } from "./game-locales.js";

export const GRID_SIZE = 9;
export const LEVELS_PER_CATEGORY = 25;

const categoryDefinitions = [
  {
    id: "grove",
    name: "Trend Radar",
    subtitle: "Slang, memes and internet moments",
    free: true,
    previewLevels: 25,
    words: ["RAGEBAIT", "PEAK", "CRASHOUT", "DIGGA", "AURA", "MEME", "VIRAL", "VIBE", "FLEX", "SUS", "GLOWUP", "FYP", "SLAY", "RIZZ", "CAP", "HYPE", "MOOD", "DRAMA", "BRAINROT", "CHAT", "STREAM", "TREND", "DUET", "TIKTOK", "POV", "EMOJI", "GOATED", "LORE", "PLOT", "AESTHETIC"]
  },
  {
    id: "shore",
    name: "Pop Culture",
    subtitle: "Stars, series and stories everyone knows",
    free: true,
    previewLevels: 25,
    words: ["TAYLOR", "WEDNESDAY", "MARVEL", "POTTER", "NETFLIX", "SWIFT", "BARBIE", "MARIO", "MANGA", "ANIME", "OSCAR", "HOLLYWOOD", "SPOILER", "FANDOM", "COMIC", "HERO", "VILLAIN", "SERIES", "CINEMA", "DIVA", "ACTOR", "STREAM", "DRAMA", "REBOOT", "SEASON", "SCENE", "CAST", "AWARD", "COSPLAY", "PIXAR"]
  },
  {
    id: "hearth",
    name: "World & Knowledge",
    subtitle: "Places, nature and surprising facts",
    free: true,
    previewLevels: 25,
    words: ["JAPAN", "BRAZIL", "TOKYO", "EIFFEL", "AMAZON", "SAHARA", "EVEREST", "NILE", "PANDA", "TIGER", "CORAL", "VOLCANO", "ORBIT", "PLANET", "ISLAND", "DESERT", "JUNGLE", "IGLOO", "SAFARI", "MONSOON", "MAPLE", "REEF", "SAIL", "DELTA", "GLACIER", "LAGOON", "BERLIN", "CAPITAL", "OASIS", "ATLAS"]
  },
  {
    id: "wilds",
    name: "Brand Battle",
    subtitle: "Famous names from shops and screens",
    free: false,
    previewLevels: 5,
    words: ["NIKE", "ADIDAS", "APPLE", "LEGO", "GUCCI", "PUMA", "SONY", "IKEA", "TESLA", "ZARA", "SAMSUNG", "AMAZON", "GOOGLE", "DISNEY", "NINTENDO", "SPOTIFY", "NETFLIX", "COCACOLA", "CHANEL", "ROLEX", "PEPSI", "FERRARI", "VISA", "LACOSTE", "TARGET", "PRADA", "SEPHORA", "EBAY", "DELL", "SONOS"]
  },
  {
    id: "starlight",
    name: "Fashion Icons",
    subtitle: "Labels, sneakers and runway style",
    free: false,
    previewLevels: 5,
    words: ["PRADA", "DIOR", "LOUISVUITTON", "BALENCIAGA", "NEWBALANCE", "SNEAKER", "RUNWAY", "COUTURE", "DENIM", "SILK", "COTTON", "VOGUE", "STYLE", "OUTFIT", "DESIGNER", "FASHION", "WARDROBE", "STILETTO", "STREETWEAR", "ELEGANCE", "MODEL", "LABEL", "CHIC", "DRESS", "BOOT", "HEEL", "BAG", "JEWEL", "TRENCH", "CATWALK"]
  },
  {
    id: "market",
    name: "Movie Mania",
    subtitle: "Big-screen worlds, heroes and surprises",
    free: false,
    previewLevels: 5,
    words: ["TITANIC", "AVATAR", "STRANGERTHING", "SHREK", "STARWARS", "PIXAR", "OSCAR", "GOLLUM", "HOGWARTS", "JURASSIC", "MATRIX", "TOYSTORY", "FROZEN", "MOANA", "BATMAN", "JOKER", "DUNE", "WIZARD", "HERO", "SCENE", "SCRIPT", "PREMIERE", "REEL", "CAMERA", "STUNT", "DIRECTOR", "ACTOR", "ANIMATION", "SEQUEL", "BLOCKBUSTER"]
  },
  {
    id: "highlands",
    name: "Party Mode",
    subtitle: "Festivals, dancing and nights with friends",
    free: false,
    previewLevels: 5,
    words: ["DJ", "FESTIVAL", "KARAOKE", "DANCEFLOOR", "MOCKTAIL", "AFTERPARTY", "DANCE", "FRIENDS", "CONFETTI", "BALLOON", "MUSIC", "LIGHTS", "PARTY", "TOAST", "PICNIC", "FIREWORKS", "GLOWSTICK", "LAUGH", "BEATS", "CHEER", "CLUB", "BRUNCH", "COSTUME", "PARADE", "CELEBRATE", "SUNSET", "MIDNIGHT", "WEEKEND", "RHYTHM", "JOY"]
  },
  {
    id: "wonder",
    name: "Spicy Secrets",
    subtitle: "Flirting, dates and butterflies · 18+",
    free: false,
    previewLevels: 3,
    ageRestricted: true,
    words: ["CRUSH", "KISS", "FLIRT", "CHEMISTRY", "DATENIGHT", "SPARK", "ROMANCE", "HEART", "BLUSH", "DATE", "CHARM", "SMILE", "COUPLE", "CUDDLE", "SWEET", "CANDLE", "CLOSER", "SECRET", "LOVER", "ATTRACTION", "ADMIRE", "AFFECTION", "PASSION", "TRUST", "BOND", "TEXT", "CHEEKY", "TINGLE", "WINK", "DESIRE"]
  },
  {
    id: "brain-quest",
    name: "Brain Quest",
    subtitle: "Logic, language and challenging ideas",
    free: false,
    previewLevels: 5,
    words: ["PARADOX", "METAMORPHOSIS", "HYPOTHESIS", "PHILOSOPHY", "LOGIC", "THEOREM", "EVIDENCE", "FALLACY", "ANALOGY", "DILEMMA", "CONUNDRUM", "INFERENCE", "REASON", "PATTERN", "PUZZLE", "THEORY", "AXIOM", "ETHICS", "QUANTUM", "GRAVITY", "ENIGMA", "SYLLOGISM", "PARSIMONY", "COGNITION", "SYNTHESIS", "RHETORIC", "EMPIRICAL", "DEDUCTION", "INDUCTION", "SEMANTIC"]
  },
  {
    id: "music-stars",
    name: "Music & Stars",
    subtitle: "Artists, sounds and stages",
    free: false,
    previewLevels: 5,
    words: ["DRAKE", "BILLIE", "APACHE", "RIHANNA", "BEYONCE", "TAYLOR", "SWIFT", "ARTIST", "SINGER", "RAPPER", "BAND", "ALBUM", "LYRIC", "RHYTHM", "MELODY", "CHORUS", "VINYL", "GUITAR", "DRUMMER", "PIANO", "KEYS", "POP", "JAZZ", "INDIE", "ROCK", "TOUR", "STAGE", "HARMONY", "RECORD", "SYNTH"]
  }
];

export const CATEGORIES = categoryDefinitions.map(({ words, ...category }) => ({
  ...category,
  levelCount: LEVELS_PER_CATEGORY,
  words
}));

function gridSizeForLevel(levelNumber) {
  return Math.min(13, 8 + Math.floor((levelNumber - 1) / 4));
}

function wordCountForLevel(levelNumber) {
  return Math.min(8, 4 + Math.floor((levelNumber - 1) / 5));
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
  if (levelNumber <= 5) return "Easy";
  if (levelNumber <= 10) return "Gentle";
  if (levelNumber <= 15) return "Steady";
  if (levelNumber <= 20) return "Tricky";
  return "Hard";
}

export const LEVELS = CATEGORIES.flatMap((category, categoryIndex) =>
  Array.from({ length: LEVELS_PER_CATEGORY }, (_, index) => {
    const localLevel = index + 1;
    const number = categoryIndex * LEVELS_PER_CATEGORY + localLevel;
    const gridSize = gridSizeForLevel(localLevel);
    return {
      id: `${category.id}-${String(localLevel).padStart(2, "0")}`,
      categoryId: category.id,
      categoryName: category.name,
      categoryFree: category.free,
      localLevel,
      number,
      gridSize,
      difficulty: difficultyForLevel(localLevel),
      words: wordsForLevel(category, localLevel, gridSize, wordCountForLevel(localLevel))
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
    const words = level.words.map((word) =>
      localizedCategory.words[sourceWords.indexOf(word)]
    );
    return {
      ...level,
      categoryName: localizedCategory.name,
      canonicalWords: level.words,
      gridSize: Math.max(level.gridSize, ...words.map((word) => word.length)),
      words
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
  if (levelNumber <= 5) {
    return DIRECTIONS.filter(([row, column]) =>
      row >= 0 && column >= 0 && (row === 0 || column === 0)
    );
  }
  if (levelNumber <= 12) return DIRECTIONS.filter(([row, column]) => row >= 0);
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
  const directions = directionsForLevel(puzzle.localLevel || puzzle.number || 76);

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
