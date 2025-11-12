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

            // Always centered horizontally, full height
            canvasEl.style.position = 'fixed'
            canvasEl.style.left = '50%'
            canvasEl.style.top = '50%'
            canvasEl.style.transform = 'translateX(-50%) translateY(-50%)'
            canvasEl.style.width = `${width}px`
            canvasEl.style.height = `${height}px`
            canvasEl.style.pointerEvents = 'auto'
            canvasEl.style.zIndex = '9999'
            document.body.appendChild(canvasEl)

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
            if (app.renderer) {
                app.renderer.resize(width, height)
            } else {
                pendingSize = { width, height }
            }

            // Always centered horizontally, full height
            if (canvasEl) {
                canvasEl.style.position = 'fixed'
                canvasEl.style.left = '50%'
                canvasEl.style.top = '0'
                canvasEl.style.transform = 'translateX(-50%)'
                canvasEl.style.width = `${width}px`
                canvasEl.style.height = '100vh'
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
