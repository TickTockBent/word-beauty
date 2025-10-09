# Word Beauty Scorer

A whimsical web tool that rates the visual aesthetic beauty of written words based purely on their letterforms and visual properties.

🔗 **[Try it live on GitHub Pages](https://ticktockbent.github.io/word-beauty/)**

## Features

### Core Scoring System
- **Real-time Beauty Scoring**: Input any word and receive an instant aesthetic score (0-100)
- **Visual Feedback**: Color-coded progress meter with descriptive labels
- **Detailed Breakdown**: See exactly how each component contributes to the final score
- **Discovery Tracking**: Automatically tracks your most beautiful and most challenging word discoveries

### Customizable Aesthetic Dimensions

Adjust nine different scoring criteria to match your aesthetic philosophy:

1. **Harmony vs. Contrast** - Reward consistent letter styles or varied combinations
2. **Symmetry Bonus** - Extra points for palindromes
3. **Letter Type Preferences** - Favor curved, angular, or balanced letters
4. **Visual Rhythm** - Reward alternating tall/short letter patterns
5. **Repetition Aesthetic** - Penalize or reward repeated letters
6. **Word Length Preference** - Favor minimalist, neutral, or elaborate words
7. **Vowel Flow** - Reward smooth vowel ratios and penalize harsh consonant clusters

### Smart Word Generator

Generate words that fit specific beauty score ranges:
- Choose from 5 predefined ranges (0-29 "Harsh" to 85-100 "Gorgeous")
- Uses 370,000+ word dictionary for valid English words
- Length-weighted selection favors interesting 5-8 letter words
- Instant generation with precomputed caches

### Advanced Performance Features

**Multi-Cache Precomputation System:**
- Hash-based caching for unlimited custom setting profiles
- Background precomputation with live progress tracking
- LocalStorage persistence across browser sessions
- Sub-millisecond word generation with cached settings

**Non-Blocking Architecture:**
- Async processing prevents UI freezing
- Chunked computation for responsive experience
- Progress indicators for long operations

## Technical Highlights

### Scoring Algorithm
- Base letter scores (3-10 points per letter)
- Configurable modifiers for aesthetic dimensions
- Length-neutral normalization using 7-letter reference scaling
- Prevents bias toward short or long words

### Performance Optimizations
- Precomputed scores for ~300,000 words
- O(1) lookups for cached setting combinations
- Weighted random selection with bell curve distribution
- Efficient Map-based data structures

### UI/UX
- Slide-out customizer drawer (hidden by default)
- Responsive design (mobile-friendly)
- Dark mode support
- Full accessibility (ARIA labels, keyboard navigation)
- Smooth animations and transitions

## Project Structure

```
word-beauty/
├── index.html              # Main HTML structure
├── main.js                 # Core scoring logic and UI (~3000 lines)
├── styles.css              # Complete styling with dark mode
├── words.txt               # 370k+ English word dictionary (4.1MB)
├── word-beauty-scorer-spec.md  # Original design specification
└── README.md               # This file
```

## How It Works

1. **Initialization**: Loads 370k word dictionary and precomputes scores for default settings
2. **User Input**: Real-time scoring as you type with instant visual feedback
3. **Customization**: Adjust sliders/toggles in the customizer panel
4. **Precomputation**: Click "Precompute" to cache scores for custom settings
5. **Generation**: Instantly generate words matching any beauty score range
6. **Persistence**: All caches and settings saved to localStorage

## Technical Stack

- **Pure JavaScript** (ES6+, async/await)
- **No frameworks or dependencies**
- **CSS Grid & Flexbox** for layout
- **LocalStorage API** for persistence
- **Fetch API** for dictionary loading
- **GitHub Pages** for deployment

## Development

### Local Testing
```bash
# Start a local server
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

### Deployment
Automatically deploys to GitHub Pages via GitHub Actions on push to `main` branch.

## Credits

Built as a gloriously overengineered toy project exploring aesthetic scoring algorithms, performance optimization, and creative web development.

Word dictionary: [dwyl/english-words](https://github.com/dwyl/english-words)

## License

MIT License - Feel free to use, modify, and share!
