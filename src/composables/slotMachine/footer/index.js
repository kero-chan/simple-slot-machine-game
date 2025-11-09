import { Container, Graphics, Text, Sprite, Texture } from 'pixi.js'
import { ASSETS } from '../../../config/assets'

export function useFooter(gameState) {
  const container = new Container()
  let handlers = {
    spin: () => {},
    increaseBet: () => {},
    decreaseBet: () => {}
  }

  function setHandlers(h) {
    handlers = { ...handlers, ...h }
  }

  // Keep references for animation and interactions
  let frameSprite = null
  let arrowSprite = null
  let minusBtn = null
  let plusBtn = null
  let lastTs = 0

  function build(rect) {
    container.removeChildren()
    const { x, y, w, h } = rect

    // Transparent footer: skip brown bar
    const bar = new Graphics()
    bar.rect(x, y, w, h)
    bar.fill(0x8a4b28)
    container.addChild(bar)

    // Transparent footer: no brown bar, center spin button
    const centerX = x + Math.floor(w / 2)
    const centerY = y + Math.floor(h / 2)

    const BTN_SCALE_W = 0.42
    const BTN_SCALE_H = 0.95
    const btnSize = Math.floor(Math.min(h * BTN_SCALE_H, w * BTN_SCALE_W))

    const arrowSize = Math.floor(btnSize * 0.68)

    // Frame sprite
    const frameSrc = ASSETS.loadedImages?.spin_frame || ASSETS.imagePaths?.spin_frame
    const frameTex = frameSrc ? (frameSrc instanceof Texture ? frameSrc : Texture.from(frameSrc)) : null
    frameSprite = frameTex ? new Sprite(frameTex) : new Graphics().circle(0, 0, Math.floor(btnSize / 2)).fill(0x00aa66)
    frameSprite.anchor?.set?.(0.5)
    frameSprite.x = centerX
    frameSprite.y = centerY
    frameSprite.width = btnSize
    frameSprite.height = btnSize
    frameSprite.eventMode = 'static'
    frameSprite.cursor = gameState.canSpin?.value ? 'pointer' : 'not-allowed'
    frameSprite.on?.('pointerdown', () => {
      if (gameState.showStartScreen?.value) return
      if (gameState.isSpinning?.value) return
      if (!gameState.canSpin?.value) return
      handlers.spin && handlers.spin()
    })
    container.addChild(frameSprite)

    // Gold arrow sprite (uses arrow.png), fit strictly inside the frame
    {
        const src = ASSETS.loadedImages?.spin_arrow || ASSETS.imagePaths?.spin_arrow
        const tex = src ? (src instanceof Texture ? src : Texture.from(src)) : null
        arrowSprite = new Sprite(tex)
        arrowSprite.anchor.set(0.5)
        arrowSprite.x = centerX
        arrowSprite.y = centerY

        // Smaller inner diameter so the arrow stays inside the green circle
        const ARROW_SCALE = 0.48
        const innerDiameter = Math.floor(btnSize * ARROW_SCALE)
        arrowSprite.width = innerDiameter
        arrowSprite.height = innerDiameter
        container.addChild(arrowSprite)

        // Circular mask slightly inset to avoid touching the ring while rotating
        const MASK_INSET_PX = 2
        const arrowMask = new Graphics()
        arrowMask.circle(centerX, centerY, Math.max(0, Math.floor(innerDiameter / 2) - MASK_INSET_PX))
        arrowMask.fill(0xffffff)
        container.addChild(arrowMask)
        arrowSprite.mask = arrowMask
    }

    // Bet controls (keep existing layout)
    const ctrlW = Math.floor(btnSize * 0.6)
    const ctrlH = Math.floor(btnSize * 0.42)
    const gap = Math.floor(btnSize * 0.5)

    // Minus (left)
    const minusX = centerX - Math.floor(btnSize / 2) - gap - ctrlW
    const minusY = centerY - Math.floor(ctrlH / 2)
    minusBtn = new Graphics()
    minusBtn.roundRect(minusX, minusY, ctrlW, ctrlH, Math.floor(ctrlH / 3))
    minusBtn.fill(0x3b6d48) // greenish to match reels
    minusBtn.eventMode = 'static'
    minusBtn.cursor = 'pointer'
    minusBtn.on('pointerdown', () => {
      if (gameState.isSpinning?.value) return
      handlers.decreaseBet && handlers.decreaseBet()
    })
    container.addChild(minusBtn)

    const minusText = new Text('−', {
      fill: 0xffffff,
      fontSize: Math.floor(ctrlH * 0.6),
      fontWeight: 'bold'
    })
    minusText.anchor.set(0.5)
    minusText.x = minusX + Math.floor(ctrlW / 2)
    minusText.y = minusY + Math.floor(ctrlH / 2)
    container.addChild(minusText)

    // Plus (right)
    const plusX = centerX + Math.floor(btnSize / 2) + gap
    const plusY = centerY - Math.floor(ctrlH / 2)
    plusBtn = new Graphics()
    plusBtn.roundRect(plusX, plusY, ctrlW, ctrlH, Math.floor(ctrlH / 3))
    plusBtn.fill(0x3b6d48)
    plusBtn.eventMode = 'static'
    plusBtn.cursor = 'pointer'
    plusBtn.on('pointerdown', () => {
      if (gameState.isSpinning?.value) return
      handlers.increaseBet && handlers.increaseBet()
    })
    container.addChild(plusBtn)

    const plusText = new Text('+', {
      fill: 0xffffff,
      fontSize: Math.floor(ctrlH * 0.6),
      fontWeight: 'bold'
    })
    plusText.anchor.set(0.5)
    plusText.x = plusX + Math.floor(ctrlW / 2)
    plusText.y = plusY + Math.floor(ctrlH / 2)
    container.addChild(plusText)
  }

  // Animate arrow rotation and button states
  function update(timestamp = 0) {
    const canSpin = !!gameState.canSpin?.value
    if (frameSprite) {
      frameSprite.alpha = canSpin ? 1 : 0.5
      frameSprite.cursor = canSpin ? 'pointer' : 'not-allowed'
    }
    if (arrowSprite) {
      const dt = lastTs ? Math.max(0, (timestamp - lastTs) / 1000) : 0
      lastTs = timestamp
      const spinning = !!gameState.isSpinning?.value
      const speed = spinning ? (Math.PI * 2.5) : (Math.PI * 0.8) // rad/sec
      arrowSprite.rotation += speed * dt
    }
  }

  return { container, build, setHandlers, update }
}
