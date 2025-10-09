# Word Beauty Scorer - Project Specification

## Concept Overview

A whimsical web tool that rates the visual aesthetic beauty of written words based purely on their letterforms and visual properties. Users can input any word and receive a "beauty score" based on customizable aesthetic philosophies.

## Core Features

### 1. Word Input & Scoring
- Large, prominent text input field for word entry
- Real-time beauty score calculation as user types
- Display score as a number out of 100
- Visual indicator (progress bar, gauge, or gradient) showing the score
- Breakdown of how the score was calculated

### 2. Adjustable Aesthetic Philosophies

Users can toggle and adjust weights for different scoring systems:

#### **Harmony vs. Contrast Slider** (0-100)
- **0 (Pure Harmony)**: Rewards words where all letters share similar properties (all curved, all angular)
- **50 (Neutral)**: No bonus or penalty for consistency
- **100 (Pure Contrast)**: Rewards words that mix different letter styles

#### **Symmetry Bonus** (Toggle ON/OFF)
- Gives bonus points to palindromes
- Bonus amount: +15 points for perfect palindromes

#### **Letter Type Preferences**
Three toggleable aesthetic preferences:
- **Favor Curves**: Gives bonus to O, S, C, G, Q, U (soft, flowing letters)
- **Favor Angles**: Gives bonus to A, K, M, N, V, W, X, Z (sharp, geometric letters)
- **Favor Balance**: Gives bonus to B, D, P, R (letters with both curves and lines)

#### **Visual Rhythm** (Toggle ON/OFF)
- Rewards alternating patterns of tall/short letters
- Example: "blob" has rhythm (tall-short-short-tall), "hill" is consistent (tall-tall-short-short)
- Bonus: +10 points for strong rhythm

#### **Repetition Aesthetic** (Slider: -20 to +20)
- Negative values: Penalizes repeated letters (minimalist aesthetic)
- Zero: Neutral on repetition
- Positive values: Rewards repeated letters (pattern appreciation)
- Affects both adjacent repeats (ll, oo) and non-adjacent (level, radar)

#### **Word Length Preference** (Dropdown)
- **Minimalist**: Favors short words (3-5 letters) - bonus for brevity
- **Neutral**: No length preference
- **Elaborate**: Favors longer words (8+ letters) - bonus for complexity

#### **Vowel Flow** (Toggle ON/OFF)
- High vowel ratio = smooth, flowing (+5 points if ratio > 0.5)
- Consonant clusters = harsh, challenging (-3 points per cluster of 3+)

## Detailed Scoring Algorithm

### Base Letter Scores

Each letter gets a base beauty score:

**Highly Aesthetic (8-10 points):**
- O (10) - perfect circle
- S (9) - elegant curves
- A (9) - symmetrical
- M (8) - symmetrical, majestic
- H (8) - symmetrical, balanced

**Aesthetic (6-7 points):**
- B, C, D, G, P, R, U, V, W, Y

**Neutral (4-5 points):**
- E, F, I, J, L, N, T, X, Z

**Less Aesthetic (2-3 points):**
- K, Q

**Challenging (0-1 points):**
- None (all letters have some merit)

### Modifier Calculations

#### 1. Harmony/Contrast Calculation
```
curved_letters = count of [O, S, C, G, Q, U]
angular_letters = count of [A, K, M, N, V, W, X, Z]
balanced_letters = count of [B, D, P, R]
total_letters = word length

consistency_score = max(curved_letters, angular_letters, balanced_letters) / total_letters

If harmony_slider < 50:
  multiplier = 1 + (consistency_score * (50 - harmony_slider) / 50 * 0.3)
Else if harmony_slider > 50:
  variety_score = 1 - consistency_score
  multiplier = 1 + (variety_score * (harmony_slider - 50) / 50 * 0.3)
Else:
  multiplier = 1
```

#### 2. Palindrome Bonus
```
if word == word reversed:
  score += 15
```

#### 3. Visual Rhythm Score
```
tall_letters = [b, d, f, h, k, l, t]
short_letters = [a, c, e, i, m, n, o, r, s, u, v, w, x, z]
descenders = [g, j, p, q, y]

Create height pattern array
Count alternations between different heights
rhythm_score = (alternations / (word_length - 1)) * 10
if rhythm_toggle ON: score += rhythm_score
```

#### 4. Repetition Modifier
```
adjacent_repeats = count of consecutive identical letters
non_adjacent_repeats = count of letters appearing 2+ times (non-adjacent)

total_repeats = adjacent_repeats + (non_adjacent_repeats * 0.5)
repetition_modifier = (repetition_slider / 20) * total_repeats
score += repetition_modifier
```

#### 5. Length Preference
```
word_length = length of word

If minimalist:
  if word_length <= 5: score += 10
  if word_length > 8: score -= 5

If elaborate:
  if word_length >= 8: score += 10
  if word_length < 4: score -= 5
```

#### 6. Vowel Flow
```
vowels = [a, e, i, o, u]
vowel_count = count of vowels
vowel_ratio = vowel_count / word_length

consonant_clusters = count of 3+ consecutive consonants

if vowel_flow_toggle ON:
  if vowel_ratio > 0.5: score += 5
  score -= (consonant_clusters * 3)
```

### Final Score Calculation
```
1. Calculate base_score = sum of all letter base scores
2. Apply harmony/contrast multiplier
3. Add all applicable bonuses/penalties
4. Normalize to 0-100 scale
5. Round to 1 decimal place
```

## User Interface Design

### Layout

**Header Section:**
- Title: "Word Beauty Scorer" (playful font)
- Subtitle: "Judge the aesthetic merit of written words"

**Main Input Area:**
- Large text input (center of page)
- Placeholder: "Enter a word..."
- Current word displayed in large, beautiful font below input

**Score Display:**
- Prominent score number (huge, colorful)
- Visual gauge/thermometer/gradient bar
- Color coding: 
  - 0-30: Harsh red
  - 31-50: Orange
  - 51-70: Yellow
  - 71-85: Light green
  - 86-100: Beautiful deep green/gold

**Score Breakdown Panel:**
- Base Letter Score: XX points
- [List each active modifier with its contribution]
- Total: XX points

**Controls Panel (Sidebar or Collapsible):**
All the toggles and sliders for aesthetic philosophies
Default settings: All neutral/off

**Sample Words Section:**
- "Try these:" with 5-6 interesting example words as clickable buttons
- Examples: "smooth", "zigzag", "level", "bubble", "crypt", "gorgeous"

**Leaderboard (Optional):**
- "Ugliest" words found
- "Most beautiful" words found
- User-submitted discoveries

### Visual Design Notes

- Clean, modern interface
- Plenty of white space
- Subtle animations when score changes
- Responsive design (mobile-friendly)
- Accessibility: proper labels, keyboard navigation, color contrast

## Technical Implementation

### Stack Suggestion
- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling
- Local storage to save user preferences

### Key Components
1. `WordInput` - Text input component
2. `ScoreDisplay` - Shows the beauty score with visual indicator
3. `ScoreBreakdown` - Detailed calculation display
4. `ControlPanel` - All the toggles and sliders
5. `SampleWords` - Clickable example words
6. `BeautyCalculator` - Core scoring logic (pure function)

### State Management
```javascript
{
  word: string,
  score: number,
  breakdown: {
    baseScore: number,
    modifiers: Array<{name: string, value: number}>
  },
  settings: {
    harmonyContrast: number,
    palindromeBonus: boolean,
    favorCurves: boolean,
    favorAngles: boolean,
    favorBalance: boolean,
    visualRhythm: boolean,
    repetitionSlider: number,
    lengthPreference: 'minimalist' | 'neutral' | 'elaborate',
    vowelFlow: boolean
  }
}
```

## Future Enhancements

- Compare two words side-by-side
- Find the most beautiful word in a paragraph of text
- "Random beautiful word" generator
- Export/share results with custom URL
- Different language support
- Handwritten vs. serif vs. sans-serif font analysis
- Animation showing how score changes as you adjust sliders

## Success Criteria

- Users can input any word and see an instant score
- Score changes are smooth and responsive
- All modifiers work correctly and transparently
- The tool is fun and shareable
- Interface is intuitive without requiring instructions