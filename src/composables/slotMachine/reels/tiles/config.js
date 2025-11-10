export const BASE_RECT = { x: 819, y: 0, w: 162, h: 188 }
export const BASE_GOLD_RECT = { x: 661, y: 0, w: 155, h: 188 }

export const TILE_SLICES = {
  fa: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 25, y: 211, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  fa_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 25, y: 211, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  wutong: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 353, y: 211, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  wusuo_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 514, y: 213, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  wutong_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 353, y: 211, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  wusuo: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 514, y: 213, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  bawan: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 25, y: 19, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  bawan_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 25, y: 19, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  liangtong: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 353, y: 24, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  liangtong_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 353, y: 24, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  liangsuo: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 516, y: 23, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  liangsuo_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 516, y: 23, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  bai: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 191, y: 210, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  bai_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 191, y: 210, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  zhong: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 189, y: 22, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  zhong_gold: {
    base: BASE_GOLD_RECT,
    outSize: 256,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 189, y: 22, w: 120, h: 134 }, scale: 0.78 }
    ]
  },

  gold: {
    outSize: 510,
    layers: [
      { sourceSprite: 'tiles_29', icon: { x: 170, y: 6, w: 152, h: 85 }, scale: 0.4, offsetY: -0.27 },
      { sourceSprite: 'tiles_50', icon: { x: 660, y: 270, w: 152, h: 97 }, scale: 0.4, offsetY: 0.08 },
    ]
  },

  bonus: {
    base: { sourceSprite: 'tiles_34', icon: { x: 416, y: 16, w: 45, h: 53 }, scale: 1.8 },
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_29', icon: { x: 0, y: 1, w: 165, h: 180 }, scale: 2 },
    ]
  }
}

const DEFAULT_LAYER_OFFSET_X = 0.02
const DEFAULT_LAYER_OFFSET_Y = -0.05
const EXEMPT_SYMBOLS = new Set(['gold', 'bonus'])

for (const [symbol, cfg] of Object.entries(TILE_SLICES)) {
  if (EXEMPT_SYMBOLS.has(symbol)) continue
  if (Array.isArray(cfg.layers)) {
    for (const layer of cfg.layers) {
      if (!layer) continue
      if (layer.offsetX === undefined) layer.offsetX = DEFAULT_LAYER_OFFSET_X
      if (layer.offsetY === undefined) layer.offsetY = DEFAULT_LAYER_OFFSET_Y
    }
  }
}
