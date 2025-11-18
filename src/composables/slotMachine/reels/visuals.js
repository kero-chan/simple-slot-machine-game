export function applyTileVisuals(sprite, alpha = 1, highlight = false, hasHighlights = false) {
    if (!sprite) return
    sprite.alpha = alpha

    // Apply bright white tint when highlighted (for green background)
    if (highlight) {
        sprite.tint = 0xffffff // Bright white tint for winning tiles
    } else if (hasHighlights) {
        // Light dim for non-winning tiles when there are winning tiles (40% brightness for green background)
        sprite.tint = 0x999999 // Light gray instead of dark gray
    } else {
        sprite.tint = 0xffffff // White (normal)
    }
}
