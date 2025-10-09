const baseScores = new Map([
  ['a', 9],
  ['b', 7],
  ['c', 7],
  ['d', 7],
  ['e', 5],
  ['f', 5],
  ['g', 7],
  ['h', 8],
  ['i', 4],
  ['j', 4],
  ['k', 3],
  ['l', 5],
  ['m', 8],
  ['n', 5],
  ['o', 10],
  ['p', 7],
  ['q', 3],
  ['r', 7],
  ['s', 9],
  ['t', 5],
  ['u', 7],
  ['v', 7],
  ['w', 7],
  ['x', 5],
  ['y', 7],
  ['z', 5],
]);

const curvedLetters = new Set(['o', 's', 'c', 'g', 'q', 'u']);
const angularLetters = new Set(['a', 'k', 'm', 'n', 'v', 'w', 'x', 'z']);
const balancedLetters = new Set(['b', 'd', 'p', 'r']);
const tallLetters = new Set(['b', 'd', 'f', 'h', 'k', 'l', 't']);
const descenders = new Set(['g', 'j', 'p', 'q', 'y']);
const vowels = new Set(['a', 'e', 'i', 'o', 'u']);

const defaultSettings = {
  harmonyContrast: 50,
  palindromeBonus: true,
  favorCurves: false,
  favorAngles: false,
  favorBalance: false,
  visualRhythm: true,
  repetitionSlider: 0,
  lengthPreference: 'neutral',
  vowelFlow: true,
};

const storageKey = 'word-beauty-settings-v2';
const themeStorageKey = 'word-beauty-theme';

function loadSettings() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn('Unable to load settings from storage', error);
    return { ...defaultSettings };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch (error) {
    console.warn('Unable to save settings', error);
  }
}

const wordField = document.querySelector('#word-field');
const currentWordEl = document.querySelector('#current-word');
const scoreNumberEl = document.querySelector('#score-number');
const scoreMeterFill = document.querySelector('#score-meter-fill');
const scoreLabel = document.querySelector('#score-label');
const breakdownList = document.querySelector('#breakdown-list');
const sampleButtons = document.querySelectorAll('.sample-words button');
const bestWordsList = document.querySelector('#best-words');
const worstWordsList = document.querySelector('#worst-words');
const controlsToggle = document.querySelector('#controls-toggle');
const controlsPanel = document.querySelector('#controls-panel');
const generatorRange = document.querySelector('#generator-range');
const generateBtn = document.querySelector('#generate-btn');
const precomputeBtn = document.querySelector('#precompute-btn');
const precomputeProgress = document.querySelector('#precompute-progress');
const progressFill = document.querySelector('#progress-fill');
const progressText = document.querySelector('#progress-text');
const resetBtn = document.querySelector('#reset-btn');
const themeToggle = document.querySelector('#theme-toggle');
const clearCacheBtn = document.querySelector('#clear-cache-btn');

const controls = {
  harmonyContrast: document.querySelector('#harmony-contrast'),
  palindromeBonus: document.querySelector('#palindrome-toggle'),
  favorCurves: document.querySelector('#favor-curves'),
  favorAngles: document.querySelector('#favor-angles'),
  favorBalance: document.querySelector('#favor-balance'),
  visualRhythm: document.querySelector('#visual-rhythm'),
  repetitionSlider: document.querySelector('#repetition-slider'),
  lengthPreference: document.querySelector('#length-preference'),
  vowelFlow: document.querySelector('#vowel-flow'),
};

const discoveries = {
  best: [],
  worst: [],
};

let validWords = new Set();
let wordListLoaded = false;
let scoreCaches = new Map(); // settingsHash -> Map(word -> { score, length })
let isPrecomputing = false;

function hashSettings(settings) {
  return `${settings.harmonyContrast}-${settings.palindromeBonus ? 1 : 0}-${settings.favorCurves ? 1 : 0}-${settings.favorAngles ? 1 : 0}-${settings.favorBalance ? 1 : 0}-${settings.visualRhythm ? 1 : 0}-${settings.repetitionSlider}-${settings.lengthPreference}-${settings.vowelFlow ? 1 : 0}`;
}

function saveCachesToStorage() {
  try {
    const serialized = {};
    scoreCaches.forEach((cache, hash) => {
      serialized[hash] = Array.from(cache.entries());
    });
    localStorage.setItem('word-beauty-caches-v1', JSON.stringify(serialized));
    console.log(`Saved ${scoreCaches.size} caches to localStorage`);
  } catch (error) {
    console.warn('Failed to save caches to localStorage', error);
  }
}

function loadCachesFromStorage() {
  try {
    const raw = localStorage.getItem('word-beauty-caches-v1');
    if (!raw) return;

    const serialized = JSON.parse(raw);
    Object.entries(serialized).forEach(([hash, entries]) => {
      scoreCaches.set(hash, new Map(entries));
    });
    console.log(`Loaded ${scoreCaches.size} caches from localStorage`);
  } catch (error) {
    console.warn('Failed to load caches from localStorage', error);
  }
}

async function precomputeScores(settings, onProgress) {
  const hash = hashSettings(settings);
  const words = Array.from(validWords).filter((w) => w.length >= 3 && w.length <= 12);
  const cache = new Map();

  const total = words.length;
  const startTime = Date.now();

  for (let i = 0; i < total; i++) {
    const word = words[i];
    const { score } = calculateScore(word, settings);
    cache.set(word, { score, length: word.length });

    // Report progress every 500 words
    if (i % 500 === 0) {
      const progress = Math.round((i / total) * 100);
      if (onProgress) onProgress(progress);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`Precomputed ${cache.size} words for hash ${hash} in ${elapsed}ms`);

  scoreCaches.set(hash, cache);
  saveCachesToStorage();

  if (onProgress) onProgress(100);
  return hash;
}

async function loadWordList() {
  try {
    const response = await fetch('words.txt');
    const text = await response.text();
    const words = text.split('\n').map((w) => w.trim().toLowerCase()).filter((w) => w.length > 0);
    validWords = new Set(words);

    console.log(`Loaded ${validWords.size} words`);

    // Load cached precomputed scores from localStorage
    loadCachesFromStorage();

    // Precompute default settings if not already cached
    const defaultHash = hashSettings(defaultSettings);
    if (!scoreCaches.has(defaultHash)) {
      console.log('Precomputing default settings...');
      await precomputeScores(defaultSettings);
    }

    wordListLoaded = true;
  } catch (error) {
    console.warn('Failed to load word list, generator will produce random letters', error);
    wordListLoaded = false;
  }
}

function sanitizeWord(input) {
  return input.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(themeStorageKey);
    if (saved) {
      return saved;
    }
    // Default to system preference
    return 'auto';
  } catch (error) {
    return 'auto';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch (error) {
    console.warn('Unable to save theme preference', error);
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light-mode');
    themeToggle.textContent = '☀️';
    themeToggle.setAttribute('aria-label', 'Switch to light mode');
  } else if (theme === 'light') {
    document.documentElement.classList.add('light-mode');
    document.documentElement.classList.remove('dark-mode');
    themeToggle.textContent = '🌙';
    themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    // auto
    document.documentElement.classList.remove('dark-mode', 'light-mode');
    themeToggle.textContent = '🌓';
    themeToggle.setAttribute('aria-label', 'Toggle dark mode (auto)');
  }
}

function cycleTheme() {
  const current = loadTheme();
  let next;

  if (current === 'auto') {
    next = 'light';
  } else if (current === 'light') {
    next = 'dark';
  } else {
    next = 'auto';
  }

  saveTheme(next);
  applyTheme(next);
}

function countLetters(word, letterSet) {
  return [...word].filter((letter) => letterSet.has(letter)).length;
}

function buildHeightPattern(word) {
  return [...word].map((letter) => {
    if (tallLetters.has(letter)) return 'tall';
    if (descenders.has(letter)) return 'descender';
    return 'short';
  });
}

function calculateRhythmScore(word) {
  if (word.length < 2) return 0;
  const pattern = buildHeightPattern(word);
  let alternations = 0;
  for (let i = 1; i < pattern.length; i += 1) {
    if (pattern[i] !== pattern[i - 1]) {
      alternations += 1;
    }
  }
  const rhythmScore = (alternations / (word.length - 1)) * 10;
  return rhythmScore;
}

function countRepetitions(word) {
  let adjacentPairs = 0;
  const occurrences = new Map();

  for (let i = 0; i < word.length; i += 1) {
    const letter = word[i];
    if (word[i + 1] === letter) {
      adjacentPairs += 1;
    }
    occurrences.set(letter, (occurrences.get(letter) || 0) + 1);
  }

  const repeatedLetters = [...occurrences.values()].filter((count) => count > 1).length;
  return { adjacentPairs, repeatedLetters };
}

function evaluateLengthPreference(word, preference) {
  const len = word.length;
  if (len === 0) return 0;

  if (preference === 'minimalist') {
    if (len >= 3 && len <= 5) return 10;
    if (len > 8) return -5;
    return 0;
  }

  if (preference === 'elaborate') {
    if (len >= 8) return 10;
    if (len > 0 && len < 4) return -5;
    return 0;
  }

  return 0;
}

function evaluateLetterPreference(word, settings) {
  let total = 0;
  if (settings.favorCurves) {
    total += countLetters(word, curvedLetters) * 1.2;
  }
  if (settings.favorAngles) {
    total += countLetters(word, angularLetters) * 1.2;
  }
  if (settings.favorBalance) {
    total += countLetters(word, balancedLetters) * 1.5;
  }
  return total;
}

function evaluateRepetition(word, sliderValue) {
  if (word.length === 0 || sliderValue === 0) {
    return { value: 0, details: 'Neutral toward repetition', totalRepeats: 0 };
  }

  const { adjacentPairs, repeatedLetters } = countRepetitions(word);
  const totalRepeats = adjacentPairs + repeatedLetters * 0.5;
  const emphasis = sliderValue / 20; // maps -20..20 to -1..1
  const value = totalRepeats * emphasis;
  const direction = sliderValue > 0 ? 'Rewards' : 'Penalizes';
  const details = `${direction} repeated letters (${totalRepeats.toFixed(1)} weight)`;
  return { value, details, totalRepeats };
}

function evaluateVowelFlow(word) {
  if (word.length === 0) return { value: 0, details: 'No vowel flow impact' };
  const letters = [...word];
  const vowelCount = letters.filter((letter) => vowels.has(letter)).length;
  const vowelRatio = vowelCount / word.length;
  let clusters = 0;
  let clusterLength = 0;
  let countedCluster = false;
  letters.forEach((letter) => {
    if (!vowels.has(letter)) {
      clusterLength += 1;
      if (clusterLength >= 3 && !countedCluster) {
        clusters += 1;
        countedCluster = true;
      }
    } else {
      clusterLength = 0;
      countedCluster = false;
    }
  });
  let value = -clusters * 3;
  if (vowelRatio > 0.5) {
    value += 5;
  }
  return {
    value,
    details: `Vowel ratio ${(vowelRatio * 100).toFixed(0)}%, consonant clusters ${clusters}`,
    vowelRatio,
    clusters,
  };
}

function calculateScore(word, settings) {
  if (!word) {
    return {
      score: 0,
      breakdown: [
        { label: 'Base letter score', value: '—' },
        { label: 'Harmony/Contrast', value: '—' },
      ],
      raw: 0,
      max: 100,
    };
  }

  const letters = [...word];
  const baseScore = letters.reduce((total, letter) => total + (baseScores.get(letter) || 4), 0);

  const curvedCount = countLetters(word, curvedLetters);
  const angularCount = countLetters(word, angularLetters);
  const balancedCount = countLetters(word, balancedLetters);
  const consistencyScore = Math.max(curvedCount, angularCount, balancedCount) / word.length || 0;

  let harmonyMultiplier = 1;
  if (settings.harmonyContrast < 50) {
    harmonyMultiplier = 1 + consistencyScore * ((50 - settings.harmonyContrast) / 50) * 0.3;
  } else if (settings.harmonyContrast > 50) {
    const varietyScore = 1 - consistencyScore;
    harmonyMultiplier = 1 + varietyScore * ((settings.harmonyContrast - 50) / 50) * 0.3;
  }

  const harmonyScore = baseScore * (harmonyMultiplier - 1);
  let total = baseScore + harmonyScore;

  const modifiers = [];
  modifiers.push({ label: 'Base letter score', value: `${baseScore.toFixed(1)} pts` });
  modifiers.push({
    label: `Harmony vs. Contrast (${settings.harmonyContrast})`,
    value: `${harmonyScore >= 0 ? '+' : ''}${harmonyScore.toFixed(1)} pts`,
  });

  const isPalindrome = word === [...word].reverse().join('');

  if (settings.palindromeBonus && isPalindrome) {
    total += 15;
    modifiers.push({ label: 'Symmetry bonus', value: '+15.0 pts' });
  }

  const letterPref = evaluateLetterPreference(word, settings);
  if (letterPref !== 0) {
    modifiers.push({ label: 'Letter preference', value: `${letterPref >= 0 ? '+' : ''}${letterPref.toFixed(1)} pts` });
    total += letterPref;
  }

  if (settings.visualRhythm) {
    const rhythmScore = calculateRhythmScore(word);
    total += rhythmScore;
    modifiers.push({ label: 'Visual rhythm', value: `+${rhythmScore.toFixed(1)} pts` });
  }

  let repetition = { value: 0, details: 'Neutral toward repetition', totalRepeats: 0 };
  if (settings.repetitionSlider !== 0) {
    repetition = evaluateRepetition(word, settings.repetitionSlider);
    total += repetition.value;
    modifiers.push({
      label: 'Repetition aesthetic',
      value: `${repetition.value >= 0 ? '+' : ''}${repetition.value.toFixed(1)} pts – ${repetition.details}`,
    });
  }

  const lengthPref = evaluateLengthPreference(word, settings.lengthPreference);
  if (lengthPref !== 0) {
    modifiers.push({
      label: 'Length preference',
      value: `${lengthPref >= 0 ? '+' : ''}${lengthPref.toFixed(1)} pts`,
    });
    total += lengthPref;
  }

  let vowelFlow = { value: 0, details: 'No vowel flow impact', vowelRatio: 0, clusters: 0 };
  if (settings.vowelFlow) {
    vowelFlow = evaluateVowelFlow(word);
    if (vowelFlow.value !== 0) {
      modifiers.push({
        label: 'Vowel flow',
        value: `${vowelFlow.value >= 0 ? '+' : ''}${vowelFlow.value.toFixed(1)} pts – ${vowelFlow.details}`,
      });
    } else {
      modifiers.push({ label: 'Vowel flow', value: `+0.0 pts – ${vowelFlow.details}` });
    }
    total += vowelFlow.value;
  }

  // Normalize to 0-100 scale
  // Use a reference word length (7 letters) to make scoring length-neutral
  const referenceLength = 7;

  // Scale total score as if the word were 7 letters long
  const normalizedTotal = (total / word.length) * referenceLength;

  // Reference ranges for a 7-letter word:
  // Minimum: 7 letters × 3 (worst letter) = 21
  // Average: 7 letters × 6.5 (average letter) = 45.5
  // Excellent: 7 letters × 10 (best letter) + bonuses (15+10+5) = 100

  const minScore = referenceLength * 3.0;
  const maxScore = referenceLength * 10 + 30; // 70 + 30 bonuses = 100

  const normalized = Math.round(
    Math.max(0, Math.min(100,
      ((normalizedTotal - minScore) / (maxScore - minScore)) * 100
    ))
  );

  modifiers.push({ label: 'Raw total', value: `${total.toFixed(1)} pts` });
  modifiers.push({ label: 'Normalized (7-letter equiv)', value: `${normalizedTotal.toFixed(1)} pts` });

  console.log(`Scoring "${word}": raw=${total.toFixed(1)}, normalized=${normalizedTotal.toFixed(1)}, score=${normalized}`);

  return {
    score: normalized,
    breakdown: modifiers,
    raw: total,
    max: maxScore,
  };
}

function readSettingsFromControls() {
  return {
    harmonyContrast: Number(controls.harmonyContrast.value),
    palindromeBonus: controls.palindromeBonus.checked,
    favorCurves: controls.favorCurves.checked,
    favorAngles: controls.favorAngles.checked,
    favorBalance: controls.favorBalance.checked,
    visualRhythm: controls.visualRhythm.checked,
    repetitionSlider: Number(controls.repetitionSlider.value),
    lengthPreference: controls.lengthPreference.value,
    vowelFlow: controls.vowelFlow.checked,
  };
}

function applySettingsToControls(settings) {
  controls.harmonyContrast.value = String(settings.harmonyContrast);
  controls.palindromeBonus.checked = settings.palindromeBonus;
  controls.favorCurves.checked = settings.favorCurves;
  controls.favorAngles.checked = settings.favorAngles;
  controls.favorBalance.checked = settings.favorBalance;
  controls.visualRhythm.checked = settings.visualRhythm;
  controls.repetitionSlider.value = String(settings.repetitionSlider);
  controls.lengthPreference.value = settings.lengthPreference;
  controls.vowelFlow.checked = settings.vowelFlow;
}

function updateMeter(score) {
  scoreMeterFill.style.width = `${score}%`;
  let label = 'A balanced beauty';
  if (score < 30) label = 'Harsh and angular';
  else if (score < 50) label = 'Intriguing but rough';
  else if (score < 70) label = 'Pleasantly shaped';
  else if (score < 85) label = 'Graceful and refined';
  else label = 'Gorgeous typography!';
  scoreLabel.textContent = label;
}

function renderBreakdown(breakdown) {
  breakdownList.innerHTML = '';
  breakdown.forEach((item) => {
    const dt = document.createElement('dt');
    dt.textContent = item.label;
    const dd = document.createElement('dd');
    dd.textContent = item.value;
    breakdownList.append(dt, dd);
  });
}

function updateDiscoveries(word, score) {
  if (!word) return;
  const existingBestIndex = discoveries.best.findIndex((entry) => entry.word === word);
  if (existingBestIndex >= 0) {
    discoveries.best.splice(existingBestIndex, 1);
  }
  const existingWorstIndex = discoveries.worst.findIndex((entry) => entry.word === word);
  if (existingWorstIndex >= 0) {
    discoveries.worst.splice(existingWorstIndex, 1);
  }

  discoveries.best.push({ word, score });
  discoveries.best.sort((a, b) => b.score - a.score);
  discoveries.best.splice(3);

  discoveries.worst.push({ word, score });
  discoveries.worst.sort((a, b) => a.score - b.score);
  discoveries.worst.splice(3);

  renderDiscoveries(bestWordsList, discoveries.best);
  renderDiscoveries(worstWordsList, discoveries.worst);
}

function renderDiscoveries(container, list) {
  container.innerHTML = '';
  if (list.length === 0) {
    const li = document.createElement('li');
    li.textContent = '—';
    container.append(li);
    return;
  }
  list.forEach((item) => {
    const li = document.createElement('li');
    const wordSpan = document.createElement('span');
    wordSpan.textContent = item.word;
    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${item.score}`;
    li.append(wordSpan, scoreSpan);
    container.append(li);
  });
}

function updateScoreDisplay(word, settings) {
  const { score, breakdown } = calculateScore(word, settings);
  scoreNumberEl.textContent = score;
  updateMeter(score);
  renderBreakdown(breakdown);
  if (!word) {
    scoreLabel.textContent = 'Awaiting a word...';
    scoreNumberEl.textContent = '0';
    scoreMeterFill.style.width = '0%';
    renderDiscoveries(bestWordsList, discoveries.best);
    renderDiscoveries(worstWordsList, discoveries.worst);
    return;
  }
  updateDiscoveries(word, score);
}

function handleInput() {
  const rawWord = wordField.value;
  const cleaned = sanitizeWord(rawWord);
  currentWordEl.textContent = cleaned || rawWord;
  const settings = readSettingsFromControls();
  saveSettings(settings);
  updateScoreDisplay(cleaned, settings);
}

function getRandomLetter(weighted = false) {
  if (!weighted) {
    return String.fromCharCode(97 + Math.floor(Math.random() * 26));
  }

  // Weighted selection based on letter scores
  const letterArray = [];
  baseScores.forEach((score, letter) => {
    // Add letter multiple times based on score (higher score = more likely)
    for (let i = 0; i < score; i++) {
      letterArray.push(letter);
    }
  });
  return letterArray[Math.floor(Math.random() * letterArray.length)];
}

function getLengthWeight(length) {
  // Bell curve centered at 6-7 letters
  // 3-4 letters: low weight
  // 6-7 letters: high weight
  // 10+ letters: low weight
  const ideal = 6.5;
  const spread = 2.5;
  const distance = Math.abs(length - ideal);
  return Math.exp(-(distance * distance) / (2 * spread * spread));
}

function getWeightedRandomWord(candidateWords) {
  // Build weighted list based on length preference
  const weightedList = [];
  candidateWords.forEach((word) => {
    const weight = getLengthWeight(word.length);
    const copies = Math.max(1, Math.round(weight * 10));
    for (let i = 0; i < copies; i++) {
      weightedList.push(word);
    }
  });
  return weightedList[Math.floor(Math.random() * weightedList.length)];
}

async function handlePrecompute() {
  if (isPrecomputing) {
    console.log('Already precomputing');
    return;
  }

  if (!wordListLoaded) {
    console.log('Word list not loaded yet');
    return;
  }

  console.log('Starting precomputation...');
  isPrecomputing = true;
  precomputeBtn.disabled = true;
  precomputeProgress.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = '0%';

  try {
    const settings = readSettingsFromControls();
    console.log('Precomputing for settings:', hashSettings(settings));

    await precomputeScores(settings, (progress) => {
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `${progress}%`;
    });

    console.log('Precomputation complete');
    precomputeBtn.textContent = '✓ Precomputed!';
    setTimeout(() => {
      precomputeProgress.style.display = 'none';
      precomputeBtn.textContent = 'Precompute for fast generation';
    }, 2000);
  } catch (error) {
    console.error('Precomputation failed', error);
    precomputeBtn.textContent = 'Failed - try again';
  } finally {
    isPrecomputing = false;
    precomputeBtn.disabled = false;
  }
}

async function generateWord(targetMin, targetMax, settings) {
  if (!wordListLoaded) {
    return 'loading';
  }

  const hash = hashSettings(settings);
  const cache = scoreCaches.get(hash);

  if (cache) {
    // Fast path: use precomputed scores
    const candidates = Array.from(cache.entries())
      .filter(([word, data]) => data.score >= targetMin && data.score <= targetMax);

    if (candidates.length > 0) {
      // Apply length weighting
      const weightedCandidates = [];
      candidates.forEach(([word, data]) => {
        const weight = getLengthWeight(data.length);
        const copies = Math.max(1, Math.round(weight * 5));
        for (let i = 0; i < copies; i++) {
          weightedCandidates.push(word);
        }
      });

      return weightedCandidates[Math.floor(Math.random() * weightedCandidates.length)];
    }
  }

  // Slow path: custom settings require live calculation
  const maxAttempts = 10000;
  const wordArray = Array.from(validWords);
  const candidateWords = wordArray.filter((w) => w.length >= 3 && w.length <= 12);

  // Try random valid words with length weighting
  // Break into chunks to allow UI updates
  const chunkSize = 500;
  for (let chunk = 0; chunk < maxAttempts / chunkSize; chunk++) {
    // Yield to browser between chunks
    if (chunk > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    for (let i = 0; i < chunkSize; i++) {
      const word = getWeightedRandomWord(candidateWords);
      const { score } = calculateScore(word, settings);

      if (score >= targetMin && score <= targetMax) {
        return word;
      }
    }
  }

  // Fallback: find closest match with length preference
  let bestWord = 'word';
  let bestDiff = Infinity;

  for (let i = 0; i < Math.min(1000, candidateWords.length); i++) {
    const word = getWeightedRandomWord(candidateWords);
    const { score } = calculateScore(word, settings);
    const diff = Math.abs(score - (targetMin + targetMax) / 2);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestWord = word;
    }
  }

  return bestWord;
}

async function handleGenerate() {
  const range = generatorRange.value;
  const [minStr, maxStr] = range.split('-');
  const targetMin = parseInt(minStr, 10);
  const targetMax = parseInt(maxStr, 10);

  // Show loading state
  generateBtn.disabled = true;
  generateBtn.classList.add('loading');
  const originalText = generateBtn.textContent;
  generateBtn.textContent = 'Searching...';

  try {
    const settings = readSettingsFromControls();
    const generatedWord = await generateWord(targetMin, targetMax, settings);

    wordField.value = generatedWord;
    wordField.dispatchEvent(new Event('input'));
    wordField.focus();
  } finally {
    // Restore button state
    generateBtn.disabled = false;
    generateBtn.classList.remove('loading');
    generateBtn.textContent = originalText;
  }
}

async function init() {
  console.log('Word Beauty Scorer v1.2 - Initializing...');

  // Load and apply theme
  const theme = loadTheme();
  applyTheme(theme);

  // Load word list in background
  loadWordList();

  const settings = loadSettings();
  applySettingsToControls(settings);
  renderBreakdown([
    { label: 'Base letter score', value: '—' },
    { label: 'Harmony/Contrast', value: '—' },
  ]);
  renderDiscoveries(bestWordsList, discoveries.best);
  renderDiscoveries(worstWordsList, discoveries.worst);

  wordField.addEventListener('input', handleInput);

  Object.values(controls).forEach((control) => {
    control.addEventListener('input', handleInput);
    control.addEventListener('change', handleInput);
  });

  sampleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      wordField.value = button.dataset.word || '';
      wordField.dispatchEvent(new Event('input'));
      wordField.focus();
    });
  });

  controlsToggle.addEventListener('click', () => {
    const isOpen = controlsPanel.classList.toggle('open');
    controlsToggle.setAttribute('aria-expanded', String(isOpen));
  });

  generateBtn.addEventListener('click', handleGenerate);
  precomputeBtn.addEventListener('click', handlePrecompute);

  resetBtn.addEventListener('click', () => {
    applySettingsToControls(defaultSettings);
    saveSettings(defaultSettings);
    handleInput();
  });

  themeToggle.addEventListener('click', cycleTheme);

  clearCacheBtn.addEventListener('click', () => {
    if (confirm('Clear all precomputed caches? You will need to precompute again for custom settings.')) {
      scoreCaches.clear();
      localStorage.removeItem('word-beauty-caches-v1');
      clearCacheBtn.textContent = '✓ Cleared!';
      setTimeout(() => {
        clearCacheBtn.textContent = 'Clear all caches';
      }, 2000);

      // Reprecompute default settings
      const defaultHash = hashSettings(defaultSettings);
      if (!scoreCaches.has(defaultHash)) {
        precomputeScores(defaultSettings);
      }
    }
  });

  handleInput();
}

init();
