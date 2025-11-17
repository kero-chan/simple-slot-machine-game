import { Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { SETTINGS } from './config'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import gsap from "gsap";

// CONFIGURABLE: Duration (in seconds) for spin button effects to stay visible
const SPIN_BUTTON_EFFECT_DURATION = 1
const SPIN_BUTTON_EFFECT_FADEOUT = 0.3  // Fade out duration in seconds

// CONFIGURABLE: Notification text scaling (percentage of notification bar height)
const NOTIFICATION_TEXT_SCALE = 0.7  // Adjust this to make all notification texts bigger/smaller\
const WIN_TEXT_SCALE = 0.6  // Adjust this to make win amount texts bigger/smaller
const BIG_WIN_TEXT_SCALE = 0.42  // Smaller scale for big win notifications (x10+ multiplier)

// CONFIGURABLE: Punctuation (period and comma) positioning in win amount displays
const PUNCTUATION_SCALE_FACTOR = 0.5  // Scale multiplier for period and comma (0.5 = half the size of numbers)
const PERIOD_Y_POSITION = 1.0   // Vertical position multiplier for period (1.0 = aligned with bottom of numbers)
const COMMA_Y_POSITION = 0.65   // Vertical position multiplier for comma (0.65 = slightly above mid-height)

export function useFooter(gameState) {
  const gameStore = useGameStore()
  const settingsStore = useSettingsStore()

  const container = new Container()
  const menuContainer = new Container()
  const jackpotContainer = new Container()
  let handlers = {
    spin: () => {},
    increaseBet: () => {},
    decreaseBet: () => {}
  }

  const amountLabels = {};
  const btns = {}

  let btnHover
  let currentBg = null
  let spinBtnArrowSprite, spinBtnSprite, notiBgSprite, notiBgSprite1, notiBgSprite2, notiTextSprite, mutedIconSprite, notiMask, spinHoverCircle, winAmounContainer
  let mainMenuContainer, menuSettingContainer, setRect, amountContainer
  let lastSpinWinAmount = 0
  let showTotalWinAmount = false
  let x,y,w,h
  let inFreeSpinMode = false
  let spins = 0

  // Spin button visual effects
  let spinGlowCircle = null
  let spinShimmer = null
  let spinParticlesContainer = null
  let spinParticles = []
  let spinLightningContainer = null
  let lightningBolts = []
  let spinGlowStarSprite = null  // Star glow sprite
  let lightningStartTime = 0
  let wasSpinning = false

  // Free spin counter particle effects
  let jackpotParticlesContainer = null
  let jackpotParticles = []

  function setHandlers(h) {
    handlers = { ...handlers, ...h }
  }

  function getDeepSetting(path) {
    return path.split('.').reduce((o, k) => o?.[k], SETTINGS);
  }

  const subTex = (key) => {
    const setting = getDeepSetting(key)
    if (!setting) return null

    const sheetTex = ASSETS.loadedImages?.[setting.assetName] || ASSETS.imagePaths?.[setting.assetName]

    const source = sheetTex?.source || sheetTex?.baseTexture
    if (!source) return null

    const x = setting.position.x < 0 ? sheetTex.frame.x : setting.position.x
    const y = setting.position.y < 0 ? sheetTex.frame.y : setting.position.y
    const w = setting.position.w <= 0 ? source.width : setting.position.w
    const h = setting.position.h <= 0 ? source.height : setting.position.h

    return new Texture({ source, frame: new Rectangle(x, y, w, h)})
  }

  // ==== SPIN BUTTON TEXTURES ====
  const setToSpinning = (isSpinning) => {
    if (!spinBtnArrowSprite) return

    if (isSpinning) {
      spinBtnArrowSprite.texture = subTex('spin_btn_arrows.spinning')
    } else {
      spinBtnArrowSprite.texture = !!gameState.canSpin?.value ? subTex('spin_btn_arrows.normal') : subTex('spin_btn_arrows.inactive')
    }
  }

  const setNotification = (notiSubTex = null) => {
    winAmounContainer.removeChildren()
    if (!notiTextSprite) return
    notiBgSprite.visible = true
    notiBgSprite1.visible = false
    notiBgSprite2.visible = false
    notiTextSprite.visible = true

    if (!notiSubTex) {
      const randomKey = `text${Math.ceil(Math.random() * 4)}`
      notiTextSprite.texture = subTex('footer_notification_texts.'+randomKey)
    }

    notiTextSprite.mask = null
    notiTextSprite.scale.set(1)
    notiTextSprite.scale.set(NOTIFICATION_TEXT_SCALE * notiBgSprite.height / notiTextSprite.height)
    notiMask.clear()
    if (notiTextSprite.width > notiBgSprite.width * 0.6) {
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  function showWinAmount(value, isTotal = false) {
    winAmounContainer.removeChildren();
    notiTextSprite.visible = false;

    let bgToShow;
    const accumulatedWinAmount = gameState.accumulatedWinAmount.value;
    const betValue = gameState.bet.value;

    if (accumulatedWinAmount < 5 * betValue) {
      bgToShow = notiBgSprite;
    } else if (accumulatedWinAmount < 10 * betValue) {
      bgToShow = notiBgSprite1;
    } else {
      if (isTotal) {
        bgToShow = notiBgSprite2;
      } else {
        bgToShow = notiBgSprite1;
      }
    }

    [notiBgSprite, notiBgSprite1, notiBgSprite2].forEach(bg => {
      if (bg !== bgToShow) bg.visible = false;
    });

    if (currentBg !== bgToShow) {
      bgToShow.visible = true;
      bgToShow.alpha = 0;

      gsap.to(bgToShow, {
        alpha: 1,
        duration: 1,
        ease: "power2.out"
      });

      currentBg = bgToShow;
    } else {
      bgToShow.visible = true;
    }

    // Calculate target height for consistent sizing
    const scaleToUse = (bgToShow === notiBgSprite2) ? BIG_WIN_TEXT_SCALE : WIN_TEXT_SCALE
    const targetHeight = bgToShow.height * scaleToUse

    const digits = String(value).split('');
    let offsetX = 0;
    let textSprite
    const winTextKey = isTotal ? 'footer_notification_texts.total_win' : 'footer_notification_texts.win'
    const winTexture = subTex(winTextKey)
    if (!winTexture) {
      console.warn(`Missing texture: ${winTextKey}`)
      return
    }
    textSprite = new Sprite(winTexture)
    // Normalize text sprite to target height
    const textScale = targetHeight / textSprite.height
    textSprite.scale.set(textScale)
    textSprite.x = offsetX
    textSprite.y = 0
    winAmounContainer.addChild(textSprite)
    offsetX += textSprite.width * 1.02

    for (const d of digits) {
      if (d === '.' || d === ',') {
        // Shared logic for period and comma punctuation
        const textureKey = d === '.' ? 'footer_notification_texts.period' : 'footer_notification_texts.comma'
        const texture = subTex(textureKey)
        if (!texture) continue

        const sprite = new Sprite(texture)
        // Apply configurable punctuation scale and position
        let spriteScale = (targetHeight / sprite.height) * PUNCTUATION_SCALE_FACTOR
        if (d === ',') spriteScale = spriteScale * 0.7
        sprite.scale.set(spriteScale)
        sprite.x = offsetX - sprite.width * 0.1
        // Use different Y positions for period vs comma
        sprite.y = targetHeight * (d === '.' ? PERIOD_Y_POSITION : COMMA_Y_POSITION)

        // Apply rotation for period if needed
        if (d === '.') {
          const setting = getDeepSetting('footer_notification_texts.period')
          if (setting) sprite.rotation = setting.rotation
        }

        winAmounContainer.addChild(sprite)
        offsetX += sprite.width * 0.7
      } else {
        const texture = subTex(`footer_notification_texts.number${d}`)
        if (!texture) continue
        const sprite = new Sprite(texture)
        // Normalize to target height
        const spriteScale = targetHeight / sprite.height
        sprite.scale.set(spriteScale)
        sprite.x = offsetX;
        sprite.y = 0;
        winAmounContainer.addChild(sprite);

        offsetX += sprite.width;
      }
    }

    // Center the container in the background
    // For big win frame (notiBgSprite2), shift down more to align better
    // For small amounts, raise baseline higher
    const verticalOffset = (bgToShow === notiBgSprite2) ? 0.5 : 0.6
    winAmounContainer.x = bgToShow.x - winAmounContainer.width * 0.5
    winAmounContainer.y = bgToShow.y - winAmounContainer.height * verticalOffset
    winAmounContainer.alpha = 0;
    gsap.to(winAmounContainer, { alpha: 1, duration: 1, ease: "power2.out" });
  }

  function drawHoverCircle(sprite, radius = 0, x = null) {
      let xPos = x || sprite.x
      let yPos = sprite.getGlobalPosition().y
      btnHover.clear()
      btnHover.circle(xPos, yPos, radius).fill({color: 0xffffff, alpha: 0.2})
    }

  const buildSettingIcon = (key, i, text, visible,onClick) => {
      const btnStartX = 0.12 * w
      const btnSpace = (w - 2*btnStartX) / 5
      const iconColor = 0xb3794f
      const yPosition = 0.32 * menuContainer.height
      const keySetting = getDeepSetting(key)
      if (!keySetting) return

      let scaleRate = 0.75
      const targetButonHeightPer = 0.35

      const xPosition = btnStartX + i * btnSpace
      const btnSprite = new Sprite(subTex(key))
      btnSprite.visible = visible
      btnSprite.anchor.set(0.5)
      btnSprite.position.set(xPosition, yPosition)
      if (key === 'close_icon') {
        btnSprite.tint = 0xb4a8a1
      } else {
        btnSprite.tint = iconColor
      }
      btnSprite.rotation = keySetting.rotation
      btnSprite.scale.set(scaleRate * menuContainer.height * targetButonHeightPer / btnSprite.height)
      btnSprite.eventMode = 'static'
      menuSettingContainer.addChild(btnSprite)
      btns[key] = btnSprite

      btnSprite.on('pointerover', () => {
        drawHoverCircle(btnSprite, yPosition * 0.8)
        btnHover.visible = true
      });

      btnSprite.on('pointerout', () => {
        btnHover.visible = false;
      });

      if (typeof onClick === 'function') {
      btnSprite.on('pointerdown', () => {
        onClick()
      });
    }

    const label = new Text({text: text,
      style: {
        fontSize: 22,
        fill: 0xb4a8a1,
      }
    })
    label.anchor.set(0.5)
    label.position.set(xPosition, 1.9 * yPosition)
    label.scale.set(0.12 * menuContainer.height / label.height)
    menuSettingContainer.addChild(label)
  }

  function switchMenuMode() {
    if (gameState.inFreeSpinMode.value) {
      amountContainer.position.set(0, y + 0.75 * h)
      menuContainer.visible = false
      jackpotContainer.visible = true
      buildJackpotContainer()
    } else {
      amountContainer.position.set(0, y + Math.floor(h * 0.5)*0.61)
      jackpotContainer.visible = false
      menuContainer.visible = true
    }
  }

  function buildJackpotContainer() {
    // Preserve particle container when rebuilding
    const particlesTemp = jackpotParticlesContainer
    jackpotContainer.removeChildren()

    const spins = gameState.freeSpins.value
    const menuHeight = h
    jackpotContainer.position.set(x, y)
    container.addChild(jackpotContainer)

    // Initialize or re-add particle container for falling light bubbles
    if (!jackpotParticlesContainer) {
      jackpotParticlesContainer = new Container()
    } else {
      jackpotParticlesContainer = particlesTemp
    }
    jackpotContainer.addChild(jackpotParticlesContainer)

    let currentTextSprite
    const spinningSprite = new Sprite(subTex('jackpot_texts.spinning'))
    spinningSprite.visible = false
    const finishSprite = new Sprite(subTex('jackpot_texts.finish'))
    finishSprite.visible = false
    if (spins <= 0) {
      currentTextSprite = finishSprite
      currentTextSprite.scale.set(0.25 * menuHeight / currentTextSprite.height)
      currentTextSprite.position.set((w - currentTextSprite.width)  * 0.5, (h - currentTextSprite.height) * 0.45)
      currentTextSprite.visible = true
      jackpotContainer.addChild(currentTextSprite)
    } else {
      currentTextSprite = spinningSprite
      currentTextSprite.scale.set(0.4 * menuHeight / currentTextSprite.height)
      currentTextSprite.position.set((w - currentTextSprite.width)  * 0.25, (h - currentTextSprite.height) * 0.45)
      currentTextSprite.visible = true
      jackpotContainer.addChild(currentTextSprite)
      let offsetX = currentTextSprite.x + currentTextSprite.width * 1.1

      const digits = String(spins).split('');
      for (const d of digits) {
        if (d === '.') {
        } else if (d === ',') {
          const imageSrc = ASSETS.loadedImages?.i40_10 || ASSETS.imagePaths?.i40_10
          if (!imageSrc) continue
          const texture = imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc)
          const sprite = new Sprite(texture);
          sprite.scale.set(0.8 * currentTextSprite.height / sprite.height)
          sprite.x = offsetX;
          sprite.y = currentTextSprite.y + (currentTextSprite.height - sprite.height) / 2
          jackpotContainer.addChild(sprite);

          offsetX += sprite.width * 0.7;
        } else {
          const imageSrc = ASSETS.loadedImages?.[`i40_0${d}`] || ASSETS.imagePaths?.[`i40_0${d}`]
          if (!imageSrc) continue
          const texture = imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc)
          const sprite = new Sprite(texture);
          sprite.scale.set(0.8 * currentTextSprite.height / sprite.height)
          sprite.x = offsetX;
          sprite.y = currentTextSprite.y + (currentTextSprite.height - sprite.height) / 2
          jackpotContainer.addChild(sprite);

          offsetX += sprite.width;
        }
      }
    }


  }

  function startSpin() {
    spinHoverCircle.visible = false
    notiBgSprite.visible = true
    notiBgSprite1.visible = false
    notiBgSprite2.visible = false

    if (!!notiTextSprite && !notiTextSprite.visible) {
      setNotification()
    }
    showTotalWinAmount = false
  }

  function buildMenuContainer() {
    const menuHeight = 0.5*h
    menuContainer.position.set(x, y + menuHeight)
    container.addChild(menuContainer)

    const settingBg = new Graphics()
    const settingBgColor = 0x0c0c0c
    const settingBgAlpha = 0.4
    settingBg.rect(0, 0.05*menuHeight, w, menuHeight).fill({color: settingBgColor, alpha: settingBgAlpha})
    menuContainer.addChild(settingBg)


    // setting menu
    menuSettingContainer = new Container()
    menuSettingContainer.visible = false
    menuContainer.addChild(menuSettingContainer)
    buildSettingIcon('return_icon', 0, '退出', true, () => {
      alert('do you want to quit game?')
    })
    buildSettingIcon('volumn_open_icon', 1, '声音', settingsStore.gameSound, () => {
      gameStore.toggleGameSound()
    })
    buildSettingIcon('volumn_close_icon', 1, '声音', !settingsStore.gameSound, () => {
      gameStore.toggleGameSound()
    })
    buildSettingIcon('win_table_icon', 2, '赔付表', true, () => {
      // Show win table
    })
    buildSettingIcon('rule_icon', 3, '规则', true, () => {
      // Show rules
    })
    buildSettingIcon('history_icon', 4, '历史', true, () => {
      // Show history
    })
    buildSettingIcon('close_icon', 5, '关闭', true, () => {
      showSprite(mainMenuContainer)
      hideSprite(menuSettingContainer)
    })

    //  main menu
    const iconColor = 0xb3794f
    const mainMenuBtnStartX = 0.12 * w
    const mainMenuSpace = 0.15 * w
    const spinBtnSpace = 0.23 * w
    const targetButonHeightPer = 0.35
    const yPosition = 0.32 * menuContainer.height
    mainMenuContainer = new Container()
    menuContainer.addChild(mainMenuContainer)
    const lightningBgSetting = getDeepSetting('lightning_bg_icon')
    if (!!lightningBgSetting) {
      const lightningBgSprite = new Sprite(subTex('lightning_bg_icon'))
      lightningBgSprite.anchor.set(0.5)
      lightningBgSprite.rotation = lightningBgSetting.rotation
      lightningBgSprite.tint = iconColor
      lightningBgSprite.position.set(mainMenuBtnStartX, yPosition)
      lightningBgSprite.scale.set(0.8 * menuHeight * targetButonHeightPer / lightningBgSprite.height)
      mainMenuContainer.addChild(lightningBgSprite)

      const lightningSetting = getDeepSetting('lightning_icon')
      if (!!lightningSetting) {
        const lightningSprite = new Sprite(subTex('lightning_icon'))
        lightningSprite.anchor.set(0.5)
        lightningSprite.tint = iconColor
        lightningSprite.rotation = lightningSetting.rotation
        lightningSprite.position.set(lightningBgSprite.x, lightningBgSprite.y)
        lightningSprite.scale.set(0.8 * 0.6 * menuHeight * targetButonHeightPer / lightningSprite.height)
        mainMenuContainer.addChild(lightningSprite)
      }

      lightningBgSprite.eventMode = 'static';
      lightningBgSprite.on('pointerover', () => {
        drawHoverCircle(lightningBgSprite, yPosition * 0.8);
        btnHover.visible = true;
      });

      lightningBgSprite.on('pointerout', () => {
        btnHover.visible = false;
      });
    }

    // Minus button
    const minusSetting = getDeepSetting('minus_icon')
    if (!!minusSetting) {
      const minusSprite = new Sprite(subTex('minus_icon'))
      minusSprite.anchor.set(0.5)
      minusSprite.position.set(mainMenuContainer.x + mainMenuBtnStartX + mainMenuSpace, yPosition)
      minusSprite.tint = iconColor
      minusSprite.scale.set(menuHeight * targetButonHeightPer / minusSprite.height)
      minusSprite.rotation = minusSetting.rotation
      minusSprite.eventMode = 'static';
      minusSprite.on('pointerover', () => {
        drawHoverCircle(minusSprite, yPosition * 0.8);
        btnHover.visible = true;
      });

      minusSprite.on('pointerout', () => {
        btnHover.visible = false;
      });

      minusSprite.on('pointerdown', () => {
        btnHover.visible = false;
        gameStore.decreaseBet()
      });

      mainMenuContainer.addChild(minusSprite)
    }


    // Spin button
    const targetSpinBtnHeightPer = 0.8
    const spinSetting = getDeepSetting('spin_btn_bg')
    if (!!spinSetting) {
      spinBtnSprite = new Sprite(subTex('spin_btn_bg'))
      spinBtnSprite.anchor.set(0.5)
      spinBtnSprite.position.set(mainMenuBtnStartX + mainMenuSpace + spinBtnSpace, yPosition)
      spinBtnSprite.scale.set(targetSpinBtnHeightPer * menuHeight / spinBtnSprite.height)
      spinBtnSprite.rotation = spinSetting.rotation
      mainMenuContainer.addChild(spinBtnSprite)

      // spint button arrow
      spinBtnArrowSprite = new Sprite(subTex('spin_btn_arrows.normal'))
      spinBtnArrowSprite.anchor.set(0.5)
      spinBtnArrowSprite.position.set(spinBtnSprite.x, spinBtnSprite.y)
      spinBtnArrowSprite.scale.set(0.65 * targetSpinBtnHeightPer * menuHeight / spinBtnArrowSprite.height)
      mainMenuContainer.addChild(spinBtnArrowSprite)

      spinBtnSprite.eventMode = 'static'
      spinBtnSprite.on('pointerdown', () => {
        if (gameState.showStartScreen?.value) return
        if (gameState.isSpinning?.value) return
        if (!gameState.canSpin?.value) return

        // === POP UP ANIMATION ON CLICK ===

        // 1. Button pops up (scales up) then back to original
        const timeline = gsap.timeline()
        timeline.to(spinBtnSprite.scale, {
          x: spinBtnSprite.originalScale.x * 1.15,
          y: spinBtnSprite.originalScale.y * 1.15,
          duration: 0.15,
          ease: "back.out(2)"
        })
        timeline.to(spinBtnSprite.scale, {
          x: spinBtnSprite.originalScale.x,
          y: spinBtnSprite.originalScale.y,
          duration: 0.3,
          ease: "power2.out"
        })

        // 2. Arrow pops with button
        const arrowTimeline = gsap.timeline()
        arrowTimeline.to(spinBtnArrowSprite.scale, {
          x: spinBtnArrowSprite.originalScale.x * 1.15,
          y: spinBtnArrowSprite.originalScale.y * 1.15,
          duration: 0.15,
          ease: "back.out(2)"
        })
        arrowTimeline.to(spinBtnArrowSprite.scale, {
          x: spinBtnArrowSprite.originalScale.x,
          y: spinBtnArrowSprite.originalScale.y,
          duration: 0.3,
          ease: "power2.out"
        })

        // 3. Star glow appears when spinning starts (handled in update function)

        // 4. Arrow speed boost effect (handled in update function via game state)

        startSpin()
        handlers.spin && handlers.spin()
      })

      let tl

      spinBtnSprite.on('pointerover', () => {
        spinHoverCircle.visible = true;
        if (tl) tl.kill();

        spinHoverCircle.alpha = 0; // reset alpha trước khi tween
        tl = gsap.timeline({ repeat: -1, yoyo: true });
        tl.to(spinHoverCircle, { alpha: 0.3, duration: 0.5 });
      });

      spinBtnSprite.on('pointerout', () => {
        if (tl) {
          tl.kill();
          tl = null;
        }
        spinHoverCircle.visible = false;
        spinHoverCircle.alpha = 0; // reset alpha
      });

      spinHoverCircle = new Graphics().circle(spinBtnSprite.x, spinBtnSprite.y, spinBtnSprite.height * 0.46).fill({ color: 0xf7f76a, alpha: 1 });
      spinHoverCircle.alpha = 0
      spinHoverCircle.visible = false
      mainMenuContainer.addChild(spinHoverCircle)

      // === VISUAL EFFECTS: Star Glow ===

      // 1. Create star glow sprite
      const starTexture = ASSETS.loadedImages?.tiles_star || ASSETS.imagePaths?.tiles_star
      if (starTexture) {
        const texture = starTexture instanceof Texture ? starTexture : Texture.from(starTexture)
        spinGlowStarSprite = new Sprite(texture)
        spinGlowStarSprite.anchor.set(0.5)
        spinGlowStarSprite.x = spinBtnSprite.x
        spinGlowStarSprite.y = spinBtnSprite.y

        // Scale star to be larger than button
        const scale = (spinBtnSprite.height / spinGlowStarSprite.height) * 1.3
        spinGlowStarSprite.scale.set(scale)

        // Additive blend mode for glow effect
        spinGlowStarSprite.blendMode = 'add'
        spinGlowStarSprite.alpha = 0.6
        spinGlowStarSprite.visible = false  // Start hidden

        // Add star behind spin button (add to container before button sprites were added)
        mainMenuContainer.addChildAt(spinGlowStarSprite, mainMenuContainer.children.indexOf(spinBtnSprite))
      }

      // Store original scales for reset
      spinBtnSprite.originalScale = { x: spinBtnSprite.scale.x, y: spinBtnSprite.scale.y }
      spinBtnArrowSprite.originalScale = { x: spinBtnArrowSprite.scale.x, y: spinBtnArrowSprite.scale.y }

      // 2. Add floating particle sparkles (like in reference)
      spinParticlesContainer = new Container()
      spinParticlesContainer.x = spinBtnSprite.x
      spinParticlesContainer.y = spinBtnSprite.y
      mainMenuContainer.addChild(spinParticlesContainer)

      // 3. Add lightning effects container
      spinLightningContainer = new Container()
      spinLightningContainer.x = spinBtnSprite.x
      spinLightningContainer.y = spinBtnSprite.y
      mainMenuContainer.addChild(spinLightningContainer)

      // No continuous animations on button itself - button stays still when idle!
    }

    // plus button
    const plusSetting = getDeepSetting('minus_icon')
    if (!!plusSetting) {
      const plusSprite = new Sprite(subTex('plus_icon'))
      plusSprite.anchor.set(0.5)
      plusSprite.position.set(mainMenuContainer.x + mainMenuBtnStartX + mainMenuSpace + 2 * spinBtnSpace, yPosition)
      plusSprite.tint = iconColor
      plusSprite.scale.set(menuHeight * targetButonHeightPer / plusSprite.height)
      plusSprite.eventMode = 'static';
      plusSprite.on('pointerover', () => {
        drawHoverCircle(plusSprite, yPosition * 0.8);
        btnHover.visible = true;
      });

      plusSprite.on('pointerout', () => {
        btnHover.visible = false;
      });

       plusSprite.on('pointerdown', () => {
        btnHover.visible = false;
        gameStore.increaseBet()
      });

      mainMenuContainer.addChild(plusSprite)
    }

    // auto spin icon
    const autoSpinBgSetting = getDeepSetting('auto_spin_bg_icon')
    if (!!autoSpinBgSetting) {
      const autoSpinBgSprite = new Sprite(subTex('auto_spin_bg_icon'))
      autoSpinBgSprite.anchor.set(0.5)
      autoSpinBgSprite.tint = iconColor
      autoSpinBgSprite.position.set(mainMenuContainer.x + mainMenuBtnStartX + 2 * mainMenuSpace + 2 * spinBtnSpace, yPosition);
      autoSpinBgSprite.scale.set(0.8 * menuHeight * targetButonHeightPer / autoSpinBgSprite.height)
      mainMenuContainer.addChild(autoSpinBgSprite)

      const autoSpinArrowSetting = getDeepSetting('auto_spin_arrow_icon')
      if (!!autoSpinArrowSetting) {
        const autoSpinArrowSprite = new Sprite(subTex('auto_spin_arrow_icon'))
        autoSpinArrowSprite.anchor.set(0.5)
        autoSpinArrowSprite.tint = iconColor
        autoSpinArrowSprite.position.set(autoSpinBgSprite.x, autoSpinBgSprite.y)
        autoSpinArrowSprite.scale.set(0.8 * 0.7 * menuHeight * targetButonHeightPer / autoSpinArrowSprite.height)
        autoSpinArrowSprite.rotation = Math.random() * Math.PI * 2
        mainMenuContainer.addChild(autoSpinArrowSprite)
      }

      const autoSpinSetting = getDeepSetting('auto_spin_icon')
      if (!!autoSpinSetting) {
        const autoSpinSprite = new Sprite(subTex('auto_spin_icon'))
        autoSpinSprite.anchor.set(0.5)
        autoSpinSprite.tint = iconColor
        autoSpinSprite.position.set(autoSpinBgSprite.x, autoSpinBgSprite.y)
        autoSpinSprite.scale.set(0.8 * 0.32 * menuHeight * targetButonHeightPer / autoSpinSprite.height)
        autoSpinSprite.rotation = autoSpinSetting.rotation
        mainMenuContainer.addChild(autoSpinSprite)
      }

      autoSpinBgSprite.eventMode = 'static';
      autoSpinBgSprite.on('pointerover', () => {
        drawHoverCircle(autoSpinBgSprite, yPosition * 0.8);
        btnHover.visible = true;
      });

      autoSpinBgSprite.on('pointerout', () => {
        btnHover.visible = false;
      });
    }

     // Menu icon
    const menuSetting = getDeepSetting('menu_icon')
    if (!!menuSetting) {
      const menuIconSprite = new Sprite(subTex('menu_icon'))
      menuIconSprite.anchor.set(0.5)
      menuIconSprite.position.set(mainMenuBtnStartX + 2 * mainMenuSpace + 2 * spinBtnSpace + 0.9 * mainMenuBtnStartX, yPosition)
      menuIconSprite.scale.set(0.5 * menuHeight * targetButonHeightPer / menuIconSprite.height)
      menuIconSprite.rotation = menuSetting.rotation
      menuIconSprite.eventMode = 'static';
      menuIconSprite.on('pointerdown', () => {
        hideSprite(mainMenuContainer)
        showSprite(menuSettingContainer)
        btnHover.visible = false
      })

      menuIconSprite.on('pointerover', () => {
        drawHoverCircle(menuIconSprite, 0.8 * yPosition, menuIconSprite.x + menuIconSprite.width/2);
        btnHover.visible = true;
      });

      menuIconSprite.on('pointerout', () => {
        btnHover.visible = false;
      });
      mainMenuContainer.addChild(menuIconSprite)

      // mute icon
      const mutedIconSetting = getDeepSetting('muted_icon')
      if (!!mutedIconSetting) {
        mutedIconSprite = new Sprite(subTex('muted_icon'))
        mutedIconSprite.anchor.set(0.5)
        mutedIconSprite.visible = !settingsStore.gameSound
        mutedIconSprite.position.set(mainMenuBtnStartX + 2 * mainMenuSpace + 2 * spinBtnSpace + 0.9 * mainMenuBtnStartX, yPosition-0.8*menuIconSprite.height)
        mutedIconSprite.scale.set(0.3 * menuHeight * targetButonHeightPer / mutedIconSprite.height)
        mutedIconSprite.rotation = mutedIconSetting.rotation

        mainMenuContainer.addChild(mutedIconSprite)
      }
    }
  }

  function build(rect) {
    container.removeChildren()
    x = rect.x
    y = rect.y
    w = rect.w
    h = rect.h
    const setRectHeight = Math.floor(h * 0.5)
    const centerX = x + Math.floor(w / 2)

    // Footer Background
    const bgSprite = new Sprite(subTex('footer_bg'))
    const scale = Math.max(
      w / bgSprite.width,
      h / bgSprite.height
    )
    bgSprite.scale.set(scale)
    bgSprite.position.set(x, y + h*0.12)
    container.addChild(bgSprite)

    const bgBarSprite = new Sprite(subTex('footer_bar'))
    bgBarSprite.scale.set(0.6 * setRectHeight / bgBarSprite.height)
    bgBarSprite.anchor.set(0.5)
    bgBarSprite.position.set(centerX, y + h * 0.052)
    container.addChild(bgBarSprite)

    // Footer notification background
    notiBgSprite = new Sprite(subTex('footer_notification_bg'))
    notiBgSprite.scale.set(0.95 * w / notiBgSprite.width)
    notiBgSprite.anchor.set(0.5)
    notiBgSprite.position.set(centerX, y + h *0.12)
    notiBgSprite.visible = true
    container.addChild(notiBgSprite)
    currentBg = notiBgSprite

    notiBgSprite1 = new Sprite(subTex('footer_notification_bg1'))
    notiBgSprite1.scale.set(0.95 * w / notiBgSprite1.width)
    notiBgSprite1.anchor.set(0.5)
    notiBgSprite1.position.set(notiBgSprite.x, notiBgSprite.y)
    notiBgSprite1.visible = false
    container.addChild(notiBgSprite1)

    notiBgSprite2 = new Sprite(subTex('footer_notification_bg2'))
    notiBgSprite2.scale.set(0.95 * w / notiBgSprite2.width)
    notiBgSprite2.anchor.set(0.5)
    notiBgSprite2.position.set(notiBgSprite.x, notiBgSprite.y)
    notiBgSprite2.visible = false
    container.addChild(notiBgSprite2)

    winAmounContainer = new Container();
    container.addChild(winAmounContainer);

    const randomKey = `text${Math.ceil(Math.random() * 4)}`
    notiTextSprite = new Sprite(subTex('footer_notification_texts.'+randomKey))
    notiMask = new Graphics()
    container.addChild(notiMask)
    setNotification(notiTextSprite)
    container.addChild(notiTextSprite)

    // Credis / Bet / Win pills
    const pillGap = Math.floor(w * 0.01)
    const startX = Math.floor((w - 3*pillGap) * 0.02)
    const pillWidth = Math.floor((w - startX*2 - pillGap*2) / 3)
    const pillHeight = Math.floor(h * 0.13)
    const recColor = 0x0c0c0c
    const iconColor = 0xb3794f
    const amountColor = 0x85efff
    const recAlpha = 0.4

    amountContainer = new Container()

    container.addChild(amountContainer)

    const buildAmountRect = (key, i, text) => {
      const keySetting = getDeepSetting(key)
      if (!keySetting) return

      const rectX = startX + i*(pillWidth+pillGap)

      const bgRect = new Graphics().
        roundRect(rectX, 0, pillWidth, pillHeight, 0.25*pillHeight).
        fill({color: recColor, alpha: recAlpha})

      amountContainer.addChild(bgRect)

      const iconSprite = new Sprite(subTex(key))
      iconSprite.anchor.set(0.5)
      iconSprite.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.12, bgRect.height/2)
      iconSprite.tint = iconColor
      iconSprite.rotation = keySetting.rotation
      fitSpriteToRect(iconSprite, pillHeight, 0.58)
      amountContainer.addChild(iconSprite)

      const label = new Text({text: text,
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: amountColor,
        }
      })
      fitTextToBox(label, pillHeight, 0.5)  // Reduced from 0.6 to 0.5 (50% of height)
      label.anchor.set(0.5)
      label.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.6, bgRect.height/2)
      amountLabels[key] = label
      amountContainer.addChild(label)
    }

    buildAmountRect('wallet_icon', 0, formatNumber(gameState.credits.value))
    buildAmountRect('bet_amount_icon', 1, formatNumber(gameState.bet.value))
    buildAmountRect('win_amount_icon', 2, formatNumber(gameState.currentWin.value))


    buildMenuContainer()
    buildJackpotContainer()

    inFreeSpinMode = gameState.inFreeSpinMode.value
    spins = gameState.freeSpins.value
    switchMenuMode()

    btnHover = new Graphics();
    btnHover.visible = false;
    container.addChild(btnHover);


    // switchToFreeSpinMode()

  }

  // Hide button animation
  function hideSprite(sprite, duration = 0.3) {
    const startY = sprite.y;
    gsap.to(sprite, {
      y: startY + 70,
      alpha: 0,
      duration: duration,
      ease: "power2.out",
      onComplete: () => {
        sprite.visible = false;
        sprite.y = startY;
        sprite.alpha = 1;
      }
    });
  }

  // Show button animation
  function showSprite(sprite, duration = 0.03) {
    const targetY = sprite.y;
    const startY = targetY + 70;

    sprite.visible = true;
    sprite.y = startY;
    sprite.alpha = 0;

    gsap.to(sprite, {
      y: targetY,
      alpha: 1,
      duration: duration,
      ease: "power2.out",
    });
  }

  function fitTextToBox(textObj, boxHeight, heightPercent = 0.8, baseFontSize = 24) {
    const targetHeight = boxHeight * heightPercent
    // Reset to base font size first to prevent compounding
    textObj.style.fontSize = baseFontSize
    // Now calculate scale factor based on the reset size
    let scaleFactor = targetHeight / textObj.height
    textObj.style.fontSize = baseFontSize * scaleFactor
  }

  function fitSpriteToRect(sprite, boxHeight, heightPercent = 0.5) {
    const targetHeight = boxHeight * heightPercent
    let scaleFactor = targetHeight / sprite.height
    sprite.scale.set(1)
    sprite.scale.set(scaleFactor)
  }

  // === SPIN BUTTON PARTICLE SPARKLES (Matching Reference Image) ===
  function spawnSpinButtonParticle() {
    if (!spinParticlesContainer || !spinBtnSprite) return

    const particle = new Graphics()
    const size = 3 + Math.random() * 5
    particle.circle(0, 0, size)
    particle.fill({ color: 0xffd700, alpha: 0.9 })
    particle.blendMode = 'add'

    // Spawn around the button edge (like in reference)
    const angle = Math.random() * Math.PI * 2
    const radius = spinBtnSprite.height * 0.5
    particle.x = Math.cos(angle) * radius
    particle.y = Math.sin(angle) * radius

    // Gentle floating movement (slower, more elegant)
    particle.vx = (Math.random() - 0.5) * 0.3
    particle.vy = -0.3 - Math.random() * 0.3  // Float upward
    particle.life = 120  // Longer life for elegant effect
    particle.maxLife = 120

    spinParticlesContainer.addChild(particle)
    spinParticles.push(particle)
  }

  function updateSpinButtonParticles() {
    if (!spinParticlesContainer) return

    // Update existing particles (clean up any remaining)
    for (let i = spinParticles.length - 1; i >= 0; i--) {
      const p = spinParticles[i]
      p.life--

      // Move particle
      p.x += p.vx
      p.y += p.vy

      // Fade out elegantly
      const lifePercent = p.life / p.maxLife
      p.alpha = lifePercent * 0.9

      // Remove dead particles
      if (p.life <= 0) {
        spinParticlesContainer.removeChild(p)
        p.destroy()
        spinParticles.splice(i, 1)
      }
    }
  }

  // === JACKPOT COUNTER PARTICLE EFFECTS (Falling Light Bubbles) ===
  function spawnJackpotParticle() {
    if (!jackpotParticlesContainer) return

    const particle = new Graphics()
    const size = 3 + Math.random() * 6
    particle.circle(0, 0, size)
    particle.fill({ color: 0xffd700, alpha: 0.8 })
    particle.blendMode = 'add'

    // Spawn from wider area at center, lower position
    particle.x = w / 2 + (Math.random() - 0.5) * 200
    particle.y = 50 + Math.random() * 10

    // Falling motion with wider horizontal spread
    particle.vx = (Math.random() - 0.5) * 3.5  // Much wider spread
    particle.vy = 0.5 + Math.random() * 1.2
    particle.life = 150 + Math.random() * 100
    particle.maxLife = particle.life

    jackpotParticlesContainer.addChild(particle)
    jackpotParticles.push(particle)
  }

  function updateJackpotParticles() {
    if (!jackpotParticlesContainer) return

    const isFreeSpinMode = gameState.inFreeSpinMode?.value

    // Spawn new particles when in free spin mode
    if (isFreeSpinMode && Math.random() < 0.15) {
      spawnJackpotParticle()
    }

    // Update existing particles
    for (let i = jackpotParticles.length - 1; i >= 0; i--) {
      const p = jackpotParticles[i]
      p.life--

      // Move particle with gentle floating
      p.x += p.vx + Math.sin(p.life * 0.05) * 0.2
      p.y += p.vy

      // Fade out
      const lifePercent = p.life / p.maxLife
      p.alpha = lifePercent * 0.8

      // Remove dead particles or ones that fell below footer
      if (p.life <= 0 || p.y > h + 10) {
        jackpotParticlesContainer.removeChild(p)
        p.destroy()
        jackpotParticles.splice(i, 1)
      }
    }

    // Clear all particles when not in free spin mode
    if (!isFreeSpinMode && jackpotParticles.length > 0) {
      for (const p of jackpotParticles) {
        jackpotParticlesContainer.removeChild(p)
        p.destroy()
      }
      jackpotParticles.length = 0
    }
  }

  // === ROTATING LIGHT RAYS ===
  function createLightRays() {
    if (!spinBtnSprite) return null

    const rays = new Graphics()
    rays.blendMode = 'add'

    const numRays = 1000  // Many small rays for dense radiant effect
    const innerRadius = spinBtnSprite.height * 0.45  // Start from button edge area
    const outerRadius = spinBtnSprite.height * 0.65  // Extend further out to match button
    const rayWidth = 20  // Width at the base

    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2

      // Create triangular ray shape - smaller/thinner rays
      const innerX1 = Math.cos(angle - 0.02) * innerRadius
      const innerY1 = Math.sin(angle - 0.02) * innerRadius
      const innerX2 = Math.cos(angle + 0.02) * innerRadius
      const innerY2 = Math.sin(angle + 0.02) * innerRadius
      const outerX = Math.cos(angle) * outerRadius
      const outerY = Math.sin(angle) * outerRadius

      // Draw ray with gradient-like layers (reduced alpha for 1000 rays)
      // Outer glow layer (widest, most transparent)
      rays.poly([
        { x: innerX1 * 1.2, y: innerY1 * 1.2 },
        { x: innerX2 * 1.2, y: innerY2 * 1.2 },
        { x: outerX, y: outerY }
      ])
      rays.fill({ color: 0xffeb3b, alpha: 0.02 })

      // Middle golden layer
      rays.poly([
        { x: innerX1, y: innerY1 },
        { x: innerX2, y: innerY2 },
        { x: outerX * 0.9, y: outerY * 0.9 }
      ])
      rays.fill({ color: 0xffd700, alpha: 0.04 })

      // Inner bright core (thinnest)
      rays.poly([
        { x: innerX1 * 0.8, y: innerY1 * 0.8 },
        { x: innerX2 * 0.8, y: innerY2 * 0.8 },
        { x: outerX * 0.8, y: outerY * 0.8 }
      ])
      rays.fill({ color: 0xffffff, alpha: 0.05 })
    }

    rays.rotation = 0
    return rays
  }

  function updateLightning() {
    if (!spinLightningContainer) return

    const isSpinning = gameState.isSpinning?.value

    // Detect when spinning just started
    if (isSpinning && !wasSpinning) {
      lightningStartTime = Date.now()
    }
    wasSpinning = isSpinning

    // Calculate elapsed time since spin started
    const elapsedSeconds = (Date.now() - lightningStartTime) / 1000

    // Show rays with fade out
    if (isSpinning) {
      if (elapsedSeconds < SPIN_BUTTON_EFFECT_DURATION) {
        // Full opacity during effect duration
        if (lightningBolts.length === 0) {
          const rays = createLightRays()
          if (rays) {
            spinLightningContainer.addChild(rays)
            lightningBolts.push(rays)
          }
        } else {
          for (const rays of lightningBolts) {
            rays.rotation += 0.02
            rays.alpha = 1
          }
        }
      } else if (elapsedSeconds < SPIN_BUTTON_EFFECT_DURATION + SPIN_BUTTON_EFFECT_FADEOUT) {
        // Fade out phase
        const fadeProgress = (elapsedSeconds - SPIN_BUTTON_EFFECT_DURATION) / SPIN_BUTTON_EFFECT_FADEOUT
        for (const rays of lightningBolts) {
          rays.rotation += 0.02
          rays.alpha = 1 - fadeProgress
        }
      } else {
        // Clear rays after fade out
        for (const bolt of lightningBolts) {
          spinLightningContainer.removeChild(bolt)
          bolt.destroy()
        }
        lightningBolts.length = 0
      }
    } else {
      // Clear all rays when not spinning
      for (const bolt of lightningBolts) {
        spinLightningContainer.removeChild(bolt)
        bolt.destroy()
      }
      lightningBolts.length = 0
    }
  }


  // Refresh pill values each frame so they reflect game state
  function updateValues() {
    const spinWinAmount = gameState.accumulatedWinAmount.value
    amountLabels.wallet_icon.text = formatNumber(gameState.credits.value)
    amountLabels.bet_amount_icon.text = formatNumber(gameState.bet.value)
    if (spinWinAmount === 0) {
      amountLabels.win_amount_icon.text = formatNumber(gameState.currentWin.value)
      return
    }

    if (!!gameState.canSpin?.value) {
      if (gameState.inFreeSpinMode.value) {
        amountLabels.win_amount_icon.text = formatNumber(spinWinAmount)
      } else {
        amountLabels.win_amount_icon.text = formatNumber(gameState.currentWin.value)
      }
      if (!showTotalWinAmount) {
        if (gameState.currentWin.value > 0) {
          showWinAmount(formatNumber(gameState.currentWin.value), true)
        }
        showTotalWinAmount = true
      }
    } else {
      amountLabels.win_amount_icon.text = formatNumber(spinWinAmount)
      if (!!winAmounContainer) {
        if (lastSpinWinAmount !== gameState.lastWinAmount.value) {
          showWinAmount(formatNumber(gameState.lastWinAmount.value))
        }
      }
    }

    lastSpinWinAmount = gameState.lastWinAmount.value
  }

  let notiState = 'idle'; // 'idle' = đứng yên trước scroll, 'scroll' = chạy text, 'waitAfterScroll' = chờ sau scroll
  let notiTimer = 0;
  const idleDuration = 1; // giây đứng yên trước scroll
  const afterScrollDuration = 1; // giây chờ sau scroll
  const scrollSpeed = 70; // px/giây

  function update(timestamp = 0) {
    const dt = lastTs ? Math.max(0, (timestamp - lastTs) / 1000) : 0;
    lastTs = timestamp;

    if (inFreeSpinMode !== gameState.inFreeSpinMode.value || spins !== gameState.freeSpins.value) {
      inFreeSpinMode = gameState.inFreeSpinMode.value
      spins = gameState.freeSpins.value
      switchMenuMode()
      startSpin()
    }

    if (btns['volumn_open_icon'] && btns['volumn_close_icon']) {
      if (settingsStore.gameSound) {
        btns['volumn_open_icon'].visible = true
        btns['volumn_close_icon'].visible = false
      } else {
        btns['volumn_open_icon'].visible = false
        btns['volumn_close_icon'].visible = true
      }
    }

    if (mutedIconSprite && !settingsStore.gameSound) {
      mutedIconSprite.visible = true
    } else {
      mutedIconSprite.visible = false
    }

    // Spin button
    if (spinBtnArrowSprite) {
      const spinning = !!gameState.isSpinning?.value;
      setToSpinning(spinning);
      const speed = spinning ? (Math.PI * 5) : (Math.PI * 0.5);
      spinBtnArrowSprite.rotation += speed * dt;

      // Control star glow based on button state
      const canSpin = !!gameState.canSpin?.value

      // Calculate elapsed time since spin started (same logic as lightning)
      const elapsedSeconds = (Date.now() - lightningStartTime) / 1000
      const showGlow = spinning && elapsedSeconds < SPIN_BUTTON_EFFECT_DURATION

      // Show star glow with fade out
      if (spinGlowStarSprite) {
        if (spinning) {
          if (elapsedSeconds < SPIN_BUTTON_EFFECT_DURATION) {
            // Full opacity during effect duration
            spinGlowStarSprite.visible = true
            spinGlowStarSprite.alpha = 0.6
            spinGlowStarSprite.rotation += 0.03
          } else if (elapsedSeconds < SPIN_BUTTON_EFFECT_DURATION + SPIN_BUTTON_EFFECT_FADEOUT) {
            // Fade out phase
            const fadeProgress = (elapsedSeconds - SPIN_BUTTON_EFFECT_DURATION) / SPIN_BUTTON_EFFECT_FADEOUT
            spinGlowStarSprite.alpha = 0.6 * (1 - fadeProgress)
            spinGlowStarSprite.rotation += 0.03
          } else {
            // Completely hidden after fade out
            spinGlowStarSprite.visible = false
          }
        } else {
          spinGlowStarSprite.visible = false
        }
      }

      // Ensure button and arrow scales return to original when idle
      if (!spinning) {
        if (Math.abs(spinBtnSprite.scale.x - spinBtnSprite.originalScale.x) > 0.01) {
          gsap.to(spinBtnSprite.scale, {
            x: spinBtnSprite.originalScale.x,
            y: spinBtnSprite.originalScale.y,
            duration: 0.2,
            ease: "power2.out"
          })
        }
        if (Math.abs(spinBtnArrowSprite.scale.x - spinBtnArrowSprite.originalScale.x) > 0.01) {
          gsap.to(spinBtnArrowSprite.scale, {
            x: spinBtnArrowSprite.originalScale.x,
            y: spinBtnArrowSprite.originalScale.y,
            duration: 0.2,
            ease: "power2.out"
          })
        }
      }
    }

    // Update spin button particles and lightning
    updateSpinButtonParticles()
    updateLightning()

    // Update jackpot counter falling particles
    updateJackpotParticles()

    if (!notiTextSprite || !notiTextSprite.visible) return;

    if (!notiTextSprite.mask || notiTextSprite.width <= notiBgSprite.width*0.6) {
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


  return { container, build, setHandlers, update, updateValues }
}
