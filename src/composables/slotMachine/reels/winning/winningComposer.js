import { Graphics } from 'pixi.js'

let loggedOnce = false

export function applyWinningFrame(sprite, highlight = false) {
  if (!sprite) return

  if (highlight) {
    // Just apply a simple tint - no graphics, no overlays, no artifacts
    sprite.tint = 0xffffaa // Golden yellow tint

    if (!loggedOnce) {
      console.log('✅ Winning highlight applied via tint')
      loggedOnce = true
    }
  } else {
    sprite.tint = 0xffffff // White (normal)
  }
}
