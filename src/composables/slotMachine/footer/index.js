import { Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { IMAGE_POSITIONS } from './config'

export function useFooter(gameState) {
  const container = new Container()
  let handlers = {
    spin: () => {},
    increaseBet: () => {},
    decreaseBet: () => {}
  }

  let spinBtnArrowSprite, spinBtnSprite

  function setHandlers(h) {
    handlers = { ...handlers, ...h }
  }

  // ==== HELPERS ====
  const loadBaseTexture = (key) => {
    const src = ASSETS.loadedImages?.[key] || ASSETS.imagePaths?.[key]
    return src?.source || src?.baseTexture
  }

  const subTex = (source, rect) => new Texture({ source, frame: new Rectangle(rect.x, rect.y, rect.w, rect.h)})

  // ==== SPIN BUTTON TEXTURES ====
  const spinSource = loadBaseTexture('spin')
  const texArrowNormal = subTex(spinSource, IMAGE_POSITIONS.spin_btn_arrows.normal)
  const texArrowSpinning = subTex(spinSource, IMAGE_POSITIONS.spin_btn_arrows.spinning)

  const setToSpinning = (isSpinning) => {
    if (spinBtnArrowSprite) spinBtnArrowSprite.texture = isSpinning ? texArrowSpinning : texArrowNormal
  }

  let lastTs = 0
  const VALUE_NAME_PREFIX = 'footer-pill-value-'


  function build(rect) {
    container.removeChildren()
    const { x, y, w, h } = rect

    // Centered spin button cluster
    const centerX = x + Math.floor(w / 2)
    const centerY = y + Math.floor(h / 2)

    // Footer Background
    const bgSubTex = (rect) => subTex(loadBaseTexture('footer_bg'), rect)
    if (IMAGE_POSITIONS.footer_bg) {
      const bgSprite = new Sprite(bgSubTex(IMAGE_POSITIONS.footer_bg))
      // bgSprite.scale.set(0.95)
      bgSprite.position.set(x, y + h*0.12)
      container.addChild(bgSprite)
    }

    if (IMAGE_POSITIONS.footer_bar) {
      const bgBarSprite = new Sprite(bgSubTex(IMAGE_POSITIONS.footer_bar))
      bgBarSprite.scale.set(1.1)
      bgBarSprite.anchor.set(0.5)
      bgBarSprite.position.set(centerX, y + h *0.05)
      container.addChild(bgBarSprite)
    }




    // Footer notification background
    if (IMAGE_POSITIONS.footer_notification_bg) {
      const notiBgSprite = new Sprite(subTex(loadBaseTexture('footer_notification_bg'),IMAGE_POSITIONS.footer_notification_bg))
      notiBgSprite.scale.set(0.96)
      notiBgSprite.height = notiBgSprite.height + h*0.02
      notiBgSprite.anchor.set(0.5)
      notiBgSprite.position.set(centerX, y + h *0.12)
      container.addChild(notiBgSprite)


      const randomKey = `text${Math.ceil(Math.random() * 4)}`
      const cfg = IMAGE_POSITIONS.footer_notification_texts[randomKey]
      if (cfg) {
        const notiTextSprite = new Sprite(subTex(loadBaseTexture('footer_notification_text'), cfg))
        notiTextSprite.scale.set(0.75)
        notiTextSprite.anchor.set(0.5)
        notiTextSprite.position.set(notiBgSprite.position.x, notiBgSprite.position.y)
        container.addChild(notiTextSprite)
      }
    }

    const iconSettingSubTex = (r) => subTex(loadBaseTexture('footer_icon_setting'), r)
    // const iconSetting1SubTex = (r) => subTex(loadBaseTexture('footer_icon_setting1'), r)

    // Credis / Bet / Win pills
    const pillGap = Math.floor(w * 0.01)
    const startX = Math.floor((w - 3*pillGap) * 0.02)
    const pillWidth = Math.floor((w - startX*2 - pillGap*2) / 3)
    const pillHeight = Math.floor(h * 0.13)
    const recColor = 0x57361f
    const iconColor = 0xb3794f
    const amountColor = 0x85efff
    const recAlpha = 0.8

    const buildRect = (r, i, text) => {
      const baseRect = new Graphics()
      baseRect.fill({color: recColor, alpha: recAlpha})
      baseRect.roundRect(startX+i*(pillWidth+pillGap), y+h*0.33, pillWidth, pillHeight, 0.25*pillHeight)
      baseRect.fill()
      container.addChild(baseRect)

      const iconSprite = new Sprite(iconSettingSubTex(r))
      iconSprite.anchor.set(0.5)
      iconSprite.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.12, y+h*0.33+baseRect.height/2)
      iconSprite.tint = iconColor
      fitSpriteToRect(iconSprite, baseRect)
      container.addChild(iconSprite)

      const label = new Text({text: text,
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: amountColor,
        }
      })
      fitTextToBox(label, pillWidth, 0.65)
      label.anchor.set(0.5)
      label.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.6, y+h*0.33+baseRect.height/2)
      container.addChild(label)
    }


    buildRect(IMAGE_POSITIONS.wallet_icon, 0,'100,000.00')
    buildRect(IMAGE_POSITIONS.wallet_icon, 1, '12.00')
    buildRect(IMAGE_POSITIONS.wallet_icon, 2, '0.00')


    // bet rectangle
    const betRect = new Graphics()
    betRect.fill({color: recColor, alpha: recAlpha})
    betRect.roundRect(startX+1*(pillWidth+pillGap), y+h*0.33, pillWidth, pillHeight, 15)
    betRect.fill()
    container.addChild(betRect)

    // win amount rectangle
    const winRect = new Graphics()
    winRect.fill({color: recColor, alpha: recAlpha})
    winRect.roundRect(startX+2*(pillWidth+pillGap), y+h*0.33, pillWidth, pillHeight, 15)
    winRect.fill()
    container.addChild(winRect)



    // Bet Setting
    const setRect = new Graphics()
    const setRectHeight = Math.floor(h * 0.48)
    setRect.fill({color: recColor, alpha: recAlpha})
    setRect.roundRect(x, y+(h-setRectHeight), w, setRectHeight, 0)
    setRect.fill()
    container.addChild(setRect)


    // Spin button
    const spinBtnBaseTex = loadBaseTexture('spin')
    const spinBtnScale = w * 0.0016
    if (IMAGE_POSITIONS.spin_btn_bg) {
      spinBtnSprite = new Sprite(subTex(spinBtnBaseTex, IMAGE_POSITIONS.spin_btn_bg))
      spinBtnSprite.anchor.set(0.5)
      spinBtnSprite.position.set(centerX, y+h*0.65)
      spinBtnSprite.scale.set(spinBtnScale)
      spinBtnSprite.rotation = -(Math.PI / 2)

      spinBtnSprite.eventMode = 'static'
      spinBtnSprite.cursor = gameState.canSpin?.value ? 'pointer' : 'not-allowed'
      spinBtnSprite.on?.('pointerdown', () => {
        console.log('pointerdown')
        if (gameState.showStartScreen?.value) return
        if (gameState.isSpinning?.value) return
        if (!gameState.canSpin?.value) return

        handlers.spin && handlers.spin()
      })

      container.addChild(spinBtnSprite)

      // spint button arrow
      if (IMAGE_POSITIONS.spin_btn_arrows.normal) {
        spinBtnArrowSprite = new Sprite(subTex(spinBtnBaseTex,IMAGE_POSITIONS.spin_btn_arrows.normal))
        spinBtnArrowSprite.anchor.set(0.5)
        spinBtnArrowSprite.position.set(spinBtnSprite.position.x, spinBtnSprite.position.y)
        spinBtnArrowSprite.scale.set(spinBtnScale)
        container.addChild(spinBtnArrowSprite)
      }
    }

    // setNotification(1, container)

    // Top row: Credits / Bet / Win pills
    // {
    //   const pillGap = Math.floor(w * 0.02)
    //   const pillWidth = Math.floor((w - pillGap * 4) / 3)
    //   const pillHeight = Math.floor(h * 0.28)
    //   const labels = ['CREDITS', 'BET', 'WIN']
    //   const vals = [
    //     Number(gameState.credits.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    //     Number(gameState.bet.value).toFixed(2),
    //     Number(gameState.currentWin.value).toFixed(2)
    //   ]

    //   for (let i = 0; i < 3; i++) {
    //     const px = x + pillGap + i * (pillWidth + pillGap)
    //     const py = y + pillGap
    //     const pill = new Graphics()
    //     pill.roundRect(px, py, pillWidth, pillHeight, Math.floor(pillHeight / 3))
    //     pill.fill(0xb2784f)
    //     container.addChild(pill)

    //     const label = new Text(labels[i], { fill: 0xffffff, fontSize: Math.floor(pillHeight * 0.25) })
    //     label.x = px + Math.floor(pillWidth * 0.06)
    //     label.y = py + Math.floor(pillHeight * 0.10)
    //     container.addChild(label)

    //     const valueText = new Text(vals[i], { fill: 0xffffff, fontSize: Math.floor(pillHeight * 0.35), fontWeight: 'bold' })
    //     valueText.x = px + Math.floor(pillWidth * 0.06)
    //     valueText.y = py + Math.floor(pillHeight * 0.50)
    //     valueText.name = `${VALUE_NAME_PREFIX}${i}`
    //     container.addChild(valueText)
    //   }
    // }



    // const BTN_SCALE_W = 0.42
    // const BTN_SCALE_H = 0.95
    // const btnSize = Math.floor(Math.min(h * BTN_SCALE_H, w * BTN_SCALE_W))



    // // Bet controls
    // const ctrlW = Math.floor(btnSize * 0.6)
    // const ctrlH = Math.floor(btnSize * 0.42)
    // const gap = Math.floor(btnSize * 0.5)

    // const minusX = centerX - Math.floor(btnSize / 2) - gap - ctrlW
    // const minusY = centerY - Math.floor(ctrlH / 2)
    // minusBtn = new Graphics()
    // minusBtn.roundRect(minusX, minusY, ctrlW, ctrlH, Math.floor(ctrlH / 3))
    // minusBtn.fill(0x3b6d48)
    // minusBtn.eventMode = 'static'
    // minusBtn.cursor = 'pointer'
    // minusBtn.on('pointerdown', () => {
    //   if (gameState.isSpinning?.value) return
    //   handlers.decreaseBet && handlers.decreaseBet()
    // })
    // container.addChild(minusBtn)

    // const minusText = new Text('−', {
    //   fill: 0xffffff,
    //   fontSize: Math.floor(ctrlH * 0.6),
    //   fontWeight: 'bold'
    // })
    // minusText.anchor.set(0.5)
    // minusText.x = minusX + Math.floor(ctrlW / 2)
    // minusText.y = minusY + Math.floor(ctrlH / 2)
    // container.addChild(minusText)

    // const plusX = centerX + Math.floor(btnSize / 2) + gap
    // const plusY = centerY - Math.floor(ctrlH / 2)
    // plusBtn = new Graphics()
    // plusBtn.roundRect(plusX, plusY, ctrlW, ctrlH, Math.floor(ctrlH / 3))
    // plusBtn.fill(0x3b6d48)
    // plusBtn.eventMode = 'static'
    // plusBtn.cursor = 'pointer'
    // plusBtn.on('pointerdown', () => {
    //   if (gameState.isSpinning?.value) return
    //   handlers.increaseBet && handlers.increaseBet()
    // })
    // container.addChild(plusBtn)

    // const plusText = new Text('+', {
    //   fill: 0xffffff,
    //   fontSize: Math.floor(ctrlH * 0.6),
    //   fontWeight: 'bold'
    // })
    // plusText.anchor.set(0.5)
    // plusText.x = plusX + Math.floor(ctrlW / 2)
    // plusText.y = plusY + Math.floor(ctrlH / 2)
    // container.addChild(plusText)
  }

  function fitTextToBox(textObj, boxWidth, widthPercent = 0.8) {
    const targetWidth = boxWidth * widthPercent
    const baseSize = textObj.style.fontSize
    let scaleFactor = targetWidth / textObj.width
    textObj.style.fontSize = baseSize * scaleFactor
  }

  function fitSpriteToRect(sprite, rect) {
    if (!sprite || !rect) return
    const h = rect.height
    const scale =(h / sprite.height) * 0.5
    sprite.scale.set(scale)
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
    if (spinBtnSprite) {
      spinBtnSprite.alpha = canSpin ? 1 : 0.5
      spinBtnSprite.cursor = canSpin ? 'pointer' : 'not-allowed'
    }

    if (spinBtnArrowSprite) {
      const dt = lastTs ? Math.max(0, (timestamp - lastTs) / 1000) : 0
      lastTs = timestamp
      const spinning = !!gameState.isSpinning?.value
      if (spinning) {
        setToSpinning(true)
      } else {
        setToSpinning(false)
      }
      const speed = spinning ? (Math.PI * 5) : (Math.PI * 0.5) // rad/sec
      spinBtnArrowSprite.rotation += speed * dt
    }
  }

  return { container, build, setHandlers, update, updateValues, setToSpinning }
}
