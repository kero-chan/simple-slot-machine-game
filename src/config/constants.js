export const CONFIG = {
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },
  reels: {
    count: 5,
    rows: 6,
    bufferRows: 4, // Extra rows above for realistic drop animation
    fullyVisibleRows: 4, // Number of fully visible rows to check for wins (rows 4-7)
    stripLength: 100, // Longer strip = smoother spin animation, prevents gaps
    symbolSize: 70,
    spacing: 8
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
    bonusChance: 0.25,               // 25% chance for bonus tiles (increased for testing, normal: 0.03)
    wildChance: 0.02,                // 2% chance for wild tiles
    goldChance: 0.15                 // 15% chance for gold variants
  }
}
