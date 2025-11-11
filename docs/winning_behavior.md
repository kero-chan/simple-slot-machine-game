# 🎬 Mahjong Ways - Winning Tile Animation Behavior Guide

Complete documentation of tile animations, effects, and cascade mechanics when winning combinations occur.

---

## **Table of Contents**

1. [Overview](#overview)
2. [Phase 1: Winning Highlight](#phase-1-winning-highlight)
3. [Phase 2: Celebration Animation](#phase-2-celebration-animation)
4. [Phase 3: Tile Removal/Disappearance](#phase-3-tile-removaldisappearance)
5. [Phase 4: Cascade/Drop](#phase-4-cascadedrop)
6. [Phase 5: New Win Check](#phase-5-new-win-check)
7. [Special: Golden Tile Transformation](#special-golden-tile-transformation)
8. [Complete Cascade Sequence Example](#complete-cascade-sequence-example)
9. [Audio/Sound Effects](#audiosound-effects)
10. [Timing Breakdown](#timing-breakdown)
11. [Visual Effects Intensity Levels](#visual-effects-intensity-levels)

---

## **Overview**

When you achieve a winning combination in Mahjong Ways, the game executes a sophisticated sequence of animations that:

- Clearly shows which tiles are part of the winning combination
- Provides satisfying visual and audio feedback
- Executes the cascade mechanic (symbols drop and refill)
- Checks for new winning combinations
- Potentially transforms golden tiles into Wilds

The entire sequence is designed to be visually engaging while maintaining clarity about what's happening mechanically.

---

## **Phase 1: Winning Highlight**

**Duration:** 0.5-1 seconds

### **What Happens:**

#### **1. Winning Tiles Light Up/Glow**

- ✨ Tiles that are part of the winning combination get highlighted
- Bright **golden or white glow** appears around them
- Glow may **pulsate or shimmer**
- Rest of the grid **dims slightly** to emphasize winners
- Creates clear visual distinction between winning and non-winning tiles

#### **2. Win Line Indication**

- **Connected path** shows between winning tiles
- Visual connection flows **left to right** (matching win direction)
- May show animated line or glow connecting tiles
- Matching symbols are clearly indicated
- Multiple win lines may be shown if multiple combinations exist

#### **3. Win Counter Displays**

- Shows the **coin amount won** for that specific combination
- Appears **above or below** the winning tiles
- Numbers **animate/count up** from 0 to final value
- May have glowing or sparkling effect
- Multiple counters if multiple wins occurred

### **Visual Characteristics:**

| Element | Effect |
|---------|--------|
| Winning tiles | Bright glow, full opacity |
| Non-winning tiles | Dimmed, reduced opacity (~50-70%) |
| Win line | Animated golden/white line |
| Win amount | Counting animation, bright display |
| Background | May darken slightly |

---

## **Phase 2: Celebration Animation**

**Duration:** 1-2 seconds

### **Winning Tiles Perform Multiple Effects:**

#### **For Regular Wins (Standard Combinations):**

##### **✨ Sparkle/Flash**

- Tiles flash **bright white or gold**
- Multiple flash cycles (2-3 times)
- Alternating bright/normal/bright
- Quick pulse rhythm

##### **💫 Glow Intensifies**

- Bright aura around the tiles
- Glow expands outward from tile
- May have color shift (white → gold)
- Pulsating effect

##### **🎆 Particle Effects**

- **Sparkles, stars, or light particles** burst from tiles
- Particles float upward and outward
- Golden or white colored particles
- Fade out as they disperse
- 10-20 particles per tile

##### **🔄 Slight Rotation/Wobble**

- Tiles may **rotate slightly** (±5-10 degrees)
- Back and forth wobble motion
- Creates "excited" appearance
- Subtle, not disorienting

##### **📈 Scale Up/Down**

- Tiles briefly **grow larger**
- Scale animation: 1.0 → 1.2 → 1.0
- Creates pop/bounce effect
- Synchronized with glow pulse

---

#### **For Big Wins (High-Value Symbols: 發, 中, etc.):**

##### **🔥 Fire/Flame Effects**

- **Golden or red flames** appear around tiles
- Flames flicker and animate
- Intense visual impact
- May engulf entire tile

##### **⚡ Lightning Effects**

- **Electric sparks** or lightning bolts
- Crackle between tiles
- Blue-white electric color
- Dynamic, energetic movement

##### **💥 Explosion Effect**

- More dramatic **burst of light**
- Screen may flash white briefly
- Radial explosion pattern
- Shockwave effect outward

##### **🌟 Stars Circling**

- **Animated stars** rotate around the tile
- Orbital motion path
- 3-5 stars per tile
- Golden/yellow colored
- Complete 1-2 full rotations

##### **📺 Screen Shake (Optional)**

- Entire screen may **shake slightly**
- Only for very big wins
- Brief vibration effect (0.2-0.5 sec)
- Adds impact and excitement

---

### **Celebration Intensity Based on Win Size:**

| Win Type | Effects Used |
|----------|-------------|
| **Small Win** (3 low symbols) | Sparkle + Glow |
| **Medium Win** (4 mid symbols) | Sparkle + Glow + Particles |
| **Big Win** (5 high symbols) | All regular effects + Flames |
| **Mega Win** (Multiple 5x high) | All effects + Lightning + Explosion |

---

## **Phase 3: Tile Removal/Disappearance**

**Duration:** 0.5-1 seconds

### **Most Common: Explosion/Burst Effect**

#### **💥 Tiles Burst Into Particles**

**Visual Breakdown:**

1. **Initial burst**
   - Tile breaks apart into **smaller pieces** (8-15 fragments)
   - Pieces fly outward in **all directions**
   - Radial explosion pattern from tile center
   - High initial velocity

2. **Fragment characteristics**
   - Pieces are **smaller versions** of the tile (or generic shapes)
   - Each fragment has **rotation** as it flies
   - **Gravity applies** - pieces arc downward
   - **Fade out** as they travel (opacity: 100% → 0%)

3. **Particle effect**
   - **Golden/white particles** accompany fragments
   - 20-30 particles per tile
   - Faster dissipation than fragments
   - Sparkle effect as they disappear

4. **Timing**
   - Initial burst: **0.1 seconds**
   - Fragment travel: **0.4-0.5 seconds**
   - Complete fade: **0.5-1 seconds**

---

### **Alternative Disappearance Effects:**

#### **🌀 Spiral Disappear**

- Tiles **spin rapidly** (360+ degree rotation)
- Simultaneously **shrink toward center**
- Scale: 1.0 → 0.5 → 0.0
- Fade out during spin
- Vortex/spiral visual effect

#### **⬇️ Drop Away**

- Tiles **fall downward** off the screen
- Accelerating drop (gravity simulation)
- May tumble/rotate as they fall
- Disappear below visible grid
- Simple, clean effect

#### **💨 Poof/Smoke**

- Tiles **dissolve into smoke/mist**
- Cloud of particles replaces tile
- Smoke dissipates upward
- Soft, mystical appearance
- Often used in Asian-themed games

#### **✨ Fade Out**

- Tiles gradually become **transparent**
- Opacity: 100% → 0%
- May have shimmer effect during fade
- Clean, simple disappearance
- No fragment pieces

---

### **Disappearance Order:**

**Winning tiles don't all disappear simultaneously!**
