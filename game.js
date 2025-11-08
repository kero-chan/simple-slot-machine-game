class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.progressBar = document.getElementById('loadingProgress');
        this.loadingText = document.getElementById('loadingText');
        this.currentProgress = 0;
    }

    updateProgress(progress, message = '') {
        this.currentProgress = Math.min(progress, 100);
        this.progressBar.style.width = `${this.currentProgress}%`;

        const displayMessage = message || `Loading... ${Math.round(this.currentProgress)}%`;
        this.loadingText.textContent = displayMessage;
    }

    async simulateLoading() {
        const steps = [
            { progress: 20, message: 'Loading assets...', delay: 200 },
            { progress: 40, message: 'Initializing game...', delay: 300 },
            { progress: 60, message: 'Setting up canvas...', delay: 200 },
            { progress: 80, message: 'Preparing symbols...', delay: 300 },
            { progress: 100, message: 'Ready!', delay: 200 }
        ];

        for (const step of steps) {
            await this.delay(step.delay);
            this.updateProgress(step.progress, step.message);
        }

        await this.delay(500);
        this.hide();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    hide() {
        this.loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 500);
    }
}
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
        this.canSpin = true;
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

        // In-canvas UI metrics
        this.uiMetrics = {
            topHeaderHeight: 28,
            multiplierBarHeight: 42,
            bottomHudHeight: 48,
            spinRadius: 36,
            spinCenter: { x: 0, y: 0 }
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
        this.uiMetrics.topHeaderHeight = Math.floor(28 * scale);
        this.uiMetrics.multiplierBarHeight = Math.floor(42 * scale);
        this.uiMetrics.bottomHudHeight = Math.floor(54 * scale);
        this.uiMetrics.spinRadius = Math.floor(36 * scale);

        // Reserve space for header+bar at top and HUD at bottom
        const reservedTop = this.uiMetrics.topHeaderHeight + this.uiMetrics.multiplierBarHeight + Math.floor(6 * scale);
        const reservedBottom = this.uiMetrics.bottomHudHeight + Math.floor(10 * scale);

        CONFIG.reels.symbolSize = Math.floor(80 * scale);
        CONFIG.reels.spacing = Math.floor(10 * scale);
        CONFIG.reels.offsetX = Math.floor(60 * scale);
        CONFIG.reels.offsetY = reservedTop;

        // Spin button position (bottom center)
        this.uiMetrics.spinCenter = { x: width / 2, y: height - reservedBottom + this.uiMetrics.bottomHudHeight / 2 };
    }

    initializeUI() {
        // Keyboard spin
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.spin();
            }
        });

        // Canvas click/touch hit-detection
        const handlePoint = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            this.handleCanvasClick(x, y);
        };

        this.canvas.addEventListener('click', (e) => handlePoint(e.clientX, e.clientY));
        this.canvas.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            if (touch) handlePoint(touch.clientX, touch.clientY);
            e.preventDefault();
        });

        this.updateUI();
    }

    updateUI() {
        // Compute spin availability for in-canvas button
        this.state.canSpin = !this.state.isSpinning &&
            (this.state.credits >= this.state.bet || this.state.freeSpins > 0);
    }

    handleCanvasClick(x, y) {
        const { x: cx, y: cy } = this.uiMetrics.spinCenter;
        const r = this.uiMetrics.spinRadius;
        const dx = x - cx;
        const dy = y - cy;
        const inside = dx * dx + dy * dy <= r * r;
        if (inside) {
            this.spin();
        }
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
    // RENDERING
    // ==========================================
    render(highlightWins = null) {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Top header and multiplier bar
        this.drawTopHeader();
        this.drawMultiplierBar();

        // Reels area
        this.drawReels(highlightWins);

        // Win banner and free-spins info
        this.drawWinBanner();
        this.drawFreeSpinsInfo();

        // Bottom HUD and Spin button
        this.drawBottomHUD();
        this.drawSpinButton();
    }

    drawTopHeader() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.uiMetrics.topHeaderHeight;

        // Wooden header bar
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#8b4a1a');
        grad.addColorStop(1, '#5e2e10');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#f7e3b5';
        ctx.font = `${Math.floor(h * 0.55)}px Georgia`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1024 路中奖组合', w / 2, h / 2);
    }

    drawMultiplierBar() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const y = this.uiMetrics.topHeaderHeight + Math.floor(this.uiMetrics.multiplierBarHeight * 0.05);
        const h = this.uiMetrics.multiplierBarHeight;

        // Red bar
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, '#c93b1f');
        grad.addColorStop(1, '#8d2413');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, w, h);

        const multipliers = this.state.inFreeSpinMode
            ? [2, 4, 6, 10]
            : [1, 2, 3, 5];

        const idx = Math.min(this.state.consecutiveWins, multipliers.length - 1);
        const segmentW = w / multipliers.length;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < multipliers.length; i++) {
            const cx = segmentW * i + segmentW / 2;
            // Highlight current
            if (i === idx) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
                ctx.fillRect(segmentW * i, y, segmentW, h);
            }
            ctx.fillStyle = '#f9d9a8';
            ctx.font = `${Math.floor(h * 0.55)}px Georgia`;
            const label = `x${multipliers[i]}`;
            ctx.fillText(label, cx, y + h / 2);
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
        if (this.state.freeSpins <= 0) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const areaH = Math.floor(this.uiMetrics.bottomHudHeight * 1.4);
        const y = h - areaH - this.uiMetrics.bottomHudHeight - Math.floor(8 * (w / CONFIG.canvas.baseWidth));
        ctx.fillStyle = 'rgba(91, 30, 18, 0.65)';
        ctx.fillRect(0, y, w, areaH);

        ctx.fillStyle = '#ffd04d';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.floor(areaH * 0.5)}px Georgia`;
        ctx.fillText('剩余免费旋转次数：', Math.floor(w * 0.05), y + areaH / 2);

        ctx.textAlign = 'right';
        ctx.font = `${Math.floor(areaH * 0.9)}px Georgia`;
        ctx.fillStyle = '#ffb300';
        ctx.fillText(`${this.state.freeSpins}`, Math.floor(w * 0.95), y + areaH / 2);
    }

    drawBottomHUD() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const hudH = this.uiMetrics.bottomHudHeight;
        const y = h - hudH;

        // HUD background
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, '#2b2f4b');
        grad.addColorStop(1, '#1c203a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, w, hudH);

        const segments = [
            { label: '余额', value: this.state.credits },
            { label: '下注', value: this.state.bet },
            { label: '赢取', value: this.state.currentWin }
        ];
        const segW = w / segments.length;

        for (let i = 0; i < segments.length; i++) {
            const x = segW * i;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#cfd8dc';
            ctx.font = `${Math.floor(hudH * 0.35)}px Arial`;
            ctx.fillText(segments[i].label, x + segW / 2, y + hudH * 0.35);

            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.floor(hudH * 0.42)}px Arial`;
            const v = typeof segments[i].value === 'number'
                ? segments[i].value.toFixed(2)
                : String(segments[i].value);
            ctx.fillText(v, x + segW / 2, y + hudH * 0.75);
        }
    }

    drawSpinButton() {
        const ctx = this.ctx;
        const { x, y } = this.uiMetrics.spinCenter;
        const r = this.uiMetrics.spinRadius;

        // Outer glow to suggest clickability
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 127, 23, 0.25)';
        ctx.fill();

        // Button fill
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.3, x, y, r);
        grad.addColorStop(0, '#ffd54f');
        grad.addColorStop(0.6, '#ffb300');
        grad.addColorStop(1, '#f57f17');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Label
        ctx.fillStyle = '#3b2f0b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.floor(r * 0.9)}px 700 Arial`;
        ctx.fillText('▶', x, y + 1);

        // Disabled overlay
        if (!this.state.canSpin) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Utility: rounded rect path
    drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
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
