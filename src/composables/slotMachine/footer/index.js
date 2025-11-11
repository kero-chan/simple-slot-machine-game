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

  let spinBtnArrowSprite, spinBtnSprite, notiBgSprite, notiTextSprite, notiMask

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

  const setNotification = (notiSubTex = null) => {
    if (!notiTextSprite) return

    if (!notiSubTex) {
      const randomKey = `text${Math.ceil(Math.random() * 4)}`
      const cfg = IMAGE_POSITIONS.footer_notification_texts[randomKey]
      notiTextSprite.texture = subTex(loadBaseTexture('footer_notification_text'), cfg)
    }

    notiTextSprite.mask = null
    notiTextSprite.scale.set(1)
    notiTextSprite.scale.set(0.7 * notiBgSprite.height / notiTextSprite.height)
    notiMask.clear()
    if (notiTextSprite.width > notiBgSprite.width * 0.9) {
      const visibleWidth = notiBgSprite.width * 0.8
      const visibleHeight = notiBgSprite.height
      notiMask.rect(
        notiBgSprite.x - notiBgSprite.width * 0.55 + notiBgSprite.width * 0.15,
        notiBgSprite.y - notiBgSprite.height * 0.5,
        visibleWidth,
        visibleHeight
      )
      notiMask.fill({ color: 0xffffff, alpha: 1 })

      notiTextSprite.mask = notiMask
      const yCenter = notiBgSprite.y
      const startX = notiBgSprite.x - notiBgSprite.width * 0.35 + notiTextSprite.width / 2
      notiTextSprite.anchor.set(0.5)
      notiTextSprite.position.set(startX, yCenter)
    } else {
      notiTextSprite.anchor.set(0.5)
      notiTextSprite.position.set(notiBgSprite.position.x, notiBgSprite.position.y)
    }
  }

  let lastTs = 0
  const VALUE_NAME_PREFIX = 'footer-pill-value-'


  function build(rect) {
    container.removeChildren()
    const { x, y, w, h } = rect
    const setRectHeight = Math.floor(h * 0.5)

    // Centered spin button cluster
    const centerX = x + Math.floor(w / 2)
    const centerY = y + Math.floor(h / 2)

    // Footer Background
    const bgSubTex = (rect) => subTex(loadBaseTexture('footer_bg'), rect)
    if (IMAGE_POSITIONS.footer_bg) {
      const bgSprite = new Sprite(bgSubTex(IMAGE_POSITIONS.footer_bg))
       const scale = Math.max(
        w / bgSprite.width,
        h / bgSprite.height
      )
      bgSprite.scale.set(scale)
      bgSprite.position.set(x, y + h*0.12)
      container.addChild(bgSprite)
    }

    if (IMAGE_POSITIONS.footer_bar) {
      const bgBarSprite = new Sprite(bgSubTex(IMAGE_POSITIONS.footer_bar))
      bgBarSprite.scale.set(0.48 * setRectHeight / bgBarSprite.height)
      bgBarSprite.anchor.set(0.5)
      bgBarSprite.position.set(centerX, y + h * 0.052)
      container.addChild(bgBarSprite)
    }

    // Footer notification background
    if (IMAGE_POSITIONS.footer_notification_bg) {
      notiBgSprite = new Sprite(subTex(loadBaseTexture('footer_notification_bg'),IMAGE_POSITIONS.footer_notification_bg))
      notiBgSprite.scale.set(0.95 * w / notiBgSprite.width)
      notiBgSprite.anchor.set(0.5)
      notiBgSprite.position.set(centerX, y + h *0.12)
      container.addChild(notiBgSprite)


      const randomKey = `text${Math.ceil(Math.random() * 4)}`
      const cfg = IMAGE_POSITIONS.footer_notification_texts[randomKey]
      if (cfg) {
        notiTextSprite = new Sprite(subTex(loadBaseTexture('footer_notification_text'), cfg))
        notiMask = new Graphics()
        container.addChild(notiMask)
        setNotification(notiTextSprite)
        container.addChild(notiTextSprite)
      }
    }

    const iconSettingSubTex = (r) => subTex(loadBaseTexture('footer_icon_setting'), r)
    const iconSetting1SubTex = (r) => subTex(loadBaseTexture('footer_icon_setting1'), r)

    // Credis / Bet / Win pills
    const pillGap = Math.floor(w * 0.01)
    const startX = Math.floor((w - 3*pillGap) * 0.02)
    const pillWidth = Math.floor((w - startX*2 - pillGap*2) / 3)
    const pillHeight = Math.floor(h * 0.13)
    const recColor = 0x57361f
    const iconColor = 0xb3794f
    const amountColor = 0x85efff
    const recAlpha = 0.8

    const buildRect = (subText, i, text) => {
      const rectX = startX + i*(pillWidth+pillGap)
      const rectY = y + setRectHeight*0.61

      const baseRect = new Graphics().
        roundRect(rectX, rectY, pillWidth, pillHeight, 0.25*pillHeight).
        fill({color: recColor, alpha: recAlpha})

      container.addChild(baseRect)

      const iconSprite = new Sprite(subText)
      iconSprite.anchor.set(0.5)
      iconSprite.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.12, rectY+baseRect.height/2)
      iconSprite.tint = iconColor
      fitSpriteToRect(iconSprite, pillHeight, 0.5)
      container.addChild(iconSprite)

      const label = new Text({text: text,
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: amountColor,
        }
      })
      fitTextToBox(label, pillHeight, 0.65)
      label.anchor.set(0.5)
      label.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.6, rectY+baseRect.height/2)
      container.addChild(label)
    }

    buildRect(iconSettingSubTex(IMAGE_POSITIONS.wallet_icon), 0,'100,000.00')
    buildRect(iconSetting1SubTex(IMAGE_POSITIONS.bet_amount_icon), 1, '12.00')
    buildRect(iconSetting1SubTex(IMAGE_POSITIONS.win_amount_icon), 2, '0.00')



    // Bet Setting
    const setRect = new Graphics()
    setRect.fill({color: recColor, alpha: recAlpha})
    setRect.roundRect(x, y+(h-setRectHeight), w, setRectHeight, 0)
    setRect.fill()
    container.addChild(setRect)

    const btnYPos = y+h*0.65
    const targetButonHeightPer = 0.35
    // Minus / Plus buttons
    const minusSprite = new Sprite(iconSettingSubTex(IMAGE_POSITIONS.minus_icon))
    minusSprite.anchor.set(0.5)
    minusSprite.position.set(centerX - 0.45*centerX, btnYPos)
    minusSprite.tint = iconColor
    minusSprite.scale.set(setRectHeight * targetButonHeightPer / minusSprite.height)
    container.addChild(minusSprite)

    const plusSprite = new Sprite(iconSettingSubTex(IMAGE_POSITIONS.plus_icon))
    plusSprite.anchor.set(0.5)
    plusSprite.position.set(centerX + 0.45*centerX, btnYPos)
    plusSprite.tint = iconColor
    plusSprite.scale.set(setRectHeight * targetButonHeightPer / plusSprite.height)
    container.addChild(plusSprite)

    // lightning icon
    const lightningBgSprite = new Sprite(iconSetting1SubTex(IMAGE_POSITIONS.lightning_bg_icon))
    lightningBgSprite.anchor.set(0.5)
    lightningBgSprite.position.set(centerX - 0.75*centerX, btnYPos)
    lightningBgSprite.tint = iconColor
    lightningBgSprite.scale.set(0.8 * setRectHeight * targetButonHeightPer / lightningBgSprite.height)
    container.addChild(lightningBgSprite)
    const lightningSprite = new Sprite(iconSettingSubTex(IMAGE_POSITIONS.lightning_icon))
    lightningSprite.anchor.set(0.5)
    lightningSprite.position.set(lightningBgSprite.position.x, btnYPos)
    lightningSprite.tint = iconColor
    lightningSprite.scale.set(0.8 * 0.6 * setRectHeight * targetButonHeightPer / lightningSprite.height)
    container.addChild(lightningSprite)

    // auto spin icon
    const autoSpinBgSprite = new Sprite(iconSetting1SubTex(IMAGE_POSITIONS.auto_spin_bg_icon))
    autoSpinBgSprite.anchor.set(0.5)
    autoSpinBgSprite.position.set(centerX + 0.75*centerX, btnYPos)
    autoSpinBgSprite.tint = iconColor
    autoSpinBgSprite.scale.set(0.8 * setRectHeight * targetButonHeightPer / autoSpinBgSprite.height)
    container.addChild(autoSpinBgSprite)

    const autoSpinArrowSprite = new Sprite(iconSettingSubTex(IMAGE_POSITIONS.auto_spin_arrow_icon))
    autoSpinArrowSprite.anchor.set(0.5)
    autoSpinArrowSprite.position.set(autoSpinBgSprite.position.x, btnYPos)
    autoSpinArrowSprite.tint = iconColor
    autoSpinArrowSprite.scale.set(0.8 * 0.7 * setRectHeight * targetButonHeightPer / autoSpinArrowSprite.height)
    autoSpinArrowSprite.rotation = Math.random() * Math.PI * 2
    container.addChild(autoSpinArrowSprite)

    const autoSpinSprite = new Sprite(iconSettingSubTex(IMAGE_POSITIONS.auto_spin_icon))
    autoSpinSprite.anchor.set(0.5)
    autoSpinSprite.position.set(autoSpinBgSprite.position.x, btnYPos)
    autoSpinSprite.tint = iconColor
    autoSpinSprite.scale.set(0.8 * 0.32 * setRectHeight * targetButonHeightPer / autoSpinSprite.height)
    autoSpinSprite.rotation = -(Math.PI / 2)
    container.addChild(autoSpinSprite)

    // Menu icon
    const menuIconSprite = new Sprite(iconSettingSubTex(IMAGE_POSITIONS.menu_icon))
    menuIconSprite.anchor.set(0.5)
    menuIconSprite.position.set(centerX + 0.98*centerX, btnYPos)
    menuIconSprite.scale.set(0.6 * setRectHeight * targetButonHeightPer / menuIconSprite.height)
    menuIconSprite.rotation = -(Math.PI / 2)
    container.addChild(menuIconSprite)

    // Spin button
    const spinBtnBaseTex = loadBaseTexture('spin')
    const targetSpinBtnHeightPer = 0.8
    if (IMAGE_POSITIONS.spin_btn_bg) {
      spinBtnSprite = new Sprite(subTex(spinBtnBaseTex, IMAGE_POSITIONS.spin_btn_bg))
      spinBtnSprite.anchor.set(0.5)
      spinBtnSprite.position.set(centerX, btnYPos)
      spinBtnSprite.scale.set(targetSpinBtnHeightPer * setRectHeight / spinBtnSprite.height)
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
        spinBtnArrowSprite.position.set(spinBtnSprite.position.x, btnYPos)
        spinBtnArrowSprite.scale.set(0.65 * targetSpinBtnHeightPer * setRectHeight / spinBtnArrowSprite.height)
        container.addChild(spinBtnArrowSprite)
      }
    }
  }

  function fitTextToBox(textObj, boxHeight, heightPercent = 0.8) {
    const targetHeight = boxHeight * heightPercent
    const baseSize = textObj.style.fontSize
    let scaleFactor = targetHeight / textObj.height
    textObj.style.fontSize = baseSize * scaleFactor
  }

  function fitSpriteToRect(sprite, boxHeight, heightPercent = 0.5) {
    const targetHeight = boxHeight * heightPercent
    let scaleFactor = targetHeight / sprite.height
    sprite.scale.set(1)
    sprite.scale.set(scaleFactor)
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

  let notiState = 'idle'; // 'idle' = đứng yên trước scroll, 'scroll' = chạy text, 'waitAfterScroll' = chờ sau scroll
  let notiTimer = 0;
  const idleDuration = 1; // giây đứng yên trước scroll
  const afterScrollDuration = 1; // giây chờ sau scroll
  const scrollSpeed = 70; // px/giây

  function update(timestamp = 0) {
    const dt = lastTs ? Math.max(0, (timestamp - lastTs) / 1000) : 0;
    lastTs = timestamp;

    // Spin button
    const canSpin = !!gameState.canSpin?.value;
    if (spinBtnSprite) {
      spinBtnSprite.alpha = canSpin ? 1 : 0.5;
      spinBtnSprite.cursor = canSpin ? 'pointer' : 'not-allowed';
    }

    if (spinBtnArrowSprite) {
      const spinning = !!gameState.isSpinning?.value;
      setToSpinning(spinning);
      const speed = spinning ? (Math.PI * 5) : (Math.PI * 0.5);
      spinBtnArrowSprite.rotation += speed * dt;
    }

    if (!notiTextSprite) return;

    if (!notiTextSprite.mask || notiTextSprite.width <= notiBgSprite.width*0.8) {
      // short notification, don't animate
      notiTimer += dt;
      if (notiTimer >= 3) {
        setNotification();
        notiTimer = 0;
      }
      return;
    }

    // long animation with mask
    if (notiState === 'idle') {
      notiTimer += dt;
      if (notiTimer >= idleDuration) {
        notiState = 'scroll';
        notiTimer = 0;
      }
    } else if (notiState === 'scroll') {
      notiTextSprite.x -= scrollSpeed * dt;

      const maskLeft = notiBgSprite.x - notiBgSprite.width*0.4;
      if (notiTextSprite.x < maskLeft - notiTextSprite.width/2) {
        notiState = 'waitAfterScroll';
        notiTimer = 0;
      }
    } else if (notiState === 'waitAfterScroll') {
      notiTimer += dt;
      if (notiTimer >= afterScrollDuration) {
        setNotification();
        notiState = 'idle';
        notiTimer = 0;
      }
    }
  }


  return { container, build, setHandlers, update, updateValues, setToSpinning }
}
