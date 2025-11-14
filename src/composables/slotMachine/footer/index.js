import { Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { SETTINGS } from './config'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import gsap from "gsap";

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
    notiTextSprite.scale.set(0.6 * notiBgSprite.height / notiTextSprite.height)
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

    const digits = String(value).split('');
    let offsetX = 0;
    let textSprite
    if (isTotal) {
      textSprite = new Sprite(subTex(`footer_notification_texts.total_win`));
    } else {
      textSprite = new Sprite(subTex(`footer_notification_texts.win`));
    }
    winAmounContainer.addChild(textSprite)
    textSprite.scale.set(0.7)
    textSprite.y = 0.07 * textSprite.height
    offsetX += textSprite.width * 1.1

    for (const d of digits) {
      if (d === '.') {
        const setting = getDeepSetting('footer_notification_texts.period')
        const sprite = new Sprite(subTex(`footer_notification_texts.period`))
        sprite.scale.set(1.1)
        sprite.x = offsetX - sprite.width * 0.2;
        sprite.y = 2.5 *sprite.height
        sprite.rotation = setting.rotation
        winAmounContainer.addChild(sprite)
        offsetX += sprite.width * 0.7;
      } else if (d === ',') {
        const sprite = new Sprite(subTex(`footer_notification_texts.comma`));
        sprite.x = offsetX - sprite.width * 0.1;
        sprite.y = 1.2*sprite.height;
        winAmounContainer.addChild(sprite);

        offsetX += sprite.width * 0.6;
      } else {
        const sprite = new Sprite(subTex(`footer_notification_texts.number${d}`));
        sprite.x = offsetX;
        sprite.y = 0;
        winAmounContainer.addChild(sprite);

        offsetX += sprite.width;
      }
    }

    winAmounContainer.scale.set(0.7 * notiBgSprite.height / winAmounContainer.height)
    winAmounContainer.x = notiBgSprite.x - winAmounContainer.width * 0.5
    winAmounContainer.y = notiBgSprite.y - winAmounContainer.height * 0.5

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
    jackpotContainer.removeChildren()

    const spins = gameState.freeSpins.value
    const menuHeight = h
    jackpotContainer.position.set(x, y)
    container.addChild(jackpotContainer)

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
        } else {
          const sprite = new Sprite(subTex(`jackpot_texts.number${d}`));
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
      fitTextToBox(label, pillHeight, 0.6)
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
    const spinWinAmount = gameState.accumulatedWinAmount.value
    amountLabels.wallet_icon.text = formatNumber(gameState.credits.value)
    amountLabels.bet_amount_icon.text = formatNumber(gameState.bet.value)
    if (spinWinAmount === 0) {
      amountLabels.win_amount_icon.text = formatNumber(gameState.currentWin.value)
      return
    }

    if (!!gameState.canSpin?.value) {
      amountLabels.win_amount_icon.text = formatNumber(gameState.currentWin.value)
      if (!showTotalWinAmount) {
        showWinAmount(formatNumber(formatNumber(gameState.currentWin.value)), true)
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
    }

    if (!notiTextSprite || !notiTextSprite.visible) return;

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


  return { container, build, setHandlers, update, updateValues }
}
