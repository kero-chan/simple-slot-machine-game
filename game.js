// ==========================================
// ASSET CONFIGURATION
// Replace these with your own images later
// ==========================================

const ASSETS = {
    symbols: {
        // High value symbols
        wild: { emoji: '🀄', name: 'Wild', color: '#FFD700' },
        scatter: { emoji: '🎴', name: 'Scatter', color: '#FF4444' },

        // Mahjong tile symbols (high to low value)
        dragon_red: { emoji: '🀆', name: 'Red Dragon', color: '#FF6B6B' },
        dragon_green: { emoji: '🀅', name: 'Green Dragon', color: '#51CF66' },
        dragon_white: { emoji: '🀄', name: 'White Dragon', color: '#E0E0E0' },
        wind_east: { emoji: '🀀', name: 'East Wind', color: '#74C0FC' },
        wind_south: { emoji: '🀁', name: 'South Wind', color: '#FFA94D' },
        bamboo: { emoji: '🎋', name: 'Bamboo', color: '#82C91E' },
        character: { emoji: '㊥', name: 'Character', color: '#FF6B9D' },
        dot: { emoji: '⚫', name: 'Dot', color: '#868E96' }
    },

    // Background colors for reels
    reelColor: '#FFFFFF',
    reelBorderColor: '#2C3E50',
    highlightColor: '#FFD700',
    goldenColor: '#FFD700',

    // You can replace these paths with actual image files
    imagePaths: {
        // wild: 'assets/wild.png',
        // scatter: 'assets/scatter.png',
        // etc...
    }
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

    // Paytable configuration
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

    // Multipliers for consecutive wins
    multipliers: [1, 2, 3, 5, 5, 5], // [1st win, 2nd, 3rd, 4th+]

    // Free spins multipliers
    freeSpinMultipliers: [2, 4, 6, 10, 10, 10],

    // Animation settings
    animation: {
        spinDuration: 2000,
        cascadeDuration: 500,
        symbolFallSpeed: 10
    },

    // Game settings
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

        // Grid holds the current symbols on screen
        this.grid = this.createEmptyGrid();

        // Track golden symbols positions
        this.goldenSymbols = new Set();

        // Animation state
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
        // Remove scatter and wild from regular symbols (lower probability)
        const regularSymbols = symbols.filter(s => s !== 'scatter' && s !== 'wild');

        const rand = Math.random();

        // 5% chance for wild
        if (rand < 0.05) return 'wild';

        // 5% chance for scatter
        if (rand < 0.10) return 'scatter';

        // Regular symbols
        return regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
    }

    getCurrentMultiplier() {
        const multipliers = this.inFreeSpinMode ?
            CONFIG.freeSpinMultipliers :
            CONFIG.multipliers;

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

        this.setupCanvas();
        this.initializeUI();
        this.render();

        // Handle window resize for responsive canvas
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    }

    setupCanvas() {
        // Calculate responsive canvas size
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const maxWidth = Math.min(containerWidth - 40, CONFIG.canvas.baseWidth);

        // Maintain aspect ratio
        const aspectRatio = CONFIG.canvas.baseHeight / CONFIG.canvas.baseWidth;
        const width = maxWidth;
        const height = width * aspectRatio;

        // Set canvas size
        this.canvas.width = width;
        this.canvas.height = height;

        // Update config for rendering calculations
        CONFIG.canvas.width = width;
        CONFIG.canvas.height = height;

        // Scale symbol sizes proportionally
        const scale = width / CONFIG.canvas.baseWidth;
        CONFIG.reels.symbolSize = Math.floor(80 * scale);
        CONFIG.reels.spacing = Math.floor(10 * scale);
        CONFIG.reels.offsetX = Math.floor(60 * scale);
        CONFIG.reels.offsetY = Math.floor(50 * scale);
    }

    initializeUI() {
        // Update UI elements
        this.updateUI();

        // Spin button - support both click and touch
        const spinBtn = document.getElementById('spinBtn');
        this.addTouchSupport(spinBtn, () => this.spin());

        // Bet controls
        this.addTouchSupport(document.getElementById('increaseBet'), () => {
            if (this.state.bet < CONFIG.game.maxBet) {
                this.state.bet += CONFIG.game.betStep;
                this.updateUI();
            }
        });

        this.addTouchSupport(document.getElementById('decreaseBet'), () => {
            if (this.state.bet > CONFIG.game.minBet) {
                this.state.bet -= CONFIG.game.betStep;
                this.updateUI();
            }
        });

        // Add keyboard support for desktop
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.spin();
            }
        });
    }

    addTouchSupport(element, callback) {
        let touchHandled = false;

        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchHandled = true;
            element.classList.add('active');
        });

        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            element.classList.remove('active');
            if (touchHandled && !element.disabled) {
                callback();
            }
            touchHandled = false;
        });

        element.addEventListener('touchcancel', () => {
            element.classList.remove('active');
            touchHandled = false;
        });

        // Also support mouse events for desktop
        element.addEventListener('click', (e) => {
            if (!touchHandled && !element.disabled) {
                callback();
            }
        });
    }

    updateUI() {
        document.getElementById('credits').textContent = this.state.credits;
        document.getElementById('bet').textContent = this.state.bet;
        document.getElementById('win').textContent = this.state.currentWin;

        const spinBtn = document.getElementById('spinBtn');
        const canSpin = !this.state.isSpinning &&
                       (this.state.credits >= this.state.bet || this.state.freeSpins > 0);

        spinBtn.disabled = !canSpin;

        // Update message
        const message = document.getElementById('message');
        if (this.state.freeSpins > 0) {
            message.textContent = `Free Spins: ${this.state.freeSpins} | Multiplier: x${this.state.getCurrentMultiplier()}`;
            message.style.color = '#FFD700';
        } else if (this.state.currentWin > 0) {
            message.textContent = `You won ${this.state.currentWin} credits!`;
            message.style.color = '#51CF66';
        } else if (this.state.consecutiveWins > 0) {
            message.textContent = `Multiplier: x${this.state.getCurrentMultiplier()}`;
            message.style.color = '#FFD700';
        } else {
            message.textContent = '';
        }
    }

    async spin() {
        // Check if we can spin
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

        // Animate spin
        await this.animateSpin();

        // Check for wins and cascades
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
                    // Randomize symbols during spin
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
                    // Final symbols
                    for (let col = 0; col < CONFIG.reels.count; col++) {
                        for (let row = 0; row < CONFIG.reels.rows; row++) {
                            this.state.grid[col][row] = this.state.getRandomSymbol();
                        }
                    }

                    // Mark some symbols as golden (only on reels 2, 3, 4)
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
            // Check for winning combinations
            const wins = this.findWinningCombinations();

            if (wins.length === 0) {
                hasWins = false;
                break;
            }

            // Calculate win amount
            const winAmount = this.calculateWinAmount(wins);
            const multiplier = this.state.getCurrentMultiplier();
            const multipliedWin = winAmount * multiplier * this.state.bet;

            totalWin += multipliedWin;
            this.state.consecutiveWins++;

            // Highlight winning symbols
            await this.highlightWins(wins);

            // Convert golden symbols to wilds
            this.convertGoldenToWilds(wins);

            // Check for scatter bonus
            const scatterCount = this.countScatters();
            if (scatterCount >= 3) {
                this.state.freeSpins += CONFIG.game.freeSpinsPerScatter +
                                        (scatterCount - 3) * CONFIG.game.bonusScattersPerSpin;
                this.state.inFreeSpinMode = true;
            }

            // Remove winning symbols and cascade
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

        // Check each row for left-to-right combinations
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
                if (this.state.grid[col][row] === 'scatter') {
                    count++;
                }
            }
        }
        return count;
    }

    calculateWinAmount(wins) {
        let total = 0;

        for (const win of wins) {
            const paytable = CONFIG.paytable[win.symbol];
            if (paytable && paytable[win.count]) {
                total += paytable[win.count];
            }
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
        // Convert golden symbols that were part of a win to wilds
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
        // Collect positions to remove
        const toRemove = new Set();
        wins.forEach(win => {
            win.positions.forEach(([col, row]) => {
                toRemove.add(`${col},${row}`);
            });
        });

        // Remove symbols and drop new ones
        for (let col = 0; col < CONFIG.reels.count; col++) {
            const removed = [];

            for (let row = CONFIG.reels.rows - 1; row >= 0; row--) {
                if (toRemove.has(`${col},${row}`)) {
                    removed.push(row);
                }
            }

            // Shift symbols down
            for (let i = removed.length - 1; i >= 0; i--) {
                const rowToRemove = removed[i];

                // Shift all symbols above down
                for (let row = rowToRemove; row > 0; row--) {
                    this.state.grid[col][row] = this.state.grid[col][row - 1];
                }

                // Add new symbol at top
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
    // RENDERING
    // ==========================================

    render(highlightWins = null) {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw reels
        this.drawReels(highlightWins);

        // Draw multiplier indicator
        this.drawMultiplier();
    }

    drawReels(highlightWins) {
        const ctx = this.ctx;
        const { symbolSize, spacing, offsetX, offsetY } = CONFIG.reels;

        // Create highlight set for faster lookup
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

                // Draw symbol background
                ctx.fillStyle = isHighlighted ? ASSETS.highlightColor : ASSETS.reelColor;
                ctx.strokeStyle = isGolden ? ASSETS.goldenColor : ASSETS.reelBorderColor;
                ctx.lineWidth = isGolden ? 4 : 2;

                ctx.fillRect(x, y, symbolSize, symbolSize);
                ctx.strokeRect(x, y, symbolSize, symbolSize);

                // Draw symbol
                const symbol = this.state.grid[col][row];
                this.drawSymbol(ctx, symbol, x, y, symbolSize, isGolden);
            }
        }
    }

    drawSymbol(ctx, symbolKey, x, y, size, isGolden) {
        const symbol = ASSETS.symbols[symbolKey];
        if (!symbol) return;

        // Draw emoji
        ctx.font = `${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isGolden) {
            // Add golden glow effect
            ctx.shadowColor = ASSETS.goldenColor;
            ctx.shadowBlur = 10;
        }

        ctx.fillStyle = symbol.color;
        ctx.fillText(symbol.emoji, x + size / 2, y + size / 2);

        ctx.shadowBlur = 0;

        // Draw symbol name (smaller)
        ctx.font = `${size * 0.12}px Arial`;
        ctx.fillStyle = '#333';
        ctx.fillText(symbol.name.substring(0, 4), x + size / 2, y + size - 8);
    }

    drawMultiplier() {
        const ctx = this.ctx;
        const multiplier = this.state.getCurrentMultiplier();

        if (multiplier > 1 || this.state.consecutiveWins > 0) {
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;

            const text = `x${multiplier}`;
            const x = this.canvas.width / 2;
            const y = 25;

            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        }
    }
}

// ==========================================
// INITIALIZE GAME
// ==========================================

window.addEventListener('load', () => {
    const game = new SlotMachine('slotCanvas');
});
