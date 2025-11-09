import { useFooterBar } from './bar'
import { useFooterInfoDisplays } from './infoDisplays'
import { useFooterBetControls } from './betControls'
import { useSpinBtn } from './spinBtn'

export function useFooter(canvasState, gameState) {
    const bar = useFooterBar(canvasState)
    const info = useFooterInfoDisplays(canvasState, gameState)
    const controls = useFooterBetControls(canvasState, gameState)
    const spinBtn = useSpinBtn(canvasState, gameState)

    function draw(ctx, rect, timestamp = 0) {
        bar.draw(ctx, rect)
        // Info strip
        info.draw(ctx, rect)
        // Bet controls
        controls.draw(ctx, rect)
        // Spin button (owned by footer)
        spinBtn.draw(ctx, timestamp)
    }

    return { draw }
}
