// ==========================================
// ASSET CONFIGURATION
// ==========================================
const ASSETS = {
    symbols: {
        wild: { emoji: '🀄', name: 'Wild', color: '#FFD700' },
        scatter: { emoji: '🎴', name: 'Scatter', color: '#FF4444' },
        dragon_red: { emoji: '🀆', name: 'Red Dragon', color: '#FF6B6B' },
        dragon_green: { emoji: '🀅', name: 'Green Dragon', color: '#51CF66' },
        dragon_white: { emoji: '🀄', name: 'White Dragon', color: '#E0E0E0' },
        wind_east: { emoji: '🀀', name: 'East Wind', color: '#74C0FC' },
        wind_south: { emoji: '🀁', name: 'South Wind', color: '#FFA94D' },
        bamboo: { emoji: '🎋', name: 'Bamboo', color: '#82C91E' },
        character: { emoji: '㊥', name: 'Character', color: '#FF6B9D' },
        dot: { emoji: '⚫', name: 'Dot', color: '#868E96' }
    },
    reelColor: '#FFFFFF',
    reelBorderColor: '#2C3E50',
    highlightColor: '#FFD700',
    goldenColor: '#FFD700',
    imagePaths: {
        wild: 'assets/wild.png',
        scatter: 'assets/scatter.png',
        dragon_red: 'assets/dragon_red.png',
        dragon_green: 'assets/dragon_green.png',
        dragon_white: 'assets/dragon_white.png',
        wind_east: 'assets/wind_east.png',
        wind_south: 'assets/wind_south.png',
        bamboo: 'assets/bamboo.png',
        character: 'assets/character.png',
        dot: 'assets/dot.png'
    },
    loadedImages: {}
};

// ==========================================
// GAME CONFIGURATION
// ==========================================
const CONFIG = {
    canvas: {
        baseWidth: 600,
        baseHeight: 400,
        width: 600,
        height: 400
    },
    reels: {
        count: 5,
        rows: 3,
        symbolSize: 80,
        spacing: 10,
        offsetX: 60,
        offsetY: 50
    },
    paytable: {
        wild: { 3: 15, 4: 60, 5: 100 },
        scatter: { 3: 10, 4: 40, 5: 80 },
        dragon_red: { 3: 8, 4: 20, 5: 60 },
        dragon_green: { 3: 6, 4: 15, 5: 40 },
        dragon_white: { 3: 6, 4: 15, 5: 40 },
        wind_east: { 3: 4, 4: 10, 5: 20 },
        wind_south: { 3: 4, 4: 10, 5: 20 },
        bamboo: { 3: 2, 4: 5, 5: 10 },
        character: { 3: 2, 4: 5, 5: 10 },
        dot: { 3: 2, 4: 5, 5: 10 }
    },
    multipliers: [1, 2, 3, 5, 5, 5],
    freeSpinMultipliers: [2, 4, 6, 10, 10, 10],
    animation: {
        spinDuration: 2000,
        cascadeDuration: 500,
        symbolFallSpeed: 10
    },
    game: {
        initialCredits: 1000,
        minBet: 5,
        maxBet: 100,
        betStep: 5,
        freeSpinsPerScatter: 12,
        bonusScattersPerSpin: 2
    }
};

// ==========================================
// GAME STATE
// ==========================================
class GameState {
    constructor() {
        this.credits = CONFIG.game.initialCredits;
        this.bet = CONFIG.game.minBet;
        this.currentWin = 0;
        this.isSpinning = false;
        this.consecutiveWins = 0;
        this.freeSpins = 0;
        this.inFreeSpinMode = false;
        this.grid = this.createEmptyGrid();
        this.goldenSymbols = new Set();
        this.animationFrame = null;
        this.cascading = false;
    }

    createEmptyGrid() {
        const grid = [];
        for (let col = 0; col < CONFIG.reels.count; col++) {
            grid[col] = [];
            for (let row = 0; row < CONFIG.reels.rows; row++) {
                grid[col][row] = this.getRandomSymbol();
            }
        }
        return grid;
    }

    getRandomSymbol() {
        const symbols = Object.keys(ASSETS.symbols);
        const regularSymbols = symbols.filter(s => s !== 'scatter' && s !== 'wild');
        const rand = Math.random();
        if (rand < 0.05) return 'wild';
        if (rand < 0.10) return 'scatter';
        return regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
    }

    getCurrentMultiplier() {
        const multipliers = this.inFreeSpinMode ? CONFIG.freeSpinMultipliers : CONFIG.multipliers;
        const index = Math.min(this.consecutiveWins, multipliers.length - 1);
        return multipliers[index];
    }
}

// ==========================================
// GAME ENGINE
// ==========================================
class SlotMachine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();

        // HTML UI elements
        this.creditsDisplay = document.getElementById('credits');
        this.betDisplay = document.getElementById('bet');
        this.winDisplay = document.getElementById('win');
        this.spinBtn = document.getElementById('spinBtn');
        this.increaseBetBtn = document.getElementById('increaseBet');
        this.decreaseBetBtn = document.getElementById('decreaseBet');

        this.setupCanvas();
        this.initializeUI();
        this.render();

        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const maxWidth = Math.min(containerWidth - 40, CONFIG.canvas.baseWidth);

        const aspectRatio = CONFIG.canvas.baseHeight / CONFIG.canvas.baseWidth;
        const width = maxWidth;
        const height = width * aspectRatio;

        this.canvas.width = width;
        this.canvas.height = height;

        CONFIG.canvas.width = width;
        CONFIG.canvas.height = height;

        // Scale metrics based on width
        const scale = width / CONFIG.canvas.baseWidth;

        CONFIG.reels.symbolSize = Math.floor(80 * scale);
        CONFIG.reels.spacing = Math.floor(10 * scale);
        CONFIG.reels.offsetX = Math.floor(60 * scale);
        CONFIG.reels.offsetY = Math.floor(50 * scale);
    }

    initializeUI() {
        // Spin button click
        this.spinBtn.addEventListener('click', () => this.spin());

        // Bet controls
        this.increaseBetBtn.addEventListener('click', () => {
            if (this.state.bet < CONFIG.game.maxBet && !this.state.isSpinning) {
                this.state.bet += CONFIG.game.betStep;
                this.updateUI();
            }
        });

        this.decreaseBetBtn.addEventListener('click', () => {
            if (this.state.bet > CONFIG.game.minBet && !this.state.isSpinning) {
                this.state.bet -= CONFIG.game.betStep;
                this.updateUI();
            }
        });

        // Keyboard spin
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.spin();
            }
        });

        this.updateUI();
    }

    updateUI() {
        // Update HTML displays
        this.creditsDisplay.textContent = this.state.credits;
        this.betDisplay.textContent = this.state.bet;
        this.winDisplay.textContent = this.state.currentWin;

        // Update button states
        const canSpin = !this.state.isSpinning &&
            (this.state.credits >= this.state.bet || this.state.freeSpins > 0);

        this.spinBtn.disabled = !canSpin;
        this.increaseBetBtn.disabled = this.state.isSpinning || this.state.bet >= CONFIG.game.maxBet;
        this.decreaseBetBtn.disabled = this.state.isSpinning || this.state.bet <= CONFIG.game.minBet;
    }

    async spin() {
        if (this.state.isSpinning) return;

        if (this.state.freeSpins > 0) {
            this.state.freeSpins--;
        } else {
            if (this.state.credits < this.state.bet) {
                alert('Not enough credits!');
                return;
            }
            this.state.credits -= this.state.bet;
            this.state.consecutiveWins = 0;
            this.state.inFreeSpinMode = false;
        }

        this.state.isSpinning = true;
        this.state.currentWin = 0;
        this.updateUI();

        await this.animateSpin();
        await this.checkWinsAndCascade();

        this.state.isSpinning = false;
        this.updateUI();
    }

    async animateSpin() {
        const startTime = Date.now();
        const duration = CONFIG.animation.spinDuration;

        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                if (progress < 1) {
                    for (let col = 0; col < CONFIG.reels.count; col++) {
                        for (let row = 0; row < CONFIG.reels.rows; row++) {
                            if (Math.random() > 0.7) {
                                this.state.grid[col][row] = this.state.getRandomSymbol();
                            }
                        }
                    }
                    this.render();
                    requestAnimationFrame(animate);
                } else {
                    // Finalize symbols
                    for (let col = 0; col < CONFIG.reels.count; col++) {
                        for (let row = 0; row < CONFIG.reels.rows; row++) {
                            this.state.grid[col][row] = this.state.getRandomSymbol();
                        }
                    }

                    // Random golden symbols on middle reels 2-4
                    this.state.goldenSymbols.clear();
                    for (let col = 1; col <= 3; col++) {
                        for (let row = 0; row < CONFIG.reels.rows; row++) {
                            if (Math.random() < 0.2 &&
                                this.state.grid[col][row] !== 'wild' &&
                                this.state.grid[col][row] !== 'scatter') {
                                this.state.goldenSymbols.add(`${col},${row}`);
                            }
                        }
                    }
                    this.render();
                    resolve();
                }
            };
            animate();
        });
    }

    async checkWinsAndCascade() {
        let totalWin = 0;
        let hasWins = true;

        while (hasWins) {
            const wins = this.findWinningCombinations();
            if (wins.length === 0) {
                hasWins = false;
                break;
            }

            const winAmount = this.calculateWinAmount(wins);
            const multiplier = this.state.getCurrentMultiplier();
            const multipliedWin = winAmount * multiplier * this.state.bet;

            totalWin += multipliedWin;
            this.state.consecutiveWins++;

            await this.highlightWins(wins);
            this.convertGoldenToWilds(wins);

            const scatterCount = this.countScatters();
            if (scatterCount >= 3) {
                this.state.freeSpins += CONFIG.game.freeSpinsPerScatter +
                                        (scatterCount - 3) * CONFIG.game.bonusScattersPerSpin;
                this.state.inFreeSpinMode = true;
            }

            await this.cascadeSymbols(wins);
        }

        if (totalWin > 0) {
            this.state.currentWin = totalWin;
            this.state.credits += totalWin;
        } else {
            this.state.consecutiveWins = 0;
        }
    }

    findWinningCombinations() {
        const wins = [];

        for (let row = 0; row < CONFIG.reels.rows; row++) {
            let currentSymbol = this.state.grid[0][row];
            let count = 1;
            let positions = [[0, row]];

            for (let col = 1; col < CONFIG.reels.count; col++) {
                const symbol = this.state.grid[col][row];

                if (symbol === currentSymbol || symbol === 'wild' || currentSymbol === 'wild') {
                    count++;
                    positions.push([col, row]);
                    if (currentSymbol === 'wild' && symbol !== 'wild') {
                        currentSymbol = symbol;
                    }
                } else {
                    break;
                }
            }

            if (count >= 3 && currentSymbol !== 'scatter') {
                wins.push({ symbol: currentSymbol, count, positions });
            }
        }

        return wins;
    }

    countScatters() {
        let count = 0;
        for (let col = 0; col < CONFIG.reels.count; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
                if (this.state.grid[col][row] === 'scatter') count++;
            }
        }
        return count;
    }

    calculateWinAmount(wins) {
        let total = 0;
        for (const win of wins) {
            const paytable = CONFIG.paytable[win.symbol];
            if (paytable && paytable[win.count]) total += paytable[win.count];
        }
        return total;
    }

    async highlightWins(wins) {
        const duration = 500;
        const startTime = Date.now();

        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    this.render(wins);
                    requestAnimationFrame(animate);
                } else {
                    this.render();
                    resolve();
                }
            };
            animate();
        });
    }

    convertGoldenToWilds(wins) {
        const winPositions = new Set();
        wins.forEach(win => {
            win.positions.forEach(([col, row]) => {
                winPositions.add(`${col},${row}`);
            });
        });

        winPositions.forEach(pos => {
            if (this.state.goldenSymbols.has(pos)) {
                const [col, row] = pos.split(',').map(Number);
                this.state.grid[col][row] = 'wild';
                this.state.goldenSymbols.delete(pos);
            }
        });
    }

    async cascadeSymbols(wins) {
        const toRemove = new Set();
        wins.forEach(win => {
            win.positions.forEach(([col, row]) => {
                toRemove.add(`${col},${row}`);
            });
        });

        for (let col = 0; col < CONFIG.reels.count; col++) {
            const removed = [];
            for (let row = CONFIG.reels.rows - 1; row >= 0; row--) {
                if (toRemove.has(`${col},${row}`)) removed.push(row);
            }

            for (let i = removed.length - 1; i >= 0; i--) {
                const rowToRemove = removed[i];
                for (let row = rowToRemove; row > 0; row--) {
                    this.state.grid[col][row] = this.state.grid[col][row - 1];
                }
                this.state.grid[col][0] = this.state.getRandomSymbol();
            }
        }

        await this.animateCascade();
    }

    async animateCascade() {
        const duration = CONFIG.animation.cascadeDuration;
        const startTime = Date.now();

        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    this.render();
                    requestAnimationFrame(animate);
                } else {
                    this.render();
                    resolve();
                }
            };
            animate();
        });
    }

    // ==========================================
    // RENDERING - CANVAS ONLY SHOWS REELS
    // ==========================================
    render(highlightWins = null) {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Only draw reels - no UI elements
        this.drawReels(highlightWins);

        // Show free spins info if active
        if (this.state.freeSpins > 0) {
            this.drawFreeSpinsInfo();
        }
    }

    drawReels(highlightWins) {
        const ctx = this.ctx;
        const { symbolSize, spacing, offsetX, offsetY } = CONFIG.reels;

        const highlightSet = new Set();
        if (highlightWins) {
            highlightWins.forEach(win => {
                win.positions.forEach(([col, row]) => {
                    highlightSet.add(`${col},${row}`);
                });
            });
        }

        for (let col = 0; col < CONFIG.reels.count; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
                const x = offsetX + col * (symbolSize + spacing);
                const y = offsetY + row * (symbolSize + spacing);

                const isHighlighted = highlightSet.has(`${col},${row}`);
                const isGolden = this.state.goldenSymbols.has(`${col},${row}`);

                ctx.fillStyle = isHighlighted ? ASSETS.highlightColor : ASSETS.reelColor;
                ctx.strokeStyle = isGolden ? ASSETS.goldenColor : ASSETS.reelBorderColor;
                ctx.lineWidth = isGolden ? 4 : 2;

                ctx.fillRect(x, y, symbolSize, symbolSize);
                ctx.strokeRect(x, y, symbolSize, symbolSize);

                const symbol = this.state.grid[col][row];
                this.drawSymbol(ctx, symbol, x, y, symbolSize, isGolden);
            }
        }
    }

    drawSymbol(ctx, symbolKey, x, y, size, isGolden) {
        const symbol = ASSETS.symbols[symbolKey];
        if (!symbol) return;

        // tile background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 6, y + 6, size - 12, size - 12);

        // Draw PNG image
        const img = ASSETS.loadedImages && ASSETS.loadedImages[symbolKey];
        if (img && img.complete && img.naturalHeight !== 0) {
            const padding = Math.floor(size * 0.18);
            const w = size - padding * 2;
            const h = size - padding * 2;
            ctx.drawImage(img, x + padding, y + padding, w, h);
        } else {
            // Show loading indicator if image not ready
            ctx.fillStyle = '#CCCCCC';
            ctx.font = `${Math.floor(size * 0.3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('...', x + size / 2, y + size / 2);
        }
    }

    drawFreeSpinsInfo() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const areaH = 40;
        const y = 10;

        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.fillRect(10, y, w - 20, areaH);

        ctx.fillStyle = '#1a1a2e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`FREE SPINS: ${this.state.freeSpins}`, w / 2, y + areaH / 2);
    }
}

// ==========================================
// BOOTSTRAP (images preload, no loading overlay)
// ==========================================
window.addEventListener('load', () => {
    const splash = document.getElementById('splashScreen');
    const startBtn = document.getElementById('startBtn');
    const gameContainer = document.querySelector('.game-container');

    gameContainer.style.display = 'none';

    startBtn.addEventListener('click', async () => {
        splash.classList.add('fade-out');
        setTimeout(() => { splash.style.display = 'none'; }, 500);

        gameContainer.style.display = 'block';

        // Preload images silently
        await loadSymbolImages();

        // Start the game
        new SlotMachine('slotCanvas');
    });
});

// ==========================================
// IMAGE PRELOAD
// ==========================================
async function loadSymbolImages() {
    const paths = ASSETS.imagePaths || {};
    ASSETS.loadedImages = {};
    const entries = Object.entries(paths);

    await Promise.all(entries.map(([key, src]) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            ASSETS.loadedImages[key] = img;
            resolve();
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            resolve(); // Continue even if one image fails
        };
        img.src = src;
    })));
}
