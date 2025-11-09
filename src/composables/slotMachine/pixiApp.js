import { Application } from 'pixi.js'

export function usePixiApp(canvasState) {
    let app = null
    let initPromise = null
    let canvasEl = null
    let pendingSize = null

    function ensure(width, height) {
        if (!app) {
            app = new Application()

            canvasEl = document.createElement('canvas')

            // Decide layout mode from requested size
            const cw = document.documentElement.clientWidth
            const ch = document.documentElement.clientHeight
            const isFullscreen = Math.abs(width - cw) < 2 && Math.abs(height - ch) < 2

            canvasEl.style.position = 'fixed'
            if (isFullscreen) {
                canvasEl.style.left = '0'
                canvasEl.style.top = '0'
                canvasEl.style.transform = 'none'
                canvasEl.style.width = '100vw'
                canvasEl.style.height = '100vh'
            } else {
                canvasEl.style.left = '50%'
                canvasEl.style.top = '50%'
                canvasEl.style.transform = 'translate(-50%, -50%)'
                canvasEl.style.width = `${width}px`
                canvasEl.style.height = `${height}px`
            }
            canvasEl.style.pointerEvents = 'auto'
            canvasEl.style.zIndex = '9999'
            document.body.appendChild(canvasEl)

            // Hide legacy 2D canvas
            if (canvasState.canvas.value) {
                canvasState.canvas.value.style.display = 'none'
            }

            pendingSize = { width, height }
            initPromise = app.init({
                width,
                height,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                backgroundAlpha: 0,
                canvas: canvasEl,
            })
            .then(() => {
                if (pendingSize && app?.renderer) {
                    app.renderer.resize(pendingSize.width, pendingSize.height)
                    pendingSize = null
                }
            })
            .catch(err => console.error('Pixi init failed:', err))
        } else {
            // Update renderer and CSS for subsequent ensures
            if (app.renderer) {
                app.renderer.resize(width, height)
            } else {
                pendingSize = { width, height }
            }

            const cw = document.documentElement.clientWidth
            const ch = document.documentElement.clientHeight
            const isFullscreen = Math.abs(width - cw) < 2 && Math.abs(height - ch) < 2

            if (canvasEl) {
                canvasEl.style.position = 'fixed'
                if (isFullscreen) {
                    canvasEl.style.left = '0'
                    canvasEl.style.top = '0'
                    canvasEl.style.transform = 'none'
                    canvasEl.style.width = '100vw'
                    canvasEl.style.height = '100vh'
                } else {
                    canvasEl.style.left = '50%'
                    canvasEl.style.top = '50%'
                    canvasEl.style.transform = 'translate(-50%, -50%)'
                    canvasEl.style.width = `${width}px`
                    canvasEl.style.height = `${height}px`
                }
                canvasEl.style.zIndex = '9999'
            }
        }
        return initPromise
    }

    const isReady = () => !!app?.renderer
    const getApp = () => app
    const getCanvas = () => canvasEl

    return { ensure, isReady, getApp, getCanvas }
}
