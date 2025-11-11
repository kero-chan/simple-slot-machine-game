import { Graphics, Container } from 'pixi.js'

/**
 * Creates and manages particle effects for winning tiles
 * Particles include sparkles, stars, and celebration effects
 */
export function createParticleSystem() {
  const particles = []
  const container = new Container()

  /**
   * Create a single particle
   */
  function createParticle(x, y, type = 'sparkle') {
    const particle = {
      graphics: new Graphics(),
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2, // Bias upward
      life: 1.0,
      maxLife: 0.8 + Math.random() * 0.4,
      size: 3 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      type,
      gravity: 0.15
    }

    // Draw the particle based on type
    if (type === 'sparkle') {
      // Four-pointed star/sparkle
      particle.graphics.star(0, 0, 4, particle.size, particle.size * 0.5)
      particle.graphics.fill({ color: 0xffeb3b, alpha: 1 })
    } else if (type === 'star') {
      // Five-pointed star
      particle.graphics.star(0, 0, 5, particle.size * 1.2, particle.size * 0.6)
      particle.graphics.fill({ color: 0xffd700, alpha: 1 })
    } else if (type === 'circle') {
      // Simple circle particle
      particle.graphics.circle(0, 0, particle.size)
      particle.graphics.fill({ color: 0xffffff, alpha: 1 })
    }

    particle.graphics.x = x
    particle.graphics.y = y
    particle.graphics.rotation = particle.rotation
    container.addChild(particle.graphics)

    return particle
  }

  /**
   * Create a burst of particles from a position
   */
  function burst(x, y, count = 15, type = 'sparkle') {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const speed = 2 + Math.random() * 3
      const particle = createParticle(x, y, type)

      // Radial burst pattern
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed - 1 // Slight upward bias

      particles.push(particle)
    }
  }

  /**
   * Create continuous sparkles around a position
   */
  function sparkle(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 40
      const offsetY = (Math.random() - 0.5) * 40
      const particle = createParticle(x + offsetX, y + offsetY, 'sparkle')
      particle.vy = -Math.random() * 2 - 1 // Float upward
      particle.vx = (Math.random() - 0.5) * 1
      particles.push(particle)
    }
  }

  /**
   * Create orbiting stars around a position
   */
  function orbitingStars(x, y, count = 5, radius = 30) {
    const now = Date.now() / 1000
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + now
      const px = x + Math.cos(angle) * radius
      const py = y + Math.sin(angle) * radius
      const particle = createParticle(px, py, 'star')

      // Make them orbit
      particle.orbitCenter = { x, y }
      particle.orbitAngle = angle
      particle.orbitRadius = radius
      particle.orbitSpeed = 0.05

      particles.push(particle)
    }
  }

  /**
   * Update all particles
   */
  function update(deltaTime = 1) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]

      // Handle orbiting particles
      if (p.orbitCenter) {
        p.orbitAngle += p.orbitSpeed * deltaTime
        p.x = p.orbitCenter.x + Math.cos(p.orbitAngle) * p.orbitRadius
        p.y = p.orbitCenter.y + Math.sin(p.orbitAngle) * p.orbitRadius
      } else {
        // Normal physics
        p.x += p.vx * deltaTime
        p.y += p.vy * deltaTime
        p.vy += p.gravity * deltaTime // Gravity
      }

      p.rotation += p.rotationSpeed * deltaTime
      p.life -= deltaTime / 60 // Decay over time (assuming 60fps)

      // Update graphics
      p.graphics.x = p.x
      p.graphics.y = p.y
      p.graphics.rotation = p.rotation
      p.graphics.alpha = Math.max(0, p.life / p.maxLife)

      // Remove dead particles
      if (p.life <= 0) {
        container.removeChild(p.graphics)
        p.graphics.destroy()
        particles.splice(i, 1)
      }
    }
  }

  /**
   * Clear all particles
   */
  function clear() {
    particles.forEach(p => {
      container.removeChild(p.graphics)
      p.graphics.destroy()
    })
    particles.length = 0
  }

  return {
    container,
    burst,
    sparkle,
    orbitingStars,
    update,
    clear
  }
}
