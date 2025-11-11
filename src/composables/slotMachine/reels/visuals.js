export function applyTileVisuals(sprite, alpha = 1, highlight = false) {
    if (!sprite) return
    sprite.alpha = alpha

    // Apply golden tint when highlighted
    if (highlight) {
        sprite.tint = 0xffffaa // Bright golden tint
    } else {
        sprite.tint = 0xffffff // White (normal)
    }
}
