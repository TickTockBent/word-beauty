# Word Beauty Scorer

A whimsical single-page experience that scores the visual beauty of any word based on the accompanying specification. Adjust different aesthetic philosophies, explore the scoring breakdown, and discover the most graceful (or gnarly) spellings you uncover.

## Getting Started

This project is framework-free and runs entirely in the browser.

1. Open `index.html` in any modern browser.
2. Type a word, explore the sliders and toggles, and watch the score update instantly.

No build tools or package managers are required.

## Deployment

This repository is pre-configured to publish the site with [GitHub Pages](https://pages.github.com/).

1. Push changes to the `main` branch.
2. GitHub Actions will run the **Deploy static site** workflow, uploading the contents of the repository as the site artifact.
3. The workflow promotes the artifact to the `github-pages` environment, making the latest version of the static site available at your repository's Pages URL.

## Features

- Real-time scoring with a detailed breakdown of modifiers
- Harmony vs. contrast slider with multiplier logic
- Optional symmetry, rhythm, vowel flow, and letter preference bonuses
- Repetition philosophy slider and word length preference selector
- Sample words for quick exploration
- Lightweight "discoveries" leaderboards for the most beautiful and most challenging words you find
- Preferences persist locally via `localStorage`

## Project Structure

```
├── index.html      # Layout and component structure
├── styles.css      # Tailored styling for light and dark themes
└── main.js         # Scoring logic, UI wiring, and state persistence
```

Feel free to remix the aesthetic philosophy weights to suit your own typographic taste!
