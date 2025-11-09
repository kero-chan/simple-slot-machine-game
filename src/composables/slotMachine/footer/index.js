import { Container, Graphics, Text } from 'pixi.js'

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

  function build(rect) {
    container.removeChildren()
    const { x, y, w, h } = rect

    // Footer bar
    const bar = new Graphics()
    bar.rect(x, y, w, h)
    bar.fill(0x8a4b28)
    container.addChild(bar)

    const centerX = x + Math.floor(w / 2)
    const centerY = y + Math.floor(h / 2)

    // Spin button
    const spinRadius = Math.max(32, Math.floor(Math.min(h * 0.35, w * 0.12)))
    const spinBtn = new Graphics()
    spinBtn.circle(centerX, centerY, spinRadius)
    const canSpin = !!gameState.canSpin?.value
    spinBtn.fill(canSpin ? 0xff4d4f : 0x9e9e9e)
    spinBtn.stroke({ color: 0xb02a2a, width: 4 })
    spinBtn.eventMode = 'static'
    spinBtn.cursor = canSpin ? 'pointer' : 'not-allowed'
    spinBtn.on('pointerdown', () => {
      if (gameState.showStartScreen?.value) return
      if (gameState.isSpinning?.value) return
      if (!gameState.canSpin?.value) return
      handlers.spin && handlers.spin()
    })
    container.addChild(spinBtn)

    const spinText = new Text('SPIN', {
      fill: 0xffffff,
      fontSize: Math.floor(spinRadius * 0.6),
      fontWeight: 'bold'
    })
    spinText.anchor.set(0.5)
    spinText.x = centerX
    spinText.y = centerY
    container.addChild(spinText)

    // Bet controls
    const ctrlW = Math.floor(spinRadius * 1.2)
    const ctrlH = Math.floor(spinRadius * 0.8)
    const gap = Math.floor(spinRadius * 0.6)

    // Minus (left)
    const minusX = centerX - spinRadius - gap - ctrlW
    const minusY = centerY - Math.floor(ctrlH / 2)
    const minusBtn = new Graphics()
    minusBtn.roundRect(minusX, minusY, ctrlW, ctrlH, Math.floor(ctrlH / 3))
    minusBtn.fill(0xb2784f)
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
    const plusX = centerX + spinRadius + gap
    const plusY = centerY - Math.floor(ctrlH / 2)
    const plusBtn = new Graphics()
    plusBtn.roundRect(plusX, plusY, ctrlW, ctrlH, Math.floor(ctrlH / 3))
    plusBtn.fill(0xb2784f)
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

  return { container, build, setHandlers }
}
