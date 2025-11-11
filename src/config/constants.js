export const CONFIG = {
  canvas: {
    baseWidth: 600,
    baseHeight: 800
  },
  reels: {
    count: 5,
    rows: 6,
    bufferRows: 4, // Extra rows above for realistic drop animation
    symbolSize: 70,
    spacing: 8
  },
  paytable: {
    liangsuo: { 3: 15, 4: 60, 5: 80 },
    liangtong: { 3: 10, 4: 40, 5: 80 },
    wusuo: { 3: 8, 4: 20, 5: 60 },
    wutong: { 3: 6, 4: 15, 5: 40 },
    bawan: { 3: 6, 4: 15, 5: 40 },
    bai: { 3: 4, 4: 10, 5: 20 },
    zhong: { 3: 4, 4: 10, 5: 20 },
    fa: { 3: 2, 4: 5, 5: 10 },
    bonus: { 3: 2, 4: 5, 5: 10 },
    gold: { 3: 2, 4: 5, 5: 10 }
  },
  multipliers: [1, 2, 3, 5, 5, 5],
  freeSpinMultipliers: [2, 4, 6, 10, 10, 10],
  animation: {
    spinDuration: 1600,
    cascadeDuration: 500,
    reelStagger: 150
  },
  game: {
    initialCredits: 1000000,
    minBet: 5,
    maxBet: 100,
    betStep: 5,
    freeSpinsPerScatter: 12,
    bonusScattersPerSpin: 2
  }
}
