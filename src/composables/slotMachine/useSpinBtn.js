// Draw only the round base (no arrows, no animation) using dynamic
// vertical block detection to extract the correct tile from the sprite.

import { ASSETS } from '../../config/assets'

export function useSpinBtn(canvasState, gameState) {
  // Cache analysis of the sprite sheet
  let sheetRects = null

  // Analyze the sprite to find vertical content blocks:
  // [square base], [round base], [gold rows], [silver rows]
  const analyzeSpriteSheet = (sheet) => {
    if (sheetRects) return sheetRects

    const W = sheet.naturalWidth
    const H = sheet.naturalHeight
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const octx = off.getContext('2d')
    octx.drawImage(sheet, 0, 0)

    const { data } = octx.getImageData(0, 0, W, H)
    const threshold = 8

    // Detect rows containing non-transparent pixels
    const rowHasAlpha = new Array(H).fill(false)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4 + 3
        if (data[idx] > threshold) {
          rowHasAlpha[y] = true
          break
        }
      }
    }

    // Group contiguous non-empty rows into blocks
    const blocks = []
    let inBlock = false
    let start = 0
    for (let y = 0; y < H; y++) {
      if (rowHasAlpha[y] && !inBlock) {
        inBlock = true
        start = y
      } else if (!rowHasAlpha[y] && inBlock) {
        inBlock = false
        blocks.push({ y1: start, y2: y - 1 })
      }
    }
    if (inBlock) blocks.push({ y1: start, y2: H - 1 })

    // Filter small artifacts and pick the second block as round base
    const minHeight = Math.max(8, Math.floor(H * 0.01))
    const bigBlocks = blocks.filter(b => b.y2 - b.y1 + 1 >= minHeight)
    const roundBaseBlock = bigBlocks[1] || bigBlocks[0] || { y1: 0, y2: H - 1 }

    const roundBaseRect = {
      sx: 0,
      sy: roundBaseBlock.y1,
      sw: W,
      sh: roundBaseBlock.y2 - roundBaseBlock.y1 + 1
    }

    sheetRects = { roundBaseRect }
    return sheetRects
  }

  const draw = (ctx) => {
    const btn = canvasState.buttons.value.spin
    const spriteSheet = ASSETS.loadedImages.spin_btn
    if (!spriteSheet || !spriteSheet.complete || spriteSheet.naturalHeight === 0) return

    const { roundBaseRect: src } = analyzeSpriteSheet(spriteSheet)

    const radius = btn.radius
    const size = radius * 2

    ctx.save()
    ctx.beginPath()
    ctx.arc(btn.x, btn.y, radius, 0, Math.PI * 2)
    ctx.clip()

    // Contain-fit the detected base rect inside the circle
    const scale = Math.min(size / src.sw, size / src.sh)
    const drawW = Math.round(src.sw * scale)
    const drawH = Math.round(src.sh * scale)
    const drawX = Math.round(btn.x - drawW / 2)
    const drawY = Math.round(btn.y - drawH / 2)

    ctx.drawImage(
      spriteSheet,
      src.sx, src.sy, src.sw, src.sh,
      drawX, drawY, drawW, drawH
    )

    ctx.restore()
  }

  const isPointInside = (x, y) => {
    const btn = canvasState.buttons.value.spin
    const dx = x - btn.x
    const dy = y - btn.y
    return dx * dx + dy * dy <= btn.radius * btn.radius
  }

  return {
    draw,
    isPointInside
  }
}
