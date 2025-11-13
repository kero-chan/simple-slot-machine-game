import { Container, Graphics, Text, Sprite, Texture, Rectangle } from "pixi.js";
import { ASSETS } from "../../../config/assets";
import { composeConsecutiveWinsTextures } from "./consecutiveWins/consecutiveWinsComposer";
import { CONSECUTIVE_WINS_CONFIG } from "./consecutiveWins/config";

export function useHeader(gameState) {
  const container = new Container();
  let multiplierSprites = []; // Store sprites for multiplier display
  let multiplierBackgrounds = []; // Store background sprites for active multipliers
  let app = null; // Store PIXI app reference

  function getConfiguredTexture(configKey) {
    const config = CONSECUTIVE_WINS_CONFIG[configKey];
    if (!config) return { texture: null, scale: 1 };

    // Try to get composed texture first
    let texture = ASSETS.loadedImages?.[configKey];
    const scale = config.iconScale || 1;

    // If composed texture doesn't exist, try to create a cropped texture from source
    if (!texture && config.icon && config.iconAsset) {
      const sourceTexture = ASSETS.loadedImages?.[config.iconAsset];
      if (sourceTexture) {
        // Create cropped texture manually using Rectangle
        const { x, y, w, h } = config.icon;
        try {
          texture = new Texture({
            source: sourceTexture.source,
            frame: new Rectangle(x, y, w, h),
          });
        } catch (e) {
          console.warn(`Failed to create cropped texture for ${configKey}:`, e);
          texture = sourceTexture; // Fallback to full texture
        }
      }
    }

    return { texture, scale };
  }

  function getMultiplierTexture(multiplier, isActive) {
    const state = isActive ? "active" : "default";
    const assetKey = `x${multiplier}_${state}`;

    // First try to get the composed texture
    const composedTexture = ASSETS.loadedImages?.[assetKey];
    if (composedTexture) {
      return composedTexture;
    }

    // Fallback to original assets
    const fallbackKey = `x${multiplier}_${isActive ? "active" : "disable"}`;
    const src =
      ASSETS.loadedImages?.[fallbackKey] || ASSETS.imagePaths?.[fallbackKey];
    if (!src) return null;
    return src instanceof Texture ? src : Texture.from(src);
  }

  function getMultiplierTextureAndScale(multiplier, isActive) {
    const state = isActive ? "active" : "default";
    const assetKey = `x${multiplier}_${state}`;

    // Get configured texture and scale
    const { texture, scale } = getConfiguredTexture(assetKey);
    if (texture) {
      return { texture, scale };
    }

    // Fallback to original texture without config scale
    const fallbackTexture = getMultiplierTexture(multiplier, isActive);
    return { texture: fallbackTexture, scale: 1 };
  }

  function getDisplayedMultiplier(consecutiveWins) {
    // Map consecutive wins to displayed multiplier
    // Default to X1 active even when no wins
    if (consecutiveWins <= 0) return 1; // Default X1 active
    if (consecutiveWins === 1) return 1;
    if (consecutiveWins === 2) return 2;
    if (consecutiveWins === 3) return 3;
    return 5; // consecutiveWins >= 4
  }

  function initializeComposedTextures(pixiApp) {
    app = pixiApp;
    // Compose consecutive wins textures if not already done
    if (app && app.renderer) {
      composeConsecutiveWinsTextures(app);
    }
  }

  function getBackgroundTexture(bgKey) {
    const texture = ASSETS.loadedImages?.[bgKey];
    return texture || null;
  }

  function getBackgroundTextureAndScale(bgKey) {
    const { texture, scale } = getConfiguredTexture(bgKey);
    if (texture) {
      return { texture, scale };
    }

    // Fallback to original texture without config scale
    const fallbackTexture = getBackgroundTexture(bgKey);
    return { texture: fallbackTexture, scale: 1 };
  }

  function build(rect) {
    container.removeChildren();
    multiplierSprites = [];
    multiplierBackgrounds = [];
    const { x, y, w, h } = rect;

    // Create layered background system
    // bg_01: Top half background (lowest layer)
    const { texture: bg01Texture, scale: bg01Scale } =
      getBackgroundTextureAndScale("bg_01");
    if (bg01Texture) {
      const bg01 = new Sprite(bg01Texture);
      bg01.x = x;

      // Apply config scale first
      const baseWidth = bg01Texture.width * bg01Scale;
      const baseHeight = bg01Texture.height * bg01Scale;

      // Scale to cover at least the container width while maintaining aspect ratio
      const scaleX = w / baseWidth;
      const scaleY = h / baseHeight;
      const containerScale = Math.max(scaleX, scaleY); // Cover the entire area

      // Apply uniform scale to maintain aspect ratio
      bg01.width = baseWidth * containerScale;
      bg01.height = baseHeight * containerScale;

      // Position bg_01 to align bottom edge with the middle of header (bottom of top half)
      const visibleAreaBottom = y + h / 2;
      bg01.y = visibleAreaBottom - bg01.height; // Align bottom

      // Create a mask to show only the top half of header
      const mask = new Graphics();
      mask.rect(x, y, w, h / 2); // Only show top half
      mask.fill(0xffffff);
      bg01.mask = mask;
      
      container.addChild(bg01);
      container.addChild(mask); // Add mask to container
    } else {
      // Fallback to solid background
      const bar = new Graphics();
      bar.rect(x, y, w, h);
      bar.fill(0x8a4b28);
      container.addChild(bar);
    }

    // bg_02: Bottom part background (middle layer)
    let bg02Y = y + h * 0.7; // Default bottom area if no bg_02
    let bg02Height = h * 0.3; // Default height

    const { texture: bg02Texture, scale: bg02Scale } =
      getBackgroundTextureAndScale("bg_02");
    if (bg02Texture) {
      const bg02 = new Sprite(bg02Texture);
      bg02.x = x;
      bg02.width = w;

      // Apply config scale first
      const baseHeight = bg02Texture.height * bg02Scale;
      const scaledWidth = bg02Texture.width * bg02Scale;

      // Maintain aspect ratio for height, but fit width to container
      const widthScale = w / scaledWidth;
      let calculatedHeight = baseHeight * widthScale;

      // Ensure minimum height of 50% header height
      const minHeight = h * 0.5;
      bg02.height = Math.max(calculatedHeight, minHeight);
      bg02.y = y + h - bg02.height; // Position at bottom
      container.addChild(bg02);

      // Store bg_02 position for multiplier positioning
      bg02Y = bg02.y;
      bg02Height = bg02.height;
    }

    // bg_03: Center part background (top layer)
    let bg03Y = y + h / 2; // Default center if no bg_03
    let bg03Height = h * 0.6; // Default height

    const { texture: bg03Texture, scale: bg03Scale } =
      getBackgroundTextureAndScale("bg_03");
    if (bg03Texture) {
      const bg03 = new Sprite(bg03Texture);
      bg03.x = x;
      bg03.width = w;

      // Apply config scale first
      const baseHeight = bg03Texture.height * bg03Scale;
      const scaledWidth = bg03Texture.width * bg03Scale;

      // Maintain aspect ratio for height, but fit width to container
      const widthScale = w / scaledWidth;
      let calculatedHeight = baseHeight * widthScale;

      // Ensure minimum height of 50% header height
      const minHeight = h * 0.5;
      bg03.height = Math.max(calculatedHeight, minHeight);

      // Position bg_03 with at least 40% header height distance from bottom
      const minBottomGap = h * 0.4; // 40% of header height
      const maxY = y + h - minBottomGap - bg03.height; // Maximum Y position
      const centerY = y + (h - bg03.height) / 2; // Original center position

      // Use the higher position (closer to top) to ensure minimum bottom gap
      // Add offset to move down a bit
      const yOffset = h * 0.055; // Move down by 5.5% of header height
      bg03.y = Math.min(centerY, maxY) + yOffset;

      container.addChild(bg03);

      // Store bg_03 position for page title positioning
      bg03Y = bg03.y;
      bg03Height = bg03.height;
    }

    // === PAGE TITLE (on bg_03) ===
    // Display page title in the center of bg_03 area with fixed 50% width
    const { texture: pageTitleTexture, scale: configScale } =
      getConfiguredTexture("page_title");

    if (pageTitleTexture) {
      const pageTitle = new Sprite(pageTitleTexture);
      pageTitle.anchor.set(0.5);
      pageTitle.x = x + w / 2; // Center horizontally in header
      pageTitle.y = bg03Y + bg03Height / 2 - 2; // Center vertically in bg_03

      // Make it slightly transparent for a softer look
      pageTitle.alpha = 0.60; // 60% opacity (slightly faded)

      // Fixed width: 41% of header width (increased from 40%)
      const targetWidth = w * 0.41; // 41% of header width
      
      // Calculate height to maintain aspect ratio
      const originalAspectRatio = pageTitleTexture.width / pageTitleTexture.height;
      const targetHeight = targetWidth / originalAspectRatio;

      // Apply the fixed size
      pageTitle.width = targetWidth;
      pageTitle.height = targetHeight;

      container.addChild(pageTitle);
    }

    // === MULTIPLIER DISPLAY (TOP LAYER) ===
    // Create multiplier display: X1, X2, X3, X5
    // Position multipliers on top of bg_02 area (bottom section)
    const multipliers = [1, 2, 3, 5];

    // Layout configuration:
    // - Each multiplier: 14% default, 16% active
    // - Gap between multipliers: 6% of header width
    const defaultMultiplierWidth = w * 0.13; // 13% width for default
    const activeMultiplierWidth = w * 0.13; // 18% width for active
    const gapWidth = w * 0.055; // 5% gap between multipliers

    // Determine current active multiplier
    const currentConsecutiveWins = gameState.consecutiveWins?.value || 0;
    const displayedMult = getDisplayedMultiplier(currentConsecutiveWins);

    // Calculate total content width (sum of all multiplier widths + gaps)
    let totalContentWidth = (multipliers.length - 1) * gapWidth;
    for (const mult of multipliers) {
      const isActive = mult === displayedMult;
      totalContentWidth += isActive ? activeMultiplierWidth : defaultMultiplierWidth;
    }
    
    // Start position to center the group horizontally
    let currentX = x + (w - totalContentWidth) / 2;

    // Position multipliers in the bg_02 area (bottom section)
    const spriteHeight = Math.floor(bg02Height * 0.8); // Size relative to bg_02 height

    for (let i = 0; i < multipliers.length; i++) {
      const mult = multipliers[i];
      const isActive = mult === displayedMult; // Only the current multiplier is active

      // Get width based on active state
      const multiplierWidth = isActive ? activeMultiplierWidth : defaultMultiplierWidth;
      const centerX = currentX + multiplierWidth / 2;
      const centerY = bg02Y + bg02Height / 2 + 4; // Center within bg_02 area

      // Get texture and config scale for active/inactive state
      const { texture, scale: configScale } = getMultiplierTextureAndScale(
        mult,
        isActive
      );

      if (texture) {
        // Add active status background if this multiplier is active
        if (isActive) {
          const activeBgTexture = ASSETS.loadedImages?.active_status_bg;
          if (activeBgTexture) {
            const bgSprite = new Sprite(activeBgTexture);
            bgSprite.anchor.set(0.5);
            bgSprite.x = centerX;
            bgSprite.y = centerY - 50; // Move background up by 50px
            
            // Set blend mode to 'screen' for better blending with dark background
            bgSprite.blendMode = 'screen';
            
            // Scale background to fit the multiplier area (slightly larger for effect)
            // Calculate base scale to fit the multiplier, then multiply by 1.5 for larger effect
            const baseScaleX = multiplierWidth / activeBgTexture.width;
            const baseScaleY = spriteHeight / activeBgTexture.height;
            const baseScale = Math.max(baseScaleX, baseScaleY);
            const bgScale = baseScale * 2.5; // 2.5x larger than the multiplier size
            
            bgSprite.width = activeBgTexture.width * bgScale;
            bgSprite.height = activeBgTexture.height * bgScale;
            
            container.addChild(bgSprite);
            multiplierBackgrounds.push({ sprite: bgSprite, multiplier: mult });
          }
        }

        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.x = centerX;
        sprite.y = centerY;

        // Apply iconScale from config first
        const baseWidth = texture.width * configScale;
        const baseHeight = texture.height * configScale;

        // Then apply container constraints if needed
        const maxWidth = multiplierWidth;
        const maxHeight = spriteHeight;

        // Calculate additional scale if base size exceeds container
        const additionalScaleX = Math.min(1, maxWidth / baseWidth);
        const additionalScaleY = Math.min(1, maxHeight / baseHeight);
        const additionalScale = Math.min(additionalScaleX, additionalScaleY);

        // Final size combines config scale and container constraints
        sprite.width = baseWidth * additionalScale;
        sprite.height = baseHeight * additionalScale;

        container.addChild(sprite);
        multiplierSprites.push({ sprite, multiplier: mult });
      } else {
        // Fallback to text if texture not available
        const color = isActive ? 0xffd04d : 0x666666;
        const text = new Text(`X${mult}`, {
          fill: color,
          fontSize: Math.floor(Math.min(multiplierWidth, spriteHeight) * 0.4),
          fontWeight: "bold",
        });
        text.anchor.set(0.5);
        text.x = centerX;
        text.y = centerY;
        container.addChild(text);
        multiplierSprites.push({ sprite: text, multiplier: mult });
      }

      // Move to next position
      currentX += multiplierWidth + gapWidth;
    }
  }

  function updateValues() {
    // Update multiplier sprites based on current consecutive wins
    const currentConsecutiveWins = gameState.consecutiveWins?.value || 0;
    const displayedMult = getDisplayedMultiplier(currentConsecutiveWins);

    // Get header dimensions from container bounds
    const containerBounds = container.getBounds();
    const w = containerBounds.width;
    const h = containerBounds.height;

    // Layout configuration (same as build)
    const defaultMultiplierWidth = w * 0.13; // 13% width for default
    const activeMultiplierWidth = w * 0.13; // 18% width for active

    // Estimate bg02Height for spriteHeight calculation
    const bg02Height = h * 0.5; // Approximate
    const spriteHeight = Math.floor(bg02Height * 0.8);

    // Remove all existing backgrounds
    for (const bgItem of multiplierBackgrounds) {
      if (bgItem.sprite.parent) {
        container.removeChild(bgItem.sprite);
      }
    }
    multiplierBackgrounds = [];

    // Update multiplier sprites and add backgrounds for active ones

    // Update multiplier sprites and add backgrounds for active ones
    for (const item of multiplierSprites) {
      const { sprite, multiplier } = item;
      const isActive = multiplier === displayedMult; // Only the current multiplier is active

      // Add active status background if this multiplier is active
      if (isActive) {
        const activeBgTexture = ASSETS.loadedImages?.active_status_bg;
        if (activeBgTexture) {
          const bgSprite = new Sprite(activeBgTexture);
          bgSprite.anchor.set(0.5);
          bgSprite.x = sprite.x;
          bgSprite.y = sprite.y - 50; // Move background up by 50px
          
          // Set blend mode to 'screen' for better blending with dark background
          bgSprite.blendMode = 'screen';
          
          // Get width based on active state
          const multiplierWidth = activeMultiplierWidth;
          
          // Scale background to fit the multiplier area (slightly larger for effect)
          // Calculate base scale to fit the multiplier, then multiply by 1.5 for larger effect
          const baseScaleX = multiplierWidth / activeBgTexture.width;
          const baseScaleY = spriteHeight / activeBgTexture.height;
          const baseScale = Math.max(baseScaleX, baseScaleY);
          const bgScale = baseScale * 2.5; // 2.5x larger than the multiplier size
          
          bgSprite.width = activeBgTexture.width * bgScale;
          bgSprite.height = activeBgTexture.height * bgScale;
          
          // Add background before the sprite
          const spriteIndex = container.getChildIndex(sprite);
          container.addChildAt(bgSprite, spriteIndex);
          multiplierBackgrounds.push({ sprite: bgSprite, multiplier });
        }
      }

      // Update texture if it's a Sprite
      if (sprite instanceof Sprite) {
        const { texture, scale: configScale } = getMultiplierTextureAndScale(
          multiplier,
          isActive
        );
        if (texture) {
          sprite.texture = texture;

          // Re-apply config scale and container constraints
          const baseWidth = texture.width * configScale;
          const baseHeight = texture.height * configScale;

          // Get width based on active state (important!)
          const multiplierWidth = isActive ? activeMultiplierWidth : defaultMultiplierWidth;
          const maxWidth = multiplierWidth;
          const maxHeight = spriteHeight;

          // Calculate additional scale if base size exceeds container
          const additionalScaleX = Math.min(1, maxWidth / baseWidth);
          const additionalScaleY = Math.min(1, maxHeight / baseHeight);
          const additionalScale = Math.min(additionalScaleX, additionalScaleY);

          sprite.width = baseWidth * additionalScale;
          sprite.height = baseHeight * additionalScale;
        }
      } else if (sprite instanceof Text) {
        // Update text color and size for fallback
        const multiplierWidth = isActive ? activeMultiplierWidth : defaultMultiplierWidth;
        sprite.style.fill = isActive ? 0xffd04d : 0x666666;
        sprite.style.fontSize = Math.floor(Math.min(multiplierWidth, spriteHeight) * 0.4);
      }
    }
  }

  return { container, build, updateValues, initializeComposedTextures };
}
