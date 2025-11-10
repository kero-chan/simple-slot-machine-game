import { Container, Texture, Rectangle, Sprite } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

let composed = false

export function composeBambooTexture(app) {
  if (composed && ASSETS.loadedImages?.bamboo) return

  const sheetTex = ASSETS.loadedImages?.tiles_50
  if (!sheetTex || (!sheetTex.source && !sheetTex.baseTexture)) {
    return
  }

  // Prefer Pixi v8 `source`; fallback only if v7 objects are present
  const source = sheetTex.source || sheetTex.baseTexture

  const makeSub = (r) => {
    const frame = new Rectangle(r.x, r.y, r.w, r.h)
    // Pixi v8-friendly Texture construction
    return new Texture({ source, frame })
  }

  // Replace these with exact rectangles from 50.png if available
  const tileBaseRect = { x: 819, y: 0, w: 162, h: 188 }
  const bambooIconRect = { x: 25, y: 211, w: 120, h: 134 }

  const baseTex = makeSub(tileBaseRect)
  const iconTex = makeSub(bambooIconRect)

  const outSize = 512
  const tmp = new Container()

  const baseSp = new Sprite(baseTex)
  baseSp.width = outSize
  baseSp.height = outSize
  tmp.addChild(baseSp)

  const iconScale = 0.78
  const iconSp = new Sprite(iconTex)
  iconSp.anchor.set(0.5)
  iconSp.width = Math.floor(outSize * iconScale)
  iconSp.height = Math.floor(outSize * iconScale)
  iconSp.x = Math.floor(outSize / 2)
  iconSp.y = Math.floor(outSize / 2)
  tmp.addChild(iconSp)

  const composedTex = app.renderer.generateTexture(tmp)
  ASSETS.loadedImages.bamboo = composedTex
  composed = true

  tmp.removeChildren()
  return
}
