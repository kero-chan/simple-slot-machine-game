import { Container, Texture, Rectangle, Sprite } from 'pixi.js'
import { ASSETS } from '../../../../config/assets'
import { CONSECUTIVE_WINS_CONFIG } from './config'

let composing = false

export function composeConsecutiveWinsTextures(app) {
  if (composing) return

  // Check if all required sheet textures are loaded
  const sheet43 = ASSETS.loadedImages?.['header_background']
  const sheet58 = ASSETS.loadedImages?.['text']
  const sheet64 = ASSETS.loadedImages?.['consecutive_wins_active']
  const sheet65 = ASSETS.loadedImages?.['consecutive_wins_default']
  if (!sheet43 || !sheet58 || !sheet64 || !sheet65) return

  composing = true
  try {
    Object.entries(CONSECUTIVE_WINS_CONFIG).forEach(([symbol, cfg]) => {
      if (ASSETS.loadedImages?.[symbol]) return

      // Select the appropriate sheet based on iconAsset
      let sheetTex
      if (cfg.iconAsset === 'header_background') sheetTex = sheet43
      else if (cfg.iconAsset === 'text') sheetTex = sheet58
      else if (cfg.iconAsset === 'consecutive_wins_active') sheetTex = sheet64
      else if (cfg.iconAsset === 'consecutive_wins_default') sheetTex = sheet65
      
      const source = sheetTex?.source || sheetTex?.baseTexture
      if (!source) return

      const outSize = cfg.outSize || 512
      const container = new Container()

      const subTex = (r) => new Texture({ source, frame: new Rectangle(r.x, r.y, r.w, r.h) })

      // Create the icon from the specified rect in the spritesheet
      if (cfg.icon) {
        const iconSp = new Sprite(subTex(cfg.icon))
        iconSp.anchor.set(0.5)
        
        // Apply scale
        const scale = cfg.iconScale ?? 1
        iconSp.width = Math.floor(cfg.icon.w * scale)
        iconSp.height = Math.floor(cfg.icon.h * scale)
        
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