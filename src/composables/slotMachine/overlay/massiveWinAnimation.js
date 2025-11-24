import { Container, Graphics, Sprite, Texture, Text } from "pixi.js";
import { BLEND_MODES } from "@pixi/constants";
import gsap from "gsap";
import { ASSETS } from "../../../config/assets";
import { useAudioEffects } from "../../../composables/useAudioEffects";
import { audioManager } from "../../../composables/audioManager";

/**
 * Creates an epic massive win animation system
 * Features:
 * - Actual game tiles orbit and spiral inward with crystals flying out
 * - Magic energy builds in trees and roots (background elements)
 * - Frame intensely glows
 * - "MASSIVE WIN" text flies out with crystals
 * - Camera stays fixed (no tilt or movement)
 */
export function createMassiveWinAnimation(reelsRef) {
  const { playWinningAnnouncement, stopWinningAnnouncement } =
    useAudioEffects();

  // Store reels reference for accessing sprite cache
  let reels = reelsRef;

  const container = new Container();
  container.visible = false;
  container.zIndex = 2000; // Above everything else

  // Sub-containers for layering
  const backgroundEffectsContainer = new Container(); // Trees/roots energy
  const frameGlowContainer = new Container(); // Frame glow effects
  const tileCollapseContainer = new Container(); // Collapsing tiles
  const crystalContainer = new Container(); // Flying crystals
  const textContainer = new Container(); // MASSIVE WIN text

  container.addChild(backgroundEffectsContainer);
  container.addChild(frameGlowContainer);
  container.addChild(tileCollapseContainer);
  container.addChild(crystalContainer);
  container.addChild(textContainer);

  // Animation state
  let isAnimating = false;
  let animationTimeline = null;
  const crystals = [];
  const energyParticles = [];
  const tileSprites = [];

  /**
   * Calculate responsive scale factor based on canvas size
   * Returns a scale factor between 0.4 (very small mobile) and 1.0 (desktop)
   */
  function getResponsiveScale(canvasWidth, canvasHeight) {
    const minDimension = Math.min(canvasWidth, canvasHeight);
    // Mobile portrait: ~400px, Mobile landscape: ~700px, Desktop: 1000+px
    if (minDimension < 500) return 0.4; // Very small mobile
    if (minDimension < 700) return 0.6; // Mobile
    if (minDimension < 900) return 0.8; // Tablet
    return 1.0; // Desktop
  }

  /**
   * Create a crystal particle that flies out from tiles
   */
  function createCrystal(x, y, delay = 0) {
    const crystal = new Graphics();

    // Create a shiny crystal shape (diamond)
    const size = 10 + Math.random() * 20;
    const points = [
      { x: 0, y: -size },
      { x: size * 0.6, y: 0 },
      { x: 0, y: size },
      { x: -size * 0.6, y: 0 },
    ];

    // Gradient-like effect with multiple colors
    const colors = [0x00ffff, 0x00ccff, 0x0099ff, 0x66ccff, 0xffffff];
    const color = colors[Math.floor(Math.random() * colors.length)];

    crystal.poly(points);
    crystal.fill({ color, alpha: 0.9 });
    crystal.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });

    crystal.x = x;
    crystal.y = y;
    crystal.scale.set(0);
    crystal.rotation = Math.random() * Math.PI * 2;
    crystal.blendMode = BLEND_MODES.ADD;

    // Physics properties
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    crystal.vx = Math.cos(angle) * speed;
    crystal.vy = Math.sin(angle) * speed - 2; // Slight upward bias
    crystal.gravity = 0.1;
    crystal.rotationSpeed = (Math.random() - 0.5) * 0.3;
    crystal.life = 1.0;
    crystal.maxLife = 2 + Math.random() * 2;
    crystal.delay = delay;
    crystal.born = Date.now();

    crystalContainer.addChild(crystal);
    crystals.push(crystal);

    // Animate crystal entrance
    gsap.to(crystal.scale, {
      x: 1,
      y: 1,
      duration: 0.3,
      delay: delay,
      ease: "back.out(1.7)",
    });

    return crystal;
  }

  /**
   * Create magic energy particles for background (trees/roots)
   */
  function createEnergyParticle(x, y, delay = 0) {
    const particle = new Graphics();

    // Create glowing orb
    const size = 3 + Math.random() * 6;
    particle.circle(0, 0, size);
    particle.fill({ color: 0x00ff88, alpha: 0.8 });

    // Outer glow
    particle.circle(0, 0, size * 1.5);
    particle.fill({ color: 0x00ff88, alpha: 0.3 });

    particle.x = x;
    particle.y = y;
    particle.scale.set(0);
    particle.blendMode = BLEND_MODES.ADD;

    // Movement properties
    particle.vx = (Math.random() - 0.5) * 0.5;
    particle.vy = -Math.random() * 1.5 - 0.5; // Float upward
    particle.life = 1.0;
    particle.maxLife = 3 + Math.random() * 2;
    particle.delay = delay;
    particle.born = Date.now();
    particle.pulseSpeed = 2 + Math.random() * 2;

    backgroundEffectsContainer.addChild(particle);
    energyParticles.push(particle);

    // Animate entrance
    gsap.to(particle.scale, {
      x: 1,
      y: 1,
      duration: 0.5,
      delay: delay,
      ease: "power2.out",
    });

    return particle;
  }

  /**
   * Create intense frame glow effect
   */
  function createFrameGlow(canvasWidth, canvasHeight) {
    frameGlowContainer.removeChildren();

    // Create multiple layers of glowing frames
    const glowLayers = 5;
    const baseThickness = 20;
    const colors = [0xffaa00, 0xffdd00, 0xffff00, 0xffffaa, 0xffffff];

    for (let i = 0; i < glowLayers; i++) {
      const glow = new Graphics();
      const thickness = (baseThickness * (glowLayers - i)) / glowLayers;
      const color = colors[i];
      const alpha = ((glowLayers - i) / glowLayers) * 0.3;

      // Draw frame border
      glow.rect(0, 0, canvasWidth, canvasHeight);
      glow.stroke({ color, width: thickness, alpha });

      glow.blendMode = BLEND_MODES.ADD;
      glow.alpha = 0;

      frameGlowContainer.addChild(glow);

      // Pulse animation
      gsap.to(glow, {
        alpha: alpha,
        duration: 0.3,
        delay: i * 0.05,
        ease: "power2.out",
      });

      // Continuous pulse
      gsap.to(glow, {
        alpha: alpha * 0.5,
        duration: 0.5,
        delay: 0.5 + i * 0.05,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }

  /**
   * Get win image and config based on intensity
   */
  function getWinConfig(intensity, canvasWidth, canvasHeight) {
    const responsiveScale = getResponsiveScale(canvasWidth, canvasHeight);
    
    const configs = {
      small: {
        imageKey: "win_small",
        targetHeight: 250 * responsiveScale,
        textFallback: "WIN!",
      },
      medium: {
        imageKey: "win_grand",
        targetHeight: 300 * responsiveScale,
        textFallback: "BIG WIN!",
      },
      big: {
        imageKey: "win_grand",
        targetHeight: 350 * responsiveScale,
        textFallback: "GRAND WIN!",
      },
      mega: {
        imageKey: "win_mega",
        targetHeight: 400 * responsiveScale,
        textFallback: "MASSIVE WIN!",
      },
      jackpot: {
        imageKey: "win_megagrand",
        targetHeight: 450 * responsiveScale,
        textFallback: "JACKPOT!",
      },
    };

    return configs[intensity] || configs.small;
  }

  /**
   * Create win announcement text/image with epic entrance
   */
  function createWinText(canvasWidth, canvasHeight, intensity = "mega") {
    textContainer.removeChildren();

    const config = getWinConfig(intensity, canvasWidth, canvasHeight);

    // Try to use image first
    const winImage =
      ASSETS.loadedImages?.[config.imageKey] ||
      ASSETS.imagePaths?.[config.imageKey];

    if (winImage) {
      const texture =
        winImage instanceof Texture ? winImage : Texture.from(winImage);
      const textSprite = new Sprite(texture);
      textSprite.anchor.set(0.5);
      textSprite.x = canvasWidth / 2;
      // Move up 20% to center better in the visible area
      textSprite.y = canvasHeight * 0.4;

      // Scale to appropriate size based on intensity
      let scale = config.targetHeight / textSprite.height;
      
      // Ensure sprite doesn't exceed 90% of canvas width
      const maxWidth = canvasWidth * 0.9;
      const scaledWidth = textSprite.width * scale;
      if (scaledWidth > maxWidth) {
        scale = maxWidth / textSprite.width;
      }
      
      textSprite.scale.set(0);

      textContainer.addChild(textSprite);

      // Epic entrance animation - explode from center
      gsap.to(textSprite.scale, {
        x: scale,
        y: scale,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
      });

      // Add rotation wobble
      gsap.to(textSprite, {
        rotation: 0.1,
        duration: 0.3,
        yoyo: true,
        repeat: 3,
        ease: "sine.inOut",
      });
    } else {
      // Fallback to text
      const textStyle = {
        fontFamily: "Arial Black, sans-serif",
        fontSize: config.targetHeight / 3,
        fontWeight: "bold",
        fill: 0xffff00,
        stroke: { color: 0xff6600, width: 12 },
        dropShadow: {
          color: 0xff0000,
          blur: 30,
          angle: Math.PI / 6,
          distance: 0,
          alpha: 0.8,
        },
        align: "center",
      };

      const text = new Text(config.textFallback, textStyle);
      text.anchor.set(0.5);
      text.x = canvasWidth / 2;
      // Move up 20% to center better in the visible area
      text.y = canvasHeight * 0.4;
      text.scale.set(0);

      textContainer.addChild(text);

      // Epic entrance animation
      gsap.to(text.scale, {
        x: 1,
        y: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }

  /**
   * Create orbiting tile that spirals inward and explodes
   * Uses actual game tile sprites from the grid
   */
  function createOrbitingTile(
    x,
    y,
    width,
    height,
    index,
    totalTiles,
    centerX,
    centerY,
    col,
    row
  ) {
    let tile;

    // Try to clone the actual tile sprite from the grid
    if (reels && reels.getSpriteCache) {
      const spriteCache = reels.getSpriteCache();
      // Grid row comes from getTilePositions (row + 4 in renderer)
      // Need to convert back to visual row used in sprite cache
      // Grid rows 4-9 map to visual rows -1 to 4 (subtract BUFFER_OFFSET which is 4)
      // BUT: getTilePositions adds 4, so we get grid rows 4-7 for the 4 visible tiles
      // Visual rows in reels: -1, 0, 1, 2, 3, 4 (6 rows total)
      // Our 4 game tiles (row 0-3 from getTilePositions) map to grid rows 4-7
      // Grid row 4 -> visual row 0, grid row 5 -> visual row 1, etc.
      const visualRow = row - 4;
      const cellKey = `${col}:${visualRow}`;
      const originalSprite = spriteCache.get(cellKey);

      if (originalSprite && originalSprite.texture) {
        // Clone the sprite with its actual texture
        tile = new Sprite(originalSprite.texture);
        tile.anchor.set(0.5, 0.5);

        // CRITICAL: Copy the exact scale from the original sprite
        // This ensures the cloned tile matches the displayed size exactly
        tile.scale.x = originalSprite.scale.x;
        tile.scale.y = originalSprite.scale.y;

        // Store the base scale for animations to use as reference
        tile._baseScaleX = originalSprite.scale.x;
        tile._baseScaleY = originalSprite.scale.y;
      }
    }

    // Fallback: Create white tile if cloning failed
    if (!tile) {
      tile = new Graphics();
      const cornerRadius = width * 0.15;

      tile.roundRect(-width / 2, -height / 2, width, height, cornerRadius);
      tile.fill({ color: 0xffffff, alpha: 0.5 });

      // Add border
      tile.roundRect(-width / 2, -height / 2, width, height, cornerRadius);
      tile.stroke({ color: 0xdddddd, width: 3, alpha: 0.5 });

      // Graphics objects have base scale of 1
      tile._baseScaleX = 1;
      tile._baseScaleY = 1;
    }

    tile.x = x;
    tile.y = y;
    tile.rotation = 0;

    tileCollapseContainer.addChild(tile);
    tileSprites.push(tile);

    // Calculate angle for this tile in the circular formation
    const angle = (index / totalTiles) * Math.PI * 2;
    
    // Responsive orbit radius based on canvas size
    const minDimension = Math.min(centerX, centerY);
    const orbitRadius = Math.min(300, minDimension * 0.6); // Max 60% of min dimension

    // Calculate orbit position
    const orbitX = centerX + Math.cos(angle) * orbitRadius;
    const orbitY = centerY + Math.sin(angle) * orbitRadius;

    // Create the animation timeline
    const timeline = gsap.timeline();

    // Phase 1: Lift up and glow (0.3s)
    // Animate relative to base scale (not absolute values)
    timeline.to(tile.scale, {
      x: tile._baseScaleX * 1.2,
      y: tile._baseScaleY * 1.2,
      duration: 0.3,
      ease: "power2.out",
    });

    timeline.to(
      tile,
      {
        y: y - 20, // Lift up 20px
        duration: 0.3,
        ease: "power2.out",
      },
      "<"
    );

    // Glow appears
    timeline.to(
      tile.children[2],
      {
        // The outer glow rectangle
        alpha: 0.3,
        duration: 0.3,
        ease: "power2.out",
      },
      "<"
    );

    // Phase 2: Move to orbit position and start rotating (1.0s)
    timeline.to(tile, {
      x: orbitX,
      y: orbitY,
      duration: 1.0,
      ease: "power2.inOut",
    });

    // Tile spins while moving to orbit
    timeline.to(
      tile,
      {
        rotation: angle + Math.PI * 2, // One full rotation plus position angle
        duration: 1.0,
        ease: "none",
      },
      "<"
    );

    // Phase 3: Circular orbit (continue rotating around center) (1.0s)
    const orbitRotations = 1.5; // 1.5 full circles
    timeline.to(
      {},
      {
        duration: 1.0,
        onUpdate: function () {
          const progress = this.progress();
          const currentAngle = angle + progress * orbitRotations * Math.PI * 2;
          const currentRadius = orbitRadius; // Keep radius constant during orbit

          tile.x = centerX + Math.cos(currentAngle) * currentRadius;
          tile.y = centerY + Math.sin(currentAngle) * currentRadius;
          tile.rotation = currentAngle + Math.PI * 2 * progress;
        },
      }
    );

    // Phase 4: Spiral inward to center (0.8s)
    timeline.to(
      {},
      {
        duration: 0.8,
        onUpdate: function () {
          const progress = this.progress();
          const currentAngle =
            angle + orbitRotations * Math.PI * 2 + progress * Math.PI * 4; // 2 more rotations
          const currentRadius = orbitRadius * (1 - progress); // Shrink radius to 0

          tile.x = centerX + Math.cos(currentAngle) * currentRadius;
          tile.y = centerY + Math.sin(currentAngle) * currentRadius;
          tile.rotation += 0.3; // Spin faster as it gets closer

          // Fade out as approaching center
          tile.alpha = 0.5 * (1 - progress);
        },
      }
    );

    // Scale down as spiraling (relative to base scale)
    timeline.to(
      tile.scale,
      {
        x: tile._baseScaleX * 0.2,
        y: tile._baseScaleY * 0.2,
        duration: 0.8,
        ease: "power2.in",
      },
      "<"
    );

    // Phase 5: Disappear at center
    timeline.to(tile, {
      alpha: 0,
      duration: 0.1,
    });

    return tile;
  }

  /**
   * Update all particles
   */
  function updateParticles(deltaTime = 1) {
    const now = Date.now();

    // Update crystals
    for (let i = crystals.length - 1; i >= 0; i--) {
      const c = crystals[i];
      const age = (now - c.born) / 1000;

      if (age < c.delay) continue;

      // Apply physics
      c.vy += c.gravity;
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotationSpeed;

      // Fade out
      const t = age / c.maxLife;
      if (t < 1) {
        c.alpha = (1 - t) * 0.9;
      } else {
        // Remove dead crystals
        c.parent?.removeChild(c);
        c.destroy();
        crystals.splice(i, 1);
      }
    }

    // Update energy particles
    for (let i = energyParticles.length - 1; i >= 0; i--) {
      const p = energyParticles[i];
      const age = (now - p.born) / 1000;

      if (age < p.delay) continue;

      // Float upward
      p.x += p.vx;
      p.y += p.vy;

      // Pulse effect
      const pulse = Math.sin(age * p.pulseSpeed) * 0.3 + 0.7;
      p.scale.set(pulse);

      // Fade out
      const t = age / p.maxLife;
      if (t < 1) {
        p.alpha = (1 - t) * 0.8;
      } else {
        // Remove dead particles
        p.parent?.removeChild(p);
        p.destroy();
        energyParticles.splice(i, 1);
      }
    }
  }

  /**
   * Refresh cloned tiles to match current grid state
   * Called after tiles collapse, before they become visible again
   */
  function refreshClonedTilesToMatchGrid(tilePositions) {
    if (!reels || !reels.getSpriteCache) return;

    const spriteCache = reels.getSpriteCache();

    tileSprites.forEach((tile, index) => {
      const originalPos = tilePositions[index];
      if (!originalPos) return;

      // Get the current sprite from the grid at this position
      const visualRow = originalPos.row - 4;
      const cellKey = `${originalPos.col}:${visualRow}`;
      const currentSprite = spriteCache.get(cellKey);

      if (currentSprite && currentSprite.texture) {
        // Update texture to match current grid
        if (tile.texture !== currentSprite.texture) {
          tile.texture = currentSprite.texture;
          console.log(
            `🔄 Refreshed tile [${originalPos.col},${originalPos.row}] with new texture`
          );
        }

        // CRITICAL: Also update the base scale to match current sprite
        // The grid sprite scale might have changed (e.g., from bump animations)
        if ("_baseScaleX" in tile && "_baseScaleY" in tile) {
          tile._baseScaleX = currentSprite.scale.x;
          tile._baseScaleY = currentSprite.scale.y;
        }
      }
    });

    console.log(
      `✅ Refreshed ${tileSprites.length} cloned tiles to match current grid`
    );
  }

  /**
   * Fade out the animation and show the grid
   */
  function fadeOutAndShowGrid(onComplete) {
    // Restore grid visibility immediately
    if (reels && reels.tilesContainer) {
      reels.tilesContainer.visible = true;
    }

    // Fade out the entire animation
    gsap.to(container, {
      alpha: 0,
      duration: 0.8,
      ease: "power2.in",
      onComplete: () => {
        hide();
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Create number display for win amount using large gold glyphs
   */
  function createAmountDisplay(amount, canvasWidth, canvasHeight) {
    const numberContainer = new Container();
    const formattedAmount = amount.toLocaleString();
    const digits = formattedAmount.split("");

    // Scale down glyphs more aggressively on smaller screens
    const responsiveScale = getResponsiveScale(canvasWidth, canvasHeight);
    const PUNCTUATION_SCALE_FACTOR = 0.5;
    const PERIOD_Y_POSITION = 1.0;
    const COMMA_Y_POSITION = 0.65;
    // Base scale factor for the entire amount display
    const BASE_GLYPH_SCALE = 0.7 * responsiveScale;

    // Get reference height from first digit
    let referenceHeight = 0;
    for (const d of digits) {
      if (d >= "0" && d <= "9") {
        const imageSrc =
          ASSETS.loadedImages?.[`glyph_${d}_gold_large`] ||
          ASSETS.imagePaths?.[`glyph_${d}_gold_large`];
        if (imageSrc) {
          const texture =
            imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc);
          const tempSprite = new Sprite(texture);
          referenceHeight = tempSprite.height;
          break;
        }
      }
    }

    let offsetX = 0;

    for (const d of digits) {
      let sprite;

      if (d === "," || d === ".") {
        const assetKey =
          d === "," ? "glyph_comma_gold_large" : "glyph_dot_gold_large";
        const imageSrc =
          ASSETS.loadedImages?.[assetKey] || ASSETS.imagePaths?.[assetKey];
        if (!imageSrc) continue;
        const texture =
          imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc);
        sprite = new Sprite(texture);

        const spriteScale =
          (referenceHeight / sprite.height) * PUNCTUATION_SCALE_FACTOR * BASE_GLYPH_SCALE;
        sprite.scale.set(spriteScale);
        sprite.x = offsetX - sprite.width * 0.1;
        sprite.y =
          referenceHeight * (d === "." ? PERIOD_Y_POSITION : COMMA_Y_POSITION) * BASE_GLYPH_SCALE;

        numberContainer.addChild(sprite);
        offsetX += sprite.width * 0.7;
      } else if (d >= "0" && d <= "9") {
        const imageSrc =
          ASSETS.loadedImages?.[`glyph_${d}_gold_large`] ||
          ASSETS.imagePaths?.[`glyph_${d}_gold_large`];
        if (!imageSrc) continue;
        const texture =
          imageSrc instanceof Texture ? imageSrc : Texture.from(imageSrc);
        sprite = new Sprite(texture);
        sprite.scale.set(BASE_GLYPH_SCALE);
        sprite.x = offsetX;
        sprite.y = 0;
        numberContainer.addChild(sprite);
        offsetX += sprite.width * 0.95;
      }
    }

    // Scale to fit within canvas - more aggressive on mobile
    const maxWidth = canvasWidth * 0.85;
    if (numberContainer.width > maxWidth) {
      const scale = maxWidth / numberContainer.width;
      numberContainer.scale.set(scale);
    }

    // Position below win text - increase offset to prevent overlap
    // Use larger offset to ensure clear separation between win text and amount
    const yOffset = 150 * responsiveScale;
    numberContainer.x = canvasWidth / 2 - numberContainer.width / 2;
    numberContainer.y = canvasHeight * 0.4 + yOffset;
    numberContainer.scale.set(0);

    textContainer.addChild(numberContainer);

    // Animate entrance
    gsap.to(numberContainer.scale, {
      x: 1,
      y: 1,
      duration: 0.6,
      delay: 0.3,
      ease: "back.out(1.5)",
    });

    return numberContainer;
  }

  /**
   * Show the massive win animation
   */
  function show(
    canvasWidth,
    canvasHeight,
    tilePositions,
    intensity = "mega",
    amount = 0,
    onComplete
  ) {
    console.log("💎 MASSIVE WIN ANIMATION START:", {
      intensity,
      amount,
      tileCount: tilePositions?.length || 0,
      canvasSize: `${canvasWidth}x${canvasHeight}`,
    });

    container.visible = true;
    container.alpha = 1;
    isAnimating = true;

    // Pause background music and play winning announcement audio
    audioManager.pause();
    playWinningAnnouncement();

    // Clear previous animations
    if (animationTimeline) {
      animationTimeline.kill();
    }
    gsap.killTweensOf(container);

    // Clear old particles
    crystals.forEach((c) => {
      c.parent?.removeChild(c);
      c.destroy();
    });
    crystals.length = 0;

    energyParticles.forEach((p) => {
      p.parent?.removeChild(p);
      p.destroy();
    });
    energyParticles.length = 0;

    tileSprites.forEach((t) => {
      t.parent?.removeChild(t);
      t.destroy();
    });
    tileSprites.length = 0;

    // Create the animation sequence
    animationTimeline = gsap.timeline({
      onComplete: () => {
        // Simply fade out and show the grid - no fly back animation
        fadeOutAndShowGrid(onComplete);
      },
    });

    // Step 1: Create frame glow (0s)
    createFrameGlow(canvasWidth, canvasHeight);

    // Step 2: Spawn energy particles around edges (0.2s)
    animationTimeline.call(
      () => {
        // Create energy particles along edges (trees/roots effect)
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
          const side = Math.floor(Math.random() * 4);
          let x, y;

          switch (side) {
            case 0: // Top
              x = Math.random() * canvasWidth;
              y = Math.random() * 100;
              break;
            case 1: // Right
              x = canvasWidth - Math.random() * 100;
              y = Math.random() * canvasHeight;
              break;
            case 2: // Bottom
              x = Math.random() * canvasWidth;
              y = canvasHeight - Math.random() * 100;
              break;
            case 3: // Left
              x = Math.random() * 100;
              y = Math.random() * canvasHeight;
              break;
          }

          createEnergyParticle(x, y, i * 0.003);
        }
      },
      null,
      0.2
    );

    // Step 3: Tiles orbit in circle and spiral inward (0.5s start)
    if (tilePositions && tilePositions.length > 0) {
      const centerX = canvasWidth / 2;
      // Move orbit center up to align with win text (40% instead of 50%)
      const centerY = canvasHeight * 0.45;

      animationTimeline.call(
        () => {
          // Hide the actual tiles during animation (not the entire container, just the tiles)
          if (reels && reels.tilesContainer) {
            reels.tilesContainer.visible = false;
          }

          // Create all orbiting tiles (clones of actual game tiles)
          tilePositions.forEach((pos, index) => {
            createOrbitingTile(
              pos.x,
              pos.y,
              pos.width,
              pos.height,
              index,
              tilePositions.length,
              centerX,
              centerY,
              pos.col,
              pos.row
            );
          });
        },
        null,
        0.5
      );

      // Step 3.5: Central explosion when tiles converge (3.6s = 0.5 + 0.3 + 1.0 + 1.0 + 0.8)
      animationTimeline.call(
        () => {
          // Create massive crystal explosion from center - responsive count
          const responsiveScale = getResponsiveScale(canvasWidth, canvasHeight);
          const crystalCount = Math.floor(150 * responsiveScale); // Fewer particles on mobile
          for (let i = 0; i < crystalCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (3 + Math.random() * 8) * responsiveScale;

            // Create crystal at center
            const crystal = createCrystal(centerX, centerY, i * 0.005);

            // Override its velocity for radial explosion
            crystal.vx = Math.cos(angle) * speed;
            crystal.vy = Math.sin(angle) * speed - 1; // Slight upward bias
          }

          // Create shockwave effect at center
          const shockwave = new Graphics();
          shockwave.circle(0, 0, 20);
          shockwave.fill({ color: 0xffff00, alpha: 0.8 });
          shockwave.x = centerX;
          shockwave.y = centerY;
          shockwave.blendMode = BLEND_MODES.ADD;
          crystalContainer.addChild(shockwave);

          // Animate shockwave
          gsap.to(shockwave.scale, {
            x: 15,
            y: 15,
            duration: 0.6,
            ease: "power2.out",
          });
          gsap.to(shockwave, {
            alpha: 0,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => {
              shockwave.parent?.removeChild(shockwave);
              shockwave.destroy();
            },
          });

          // CRITICAL: Refresh cloned tiles RIGHT AFTER collapse
          // This updates their textures to match the new grid state
          // so when they fly back, they already have the correct symbols
          refreshClonedTilesToMatchGrid(tilePositions);
        },
        null,
        3.6
      );
    }

    // Step 4: Show WIN text with intensity (4.2s = after explosion)
    animationTimeline.call(
      () => {
        createWinText(canvasWidth, canvasHeight, intensity);

        // Create extra crystals around text - responsive count and radius
        const responsiveScale = getResponsiveScale(canvasWidth, canvasHeight);
        const crystalCount = Math.floor(50 * responsiveScale);
        const baseRadius = 200 * responsiveScale;
        const radiusVariation = 100 * responsiveScale;
        
        for (let i = 0; i < crystalCount; i++) {
          const angle = (i / crystalCount) * Math.PI * 2;
          const radius = baseRadius + Math.random() * radiusVariation;
          const x = canvasWidth / 2 + Math.cos(angle) * radius;
          const y = canvasHeight / 2 + Math.sin(angle) * radius;
          createCrystal(x, y, i * 0.01);
        }
      },
      null,
      4.2
    );

    // Step 5: Show amount display (4.5s = after win text)
    if (amount > 0) {
      animationTimeline.call(
        () => {
          createAmountDisplay(amount, canvasWidth, canvasHeight);
        },
        null,
        4.5
      );
    }

    // Step 6: Hold for effect (adjust based on intensity)
    const holdDurations = {
      small: 1.5,
      medium: 2.0,
      big: 2.5,
      mega: 3.0,
      jackpot: 3.5,
    };
    const holdDuration = holdDurations[intensity] || 2.0;
    animationTimeline.to({}, { duration: holdDuration });
  }

  /**
   * Hide the animation
   */
  function hide() {
    container.visible = false;
    isAnimating = false;

    // Restore tiles visibility
    if (reels && reels.tilesContainer) {
      reels.tilesContainer.visible = true;
    }

    // Stop winning announcement audio and resume background music
    stopWinningAnnouncement();
    audioManager.resume();

    // Clean up
    frameGlowContainer.removeChildren();
    tileCollapseContainer.removeChildren();
    crystalContainer.removeChildren();
    textContainer.removeChildren();
    backgroundEffectsContainer.removeChildren();

    crystals.length = 0;
    energyParticles.length = 0;
    tileSprites.length = 0;

    if (animationTimeline) {
      animationTimeline.kill();
      animationTimeline = null;
    }
  }

  /**
   * Update animation (called every frame)
   */
  function update(deltaTime = 1) {
    if (!isAnimating || !container.visible) return;

    updateParticles(deltaTime);
  }

  /**
   * Rebuild for canvas resize
   */
  function build(canvasWidth, canvasHeight) {
    if (container.visible) {
      // Recreate frame glow for new size
      createFrameGlow(canvasWidth, canvasHeight);
    }
  }

  return {
    container,
    show,
    hide,
    update,
    build,
    isShowing: () => isAnimating,
  };
}
