export const CONFIG = {
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },
  reels: {
    count: 5,
    rows: 6,
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
}
