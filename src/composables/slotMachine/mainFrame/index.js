import { drawBackdrop } from './backdrop'
import { drawReels } from './drawReels'
import { usePixiReelsRenderer } from '../pixiRenderer'

export function useMainFrame(canvasState, gameState, gridState) {
  const pixiReels = usePixiReelsRenderer()

  function draw(ctx, w, h, mainRect, timestamp) {
    drawBackdrop(ctx, w, h)

    // Draw Pixi offscreen reels
    pixiReels.drawReelsToPixi(mainRect, gridState, gameState, timestamp)
    const pixiCanvas = pixiReels.getCanvas()

    // Composite Pixi output into the main canvas
    if (pixiCanvas) {
      ctx.drawImage(pixiCanvas, mainRect.x, mainRect.y, mainRect.w, mainRect.h)
    } else {
      // Fallback: if Pixi not ready, use 2D reels
      drawReels(ctx, mainRect, gridState, gameState, timestamp)
    }
  }
  return { draw }
}
