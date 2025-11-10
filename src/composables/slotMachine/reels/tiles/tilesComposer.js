import { Container, Texture, Rectangle, Sprite } from 'pixi.js'
import { ASSETS } from '../../../../config/assets'
import { TILE_SLICES } from './config'

let composing = false

export function composeTilesTextures(app) {
  if (composing) return

  const sheetTex = ASSETS.loadedImages?.tiles_50
  const source = sheetTex?.source || sheetTex?.baseTexture
  if (!source) return

  composing = true
  try {
    Object.entries(TILE_SLICES).forEach(([symbol, cfg]) => {
      if (ASSETS.loadedImages?.[symbol]) return

      const outSize = cfg.outSize || Math.max(cfg.base?.w || 256, cfg.base?.h || 256)
      const container = new Container()

      const subTex = (r) => new Texture({ source, frame: new Rectangle(r.x, r.y, r.w, r.h) })

      if (cfg.base) {
        const baseSp = new Sprite(subTex(cfg.base))
        baseSp.width = outSize
        baseSp.height = outSize
        container.addChild(baseSp)
      }

      if (cfg.icon) {
        const iconSp = new Sprite(subTex(cfg.icon))
        iconSp.anchor.set(0.5)
        const scale = cfg.iconScale ?? 0.78
        iconSp.width = Math.floor(outSize * scale)
        iconSp.height = Math.floor(outSize * scale)
        iconSp.x = Math.floor(outSize / 2)
        iconSp.y = Math.floor(outSize / 2)
        container.addChild(iconSp)
      }

      const composedTex = app.renderer.generateTexture(container)
      if (composedTex && composedTex.width > 0 && composedTex.height > 0) {
        ASSETS.loadedImages[symbol] = composedTex
      }

      container.removeChildren()
    })
  } finally {
    composing = false
  }
}
