export const BASE_RECT = { x: 819, y: 0, w: 162, h: 188 }

export const TILE_SLICES = {
  bamboo: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 25, y: 211, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  dragon_green: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 353, y: 211, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  dragon_red: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 514, y: 213, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  dragon_white: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 25, y: 19, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  scatter: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 353, y: 24, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  wild: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 516, y: 23, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  wind_east: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 191, y: 210, w: 120, h: 134 }, scale: 0.78 }
    ]
  },
  wind_south: {
    base: BASE_RECT,
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_50', icon: { x: 189, y: 22, w: 120, h: 134 }, scale: 0.78 }
    ]
  },

  // Dot: layered composition only, no BASE_RECT
  dot: {
    outSize: 512,
    layers: [
      { sourceSprite: 'tiles_29', icon: { x: 170, y: 6, w: 152, h: 85 }, scale: 0.4, offsetY: -0.27 },
      { sourceSprite: 'tiles_50', icon: { x: 660, y: 270, w: 152, h: 97 }, scale: 0.48, offsetY: 0.08 },
    ]
  }
}
