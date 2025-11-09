import { useFooterBar } from './bar'
import { useFooterInfoDisplays } from './infoDisplays'
import { useFooterBetControls } from './betControls'
import { useSpinBtn } from './spinBtn'

export function useFooter(canvasState, gameState, container) {
    const bar = useFooterBar(canvasState)
    const info = useFooterInfoDisplays(canvasState, gameState)
    const controls = useFooterBetControls(canvasState, gameState)
    const spinBtn = useSpinBtn(canvasState, gameState)

    function draw(rect) {
        const timestamp = performance.now()

        // Draw components in order (bar first as background)
        bar.draw(container, rect)
        info.draw(container, rect)
        controls.draw(container, rect)
        spinBtn.draw(container, timestamp)
    }

    return { draw }
}
