const { createApp, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;

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
        baseHeight: 800
    },
    reels: {
        count: 5,
        rows: 3,
        symbolSize: 70,
        spacing: 8
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
        cascadeDuration: 500
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
// UTILITY FUNCTIONS
// ==========================================
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

async function loadAllAssets() {
    const paths = ASSETS.imagePaths;
    ASSETS.loadedImages = {};
    const entries = Object.entries(paths);

    await Promise.all(entries.map(([key, src]) =>
        loadImage(src).then(img => {
            ASSETS.loadedImages[key] = img;
        })
    ));
}

function getRandomSymbol() {
    const symbols = Object.keys(ASSETS.symbols);
    const regularSymbols = symbols.filter(s => s !== 'scatter' && s !== 'wild');
    const rand = Math.random();
    if (rand < 0.05) return 'wild';
    if (rand < 0.10) return 'scatter';
    return regularSymbols[Math.floor(Math.random() * regularSymbols.length)];
}

function createEmptyGrid() {
    const grid = [];
    for (let col = 0; col < CONFIG.reels.count; col++) {
        grid[col] = [];
        for (let row = 0; row < CONFIG.reels.rows; row++) {
            grid[col][row] = getRandomSymbol();
        }
    }
    return grid;
}

// ==========================================
// COMPOSABLES
// ==========================================

// Game State Composable
function useGameState() {
    const credits = ref(CONFIG.game.initialCredits);
    const bet = ref(CONFIG.game.minBet);
    const currentWin = ref(0);
    const isSpinning = ref(false);
    const consecutiveWins = ref(0);
    const freeSpins = ref(0);
    const inFreeSpinMode = ref(false);

    const currentMultiplier = computed(() => {
        const multipliers = inFreeSpinMode.value
            ? CONFIG.freeSpinMultipliers
            : CONFIG.multipliers;
        const index = Math.min(consecutiveWins.value, multipliers.length - 1);
        return multipliers[index];
    });

    const canSpin = computed(() => {
        return !isSpinning.value &&
               (credits.value >= bet.value || freeSpins.value > 0);
    });

    return {
        credits,
        bet,
        currentWin,
        isSpinning,
        consecutiveWins,
        freeSpins,
        inFreeSpinMode,
        currentMultiplier,
        canSpin
    };
}

// Grid State Composable
function useGridState() {
    const grid = ref(createEmptyGrid());
    const goldenSymbols = ref(new Set());
    const highlightWins = ref(null);

    return {
        grid,
        goldenSymbols,
        highlightWins
    };
}

// Canvas Composable
function useCanvas(canvasRef) {
    const canvas = ref(null);
    const ctx = ref(null);
    const canvasWidth = ref(0);
    const canvasHeight = ref(0);
    const scale = ref(1);
    const reelOffset = ref({ x: 0, y: 0 });

    const buttons = ref({
        spin: { x: 0, y: 0, radius: 50 },
        betPlus: { x: 0, y: 0, width: 60, height: 50 },
        betMinus: { x: 0, y: 0, width: 60, height: 50 }
    });

    const setupCanvas = () => {
        if (!canvasRef.value) return;

        canvas.value = canvasRef.value;
        ctx.value = canvas.value.getContext('2d');

        const container = canvas.value.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = window.innerHeight;

        const maxWidth = Math.min(containerWidth, 600);
        const aspectRatio = CONFIG.canvas.baseHeight / CONFIG.canvas.baseWidth;
        const width = maxWidth;
        const height = Math.min(width * aspectRatio, containerHeight - 20);

        canvas.value.width = width;
        canvas.value.height = height;
        canvasWidth.value = width;
        canvasHeight.value = height;

        scale.value = width / CONFIG.canvas.baseWidth;

        // Calculate reel positioning
        const symbolSize = Math.floor(CONFIG.reels.symbolSize * scale.value);
        const spacing = Math.floor(CONFIG.reels.spacing * scale.value);
        const reelAreaWidth = symbolSize * CONFIG.reels.count + spacing * (CONFIG.reels.count - 1);

        reelOffset.value.x = (width - reelAreaWidth) / 2;
        reelOffset.value.y = height * 0.25;

        // Button positions
        buttons.value.spin.x = width / 2;
        buttons.value.spin.y = height - 100 * scale.value;
        buttons.value.spin.radius = 50 * scale.value;

        buttons.value.betMinus.x = width / 2 - 100 * scale.value;
        buttons.value.betMinus.y = height - 200 * scale.value;
        buttons.value.betMinus.width = 60 * scale.value;
        buttons.value.betMinus.height = 50 * scale.value;

        buttons.value.betPlus.x = width / 2 + 40 * scale.value;
        buttons.value.betPlus.y = height - 200 * scale.value;
        buttons.value.betPlus.width = 60 * scale.value;
        buttons.value.betPlus.height = 50 * scale.value;
    };

    return {
        canvas,
        ctx,
        canvasWidth,
        canvasHeight,
        scale,
        reelOffset,
        buttons,
        setupCanvas
    };
}

// Rendering Composable
function useRenderer(canvasState, gameState, gridState) {
    const render = () => {
        if (!canvasState.ctx.value) return;

        const ctx = canvasState.ctx.value;
        const w = canvasState.canvasWidth.value;
        const h = canvasState.canvasHeight.value;

        // Canvas background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(0.5, '#16213e');
        grad.addColorStop(1, '#0f3460');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw components
        drawTitle(ctx, w, canvasState.scale.value);
        drawReels(ctx, canvasState, gridState);
        drawInfoDisplays(ctx, canvasState, gameState);
        drawBetControls(ctx, canvasState, gameState);
        drawSpinButton(ctx, canvasState, gameState);

        if (gameState.freeSpins.value > 0) {
            drawFreeSpinsInfo(ctx, canvasState, gameState);
        }
    };

    const drawTitle = (ctx, w, scale) => {
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${Math.floor(32 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('麻将胡了', w / 2, 20 * scale);
        ctx.shadowBlur = 0;
    };

    const drawReels = (ctx, canvasState, gridState) => {
        const symbolSize = Math.floor(CONFIG.reels.symbolSize * canvasState.scale.value);
        const spacing = Math.floor(CONFIG.reels.spacing * canvasState.scale.value);

        const highlightSet = new Set();
        if (gridState.highlightWins.value) {
            gridState.highlightWins.value.forEach(win => {
                win.positions.forEach(([col, row]) => {
                    highlightSet.add(`${col},${row}`);
                });
            });
        }

        for (let col = 0; col < CONFIG.reels.count; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
                const x = canvasState.reelOffset.value.x + col * (symbolSize + spacing);
                const y = canvasState.reelOffset.value.y + row * (symbolSize + spacing);

                const isHighlighted = highlightSet.has(`${col},${row}`);
                const isGolden = gridState.goldenSymbols.value.has(`${col},${row}`);

                // Reel background
                ctx.fillStyle = isHighlighted ? '#FFD700' : '#FFFFFF';
                ctx.strokeStyle = isGolden ? '#FFD700' : '#2C3E50';
                ctx.lineWidth = isGolden ? 4 : 2;

                ctx.fillRect(x, y, symbolSize, symbolSize);
                ctx.strokeRect(x, y, symbolSize, symbolSize);

                const symbol = gridState.grid.value[col][row];
                drawSymbol(ctx, symbol, x, y, symbolSize);
            }
        }
    };

    const drawSymbol = (ctx, symbolKey, x, y, size) => {
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
    };

    const drawInfoDisplays = (ctx, canvasState, gameState) => {
        const w = canvasState.canvasWidth.value;
        const h = canvasState.canvasHeight.value;
        const y = h - 280 * canvasState.scale.value;

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, y, w, 80 * canvasState.scale.value);

        const labels = ['CREDITS', 'BET', 'WIN'];
        const values = [gameState.credits.value, gameState.bet.value, gameState.currentWin.value];
        const segmentWidth = w / 3;

        ctx.textBaseline = 'middle';
        for (let i = 0; i < 3; i++) {
            const x = segmentWidth * i + segmentWidth / 2;

            // Label
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${Math.floor(16 * canvasState.scale.value)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x, y + 25 * canvasState.scale.value);

            // Value
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.floor(24 * canvasState.scale.value)}px Arial`;
            ctx.fillText(values[i], x, y + 55 * canvasState.scale.value);
        }
    };

    const drawBetControls = (ctx, canvasState, gameState) => {
        const minusBtn = canvasState.buttons.value.betMinus;
        const plusBtn = canvasState.buttons.value.betPlus;

        // Bet Minus Button
        ctx.fillStyle = gameState.isSpinning.value ? '#666' : '#4CAF50';
        ctx.fillRect(minusBtn.x, minusBtn.y, minusBtn.width, minusBtn.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(minusBtn.x, minusBtn.y, minusBtn.width, minusBtn.height);

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(30 * canvasState.scale.value)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('-', minusBtn.x + minusBtn.width / 2, minusBtn.y + minusBtn.height / 2);

        // Bet Plus Button
        ctx.fillStyle = gameState.isSpinning.value ? '#666' : '#4CAF50';
        ctx.fillRect(plusBtn.x, plusBtn.y, plusBtn.width, plusBtn.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(plusBtn.x, plusBtn.y, plusBtn.width, plusBtn.height);

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(30 * canvasState.scale.value)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', plusBtn.x + plusBtn.width / 2, plusBtn.y + plusBtn.height / 2);
    };

    const drawSpinButton = (ctx, canvasState, gameState) => {
        const btn = canvasState.buttons.value.spin;

        // Outer glow
        ctx.beginPath();
        ctx.arc(btn.x, btn.y, btn.radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = gameState.canSpin.value ? 'rgba(255, 215, 0, 0.5)' : 'rgba(100, 100, 100, 0.5)';
        ctx.fill();

        // Button circle
        const grad = ctx.createRadialGradient(btn.x, btn.y, 0, btn.x, btn.y, btn.radius);
        if (gameState.canSpin.value) {
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
        ctx.font = `bold ${Math.floor(24 * canvasState.scale.value)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPIN', btn.x, btn.y);
    };

    const drawFreeSpinsInfo = (ctx, canvasState, gameState) => {
        const w = canvasState.canvasWidth.value;
        const h = canvasState.canvasHeight.value;

        const boxWidth = 250 * canvasState.scale.value;
        const boxHeight = 60 * canvasState.scale.value;
        const x = (w - boxWidth) / 2;
        const y = h * 0.15;

        ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.floor(20 * canvasState.scale.value)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`FREE SPINS: ${gameState.freeSpins.value}`, w / 2, y + boxHeight / 2);
    };

    return { render };
}

// Game Logic Composable
function useGameLogic(gameState, gridState, render) {
    const findWinningCombinations = () => {
        const wins = [];

        for (let row = 0; row < CONFIG.reels.rows; row++) {
            let currentSymbol = gridState.grid.value[0][row];
            let count = 1;
            let positions = [[0, row]];

            for (let col = 1; col < CONFIG.reels.count; col++) {
                const symbol = gridState.grid.value[col][row];

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
    };

    const countScatters = () => {
        let count = 0;
        for (let col = 0; col < CONFIG.reels.count; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
                if (gridState.grid.value[col][row] === 'scatter') count++;
            }
        }
        return count;
    };

    const calculateWinAmount = (wins) => {
        let total = 0;
        for (const win of wins) {
            const paytable = CONFIG.paytable[win.symbol];
            if (paytable && paytable[win.count]) {
                total += paytable[win.count];
            }
        }
        return total;
    };

    const animateSpin = () => {
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
                                gridState.grid.value[col][row] = getRandomSymbol();
                            }
                        }
                    }
                    gridState.grid.value = [...gridState.grid.value]; // Trigger reactivity
                    requestAnimationFrame(animate);
                } else {
                    // Final grid
                    for (let col = 0; col < CONFIG.reels.count; col++) {
                        for (let row = 0; row < CONFIG.reels.rows; row++) {
                            gridState.grid.value[col][row] = getRandomSymbol();
                        }
                    }

                    // Add golden symbols
                    gridState.goldenSymbols.value.clear();
                    for (let col = 1; col <= 3; col++) {
                        for (let row = 0; row < CONFIG.reels.rows; row++) {
                            if (Math.random() < 0.2 &&
                                gridState.grid.value[col][row] !== 'wild' &&
                                gridState.grid.value[col][row] !== 'scatter') {
                                gridState.goldenSymbols.value.add(`${col},${row}`);
                            }
                        }
                    }

                    gridState.grid.value = [...gridState.grid.value]; // Trigger reactivity
                    resolve();
                }
            };
            animate();
        });
    };

    const highlightWinsAnimation = (wins) => {
        const duration = 500;
        const startTime = Date.now();

        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    gridState.highlightWins.value = wins;
                    requestAnimationFrame(animate);
                } else {
                    gridState.highlightWins.value = null;
                    resolve();
                }
            };
            animate();
        });
    };

    const convertGoldenToWilds = (wins) => {
        const winPositions = new Set();
        wins.forEach(win => {
            win.positions.forEach(([col, row]) => {
                winPositions.add(`${col},${row}`);
            });
        });

        winPositions.forEach(pos => {
            if (gridState.goldenSymbols.value.has(pos)) {
                const [col, row] = pos.split(',').map(Number);
                gridState.grid.value[col][row] = 'wild';
                gridState.goldenSymbols.value.delete(pos);
            }
        });

        gridState.grid.value = [...gridState.grid.value]; // Trigger reactivity
    };

    const cascadeSymbols = async (wins) => {
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
                    gridState.grid.value[col][row] = gridState.grid.value[col][row - 1];
                }
                gridState.grid.value[col][0] = getRandomSymbol();
            }
        }

        gridState.grid.value = [...gridState.grid.value]; // Trigger reactivity
        await animateCascade();
    };

    const animateCascade = () => {
        const duration = CONFIG.animation.cascadeDuration;
        const startTime = Date.now();

        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    render();
                    requestAnimationFrame(animate);
                } else {
                    render();
                    resolve();
                }
            };
            animate();
        });
    };

    const checkWinsAndCascade = async () => {
        let totalWin = 0;
        let hasWins = true;

        while (hasWins) {
            const wins = findWinningCombinations();
            if (wins.length === 0) {
                hasWins = false;
                break;
            }

            const winAmount = calculateWinAmount(wins);
            const multipliedWin = winAmount * gameState.currentMultiplier.value * gameState.bet.value;

            totalWin += multipliedWin;
            gameState.consecutiveWins.value++;

            await highlightWinsAnimation(wins);
            convertGoldenToWilds(wins);

            const scatterCount = countScatters();
            if (scatterCount >= 3) {
                gameState.freeSpins.value += CONFIG.game.freeSpinsPerScatter +
                                 (scatterCount - 3) * CONFIG.game.bonusScattersPerSpin;
                gameState.inFreeSpinMode.value = true;
            }

            await cascadeSymbols(wins);
        }

        if (totalWin > 0) {
            gameState.currentWin.value = totalWin;
            gameState.credits.value += totalWin;
        } else {
            gameState.consecutiveWins.value = 0;
        }
    };

    const spin = async () => {
        if (gameState.isSpinning.value) return;

        if (gameState.freeSpins.value > 0) {
            gameState.freeSpins.value--;
        } else {
            if (gameState.credits.value < gameState.bet.value) {
                return;
            }
            gameState.credits.value -= gameState.bet.value;
            gameState.consecutiveWins.value = 0;
            gameState.inFreeSpinMode.value = false;
        }

        gameState.isSpinning.value = true;
        gameState.currentWin.value = 0;

        await animateSpin();
        await checkWinsAndCascade();

        gameState.isSpinning.value = false;
    };

    const increaseBet = () => {
        if (!gameState.isSpinning.value && gameState.bet.value < CONFIG.game.maxBet) {
            gameState.bet.value += CONFIG.game.betStep;
        }
    };

    const decreaseBet = () => {
        if (!gameState.isSpinning.value && gameState.bet.value > CONFIG.game.minBet) {
            gameState.bet.value -= CONFIG.game.betStep;
        }
    };

    return {
        spin,
        increaseBet,
        decreaseBet
    };
}

// ==========================================
// VUE APP
// ==========================================
createApp({
    setup() {
        // Refs
        const showSplash = ref(true);
        const canvasRef = ref(null);

        // Composables
        const gameState = useGameState();
        const gridState = useGridState();
        const canvasState = useCanvas(canvasRef);

        // Renderer (needs to be created after canvas state)
        const { render } = useRenderer(canvasState, gameState, gridState);

        // Game Logic
        const gameLogic = useGameLogic(gameState, gridState, render);

        // Initialization
        const startGame = async () => {
            showSplash.value = false;

            await nextTick();

            // Load assets
            await loadAllAssets();

            // Setup canvas
            canvasState.setupCanvas();
            render();
        };

        const handleResize = () => {
            canvasState.setupCanvas();
            render();
        };

        // Input handlers
        const processClick = (x, y) => {
            // Check spin button (circle)
            const spinBtn = canvasState.buttons.value.spin;
            const dx = x - spinBtn.x;
            const dy = y - spinBtn.y;
            if (dx * dx + dy * dy <= spinBtn.radius * spinBtn.radius) {
                gameLogic.spin();
                return;
            }

            // Check bet minus button
            const minusBtn = canvasState.buttons.value.betMinus;
            if (x >= minusBtn.x && x <= minusBtn.x + minusBtn.width &&
                y >= minusBtn.y && y <= minusBtn.y + minusBtn.height) {
                gameLogic.decreaseBet();
                return;
            }

            // Check bet plus button
            const plusBtn = canvasState.buttons.value.betPlus;
            if (x >= plusBtn.x && x <= plusBtn.x + plusBtn.width &&
                y >= plusBtn.y && y <= plusBtn.y + plusBtn.height) {
                gameLogic.increaseBet();
                return;
            }
        };

        const handleCanvasClick = (e) => {
            const rect = canvasState.canvas.value.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            processClick(x, y);
        };

        const handleCanvasTouch = (e) => {
            const touch = e.changedTouches[0];
            if (touch) {
                const rect = canvasState.canvas.value.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                processClick(x, y);
            }
        };

        // Watchers - trigger re-render when state changes
        watch(() => gridState.grid.value, render, { deep: true });
        watch(() => gameState.credits.value, render);
        watch(() => gameState.bet.value, render);
        watch(() => gameState.currentWin.value, render);
        watch(() => gameState.freeSpins.value, render);
        watch(() => gridState.highlightWins.value, render);

        // Lifecycle
        onMounted(() => {
            window.addEventListener('resize', handleResize);

            document.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    gameLogic.spin();
                }
            });
        });

        onBeforeUnmount(() => {
            window.removeEventListener('resize', handleResize);
        });

        return {
            // State
            showSplash,
            canvasRef,

            // Methods
            startGame,
            handleCanvasClick,
            handleCanvasTouch
        };
    }
}).mount('#app');
