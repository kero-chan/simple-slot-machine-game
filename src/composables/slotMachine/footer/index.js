import { Container, Graphics, Text, Sprite, Texture, Rectangle } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { SETTINGS } from './config'
import { useGameStore } from '../../../stores/gameStore'

export function useFooter(gameState) {
  const gameStore = useGameStore()

  const container = new Container()
  let handlers = {
    spin: () => {},
    increaseBet: () => {},
    decreaseBet: () => {}
  }

  const amountLabels = {};

  let spinBtnArrowSprite, spinBtnSprite, notiBgSprite, notiBgSprite1, notiBgSprite2, notiTextSprite, mutedIconSprite, notiMask, spinHoverCircle, winAmounContainer
  let hoverAnimating = false;
  let hoverAlphaDir = 1; // 1 = tăng alpha, -1 = giảm alpha
  const hoverSpeed = 1.2;  // tốc độ thay đổi alpha
  let lastSpinWinAmount = 0
  let showTotalWinAmount = false

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

    const accumulatedWinAmount = gameState.accumulatedWinAmount.value
    const betValue = gameState.bet.value
    if (accumulatedWinAmount < 5 * betValue) {
      notiBgSprite.visible = true
      notiBgSprite1.visible = false
      notiBgSprite2.visible = false
    } else if (accumulatedWinAmount < 10 * betValue) {
      notiBgSprite.visible = false
      notiBgSprite1.visible = true
      notiBgSprite2.visible = false
    } else {
      if (isTotal) {
        notiBgSprite.visible = false
        notiBgSprite1.visible = false
        notiBgSprite2.visible = true
      } else {
        notiBgSprite.visible = false
        notiBgSprite1.visible = true
        notiBgSprite2.visible = false
      }
    }

    winAmounContainer.scale.set(0.7 * notiBgSprite.height / winAmounContainer.height)
    winAmounContainer.x = notiBgSprite.x - winAmounContainer.width * 0.5
    winAmounContainer.y = notiBgSprite.y - winAmounContainer.height * 0.5
  }


  function build(rect) {
    container.removeChildren()
    const { x, y, w, h } = rect
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

    const buildAmountRect = (key, i, text) => {
      const keySetting = getDeepSetting(key)
      if (!keySetting) return

      const rectX = startX + i*(pillWidth+pillGap)
      const rectY = y + setRectHeight*0.61

      const baseRect = new Graphics().
        roundRect(rectX, rectY, pillWidth, pillHeight, 0.25*pillHeight).
        fill({color: recColor, alpha: recAlpha})

      container.addChild(baseRect)

      const iconSprite = new Sprite(subTex(key))
      iconSprite.anchor.set(0.5)
      iconSprite.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.12, rectY+baseRect.height/2)
      iconSprite.tint = iconColor
      iconSprite.rotation = keySetting.rotation
      fitSpriteToRect(iconSprite, pillHeight, 0.58)
      container.addChild(iconSprite)

      const label = new Text({text: text,
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: amountColor,
        }
      })
      fitTextToBox(label, pillHeight, 0.6)
      label.anchor.set(0.5)
      label.position.set(startX + i*(pillWidth+pillGap) + pillWidth*0.6, rectY+baseRect.height/2)
      amountLabels[key] = label
      container.addChild(label)
    }

    buildAmountRect('wallet_icon', 0, formatNumber(gameState.credits.value))
    buildAmountRect('bet_amount_icon', 1, formatNumber(gameState.bet.value))
    buildAmountRect('win_amount_icon', 2, formatNumber(gameState.currentWin.value))


    // Bet Setting
    const setRect = new Graphics()
    const setRectYPos = y+(h-setRectHeight)
    setRect.fill({color: recColor, alpha: recAlpha})
    setRect.roundRect(x, setRectYPos, w, setRectHeight, 0)
    setRect.fill()
    container.addChild(setRect)

    const btnYPos = y+h*0.65
    const targetButonHeightPer = 0.35

    const mainMenuContainer = new Container()
    mainMenuContainer.position.set(x, btnYPos)
    mainMenuContainer.visible = true
    container.addChild(mainMenuContainer)

    // menu hiden buttons
    const btnStartX = 0.12 * w
    const btnSpace = (w - 2*btnStartX) / 5
    const menuSettingContainer = new Container()
    menuSettingContainer.position.set(x, btnYPos)
    menuSettingContainer.visible = false
    container.addChild(menuSettingContainer)

    const buildMenuIcon = (key, i, text, onClick) => {
      const keySetting = getDeepSetting(key)
      if (!keySetting) return

      let scaleRate = 0.72

      const xPosition = btnStartX + i * btnSpace
      const btnSprite = new Sprite(subTex(key))
      btnSprite.anchor.set(0.5)
      btnSprite.position.set(xPosition, 0)
      if (key === 'close_icon') {
        btnSprite.tint = 0xb4a8a1
      } else {
        btnSprite.tint = iconColor
      }
      btnSprite.rotation = keySetting.rotation
      btnSprite.scale.set(scaleRate * setRectHeight * targetButonHeightPer / btnSprite.height)
      btnSprite.eventMode = 'static'
      btnSprite.cursor = 'pointer'
      btnSprite.hitArea = new Rectangle(
        -btnSprite.width / 2,
        -btnSprite.height / 2,
        btnSprite.width,
        btnSprite.height
      )

      menuSettingContainer.addChild(btnSprite)

      let btnSprite1 = null
      if (key === 'volumn_open_icon') {
        const setting1 = getDeepSetting('volumn_close_icon')
        if (setting1) {
          btnSprite1 = new Sprite(subTex('volumn_close_icon'))
          btnSprite1.anchor.set(0.5)
          btnSprite1.visible = false
          btnSprite1.position.set(xPosition, 0)
          btnSprite1.tint = iconColor
          btnSprite1.rotation = setting1.rotation
          btnSprite1.scale.set(1.05 * scaleRate * setRectHeight * targetButonHeightPer / btnSprite1.height)
          btnSprite1.eventMode = 'static'
          btnSprite1.cursor = 'pointer'
          btnSprite1.hitArea = new Rectangle(
            -btnSprite1.width / 2,
            -btnSprite1.height / 2,
            btnSprite1.width,
            btnSprite1.height
          )

          btnSprite1.on('pointerover', () => {
            drawHoverCircle(btnSprite1)
            hoverCircle.visible = true
          });

          btnSprite1.on('pointerout', () => {
            hoverCircle.visible = false;
          });

          if (typeof onClick === 'function') {
            btnSprite1.on('pointerdown', () => {
              onClick()
              hoverCircle.visible = false
              btnSprite1.visible = false
              btnSprite.visible = true
            });
          }
          menuSettingContainer.addChild(btnSprite1)
        }
      }

      btnSprite.on('pointerover', () => {
        drawHoverCircle(btnSprite)
        hoverCircle.visible = true
      });

      btnSprite.on('pointerout', () => {
        hoverCircle.visible = false;
      });

      if (typeof onClick === 'function') {
        btnSprite.on('pointerdown', () => {
          onClick()
          hoverCircle.visible = false
          if (!!btnSprite1) {
            btnSprite1.visible = true
            btnSprite.visible = false
          }
        });
      }

      const label = new Text({text: text,
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: 0xb4a8a1,
        }
      })
      label.anchor.set(0.5)
      label.position.set(xPosition, 1.1 * btnSprite.height)
      menuSettingContainer.addChild(label)
    }


    buildMenuIcon('return_icon', 0, '退出', () => {
      alert('do you want to quit game?')
    })
    buildMenuIcon('volumn_open_icon', 1, '声音', () => {
      gameStore.toggleGameSound()
    })
    buildMenuIcon('win_table_icon', 2, '赔付表', () => {
      // Show win table
    })
    buildMenuIcon('rule_icon', 3, '规则', () => {
      // Show rules
    })
    buildMenuIcon('history_icon', 4, '历史', () => {
      // Show history
    })
    buildMenuIcon('close_icon', 5, '关闭', () => {
      showButton(mainMenuContainer)
      hideButton(menuSettingContainer)
    })

     // btn hover
    const hoverCircle = new Graphics();
    hoverCircle.visible = false; // mặc định ẩn
    container.addChild(hoverCircle);

    function drawHoverCircle(sprite, x = null) {
      let xPos = x || sprite.x
      let yPos = sprite.getGlobalPosition().y
      hoverCircle.clear()
      hoverCircle.fill({color: 0xffffff, alpha: 0.2})
      hoverCircle.circle(xPos, yPos, yPos-setRectYPos-2)
      hoverCircle.fill()
    }

    // Main Menu
    const mainMenuBtnStartX = 0.12 * w
    const mainMenuSpace = 0.15 * w
    const spinBtnSpace = 0.23 * w

    const lightningBgSetting = getDeepSetting('lightning_bg_icon')
    if (!!lightningBgSetting) {
      const lightningBgSprite = new Sprite(subTex('lightning_bg_icon'))
      lightningBgSprite.anchor.set(0.5)
      lightningBgSprite.rotation = lightningBgSetting.rotation
      lightningBgSprite.tint = iconColor
      lightningBgSprite.position.set(mainMenuContainer.x + mainMenuBtnStartX, 0)
      lightningBgSprite.scale.set(0.8 * setRectHeight * targetButonHeightPer / lightningBgSprite.height)
      mainMenuContainer.addChild(lightningBgSprite)

      const lightningSetting = getDeepSetting('lightning_icon')
      if (!!lightningSetting) {
        const lightningSprite = new Sprite(subTex('lightning_icon'))
        lightningSprite.anchor.set(0.5)
        lightningSprite.tint = iconColor
        lightningSprite.rotation = lightningSetting.rotation
        lightningSprite.position.set(lightningBgSprite.x, lightningBgSprite.y)
        lightningSprite.scale.set(0.8 * 0.6 * setRectHeight * targetButonHeightPer / lightningSprite.height)
        mainMenuContainer.addChild(lightningSprite)
      }

      lightningBgSprite.eventMode = 'static';
      lightningBgSprite.on('pointerover', () => {
        drawHoverCircle(lightningBgSprite);
        hoverCircle.visible = true;
      });

      lightningBgSprite.on('pointerout', () => {
        hoverCircle.visible = false;
      });
    }


    // Minus / Plus buttons
    const minusSetting = getDeepSetting('minus_icon')
    if (!!minusSetting) {
      const minusSprite = new Sprite(subTex('minus_icon'))
      minusSprite.anchor.set(0.5)
      minusSprite.position.set(mainMenuContainer.x + mainMenuBtnStartX + mainMenuSpace, 0)
      minusSprite.tint = iconColor
      minusSprite.scale.set(setRectHeight * targetButonHeightPer / minusSprite.height)
      minusSprite.rotation = minusSetting.rotation
      minusSprite.eventMode = 'static';
      minusSprite.on('pointerover', () => {
        drawHoverCircle(minusSprite);
        hoverCircle.visible = true;
      });

      minusSprite.on('pointerout', () => {
        hoverCircle.visible = false;
      });

      minusSprite.on('pointerdown', () => {
        hoverCircle.visible = false;
        gameStore.decreaseBet()
      });

      mainMenuContainer.addChild(minusSprite)
    }

    const plusSetting = getDeepSetting('minus_icon')
    if (!!plusSetting) {
      const plusSprite = new Sprite(subTex('plus_icon'))
      plusSprite.anchor.set(0.5)
      plusSprite.position.set(mainMenuContainer.x + mainMenuBtnStartX + mainMenuSpace + 2 * spinBtnSpace, 0)
      plusSprite.tint = iconColor
      plusSprite.scale.set(setRectHeight * targetButonHeightPer / plusSprite.height)
      plusSprite.eventMode = 'static';
      plusSprite.on('pointerover', () => {
        drawHoverCircle(plusSprite);
        hoverCircle.visible = true;
      });

      plusSprite.on('pointerout', () => {
        hoverCircle.visible = false;
      });

       plusSprite.on('pointerdown', () => {
        hoverCircle.visible = false;
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
      autoSpinBgSprite.position.set(mainMenuContainer.x + mainMenuBtnStartX + 2 * mainMenuSpace + 2 * spinBtnSpace, 0);
      autoSpinBgSprite.scale.set(0.8 * setRectHeight * targetButonHeightPer / autoSpinBgSprite.height)
      mainMenuContainer.addChild(autoSpinBgSprite)

      const autoSpinArrowSetting = getDeepSetting('auto_spin_arrow_icon')
      if (!!autoSpinArrowSetting) {
        const autoSpinArrowSprite = new Sprite(subTex('auto_spin_arrow_icon'))
        autoSpinArrowSprite.anchor.set(0.5)
        autoSpinArrowSprite.tint = iconColor
        autoSpinArrowSprite.position.set(autoSpinBgSprite.x, autoSpinBgSprite.y)
        autoSpinArrowSprite.scale.set(0.8 * 0.7 * setRectHeight * targetButonHeightPer / autoSpinArrowSprite.height)
        autoSpinArrowSprite.rotation = Math.random() * Math.PI * 2
        mainMenuContainer.addChild(autoSpinArrowSprite)
      }

      const autoSpinSetting = getDeepSetting('auto_spin_icon')
      if (!!autoSpinSetting) {
        const autoSpinSprite = new Sprite(subTex('auto_spin_icon'))
        autoSpinSprite.anchor.set(0.5)
        autoSpinSprite.tint = iconColor
        autoSpinSprite.position.set(autoSpinBgSprite.x, autoSpinBgSprite.y)
        autoSpinSprite.scale.set(0.8 * 0.32 * setRectHeight * targetButonHeightPer / autoSpinSprite.height)
        autoSpinSprite.rotation = autoSpinSetting.rotation
        mainMenuContainer.addChild(autoSpinSprite)
      }

      autoSpinBgSprite.eventMode = 'static';
      autoSpinBgSprite.on('pointerover', () => {
        drawHoverCircle(autoSpinBgSprite);
        hoverCircle.visible = true;
      });

      autoSpinBgSprite.on('pointerout', () => {
        hoverCircle.visible = false;
      });
    }


     // Spin button
    const targetSpinBtnHeightPer = 0.8
    const spinSetting = getDeepSetting('spin_btn_bg')
    if (!!spinSetting) {
      spinBtnSprite = new Sprite(subTex('spin_btn_bg'))
      spinBtnSprite.anchor.set(0.5)
      spinBtnSprite.position.set(mainMenuBtnStartX + mainMenuSpace + spinBtnSpace, 0)
      spinBtnSprite.scale.set(targetSpinBtnHeightPer * setRectHeight / spinBtnSprite.height)
      spinBtnSprite.rotation = spinSetting.rotation
      mainMenuContainer.addChild(spinBtnSprite)

      // spint button arrow
      spinBtnArrowSprite = new Sprite(subTex('spin_btn_arrows.normal'))
      spinBtnArrowSprite.anchor.set(0.5)
      spinBtnArrowSprite.position.set(spinBtnSprite.x, spinBtnSprite.y)
      spinBtnArrowSprite.scale.set(0.65 * targetSpinBtnHeightPer * setRectHeight / spinBtnArrowSprite.height)
      mainMenuContainer.addChild(spinBtnArrowSprite)

      spinBtnSprite.eventMode = 'static'
      spinBtnSprite.on('pointerdown', () => {
        if (gameState.showStartScreen?.value) return
        if (gameState.isSpinning?.value) return
        if (!gameState.canSpin?.value) return

        hoverCircle.visible = false
        notiBgSprite.visible = true
        notiBgSprite1.visible = false
        notiBgSprite2.visible = false
        amountLabels.win_amount_icon.text = '0.00'


        if (!!notiTextSprite && !notiTextSprite.visible) {
          setNotification()
        }
        showTotalWinAmount = false
        handlers.spin && handlers.spin()
      })

      spinBtnSprite.on('pointerover', () => {
        drawSpinHoverCircle(spinBtnSprite);
        spinHoverCircle.visible = true;
        hoverAnimating = true;
        hoverAlphaDir = 1;
      });

      spinBtnSprite.on('pointerout', () => {
        hoverAnimating = false;
        spinHoverCircle.visible = false;
        spinHoverCircle.alpha = 0;
      });
    }


    // spin btn hover
    spinHoverCircle = new Graphics();
    spinHoverCircle.visible = false; // mặc định ẩn
    spinHoverCircle.alpha = 0;
    mainMenuContainer.addChild(spinHoverCircle);

    function drawSpinHoverCircle(sprite, x = null) {
      let xPos = x || sprite.x
      spinHoverCircle.clear()
      spinHoverCircle.fill({ color: 0xf7f76a, alpha: 0.3 }) // vàng sáng
      spinHoverCircle.circle(xPos, sprite.y, 0.65 * sprite.width/2)
      spinHoverCircle.fill()
    }

    // Menu icon
    const menuSetting = getDeepSetting('menu_icon')
    if (!!menuSetting) {
      const menuIconSprite = new Sprite(subTex('menu_icon'))
      menuIconSprite.anchor.set(0.5)
      menuIconSprite.position.set(mainMenuBtnStartX + 2 * mainMenuSpace + 2 * spinBtnSpace + 0.9 * mainMenuBtnStartX, 0)
      menuIconSprite.scale.set(0.6 * setRectHeight * targetButonHeightPer / menuIconSprite.height)
      menuIconSprite.rotation = menuSetting.rotation
      menuIconSprite.eventMode = 'static';
      menuIconSprite.on('pointerdown', () => {
        hideButton(mainMenuContainer)
        showButton(menuSettingContainer)
        hoverCircle.visible = false
      })

      menuIconSprite.on('pointerover', () => {
        drawHoverCircle(menuIconSprite, menuIconSprite.x + menuIconSprite.width/2);
        hoverCircle.visible = true;
      });

      menuIconSprite.on('pointerout', () => {
        hoverCircle.visible = false;
      });
      mainMenuContainer.addChild(menuIconSprite)

      // mute icon
      const mutedIconSetting = getDeepSetting('muted_icon')
      if (!!mutedIconSetting) {
        mutedIconSprite = new Sprite(subTex('muted_icon'))
        mutedIconSprite.anchor.set(0.5)
        mutedIconSprite.visible = !gameState.gameSound.value
        mutedIconSprite.position.set(mainMenuBtnStartX + 2 * mainMenuSpace + 2 * spinBtnSpace + 0.9 * mainMenuBtnStartX, -0.8*menuIconSprite.height)
        mutedIconSprite.scale.set(0.3 * setRectHeight * targetButonHeightPer / mutedIconSprite.height)
        mutedIconSprite.rotation = mutedIconSetting.rotation

        mainMenuContainer.addChild(mutedIconSprite)
      }
    }

  }

  // Hàm animate button ẩn xuống
  function hideButton(btn, duration = 0.03) {
    const startY = btn.y;
    const targetY = btn.y + 50; // chạy xuống 50px
    let elapsed = 0;

    const animate = (delta) => {
      elapsed += delta;
      const t = Math.min(elapsed / duration, 1);
      btn.y = startY + (targetY - startY) * t;
      btn.alpha = 1 - t; // mờ dần
      if (t < 1) {
        requestAnimationFrame(() => animate(delta));
      } else {
        btn.visible = false;
        btn.y = startY; // reset vị trí nếu cần
      }
    };
    animate(1/60); // bắt đầu animation
  }

  // Hàm animate button hiện lên
  function showButton(btn, duration = 0.03) {
    const startY = btn.y + 50; // bắt đầu từ dưới
    const targetY = btn.y;
    btn.y = startY;
    btn.visible = true;
    btn.alpha = 0;
    let elapsed = 0;

    const animate = (delta) => {
      elapsed += delta;
      const t = Math.min(elapsed / duration, 1);
      btn.y = startY + (targetY - startY) * t;
      btn.alpha = t; // sáng dần
      if (t < 1) {
        requestAnimationFrame(() => animate(delta));
      }
    };
    animate(1/60);
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

    if (mutedIconSprite && !gameState.gameSound.value) {
      mutedIconSprite.visible = true
    } else {
      mutedIconSprite.visible = false
    }

    if (hoverAnimating && spinHoverCircle) {
      spinHoverCircle.alpha += hoverAlphaDir * hoverSpeed * dt;
      if (spinHoverCircle.alpha >= 1) {
        spinHoverCircle.alpha = 1;
        hoverAlphaDir = -1; // đảo chiều alpha
      } else if (spinHoverCircle.alpha <= 0) {
        spinHoverCircle.alpha = 0;
        hoverAlphaDir = 1; // đảo chiều alpha
      }
    }

    if (gameState.canSpin.value) {
      amountLabels.bet_amount_icon.style.fill = 0x85efff
      amountLabels.win_amount_icon.style.fill = 0x85efff
      amountLabels.wallet_icon.style.fill = 0x85efff
    } else {
      amountLabels.bet_amount_icon.style.fill = 0xffffff
      amountLabels.win_amount_icon.style.fill = 0xffffff
      amountLabels.wallet_icon.style.fill = 0xffffff
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
