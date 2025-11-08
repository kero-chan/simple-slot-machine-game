# Assets Directory

Place your custom symbol images here to replace the emoji symbols.

## Required Images

Create PNG files with transparency for each symbol:

- `wild.png` - Wild symbol (substitutes for all except scatter)
- `scatter.png` - Scatter symbol (triggers free spins)
- `dragon_red.png` - Red Dragon (high value)
- `dragon_green.png` - Green Dragon (high value)
- `dragon_white.png` - White Dragon (high value)
- `wind_east.png` - East Wind (medium value)
- `wind_south.png` - South Wind (medium value)
- `bamboo.png` - Bamboo tile (low value)
- `character.png` - Character tile (low value)
- `dot.png` - Dot tile (low value)

## Image Specifications

- **Format**: PNG with transparency
- **Size**: 256×256 pixels (recommended)
- **Resolution**: 72-144 DPI
- **Color Space**: RGB or sRGB

## Tips for Best Results

1. **Keep it simple**: Symbols should be clear and recognizable at small sizes
2. **High contrast**: Use colors that stand out against the white background
3. **Centered design**: Keep the main symbol centered in the image
4. **Padding**: Leave some padding around the edges (10-20px)
5. **Consistent style**: All symbols should have a similar art style

## Example File Structure

```
assets/
├── README.md (this file)
├── wild.png
├── scatter.png
├── dragon_red.png
├── dragon_green.png
├── dragon_white.png
├── wind_east.png
├── wind_south.png
├── bamboo.png
├── character.png
└── dot.png
```

## Activating Custom Images

After adding your images:

1. Open `game.js`
2. Find the `ASSETS` object at the top
3. Update the `imagePaths` or add `image` properties to each symbol
4. Set `useImages: true` in the ASSETS configuration
5. Implement the image loading system as described in the main README.md

---

**Note**: The game currently uses emoji symbols by default. Custom images are optional but recommended for a more polished look.
