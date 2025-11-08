import { ASSETS } from '../../config/assets'
import { CONFIG } from '../../config/constants'

export function useRenderer(canvasState, gameState, gridState) {
    const render = () => {
        if (!canvasState.ctx.value) return
        const ctx = canvasState.ctx.value
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value

        // Start screen branch
        if (gameState.showStartScreen.value) {
            drawStartScreen(ctx, w, h, canvasState)
            return
        }

        // Play screen - canvas background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, '#1a1a2e')
        grad.addColorStop(0.5, '#16213e')
        grad.addColorStop(1, '#0f3460')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        // Draw components
        drawTitle(ctx, w, canvasState.scale.value)
        drawReels(ctx, canvasState, gridState)
        drawInfoDisplays(ctx, canvasState, gameState)
        drawBetControls(ctx, canvasState, gameState)
        drawSpinButton(ctx, canvasState, gameState)

        if (gameState.freeSpins.value > 0) {
            drawFreeSpinsInfo(ctx, canvasState, gameState)
        }
    }

    const drawTitle = (ctx, w, scale) => {
        ctx.fillStyle = '#FFD700'
        ctx.font = `bold ${Math.floor(32 * scale)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 10
        ctx.fillText('麻将胡了', w / 2, 20 * scale)
        ctx.shadowBlur = 0
    }

    const drawReels = (ctx, canvasState, gridState) => {
        const symbolSize = Math.floor(CONFIG.reels.symbolSize * canvasState.scale.value)
        const spacing = Math.floor(CONFIG.reels.spacing * canvasState.scale.value)

        const highlightSet = new Set()
        if (gridState.highlightWins.value) {
            gridState.highlightWins.value.forEach(win => {
                win.positions.forEach(([col, row]) => {
                    highlightSet.add(`${col},${row}`)
                })
            })
        }

        for (let col = 0; col < CONFIG.reels.count; col++) {
            for (let row = 0; row < CONFIG.reels.rows; row++) {
                const x = canvasState.reelOffset.value.x + col * (symbolSize + spacing)
                const y = canvasState.reelOffset.value.y + row * (symbolSize + spacing)

                const isHighlighted = highlightSet.has(`${col},${row}`)
                const isGolden = gridState.goldenSymbols.value.has(`${col},${row}`)

                // Reel background
                ctx.fillStyle = isHighlighted ? '#FFD700' : '#FFFFFF'
                ctx.strokeStyle = isGolden ? '#FFD700' : '#2C3E50'
                ctx.lineWidth = isGolden ? 4 : 2

                ctx.fillRect(x, y, symbolSize, symbolSize)
                ctx.strokeRect(x, y, symbolSize, symbolSize)

                const symbol = gridState.grid.value[col][row]
                drawSymbol(ctx, symbol, x, y, symbolSize)
            }
        }
    }

    const drawSymbol = (ctx, symbolKey, x, y, size) => {
        const symbol = ASSETS.symbols[symbolKey]
        if (!symbol) return

        const img = ASSETS.loadedImages && ASSETS.loadedImages[symbolKey]
        if (img && img.complete && img.naturalHeight !== 0) {
            const padding = Math.floor(size * 0.15)
            const w = size - padding * 2
            const h = size - padding * 2
            ctx.drawImage(img, x + padding, y + padding, w, h)
        } else {
            ctx.fillStyle = '#CCCCCC'
            ctx.font = `${Math.floor(size * 0.3)}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('...', x + size / 2, y + size / 2)
        }
    }

    const drawInfoDisplays = (ctx, canvasState, gameState) => {
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value
        const y = h - 280 * canvasState.scale.value

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, y, w, 80 * canvasState.scale.value)

        const labels = ['CREDITS', 'BET', 'WIN']
        const values = [gameState.credits.value, gameState.bet.value, gameState.currentWin.value]
        const segmentWidth = w / 3

        ctx.textBaseline = 'middle'
        for (let i = 0; i < 3; i++) {
            const x = segmentWidth * i + segmentWidth / 2

            // Label
            ctx.fillStyle = '#FFD700'
            ctx.font = `bold ${Math.floor(16 * canvasState.scale.value)}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText(labels[i], x, y + 25 * canvasState.scale.value)

            // Value
            ctx.fillStyle = '#FFFFFF'
            ctx.font = `bold ${Math.floor(24 * canvasState.scale.value)}px Arial`
            ctx.fillText(values[i], x, y + 55 * canvasState.scale.value)
        }
    }

    const drawBetControls = (ctx, canvasState, gameState) => {
        const minusBtn = canvasState.buttons.value.betMinus
        const plusBtn = canvasState.buttons.value.betPlus

        // Bet Minus Button
        ctx.fillStyle = gameState.isSpinning.value ? '#666' : '#4CAF50'
        ctx.fillRect(minusBtn.x, minusBtn.y, minusBtn.width, minusBtn.height)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.strokeRect(minusBtn.x, minusBtn.y, minusBtn.width, minusBtn.height)

        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.floor(30 * canvasState.scale.value)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('-', minusBtn.x + minusBtn.width / 2, minusBtn.y + minusBtn.height / 2)

        // Bet Plus Button
        ctx.fillStyle = gameState.isSpinning.value ? '#666' : '#4CAF50'
        ctx.fillRect(plusBtn.x, plusBtn.y, plusBtn.width, plusBtn.height)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.strokeRect(plusBtn.x, plusBtn.y, plusBtn.width, plusBtn.height)

        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.floor(30 * canvasState.scale.value)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('+', plusBtn.x + plusBtn.width / 2, plusBtn.y + plusBtn.height / 2)
    }

    const drawSpinButton = (ctx, canvasState, gameState) => {
        const btn = canvasState.buttons.value.spin

        // Outer glow
        ctx.beginPath()
        ctx.arc(btn.x, btn.y, btn.radius + 5, 0, Math.PI * 2)
        ctx.fillStyle = gameState.canSpin.value ? 'rgba(255, 215, 0, 0.5)' : 'rgba(100, 100, 100, 0.5)'
        ctx.fill()

        // Button circle
        const grad = ctx.createRadialGradient(btn.x, btn.y, 0, btn.x, btn.y, btn.radius)
        if (gameState.canSpin.value) {
            grad.addColorStop(0, '#FFD700')
            grad.addColorStop(1, '#FFA500')
        } else {
            grad.addColorStop(0, '#888')
            grad.addColorStop(1, '#555')
        }

        ctx.beginPath()
        ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()

        // Label
        ctx.fillStyle = '#000'
        ctx.font = `bold ${Math.floor(24 * canvasState.scale.value)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('SPIN', btn.x, btn.y)
    }

    const drawFreeSpinsInfo = (ctx, canvasState, gameState) => {
        const w = canvasState.canvasWidth.value
        const h = canvasState.canvasHeight.value

        const boxWidth = 250 * canvasState.scale.value
        const boxHeight = 60 * canvasState.scale.value
        const x = (w - boxWidth) / 2
        const y = h * 0.15

        ctx.fillStyle = 'rgba(255, 215, 0, 0.95)'
        ctx.fillRect(x, y, boxWidth, boxHeight)
        ctx.strokeStyle = '#FF4500'
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, boxWidth, boxHeight)

        ctx.fillStyle = '#000'
        ctx.font = `bold ${Math.floor(20 * canvasState.scale.value)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`FREE SPINS: ${gameState.freeSpins.value}`, w / 2, y + boxHeight / 2)
    }

    const drawStartScreen = (ctx, w, h, canvasState) => {
        // Background image scaled to canvas
        const img = ASSETS.loadedImages.start_background
        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, 0, 0, w, h)
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, h)
            grad.addColorStop(0, '#7a1a1a')
            grad.addColorStop(1, '#3a0f0f')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, w, h)
        }

        // Start button (bottom-center)
        const sb = canvasState.buttons.value.start
        ctx.save()
        ctx.fillStyle = '#ff4d4f'
        ctx.strokeStyle = '#b02a2a'
        ctx.lineWidth = 4
        roundRect(ctx, sb.x, sb.y, sb.width, sb.height, Math.floor(sb.height / 2))
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.floor(sb.height * 0.45)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('开始', sb.x + sb.width / 2, sb.y + sb.height / 2)
        ctx.restore()
    }

    const roundRect = (ctx, x, y, w, h, r) => {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + h, r)
        ctx.arcTo(x + w, y + h, x, y + h, r)
        ctx.arcTo(x, y + h, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
    }

    return { render }
}
