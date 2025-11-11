import { createParticleSystem } from './particles'

/**
 * Manages winning tile effects including glow, pulse, scale, rotation
 * Coordinates with particle system for celebration animations
 */
export function createWinningEffects() {
  const particleSystem = createParticleSystem()
  const activeEffects = new Map() // Map of tile key -> effect state
  let animationTime = 0

  /**
   * Determine effect intensity based on win details
   */
  function getEffectIntensity(win) {
    const { count, symbol } = win

    // High-value symbols
    const highValueSymbols = ['chu', 'zhong', 'fa']

    // Determine win size
    if (count >= 5 && highValueSymbols.includes(symbol)) {
      return 'mega' // 5+ high-value symbols
    } else if (count >= 5 || (count >= 4 && highValueSymbols.includes(symbol))) {
      return 'big' // 5 of any symbol or 4+ high-value
    } else if (count >= 4) {
      return 'medium' // 4 symbols
    } else {
      return 'small' // 3 symbols
    }
  }

  /**
   * Get effect parameters based on intensity
   */
  function getEffectParams(intensity) {
    const params = {
      small: {
        glowIntensity: 0.3,
        pulseSpeed: 2,
        pulseScale: 1.1,
        rotation: 0.05, // radians
        particleCount: 10,
        particleType: 'sparkle',
        flashCount: 2,
        enableOrbiting: false
      },
      medium: {
        glowIntensity: 0.5,
        pulseSpeed: 2.5,
        pulseScale: 1.15,
        rotation: 0.08,
        particleCount: 15,
        particleType: 'sparkle',
        flashCount: 3,
        enableOrbiting: false
      },
      big: {
        glowIntensity: 0.7,
        pulseSpeed: 3,
        pulseScale: 1.2,
        rotation: 0.1,
        particleCount: 20,
        particleType: 'star',
        flashCount: 4,
        enableOrbiting: true,
        orbitStars: 5
      },
      mega: {
        glowIntensity: 1.0,
        pulseSpeed: 4,
        pulseScale: 1.3,
        rotation: 0.15,
        particleCount: 30,
        particleType: 'star',
        flashCount: 5,
        enableOrbiting: true,
        orbitStars: 8
      }
    }

    return params[intensity] || params.small
  }

  /**
   * Start winning effects for a set of wins
   */
  function startEffects(wins, tileSprites) {
    if (!wins || wins.length === 0) return

    animationTime = 0
    activeEffects.clear()

    wins.forEach(win => {
      const intensity = getEffectIntensity(win)
      const params = getEffectParams(intensity)

      win.positions.forEach(([col, row]) => {
        const key = `${col}:${row}`
        const sprite = tileSprites.get(key)

        if (sprite) {
          // Store original dimensions and state
          const effect = {
            sprite,
            params,
            intensity,
            startTime: Date.now(),
            phase: 'highlight', // highlight -> celebrate -> idle
            originalWidth: sprite.width,
            originalHeight: sprite.height,
            originalRotation: sprite.rotation || 0,
            flashCounter: 0,
            burstTriggered: false,
            orbitTriggered: false
          }

          activeEffects.set(key, effect)
        }
      })
    })
  }

  /**
   * Apply visual effects to a sprite based on animation phase
   */
  function applyEffectToSprite(effect, deltaTime) {
    const { sprite, params, phase, startTime } = effect
    const elapsed = (Date.now() - startTime) / 1000 // seconds

    // Ensure sprite is valid
    if (!sprite || sprite.destroyed) return

    // Phase 1: Highlight (0-0.5s)
    if (elapsed < 0.5) {
      effect.phase = 'highlight'

      // Glow effect via tint (golden glow)
      const glowPulse = 0.5 + Math.sin(animationTime * params.pulseSpeed) * 0.5
      sprite.tint = 0xffffaa + Math.floor(glowPulse * 0x55) // Yellow-white glow

      // Initial scale up
      const scaleProgress = Math.min(elapsed / 0.5, 1)
      const targetScale = 1 + (params.pulseScale - 1) * scaleProgress

      // Calculate new dimensions based on original dimensions
      const newWidth = effect.originalWidth * targetScale
      const newHeight = effect.originalHeight * targetScale
      sprite.width = newWidth
      sprite.height = newHeight

      // Slight initial rotation
      sprite.rotation = effect.originalRotation + Math.sin(animationTime * 2) * params.rotation * 0.5

    // Phase 2: Celebration (0.5-2s)
    } else if (elapsed < 2.0) {
      if (effect.phase !== 'celebrate') {
        effect.phase = 'celebrate'
        effect.celebrateStartTime = Date.now()
      }

      const celebrateElapsed = (Date.now() - effect.celebrateStartTime) / 1000

      // Pulsing glow (golden/white)
      const glowPulse = 0.5 + Math.sin(animationTime * params.pulseSpeed * 1.5) * 0.5
      sprite.tint = 0xffff88 + Math.floor(glowPulse * 0x77) // Bright golden glow

      // Scale pulse animation
      const scalePulse = 1 + Math.sin(animationTime * params.pulseSpeed) * (params.pulseScale - 1)
      const newWidth = effect.originalWidth * scalePulse
      const newHeight = effect.originalHeight * scalePulse
      sprite.width = newWidth
      sprite.height = newHeight

      // Wobble rotation
      sprite.rotation = effect.originalRotation + Math.sin(animationTime * params.pulseSpeed * 2) * params.rotation

      // Trigger particle burst at start of celebration
      if (!effect.burstTriggered) {
        effect.burstTriggered = true
        const centerX = sprite.x + sprite.width / 2
        const centerY = sprite.y + sprite.height / 2
        particleSystem.burst(centerX, centerY, params.particleCount, params.particleType)
      }

      // Continuous sparkles during celebration
      if (Math.random() < 0.15) {
        const centerX = sprite.x + sprite.width / 2
        const centerY = sprite.y + sprite.height / 2
        particleSystem.sparkle(centerX, centerY, 2)
      }

      // Orbiting stars for big wins
      if (params.enableOrbiting && !effect.orbitTriggered && celebrateElapsed > 0.3) {
        effect.orbitTriggered = true
        const centerX = sprite.x + sprite.width / 2
        const centerY = sprite.y + sprite.height / 2
        particleSystem.orbitingStars(centerX, centerY, params.orbitStars, sprite.width * 0.4)
      }

      // Flash effect
      const flashInterval = 0.2
      const flashIndex = Math.floor(celebrateElapsed / flashInterval)
      if (flashIndex !== effect.flashCounter && flashIndex < params.flashCount) {
        effect.flashCounter = flashIndex
        // Flash white
        sprite.tint = 0xffffff
        setTimeout(() => {
          if (sprite && !sprite.destroyed) {
            sprite.tint = 0xffffcc // Golden tint
          }
        }, 50)
      }

    // Phase 3: Idle (fade out effects)
    } else {
      effect.phase = 'idle'

      // Gradually return to normal
      const fadeOutTime = 0.5
      const fadeElapsed = elapsed - 2.0
      const fadeProgress = Math.min(fadeElapsed / fadeOutTime, 1)

      const targetScale = params.pulseScale - (params.pulseScale - 1) * fadeProgress
      const newWidth = effect.originalWidth * targetScale
      const newHeight = effect.originalHeight * targetScale
      sprite.width = newWidth
      sprite.height = newHeight

      const rotation = params.rotation * (1 - fadeProgress)
      sprite.rotation = effect.originalRotation + Math.sin(animationTime * 2) * rotation

      // Fade tint back to normal
      const tintProgress = 1 - fadeProgress
      sprite.tint = 0xffffff + Math.floor(tintProgress * 0xff) * 0x010100 // Fade golden tint
    }
  }

  /**
   * Update all active effects
   */
  function update(deltaTime = 1, tileSprites) {
    animationTime += deltaTime / 60 // Convert to seconds

    // Update all active tile effects
    activeEffects.forEach((effect, key) => {
      if (effect.sprite && !effect.sprite.destroyed) {
        applyEffectToSprite(effect, deltaTime)
      } else {
        activeEffects.delete(key)
      }
    })

    // Update particle system
    particleSystem.update(deltaTime)
  }

  /**
   * Clear all effects
   */
  function clear() {
    activeEffects.forEach((effect) => {
      if (effect.sprite && !effect.sprite.destroyed) {
        // Reset sprite to original state
        effect.sprite.width = effect.originalWidth
        effect.sprite.height = effect.originalHeight
        effect.sprite.rotation = effect.originalRotation
        effect.sprite.tint = 0xffffff
      }
    })
    activeEffects.clear()
    particleSystem.clear()
  }

  /**
   * Check if effects are still active
   */
  function isActive() {
    return activeEffects.size > 0
  }

  return {
    container: particleSystem.container,
    startEffects,
    update,
    clear,
    isActive,
    getEffectIntensity
  }
}
