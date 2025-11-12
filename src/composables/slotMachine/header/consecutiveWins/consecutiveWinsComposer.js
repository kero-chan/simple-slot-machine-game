import { Container, Texture, Rectangle, Sprite } from 'pixi.js'
import { ASSETS } from '../../../../config/assets'
import { CONSECUTIVE_WINS_CONFIG } from './config'

let composing = false

export function composeConsecutiveWinsTextures(app) {
  if (composing) return

  composing = true
  try {
    Object.entries(CONSECUTIVE_WINS_CONFIG).forEach(([symbol, cfg]) => {
      if (ASSETS.loadedImages?.[symbol]) return

      // Get the texture from loadedImages (should be already loaded by imageLoader)
      let sheetTex = ASSETS.loadedImages?.[cfg.iconAsset]
      
      if (!sheetTex || !(sheetTex instanceof Texture)) {
        return
      }
      
      const source = sheetTex.source
      if (!source) {
        return
      }

      const outSize = cfg.outSize || 512
      const container = new Container()
      const x = cfg.icon.x < 0 ? sheetTex.frame.x : cfg.icon.x
      const y = cfg.icon.y < 0 ? sheetTex.frame.y : cfg.icon.y
      const w = cfg.icon.w <= 0 ? source.width : cfg.icon.w
      const h = cfg.icon.h <= 0 ? source.height : cfg.icon.h

      const subTex = () => new Texture({ source, frame: new Rectangle(x, y, w, h) })

      // Create the icon from the specified rect in the spritesheet
      if (cfg.icon) {
        const iconSp = new Sprite(subTex())
        iconSp.anchor.set(0.5)

        // Apply scale
        const scale = cfg.iconScale ?? 1
        iconSp.width = Math.floor(w * scale)
        iconSp.height = Math.floor(h * scale)

        // Position at center
        iconSp.x = Math.floor(outSize / 2)
        iconSp.y = Math.floor(outSize / 2)

        // Apply rotation if specified
        if (cfg.iconRotation) {
          iconSp.rotation = cfg.iconRotation
        }

        container.addChild(iconSp)
      }

      // Generate the composed texture
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
