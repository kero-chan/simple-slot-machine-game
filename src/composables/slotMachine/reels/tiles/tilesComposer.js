import { Container, Texture, Rectangle, Sprite } from 'pixi.js'
import { ASSETS } from '../../../../config/assets'
import { TILE_SLICES, BASE_RECT } from './config'

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

      const outSize = cfg.outSize || Math.max((BASE_RECT?.w || 256), (BASE_RECT?.h || 256))
      const container = new Container()

      const makeSubTex = (source, r) => new Texture({ source, frame: new Rectangle(r.x, r.y, r.w, r.h) })

      // Draw base only if the tile defines one
      if (cfg.base) {
        const baseSourceAlias = cfg.baseSourceSprite || (cfg.layers?.[0]?.sourceSprite) || 'tiles_50'
        const baseSheetTex = ASSETS.loadedImages?.[baseSourceAlias]
        const baseSource = baseSheetTex?.source || baseSheetTex?.baseTexture
        if (baseSource) {
          const baseSp = new Sprite(makeSubTex(baseSource, cfg.base))
          baseSp.width = outSize
          baseSp.height = outSize
          container.addChild(baseSp)
        }
      }

      // Layered composition
      const addLayer = (layer) => {
        const layerAlias = layer.sourceSprite || 'tiles_50'
        const sheetTex = ASSETS.loadedImages?.[layerAlias]
        const source = sheetTex?.source || sheetTex?.baseTexture
        if (!source || !layer.icon) return

        const sprite = new Sprite(makeSubTex(source, layer.icon))
        sprite.anchor.set(0.5)

        const scale = layer.scale ?? cfg.iconScale ?? 0.78
        sprite.width = Math.floor(outSize * scale)
        sprite.height = Math.floor(outSize * scale)

        const offsetX = Math.floor(outSize * (layer.offsetX || 0))
        const offsetY = Math.floor(outSize * (layer.offsetY || 0))
        sprite.x = Math.floor(outSize / 2) + offsetX
        sprite.y = Math.floor(outSize / 2) + offsetY

        container.addChild(sprite)
      }

      if (Array.isArray(cfg.layers) && cfg.layers.length) {
        cfg.layers.forEach(addLayer)
      } else if (cfg.icon) {
        addLayer({ icon: cfg.icon, sourceSprite: cfg.sourceSprite })
      } else if (cfg.iconAsset) {
        const iconTex = ASSETS.loadedImages?.[cfg.iconAsset]
        if (iconTex) {
          const sprite = new Sprite(iconTex)
          sprite.anchor.set(0.5)
          const scale = cfg.iconScale ?? 0.78
          sprite.width = Math.floor(outSize * scale)
          sprite.height = Math.floor(outSize * scale)
          sprite.x = Math.floor(outSize / 2)
          sprite.y = Math.floor(outSize / 2)
          container.addChild(sprite)
        }
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
