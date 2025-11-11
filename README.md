# Mahjong Slot Machine Game

A mahjong-themed slot machine game built with **Vue 3** and **Vite**, featuring the **Composition API** and modern development tooling.

## Features

- 🎰 Slot machine mechanics with cascading wins
- 🀄 Mahjong-themed symbols and design
- ✨ Free spins bonus system
- 🎯 Multiplier system for consecutive wins
- 💎 Golden symbols that convert to wilds
- 📱 Responsive design for desktop and mobile
- ⚡️ Built with Vite for fast development and build times

## Project Structure

```
src/
├── components/         # Vue components
│   ├── SplashScreen.vue
│   └── GameCanvas.vue
├── composables/        # Reusable composition functions
│   ├── useGameState.js
│   ├── useGridState.js
│   ├── useCanvas.js
│   ├── useRenderer.js
│   └── useGameLogic.js
├── config/            # Configuration files
│   ├── constants.js
│   └── assets.js
├── utils/             # Utility functions
│   ├── imageLoader.js
│   └── gameHelpers.js
├── App.vue            # Main application component
└── main.js            # Application entry point
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The game will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Composition API** - Modern Vue 3 API for better code organization
- **Canvas API** - For rendering the game graphics

## Game Mechanics

- **Bet System**: Adjustable bet amounts (5-100 credits)
- **Win Lines**: 3+ matching symbols in a row
- **Cascading Wins**: Winning symbols are removed and new ones drop down
- **Multipliers**: Increase with consecutive wins (1x → 2x → 3x → 5x)
- **Free Spins**: Triggered by 3+ liangtong symbols
- **Golden Symbols**: Randomly appear and convert to liangsuo when part of a win
- **Liangsuo**: Substitutes for any symbol except liangtong
