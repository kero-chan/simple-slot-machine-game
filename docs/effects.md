Core Animation Effects:

1. Reel Spinning Animation
Motion blur effect on tiles while spinning - use multiple semi-transparent tile renders offset vertically

Easing functions - starts fast, slows down gradually (ease-out)

Staggered stopping - each column stops at slightly different times for more natural feel

2. Winning Symbol Highlights
Yellow/gold glow effect - use shadowBlur and shadowColor in canvas, or create radial gradients

Pulsing animation - scale winning tiles slightly larger and back (1.0 → 1.1 → 1.0)

Border highlights - draw glowing borders around winning combinations

3. Particle Effects
Fire/flame particles on special symbols - create particle systems with:

Random spawn positions around the symbol

Upward movement with slight horizontal drift

Fade out over time (alpha decrease)

Orange/yellow/red color palette

Sparkle/glitter effects - small bright dots that appear and fade quickly

Coin/medallion drops from top - falling animations with bounce physics

4. Win Banner Display
Slide-in animation with decorative frame

Number count-up effect - animate from 0 to final win amount

Scale bounce - banner appears larger then settles (scale 1.2 → 1.0)

5. Multiplier Effects
Highlight active multipliers with color change (gray → golden yellow)

Glow pulse on active multiplier values

6. Visual Polish
Red ribbons/banners hanging from winning symbols at top

Shadow effects on all tiles for depth

Smooth transitions between states

Background blur during special events
