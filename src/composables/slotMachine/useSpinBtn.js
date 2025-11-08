import { ASSETS } from '../../config/assets'

export function useSpinBtn(canvasState, gameState) {
  // Rotation state for the arrow
  let angleRad = 0
  let lastTime = 0
  const rotationSpeedRadPerSec = Math.PI / 3 // ~60°/s

  // Cache detected opaque bounds for the frame
  let frameSrcRectCache = null

  // Detect non-transparent bounds of an image
  const getActiveSrcRect = (img, alphaThreshold = 10) => {
    if (frameSrcRectCache) return frameSrcRectCache
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    if (!iw || !ih) return null

    const off = document.createElement('canvas')
    off.width = iw
    off.height = ih
    const ctx = off.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, iw, ih).data

    let minX = iw, minY = ih, maxX = -1, maxY = -1
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const a = data[(y * iw + x) * 4 + 3]
        if (a > alphaThreshold) {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX < 0 || maxY < 0) return { sx: 0, sy: 0, sw: iw, sh: ih }

    frameSrcRectCache = {
      sx: minX,
      sy: minY,
      sw: maxX - minX + 1,
      sh: maxY - minY + 1
    }
    return frameSrcRectCache
  }

  // Draw helper: cover-fit a source rect into a destination rect centered
  const drawSubImageCover = (ctx, img, srcRect, dx, dy, dw, dh) => {
    if (!srcRect) return
    const s = Math.max(dw / srcRect.sw, dh / srcRect.sh)
    const w = Math.round(srcRect.sw * s)
    const h = Math.round(srcRect.sh * s)
    const x = Math.round(dx + (dw - w) / 2)
    const y = Math.round(dy + (dh - h) / 2)
    ctx.drawImage(
      img,
      srcRect.sx, srcRect.sy, srcRect.sw, srcRect.sh,
      x, y, w, h
    )
  }

  // Draw helper: contain-fit an image into a destination rect centered
  const drawImageContain = (ctx, img, dx, dy, dw, dh) => {
    if (!img || !img.complete || (img.naturalWidth ?? 0) === 0) return
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    const s = Math.min(dw / iw, dh / ih)
    const w = Math.round(iw * s)
    const h = Math.round(ih * s)
    const x = Math.round(dx + (dw - w) / 2)
    const y = Math.round(dy + (dh - h) / 2)
    ctx.drawImage(img, x, y, w, h)
  }

  const draw = (ctx, timestamp = 0) => {
    const btn = canvasState.buttons.value.spin
    const frameImg = ASSETS.loadedImages.spin_frame
    const arrowImg = ASSETS.loadedImages.spin_arrow
    if (!frameImg || !arrowImg) return
    if (!frameImg.complete || frameImg.naturalHeight === 0) return
    if (!arrowImg.complete || arrowImg.naturalHeight === 0) return

    // Advance rotation continuously
    if (!lastTime) lastTime = timestamp
    const dt = Math.max(0, timestamp - lastTime) / 1000
    angleRad = (angleRad + rotationSpeedRadPerSec * dt) % (Math.PI * 2)
    lastTime = timestamp

    const radius = btn.radius
    const diameter = radius * 2

    // Clip to circular area and clear
    ctx.save()
    ctx.beginPath()
    ctx.arc(btn.x, btn.y, radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.clearRect(btn.x - radius, btn.y - radius, diameter, diameter)

    // 1) Frame: detect opaque bounds and cover-fit to fill the circle
    const srcRect = getActiveSrcRect(frameImg)
    drawSubImageCover(ctx, frameImg, srcRect, btn.x - diameter / 2, btn.y - diameter / 2, diameter, diameter)

    // 2) Arrow: rotate and contain-fit inside the frame
    const arrowInsetRatio = 0.20
    const arrowW = diameter * (1 - arrowInsetRatio * 2)
    const arrowH = diameter * (1 - arrowInsetRatio * 2)

    ctx.translate(btn.x, btn.y)
    ctx.rotate(angleRad)
    drawImageContain(ctx, arrowImg, -arrowW / 2, -arrowH / 2, arrowW, arrowH)

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
