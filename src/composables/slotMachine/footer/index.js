import { Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { BASE_FRAME, ARROWS } from './config'

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
  const scaleSpinBtn = 1

  // Track value Text nodes
  const VALUE_NAME_PREFIX = 'footer-pill-value-'
  const sheetTex = ASSETS.loadedImages?.spin || ASSETS.imagePaths?.spin
  const source = sheetTex?.source || sheetTex?.baseTexture
  const subTex = (r) => new Texture({ source, frame: new Rectangle(r.x, r.y, r.w, r.h) })
  const texArrowNormal = subTex(ARROWS.gold)
  const texArrowSpinning = subTex(ARROWS.gold_spinning)

  function setToSpinning(isSpinning) {
    if (!arrowSprite) return

    arrowSprite.texture = isSpinning ? texArrowSpinning : texArrowNormal
  }

  function build(rect) {
    container.removeChildren()
    const { x, y, w, h } = rect

    const bar = new Graphics()
    bar.rect(x, y, w, h)
    bar.fill(0x8a4b28)
    container.addChild(bar)

    // Top row: Credits / Bet / Win pills
    {
      const pillGap = Math.floor(w * 0.02)
      const pillWidth = Math.floor((w - pillGap * 4) / 3)
      const pillHeight = Math.floor(h * 0.28)
      const labels = ['CREDITS', 'BET', 'WIN']
      const vals = [
        Number(gameState.credits.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        Number(gameState.bet.value).toFixed(2),
        Number(gameState.currentWin.value).toFixed(2)
      ]

      for (let i = 0; i < 3; i++) {
        const px = x + pillGap + i * (pillWidth + pillGap)
        const py = y + pillGap
        const pill = new Graphics()
        pill.roundRect(px, py, pillWidth, pillHeight, Math.floor(pillHeight / 3))
        pill.fill(0xb2784f)
        container.addChild(pill)

        const label = new Text(labels[i], { fill: 0xffffff, fontSize: Math.floor(pillHeight * 0.25) })
        label.x = px + Math.floor(pillWidth * 0.06)
        label.y = py + Math.floor(pillHeight * 0.10)
        container.addChild(label)

        const valueText = new Text(vals[i], { fill: 0xffffff, fontSize: Math.floor(pillHeight * 0.35), fontWeight: 'bold' })
        valueText.x = px + Math.floor(pillWidth * 0.06)
        valueText.y = py + Math.floor(pillHeight * 0.50)
        valueText.name = `${VALUE_NAME_PREFIX}${i}`
        container.addChild(valueText)
      }
    }

    // Centered spin button cluster
    const centerX = x + Math.floor(w / 2)
    const centerY = y + Math.floor(h / 2)

    const BTN_SCALE_W = 0.42
    const BTN_SCALE_H = 0.95
    const btnSize = Math.floor(Math.min(h * BTN_SCALE_H, w * BTN_SCALE_W))

    // Button fram sprite
    const bgPosition = BASE_FRAME
    if (bgPosition) {
      frameSprite = new Sprite(subTex(bgPosition))
      frameSprite.anchor.set(0.5);
      frameSprite.x = centerX;
      frameSprite.y = centerY;
      frameSprite.scale.set(scaleSpinBtn)
      frameSprite.rotation = -(Math.PI / 2)

      frameSprite.eventMode = 'static'
      frameSprite.cursor = gameState.canSpin?.value ? 'pointer' : 'not-allowed'
      frameSprite.on?.('pointerdown', () => {
        console.log('pointerdown')
        if (gameState.showStartScreen?.value) return
        if (gameState.isSpinning?.value) return
        if (!gameState.canSpin?.value) return

        handlers.spin && handlers.spin()
      })

      container.addChild(frameSprite)
    }

    // Gold arrow sprite
    const arrowFramePos = ARROWS.gold
    if (arrowFramePos) {
      arrowSprite = new Sprite(subTex(arrowFramePos))
      arrowSprite.anchor.set(0.5);
      arrowSprite.x = centerX;
      arrowSprite.y = centerY;
      arrowSprite.scale.set(scaleSpinBtn)
      container.addChild(arrowSprite)
    }

    // Bet controls
    const ctrlW = Math.floor(btnSize * 0.6)
    const ctrlH = Math.floor(btnSize * 0.42)
    const gap = Math.floor(btnSize * 0.5)

    const minusX = centerX - Math.floor(btnSize / 2) - gap - ctrlW
    const minusY = centerY - Math.floor(ctrlH / 2)
    minusBtn = new Graphics()
    minusBtn.roundRect(minusX, minusY, ctrlW, ctrlH, Math.floor(ctrlH / 3))
    minusBtn.fill(0x3b6d48)
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

  // Refresh pill values each frame so they reflect game state
  function updateValues() {
    const vals = [
      Number(gameState.credits.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      Number(gameState.bet.value).toFixed(2),
      Number(gameState.currentWin.value).toFixed(2)
    ]
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i]
      if (child instanceof Text && child.name && child.name.startsWith(VALUE_NAME_PREFIX)) {
        const idx = Number(child.name.replace(VALUE_NAME_PREFIX, ''))
        child.text = vals[idx]
      }
    }
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
      if (spinning) {
        setToSpinning(true)
      } else {
        setToSpinning(false)
      }
      const speed = spinning ? (Math.PI * 5) : (Math.PI * 0.5) // rad/sec
      arrowSprite.rotation += speed * dt
    }
  }

  return { container, build, setHandlers, update, updateValues, setToSpinning }
}
