export function applyTileVisuals(sprite, alpha = 1, highlight = false, hasHighlights = false) {
    if (!sprite) return
    sprite.alpha = alpha

    // Apply golden tint when highlighted
    if (highlight) {
        sprite.tint = 0xffffaa // Bright golden tint
    } else if (hasHighlights) {
        // Dark mask for non-winning tiles when there are winning tiles (80% darkness)
        sprite.tint = 0x333333
    } else {
        sprite.tint = 0xffffff // White (normal)
    }
}
