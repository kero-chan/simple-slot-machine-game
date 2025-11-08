# 🎰 Mahjong Slot Machine Game

An HTML5 Canvas-based slot machine game inspired by Mahjong-themed slot games, featuring cascading wins, multipliers, golden symbols, and free spins.

## 🎮 Features

- **5 Reels × 3 Rows** slot machine layout
- **Cascading Wins**: Winning symbols disappear and new ones fall down
- **Multiplier System**: Consecutive wins increase multipliers (×1, ×2, ×3, ×5)
- **Golden Symbols**: Special golden symbols on reels 2, 3, and 4 that convert to Wilds after wins
- **Free Spins**: Triggered by 3+ scatter symbols (12 free spins + 2 per extra scatter)
- **Enhanced Free Spin Multipliers**: ×2, ×4, ×6, ×10 during free spins
- **Mobile-Responsive**: Optimized for both desktop and mobile devices
- **Touch Support**: Full touch controls for mobile gameplay

## 🎯 How to Play

1. **Set Your Bet**: Use the "+ Bet" and "- Bet" buttons to adjust your wager (5-100 credits)
2. **Spin**: Click/tap the "SPIN" button to start the reels
3. **Win**: Match 3+ symbols from left to right to win
4. **Cascade**: Winning symbols explode, new ones fall, and you can win again with increased multipliers!
5. **Free Spins**: Land 3+ 🎴 scatter symbols to trigger free spins with enhanced multipliers

## 📱 Mobile Support

The game is fully optimized for mobile devices:
- Responsive canvas that adapts to screen size
- Touch-friendly buttons
- Optimized layout for portrait and landscape modes
- Smooth touch interactions

## 🎨 Symbol Paytable

| Symbol | 3 Match | 4 Match | 5 Match |
|--------|---------|---------|---------|
| 🀄 Wild | 15× | 60× | 100× |
| 🎴 Scatter | 10× | 40× | 80× |
| 🀆 Red Dragon | 8× | 20× | 60× |
| 🀅 Green Dragon | 6× | 15× | 40× |
| 🀄 White Dragon | 6× | 15× | 40× |
| 🀀 East Wind | 4× | 10× | 20× |
| 🀁 South Wind | 4× | 10× | 20× |
| 🎋 Bamboo | 2× | 5× | 10× |
| ㊥ Character | 2× | 5× | 10× |
| ⚫ Dot | 2× | 5× | 10× |

*Payouts are multiplied by your bet amount*

## 🖼️ Replacing Assets with Images

The game currently uses emoji symbols for easy testing and compatibility. To replace them with custom images:

### Step 1: Prepare Your Images

Create image files for each symbol in the `assets/` directory:

```
assets/
├── wild.png
├── scatter.png
├── dragon_red.png
├── dragon_green.png
├── dragon_white.png
├── wind_east.png
├── wind_south.png
├── bamboo.png
├── character.png
└── dot.png
```

Recommended image size: 256×256px (PNG with transparency)

### Step 2: Update the Asset Configuration

Edit `game.js` and modify the `ASSETS` object:

```javascript
const ASSETS = {
    symbols: {
        wild: {
            image: 'assets/wild.png',
            name: 'Wild',
            color: '#FFD700'
        },
        scatter: {
            image: 'assets/scatter.png',
            name: 'Scatter',
            color: '#FF4444'
        },
        // ... add image paths for all symbols
    },

    // Set this to true to use images instead of emojis
    useImages: true
};
```

### Step 3: Add Image Loading System

Add this code to the `SlotMachine` class constructor in `game.js`:

```javascript
constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.state = new GameState();
    this.images = {};
    this.imagesLoaded = false;

    if (ASSETS.useImages) {
        this.loadImages().then(() => {
            this.imagesLoaded = true;
            this.setupCanvas();
            this.initializeUI();
            this.render();
        });
    } else {
        this.setupCanvas();
        this.initializeUI();
        this.render();
    }

    // ... rest of constructor
}

async loadImages() {
    const promises = [];

    for (const [key, symbol] of Object.entries(ASSETS.symbols)) {
        if (symbol.image) {
            const img = new Image();
            promises.push(new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = symbol.image;
            }));
            this.images[key] = img;
        }
    }

    await Promise.all(promises);
}
```

### Step 4: Update the Drawing Function

Modify the `drawSymbol` method in `game.js`:

```javascript
drawSymbol(ctx, symbolKey, x, y, size, isGolden) {
    const symbol = ASSETS.symbols[symbolKey];
    if (!symbol) return;

    if (ASSETS.useImages && this.images[symbolKey]) {
        // Draw image
        if (isGolden) {
            ctx.shadowColor = ASSETS.goldenColor;
            ctx.shadowBlur = 15;
        }

        ctx.drawImage(this.images[symbolKey], x + 5, y + 5, size - 10, size - 10);
        ctx.shadowBlur = 0;
    } else {
        // Draw emoji (current implementation)
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isGolden) {
            ctx.shadowColor = ASSETS.goldenColor;
            ctx.shadowBlur = 10;
        }

        ctx.fillStyle = symbol.color;
        ctx.fillText(symbol.emoji, x + size / 2, y + size / 2);
        ctx.shadowBlur = 0;
    }

    // Draw symbol name
    ctx.font = `${size * 0.12}px Arial`;
    ctx.fillStyle = '#333';
    ctx.fillText(symbol.name.substring(0, 4), x + size / 2, y + size - 8);
}
```

## 🎲 Game Mechanics

### Cascading Wins
- When you win, winning symbols explode and disappear
- New symbols fall from above to fill empty spaces
- Chain reactions can occur for multiple wins in one spin!

### Multiplier System
- **Normal Spins**: ×1 → ×2 → ×3 → ×5 (for consecutive wins)
- **Free Spins**: ×2 → ×4 → ×6 → ×10 (enhanced multipliers!)

### Golden Symbols
- Appear randomly on reels 2, 3, and 4
- Shown with a golden border and glow effect
- When part of a winning combination, they convert to Wild symbols for the next cascade
- Increases your chances for bigger wins!

### Wild Symbol (🀄)
- Substitutes for all symbols except Scatter
- Can be part of winning combinations
- Golden symbols convert to Wilds after winning

### Scatter Symbol (🎴)
- Triggers Free Spins when 3+ appear anywhere
- 3 Scatters = 12 Free Spins
- Each additional Scatter = +2 Free Spins
- Can be re-triggered during Free Spins!

## 🛠️ Technical Details

### Files Structure
```
.
├── index.html          # Main HTML file
├── style.css           # Styling and responsive design
├── game.js            # Game logic and rendering
└── README.md          # This file
```

### Browser Compatibility
- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)
- iOS Safari and Chrome Mobile

### Performance
- 60 FPS animations
- Optimized canvas rendering
- Efficient cascade and multiplier calculations

## 🎮 Keyboard Controls (Desktop)

- **SPACE** or **ENTER**: Spin the reels

## 📝 Game Configuration

Edit the `CONFIG` object in `game.js` to customize:

```javascript
const CONFIG = {
    game: {
        initialCredits: 1000,      // Starting credits
        minBet: 5,                 // Minimum bet amount
        maxBet: 100,               // Maximum bet amount
        betStep: 5,                // Bet increment/decrement
        freeSpinsPerScatter: 12,   // Base free spins
        bonusScattersPerSpin: 2    // Extra spins per scatter
    },

    multipliers: [1, 2, 3, 5],     // Normal mode multipliers
    freeSpinMultipliers: [2, 4, 6, 10], // Free spin multipliers

    // Adjust paytable, animation speeds, etc.
};
```

## 🚀 Getting Started

1. **Clone or download** this repository
2. **Open `index.html`** in a web browser
3. **Start playing!** No build process or dependencies needed

For development:
```bash
# Serve with a local server (optional)
python -m http.server 8000
# or
npx serve
```

Then visit `http://localhost:8000`

## 📄 License

This project is open source and available for modification and use.

## 🙏 Credits

Inspired by Mahjong Ways (麻将胡了) and similar cascading slot games.

---

**Enjoy the game! 🎰🀄**
