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
    loadedImages: {},
    backgroundImage: null
};

// ==========================================
// GAME CONFIGURATION
// ==========================================
const CONFIG = {
    canvas: {
        baseWidth: 600,
        baseHeight: 800,
        width: 600,
        height: 800
    },
    reels: {
        count: 5,
        rows: 3,
        symbolSize: 70,
        spacing: 8,
        offsetX: 0,
        offsetY: 0
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

        // UI button hit areas
        this.buttons = {
            spin: { x: 0, y: 0, width: 0, height: 0, radius: 50 },
            betPlus: { x: 0, y: 0, width: 60, height: 50 },
            betMinus: { x: 0, y: 0, width: 60, height: 50 }
        };

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
        const containerHeight = window.innerHeight;

        // Use full available space
        const maxWidth = Math.min(containerWidth, 600);
        const aspectRatio = CONFIG.canvas.baseHeight / CONFIG.canvas.baseWidth;
        const width = maxWidth;
        const height = Math.min(width * aspectRatio, containerHeight - 20);

        this.canvas.width = width;
        this.canvas.height = height;

        CONFIG.canvas.width = width;
        CONFIG.canvas.height = height;

        const scale = width / CONFIG.canvas.baseWidth;

        // Position reels in center
        const reelAreaWidth = CONFIG.reels.count * 70 + (CONFIG.reels.count - 1) * 8;
        const reelAreaHeight = CONFIG.reels.rows * 70 + (CONFIG.reels.rows - 1) * 8;

        CONFIG.reels.symbolSize = Math.floor(70 * scale);
        CONFIG.reels.spacing = Math.floor(8 * scale);
        CONFIG.reels.offsetX = (width - (CONFIG.reels.symbolSize * CONFIG.reels.count + CONFIG.reels.spacing * (CONFIG.reels.count - 1))) / 2;
        CONFIG.reels.offsetY = height * 0.25;

        // Button positions
        this.buttons.spin.x = width / 2;
        this.buttons.spin.y = height - 100 * scale;
        this.buttons.spin.radius = 50 * scale;

        this.buttons.betMinus.x = width / 2 - 100 * scale;
        this.buttons.betMinus.y = height - 200 * scale;
        this.buttons.betMinus.width = 60 * scale;
        this.buttons.betMinus.height = 50 * scale;

        this.buttons.betPlus.x = width / 2 + 40 * scale;
        this.buttons.betPlus.y = height - 200 * scale;
        this.buttons.betPlus.width = 60 * scale;
        this.buttons.betPlus.height = 50 * scale;
    }

    initializeUI() {
        // Canvas click/touch handler
        const handleClick = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            this.handleCanvasClick(x, y);
        };

        this.canvas.addEventListener('click', (e) => handleClick(e.clientX, e.clientY));
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            if (touch) handleClick(touch.clientX, touch.clientY);
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.spin();
            }
        });
    }

    handleCanvasClick(x, y) {
        // Check spin button (circle)
        const spinBtn = this.buttons.spin;
        const dx = x - spinBtn.x;
        const dy = y - spinBtn.y;
        if (dx * dx + dy * dy <= spinBtn.radius * spinBtn.radius) {
            this.spin();
            return;
        }

        // Check bet minus button
        const minusBtn = this.buttons.betMinus;
        if (x >= minusBtn.x && x <= minusBtn.x + minusBtn.width &&
            y >= minusBtn.y && y <= minusBtn.y + minusBtn.height) {
            this.decreaseBet();
            return;
        }

        // Check bet plus button
        const plusBtn = this.buttons.betPlus;
        if (x >= plusBtn.x && x <= plusBtn.x + plusBtn.width &&
            y >= plusBtn.y && y <= plusBtn.y + plusBtn.height) {
            this.increaseBet();
            return;
        }
    }

    increaseBet() {
        if (!this.state.isSpinning && this.state.bet < CONFIG.game.maxBet) {
            this.state.bet += CONFIG.game.betStep;
            this.render();
        }
    }

    decreaseBet() {
        if (!this.state.isSpinning && this.state.bet > CONFIG.game.minBet) {
            this.state.bet -= CONFIG.game.betStep;
            this.render();
        }
    }

    async spin() {
        if (this.state.isSpinning) return;

        if (this.state.freeSpins > 0) {
            this.state.freeSpins--;
        } else {
            if (this.state.credits < this.state.bet) {
                return;
            }
            this.state.credits -= this.state.bet;
            this.state.consecutiveWins = 0;
            this.state.inFreeSpinMode = false;
        }

        this.state.isSpinning = true;
        this.state.currentWin = 0;

        await this.animateSpin();
        await this.checkWinsAndCascade();

        this.state.isSpinning = false;
        this.render();
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
                    for (let col = 0; col < CONFIG.reels.count; col++) {
                        for (let row = 0; row < CONFIG.reels.rows; row++) {
                            this.state.grid[col][row] = this.state.getRandomSymbol();
                        }
                    }

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
    // RENDERING - EVERYTHING IN CANVAS
    // ==========================================
    render(highlightWins = null) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Draw background image (splash.jpg)
        if (ASSETS.backgroundImage) {
            ctx.drawImage(ASSETS.backgroundImage, 0, 0, w, h);
        } else {
            // Fallback gradient
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#ff6b35');
            grad.addColorStop(1, '#f7931e');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        // Semi-transparent overlay for readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, w, h);

        // Draw game title
        this.drawTitle();

        // Draw reels
        this.drawReels(highlightWins);

        // Draw info displays (credits, bet, win)
        this.drawInfoDisplays();

        // Draw bet controls
        this.drawBetControls();

        // Draw spin button
        this.drawSpinButton();

        // Draw free spins info if active
        if (this.state.freeSpins > 0) {
            this.drawFreeSpinsInfo();
        }
    }

    drawTitle() {
        const ctx = this.ctx;
        const w = this.canvas.width;

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('麻将胡了', w / 2, 20);
        ctx.shadowBlur = 0;
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

                // Reel background
                ctx.fillStyle = isHighlighted ? '#FFD700' : '#FFFFFF';
                ctx.strokeStyle = isGolden ? '#FFD700' : '#2C3E50';
                ctx.lineWidth = isGolden ? 4 : 2;

                ctx.fillRect(x, y, symbolSize, symbolSize);
                ctx.strokeRect(x, y, symbolSize, symbolSize);

                const symbol = this.state.grid[col][row];
                this.drawSymbol(ctx, symbol, x, y, symbolSize);
            }
        }
    }

    drawSymbol(ctx, symbolKey, x, y, size) {
        const symbol = ASSETS.symbols[symbolKey];
        if (!symbol) return;

        const img = ASSETS.loadedImages && ASSETS.loadedImages[symbolKey];
        if (img && img.complete && img.naturalHeight !== 0) {
            const padding = Math.floor(size * 0.15);
            const w = size - padding * 2;
            const h = size - padding * 2;
            ctx.drawImage(img, x + padding, y + padding, w, h);
        } else {
            ctx.fillStyle = '#CCCCCC';
            ctx.font = `${Math.floor(size * 0.3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('...', x + size / 2, y + size / 2);
        }
    }

    drawInfoDisplays() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const y = h - 280;

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, y, w, 80);

        const labels = ['CREDITS', 'BET', 'WIN'];
        const values = [this.state.credits, this.state.bet, this.state.currentWin];
        const segmentWidth = w / 3;

        ctx.textBaseline = 'middle';
        for (let i = 0; i < 3; i++) {
            const x = segmentWidth * i + segmentWidth / 2;

            // Label
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x, y + 25);

            // Value
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(values[i], x, y + 55);
        }
    }

    drawBetControls() {
        const ctx = this.ctx;
        const minusBtn = this.buttons.betMinus;
        const plusBtn = this.buttons.betPlus;

        // Bet Minus Button
        ctx.fillStyle = this.state.isSpinning ? '#666' : '#4CAF50';
        ctx.fillRect(minusBtn.x, minusBtn.y, minusBtn.width, minusBtn.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(minusBtn.x, minusBtn.y, minusBtn.width, minusBtn.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('-', minusBtn.x + minusBtn.width / 2, minusBtn.y + minusBtn.height / 2);

        // Bet Plus Button
        ctx.fillStyle = this.state.isSpinning ? '#666' : '#4CAF50';
        ctx.fillRect(plusBtn.x, plusBtn.y, plusBtn.width, plusBtn.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(plusBtn.x, plusBtn.y, plusBtn.width, plusBtn.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', plusBtn.x + plusBtn.width / 2, plusBtn.y + plusBtn.height / 2);
    }

    drawSpinButton() {
        const ctx = this.ctx;
        const btn = this.buttons.spin;

        const canSpin = !this.state.isSpinning &&
            (this.state.credits >= this.state.bet || this.state.freeSpins > 0);

        // Outer glow
        ctx.beginPath();
        ctx.arc(btn.x, btn.y, btn.radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = canSpin ? 'rgba(255, 215, 0, 0.5)' : 'rgba(100, 100, 100, 0.5)';
        ctx.fill();

        // Button circle
        const grad = ctx.createRadialGradient(btn.x, btn.y, 0, btn.x, btn.y, btn.radius);
        if (canSpin) {
            grad.addColorStop(0, '#FFD700');
            grad.addColorStop(1, '#FFA500');
        } else {
            grad.addColorStop(0, '#888');
            grad.addColorStop(1, '#555');
        }

        ctx.beginPath();
        ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPIN', btn.x, btn.y);
    }

    drawFreeSpinsInfo() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const boxWidth = 250;
        const boxHeight = 60;
        const x = (w - boxWidth) / 2;
        const y = h * 0.15;

        ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`FREE SPINS: ${this.state.freeSpins}`, w / 2, y + boxHeight / 2);
    }
}

// ==========================================
// BOOTSTRAP
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

        // Preload all images including background
        await loadAllAssets();

        // Start the game
        new SlotMachine('slotCanvas');
    });
});

// ==========================================
// ASSET LOADING
// ==========================================
async function loadAllAssets() {
    // Load background image
    ASSETS.backgroundImage = await loadImage('assets/splash.jpg');

    // Load symbol images
    const paths = ASSETS.imagePaths || {};
    ASSETS.loadedImages = {};
    const entries = Object.entries(paths);

    await Promise.all(entries.map(([key, src]) =>
        loadImage(src).then(img => {
            ASSETS.loadedImages[key] = img;
        })
    ));
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            resolve(null);
        };
        img.src = src;
    });
}
