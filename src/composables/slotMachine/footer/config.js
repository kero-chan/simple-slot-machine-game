// position value < 0 means use source.frame.x/y/w/h

export const SETTINGS = {
  spin_btn_bg: {
    rotation: -(Math.PI / 2),
    position: { x: 7, y: 3, w: -1, h: 180 },
    assetName: 'icon_spin_circle_bg',
  },
  auth_spin_btn_bg: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_spin_square_bg',
  },
  spin_btn_arrows: {
    normal: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'icon_spin_arrows_normal',
    },
    spinning: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'icon_spin_arrows_normal_blur',
    },
    inactive: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'icon_spin_arrows_disabled',
    },
    inactive_spinning: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'icon_spin_arrows_disabled_blur',
    }
  },
  footer_bg: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'background_coins',
  },
  footer_bar: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'background_bottom',
  },
  footer_notification_bg: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'background_marquee_red',
  },
  footer_notification_bg1: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'background_marquee_green',
  },
  footer_notification_bg2: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'background_marquee_purple',
  },
  footer_notification_texts: {
    text1: {
      rotation: 0,
      position: { x: 1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_win_1024_text',
    },
    text2: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_bonus_12_free_text',
    },
    text3: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_gold_symbol_chance_text',
    },
    text4: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_free_spin_10x_text',
    },
    win: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_win_text',
    },
    total_win: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_total_win_text',
    },
    number0: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_0_gold_small',
    },
    number1: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_1_gold_small',
    },
    number2: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_2_gold_small',
    },
    number3: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_3_gold_small',
    },
    number4: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_4_gold_small',
    },
    number5: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_5_gold_small',
    },
    number6: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_6_gold_small',
    },
    number7: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_7_gold_small',
    },
    number8: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_8_gold_small',
    },
    number9: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_9_gold_small',
    },
    period: {
      rotation:  -(Math.PI / 2),
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_dot_gold_small',
    },
    comma: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_comma_gold_small',
    },
  },
  jackpot_texts: {
    spinning: {
      rotation: 0,
      position: { x: 1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_free_spin_text',
    },
    finish: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_spin_last_text',
    },

    number0: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_0_gold_large',
    },
    number1: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_1_gold_large',
    },
    number2: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_2_gold_large',
    },
    number3: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_3_gold_large',
    },
    number4: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_4_gold_large',
    },
    number5: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_5_gold_large',
    },
    number6: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_6_gold_large',
    },
    number7: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_7_gold_large',
    },
    number8: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_8_gold_large',
    },
    number9: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_9_gold_large',
    },
    period: {
      rotation:  -(Math.PI / 2),
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_dot_gold_large',
    },
    comma: {
      rotation: 0,
      position: { x: -1, y: -1, w: -1, h: -1 },
      assetName: 'glyph_comma_gold_large',
    },
  },
  wallet_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_wallet',
  },
  bet_amount_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_coin',
  },
  win_amount_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_history_active_small',
  },
  plus_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_plus',
  },
  minus_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_minus',
  },
  lightning_bg_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_circle_history',
  },
  lightning_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_turbo',
  },
  auto_spin_bg_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_circle_auto',
  },
  auto_spin_icon: {
    rotation: -(Math.PI / 2),
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_play',
  },
  auto_spin_arrow_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_spin_arrows_small',
  },
  menu_icon: {
    rotation: -(Math.PI / 2),
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_menu',
  },
  return_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_exit',
  },
  volumn_open_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_volume_on',
  },
  volumn_close_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_volume_off',
  },
  muted_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_menu_mute',
  },
  win_table_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_paytable',
  },
  rule_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_rules',
  },
  history_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_history_active_large',
  },
  close_icon: {
    rotation: 0,
    position: { x: -1, y: -1, w: -1, h: -1 },
    assetName: 'icon_close',
  },
}
