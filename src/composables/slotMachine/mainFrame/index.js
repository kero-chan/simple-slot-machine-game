import { drawBackdrop } from './backdrop'
import { drawReels } from './drawReels'

export function useMainFrame(canvasState, gameState, gridState) {
  function draw(ctx, w, h, mainRect) {
    drawBackdrop(ctx, w, h)
    drawReels(ctx, mainRect, gridState)
  }
  return { draw }
}