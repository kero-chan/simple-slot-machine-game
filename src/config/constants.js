export const CONFIG = {
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },
  reels: {
    count: 5,
    rows: 6,
    bufferRows: 4, // Extra rows above for realistic drop animation
    fullyVisibleRows: 4, // Number of fully visible rows to check for wins
    stripLength: 100, // Longer strip = smoother spin animation, prevents gaps
    symbolSize: 70,
    spacing: 8,

    // WINNING CHECK ROWS - Single source of truth for all winning/bonus/effect calculations
    // These are the GRID row indices used for checking wins (adjusted for strip layout fix)
    // Grid rows: 0-9 total (10 rows including buffer)
    // Visual rows in renderer: -4 to 5 (where -4 to -1 are buffer, 0 is transition, 1-4 fully visible, 5 partial bottom)
    // Relationship: gridRow = visualRow + bufferRows (e.g., gridRow 5 = visualRow 1)
    // After strip layout fix: The 4 fully visible middle rows are visual rows 1-4 (grid rows 5-8)
    winCheckStartRow: 5,  // Start checking wins from grid row 5 (visual row 1 = first fully visible row)
    winCheckEndRow: 8,    // End checking wins at grid row 8 (visual row 4 = last fully visible row)

    // For renderer: visual row equivalents (calculated from grid rows)
    // visualRow = gridRow - bufferRows
    get visualWinStartRow() { return this.winCheckStartRow - this.bufferRows }, // 5 - 4 = 1
    get visualWinEndRow() { return this.winCheckEndRow - this.bufferRows }       // 8 - 4 = 4
  },
  paytable: {
    fa: { 3: 10, 4: 25, 5: 50 },
    zhong: { 3: 8, 4: 20, 5: 40 },
    bai: { 3: 6, 4: 15, 5: 30 },
    bawan: { 3: 5, 4: 10, 5: 15 },
    wusuo: { 3: 3, 4: 5, 5: 12 },
    wutong: { 3: 3, 4: 5, 5: 12 },
    liangsuo: { 3: 2, 4: 4, 5: 10 },
    liangtong: { 3: 1, 4: 3, 5: 6 },
    bonus: { 3: 1, 4: 3, 5: 6 },
    wild: { 3: 1, 4: 3, 5: 6 }
  },
  multipliers: [1, 2, 3, 5, 5, 5],
  freeSpinMultipliers: [2, 4, 6, 10, 10, 10],
  animation: {
    spinDuration: 1600,
    reelStagger: 150
  },
  game: {
    initialCredits: 100000,
    minBet: 10,
    maxBet: 100,
    betStep: 2,
    bettingMultiplierRate: 0.1,
    freeSpinsPerScatter: 12,       // Number of free spins awarded when bonus is triggered
    bonusScattersPerSpin: 2,       // Max bonus tiles per spin (for spawn control)
    minBonusToTrigger: 3,          // Minimum bonus tiles required to trigger free spins
    maxBonusPerColumn: 2           // Maximum bonus tiles allowed per column in visible rows
  },
  spawnRates: {
    bonusChance: 0.00025,               // 25% chance for bonus tiles (increased for testing, normal: 0.03)
    wildChance: 0.02,                // 2% chance for wild tiles
    goldChance: 0.15                 // 15% chance for gold variants
  }
}
