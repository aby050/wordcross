<div align="center">

<img src="assets/icon.png" width="96" alt="WordCross icon" />

# WordCross — Offline Crossword

**Calm, ad-free crossword puzzles for iOS and Android that work with no internet.**

1000+ levels from easy to hard, beautiful animated themes, letter tiles or a full keyboard —
and nothing leaves your device.

[![CI](https://github.com/aby050/wordcross/actions/workflows/ci.yml/badge.svg)](https://github.com/aby050/wordcross/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[<img alt="Get it on Google Play" height="48" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png">](https://play.google.com/store/apps/details?id=com.abhay.wordcross)
[<img alt="Download on the App Store" height="48" src="https://tools.applemarketingtools.com/api/badges/download-on-the-app-store/black/en-us">](https://apps.apple.com/app/id6817191231)

</div>

## Screenshots

<p align="center">
  <img src="docs/screenshots/1-home.jpg" width="180" alt="Home screen" />
  <img src="docs/screenshots/2-play.jpg" width="180" alt="Playing a level" />
  <img src="docs/screenshots/3-book.jpg" width="180" alt="Word book" />
  <img src="docs/screenshots/4-themes.jpg" width="180" alt="Themes" />
  <img src="docs/screenshots/5-stats.jpg" width="180" alt="Statistics" />
</p>

## Features

- **1000+ levels** generated from 2,000+ everyday words and hand-written clues.
- **Animated themes** — Lake at dusk, Nature, Blossom, Ocean, Night, Autumn and Wood.
- **Letter tiles or keyboard** — tiles include a few decoys; the keyboard is the classic challenge.
- **Power-ups** — reveal a letter, erase mistakes, jump to another clue.
- **Streaks and stats** — daily coins, a progress calendar, accuracy and play time.
- **Bonus modes** — picture-clue arrow puzzles and a word battle against a friendly bot.
- **100% offline and private** — no ads, no sign-up, no analytics; progress lives in AsyncStorage.

## Getting started

Requires Node 20+ and the Expo toolchain.

```bash
git clone https://github.com/aby050/wordcross.git
cd wordcross
npm install
npx expo start          # press w for web, a for Android, i for iOS
```

Typecheck before opening a pull request:

```bash
npx tsc --noEmit
```

## Project structure

| Path | What lives there |
|---|---|
| `App.tsx` | Entry point and navigation between screens |
| `src/cross/` | Crossword mode: screens, level generator (`generate.ts`), clues, themes, store |
| `src/cross/bank/` | Word and clue bank |
| `src/ArrowGame.tsx`, `src/arrowPuzzles.ts` | Picture-clue arrow puzzles |
| `src/WordGame.tsx`, `src/scrabble.ts` | Word battle mode |
| `src/progress.ts` | Saved progress, coins and streaks |
| `assets/` | Icons, splash and sounds |
| `store/` | Store listing copy, screenshots and privacy page |
| `scripts/` | Release scripts (maintainer only) |

## Contributing

Bug reports, new clues, themes and puzzle modes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
and the [Code of Conduct](CODE_OF_CONDUCT.md) first. Good first contributions:

- fix or improve a clue in `src/cross/bank/`,
- add a theme in `src/cross/themes.ts`,
- report a level whose words overlap badly (include the level number).

## Privacy

WordCross collects no data. See the [privacy policy](https://rvastudio.in/wordcross/privacy).

## License

[MIT](LICENSE). Use, modify and ship it freely, including commercially.

The WordCross name, icon and store listings belong to RVA Studio and are not covered by the code license.
