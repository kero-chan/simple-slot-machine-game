# GSAP Integration - Slot Machine Reel Animations

## Overview
All reel animations are now fully powered by GSAP (GreenSock Animation Platform) for smooth, professional-grade animations.

## Files Modified

### 1. **Drop Animations** (`src/composables/slotMachine/reels/dropAnimation.js`)
- **Before**: Manual `requestAnimationFrame` with time-based calculations
- **Now**: GSAP tweens with `ease: 'none'` for linear motion
- **Benefit**: Smoother 60fps animations, automatic cleanup, better performance

```javascript
// GSAP directly tweens sprite Y position
const tween = gsap.to(animObj, {
  currentY: toY,
  duration: timingStore.DROP_DURATION / 1000,
  ease: 'none',
  onUpdate: () => sprite.y = animObj.currentY
})
```

### 2. **Bump Animations** (`src/composables/slotMachine/reels/tiles/bumpAnimation.js`)
- **Before**: Manual sine wave calculations in update loop
- **Now**: GSAP timeline with `sine.inOut` easing
- **Benefit**: Built-in easing functions, timeline control

```javascript
// GSAP timeline for squeeze/bounce effect
timeline.to(sprite.scale, {
  x: baseScaleX * 0.8,
  y: baseScaleY * 0.8,
  duration: 0.3,
  ease: 'sine.inOut'
}).to(sprite.scale, {
  x: baseScaleX,
  y: baseScaleY,
  duration: 0.3,
  ease: 'sine.inOut'
})
```

### 3. **Pop Animations** (`src/composables/slotMachine/reels/tiles/popAnimation.js`)
- **Before**: Custom easeOutBack function
- **Now**: GSAP's built-in `back.out(1.7)` easing
- **Benefit**: Professional overshoot effect, less code

```javascript
// GSAP with back easing for dramatic pop
const tween = gsap.to(sprite.scale, {
  x: baseScaleX * maxScale,
  y: baseScaleY * maxScale,
  duration: 0.5,
  ease: 'back.out(1.7)'
})
```

### 4. **Spin Animation** (`src/composables/slotMachine/useGameLogic.js`)
- **Before**: Manual `requestAnimationFrame` loop with Math.pow easing
- **Now**: GSAP timeline with `power2.out` easing
- **Benefit**: Precise timing control, dynamic duration adjustment for anticipation mode

```javascript
// GSAP timeline manages all 5 reels with stagger
const timeline = gsap.timeline()
for (let col = 0; col < cols; col++) {
  const tween = gsap.to(animObj, {
    position: targetIndex,
    duration: baseDuration,
    delay: col * stagger,
    ease: 'power2.out'
  })
  timeline.add(tween, 0)
}
```

### 5. **GSAP Reel Scroll System** (`src/composables/slotMachine/reels/index.js:56-151`)
- **New Feature**: Direct container animation capability
- Creates full strip of sprites
- GSAP animates container Y position for GPU-accelerated scrolling
- Available for future enhancements

```javascript
// GSAP directly animates container position
timeline.to(reelContainer, {
  y: `+=${scrollDistance}`,
  duration: duration,
  delay: delay,
  ease: 'power2.out'
})
```

## GSAP Features Utilized

### 1. **Easing Functions**
- `none` - Linear motion for drops (constant speed)
- `sine.inOut` - Smooth squeeze/bounce for bumps
- `back.out(1.7)` - Overshoot effect for pops
- `power2.out` - Natural deceleration for spins

### 2. **Timeline Control**
- Sequential animations (bump squeeze then expand)
- Parallel animations (all reels with stagger)
- Dynamic duration adjustments (anticipation mode)

### 3. **Callbacks**
- `onUpdate` - Update sprite positions, check game state
- `onComplete` - Clean up, sync to grid, trigger next state
- `onStart` - Initialize animation state

### 4. **Performance Benefits**
- Automatic 60fps targeting
- GPU acceleration where possible
- Efficient memory management
- Kill/cleanup API prevents memory leaks

## Game Logic Preservation

All spec.txt requirements are maintained:
- ✅ Winning calculation on 4 middle rows only
- ✅ TOP_TO_BOTTOM spin direction
- ✅ No tile flicker after spin stops
- ✅ No tile changes when hitting spin

## How GSAP Improves Performance

1. **Native Animation Engine**: GSAP uses optimized RAF loops
2. **Smart Updates**: Only animates properties that changed
3. **GPU Layering**: Transforms use GPU when possible
4. **Ticker Management**: Single global ticker for all animations
5. **Memory Efficient**: Automatic cleanup prevents leaks

## Future Enhancements

The GSAP reel scroll system is ready for:
- Motion blur effects during high-speed spinning
- Elastic bounce when reels stop
- 3D perspective transforms
- Particle effects synced to reel position
- Advanced physics (momentum, friction)

## Summary

**Before GSAP**: ~500 lines of manual animation code with RAF loops, time calculations, custom easing
**After GSAP**: ~200 lines with professional easing, timeline control, automatic optimization

**All reel animations are now GSAP-driven**, providing smoother visuals, better performance, and cleaner code.
