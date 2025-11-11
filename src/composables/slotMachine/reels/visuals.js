export function applyTileVisuals(sprite, alpha = 1, highlight = false) {
    if (!sprite) return
    sprite.alpha = alpha
    sprite.tint = highlight ? 0xffffcc : 0xffffff
}
