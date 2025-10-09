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
  palindromeBonus: false,
  favorCurves: false,
  favorAngles: false,
  favorBalance: false,
  visualRhythm: false,
  repetitionSlider: 0,
  lengthPreference: 'neutral',
  vowelFlow: false,
};

const storageKey = 'word-beauty-settings-v1';

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

function sanitizeWord(input) {
  return input.replace(/[^a-zA-Z]/g, '').toLowerCase();
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

  const maxHarmonyBonus = baseScore * 0.3;
  const positiveLengthBonus = Math.max(0, lengthPref);
  const positiveRepetition = Math.max(0, repetition.value);
  const positiveVowelBonus = settings.vowelFlow && vowelFlow.vowelRatio > 0.5 ? 5 : 0;

  let maxPossible =
    baseScore +
    maxHarmonyBonus +
    (settings.palindromeBonus && isPalindrome ? 15 : 0) +
    Math.max(0, letterPref) +
    (settings.visualRhythm ? 10 : 0) +
    positiveRepetition +
    positiveLengthBonus +
    positiveVowelBonus;

  const negativeRepetition = Math.min(0, repetition.value);
  const negativeLength = Math.min(0, lengthPref);
  const negativeVowel = settings.vowelFlow ? Math.min(0, vowelFlow.value) : 0;

  const minPossible = baseScore + negativeRepetition + negativeLength + negativeVowel;

  if (maxPossible <= minPossible) {
    maxPossible = minPossible + baseScore;
  }

  const normalized = Math.max(
    0,
    Math.min(100, ((total - minPossible) / Math.max(1, maxPossible - minPossible)) * 100),
  );

  modifiers.push({ label: 'Raw total', value: `${total.toFixed(1)} pts` });

  return {
    score: parseFloat(normalized.toFixed(1)),
    breakdown: modifiers,
    raw: total,
    max: maxPossible,
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
    scoreSpan.textContent = `${item.score.toFixed(1)}`;
    li.append(wordSpan, scoreSpan);
    container.append(li);
  });
}

function updateScoreDisplay(word, settings) {
  const { score, breakdown } = calculateScore(word, settings);
  scoreNumberEl.textContent = score.toFixed(1);
  updateMeter(score);
  renderBreakdown(breakdown);
  if (!word) {
    scoreLabel.textContent = 'Awaiting a word...';
    scoreNumberEl.textContent = '0.0';
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

function init() {
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

  handleInput();
}

init();
