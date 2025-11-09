import { drawBackdrop } from './backdrop'
import { drawReels } from './drawReels'

export function useMainFrame(canvasState, gameState, gridState, container) {
  function draw(w, h, mainRect) {
    drawBackdrop(container, w, h)
    drawReels(container, mainRect, gridState, gameState)
  }
  return { draw }
}
