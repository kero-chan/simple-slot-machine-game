# Audio Architecture - Event-Based System

## Overview

The audio system uses an **event-driven architecture** to decouple audio playback from UI components. All audio operations are triggered by emitting events through a centralized event bus.

## Architecture Diagram

```
┌─────────────────────────┐
│   UI Components         │
│   Game Logic            │
└──────────┬──────────────┘
           │
           │ emit audio events
           ▼
┌─────────────────────────┐
│   Audio Event Bus       │  ◄── Central communication layer
│   (audioEventBus.js)    │      Event types + Emit/Listen
└──────────┬──────────────┘
           │
           │ auto-handled by
           ▼
┌─────────────────────────┐
│   Audio Player Module   │  ◄── Standalone audio handler
│   (audioPlayer.js)      │      Listens to events
│   Uses Howler.js        │      Plays audio
└─────────────────────────┘
```

## Core Components

### 1. Audio Event Bus
**File:** `src/composables/audioEventBus.js`

The central event communication system. It provides:
- Event type constants (`AUDIO_EVENTS`)
- Event emitter (`emit()`)
- Event listener (`on()`, `off()`)

### 2. Audio Player Module
**File:** `src/composables/audioPlayer.js`

Standalone module that:
- Automatically listens to all audio events
- Handles audio playback using Howler.js
- Manages audio state (volume, mute, etc.)
- **No direct imports from UI code**

### 3. Audio Composables (Optional Helpers)
**Files:** 
- `src/composables/useAudioEffects.js` - Helper for sound effects
- `src/composables/useBackgroundMusic.js` - Helper for background music
- `src/composables/audioManager.js` - Facade for initialization

These provide convenient wrappers but **just emit events internally**.

---

## Available Audio Events

### Background Music Events

| Event | Data | Description |
|-------|------|-------------|
| `MUSIC_START` | none | Start background music |
| `MUSIC_STOP` | none | Stop background music |
| `MUSIC_PAUSE` | none | Pause music (for videos) |
| `MUSIC_RESUME` | none | Resume music |
| `MUSIC_SWITCH_JACKPOT` | none | Switch to jackpot music |
| `MUSIC_SWITCH_NORMAL` | none | Switch to normal music |
| `MUSIC_SET_VOLUME` | `{ volume: number }` | Set music volume |

### Sound Effect Events

| Event | Data | Description |
|-------|------|-------------|
| `EFFECT_PLAY` | `{ audioKey: string, volume?: number }` | Play any sound effect |
| `EFFECT_WIN` | `{ wins: array }` | Play win sound |
| `EFFECT_CONSECUTIVE_WIN` | `{ consecutiveWins: number, isFreeSpin: boolean }` | Play consecutive win sound |
| `EFFECT_WINNING_ANNOUNCEMENT` | none | Play winning announcement (loop) |
| `EFFECT_WINNING_ANNOUNCEMENT_STOP` | none | Stop winning announcement |
| `EFFECT_WINNING_HIGHLIGHT` | none | Play winning highlight |

### Global Control Events

| Event | Data | Description |
|-------|------|-------------|
| `AUDIO_ENABLE` | none | Enable all audio |
| `AUDIO_DISABLE` | none | Disable all audio |
| `AUDIO_SET_GLOBAL_VOLUME` | `{ volume: number }` | Set global volume |

---

## Usage Examples

### Method 1: Direct Event Emission (Recommended for new code)

```javascript
import { audioEvents, AUDIO_EVENTS } from '@/composables/audioEventBus'

// Play a sound effect
audioEvents.emit(AUDIO_EVENTS.EFFECT_PLAY, { 
  audioKey: 'button_click' 
})

// Start background music
audioEvents.emit(AUDIO_EVENTS.MUSIC_START)

// Play win sound with data
audioEvents.emit(AUDIO_EVENTS.EFFECT_WIN, { 
  wins: [{ symbol: 'fa', count: 3 }] 
})

// Switch to jackpot music
audioEvents.emit(AUDIO_EVENTS.MUSIC_SWITCH_JACKPOT)

// Enable/disable audio
audioEvents.emit(AUDIO_EVENTS.AUDIO_DISABLE)
audioEvents.emit(AUDIO_EVENTS.AUDIO_ENABLE)
```

### Method 2: Using Helper Composables (For convenience)

```javascript
// Sound effects helper
import { useAudioEffects } from '@/composables/useAudioEffects'

const { 
  playEffect,
  playWinSound,
  playConsecutiveWinSound,
  playWinningAnnouncement,
  stopWinningAnnouncement,
  playWinningHighlight
} = useAudioEffects()

// These internally emit events
playEffect('game_start')
playWinSound(wins)
playConsecutiveWinSound(2, false)
```

```javascript
// Background music helper
import { useBackgroundMusic } from '@/composables/useBackgroundMusic'

const { 
  start, 
  stop, 
  pause, 
  resume,
  switchToJackpotMusic,
  switchToNormalMusic
} = useBackgroundMusic()

// These internally emit events
start()
switchToJackpotMusic()
```

### Method 3: Using Audio Manager Facade

```javascript
import { audioManager } from '@/composables/audioManager'

// Initialize audio system (call once at app start)
audioManager.initialize()

// Control game sound on/off
audioManager.setGameSoundEnabled(true)
audioManager.setGameSoundEnabled(false)

// Check if audio is ready
if (audioManager.isAudioReady()) {
  // Audio system is initialized
}

// Convenience methods (delegate to background music)
audioManager.start()
audioManager.stop()
audioManager.switchToJackpotMusic()
```

---

## Common Patterns

### Playing a Sound on Button Click

```javascript
<script setup>
import { audioEvents, AUDIO_EVENTS } from '@/composables/audioEventBus'

const handleButtonClick = () => {
  // Emit event to play sound
  audioEvents.emit(AUDIO_EVENTS.EFFECT_PLAY, { audioKey: 'button_click' })
  
  // Your button logic...
}
</script>
```

### Starting Background Music After Loading

```javascript
import { audioEvents, AUDIO_EVENTS } from '@/composables/audioEventBus'

// After assets loaded
onMounted(async () => {
  await loadAssets()
  
  // Start background music
  audioEvents.emit(AUDIO_EVENTS.MUSIC_START)
})
```

### Switching Music Based on Game State

```javascript
import { audioEvents, AUDIO_EVENTS } from '@/composables/audioEventBus'
import { watch } from 'vue'

// Watch game state and switch music
watch(() => gameStore.isJackpot, (isJackpot) => {
  if (isJackpot) {
    audioEvents.emit(AUDIO_EVENTS.MUSIC_SWITCH_JACKPOT)
  } else {
    audioEvents.emit(AUDIO_EVENTS.MUSIC_SWITCH_NORMAL)
  }
})
```

### Toggle Audio On/Off

```javascript
import { audioEvents, AUDIO_EVENTS } from '@/composables/audioEventBus'

const toggleAudio = (enabled) => {
  if (enabled) {
    audioEvents.emit(AUDIO_EVENTS.AUDIO_ENABLE)
  } else {
    audioEvents.emit(AUDIO_EVENTS.AUDIO_DISABLE)
  }
}
```

---

## Event Flow

### 1. Initialization Flow
```
App Starts
    ↓
imageLoader.js calls audioManager.initialize()
    ↓
Audio Player Module initializes
    ↓
Audio Player sets up event listeners for ALL events
    ↓
System ready to receive events
```

### 2. Playing Sound Effect Flow
```
User Action (e.g., button click)
    ↓
Component emits: audioEvents.emit(EFFECT_PLAY, { audioKey: 'click' })
    ↓
Event Bus broadcasts event
    ↓
Audio Player receives event (already listening)
    ↓
Audio Player plays sound using Howler.js
    ↓
Sound plays 🔊
```

### 3. Background Music Flow
```
Game starts
    ↓
Component emits: audioEvents.emit(MUSIC_START)
    ↓
Event Bus broadcasts event
    ↓
Audio Player receives event
    ↓
Audio Player starts music, schedules game start sound, starts noise loop
    ↓
Music plays 🎵
```

---

## Key Principles

### ✅ DO

1. **Emit events from UI components**
   ```javascript
   audioEvents.emit(AUDIO_EVENTS.EFFECT_PLAY, { audioKey: 'click' })
   ```

2. **Use helper composables for convenience**
   ```javascript
   const { playEffect } = useAudioEffects()
   playEffect('click')
   ```

3. **Pass required data with events**
   ```javascript
   audioEvents.emit(AUDIO_EVENTS.EFFECT_WIN, { wins: [...] })
   ```

### ❌ DON'T

1. **Don't import Audio Player in UI code**
   ```javascript
   import { audioPlayer } from '@/composables/audioPlayer' // ❌ Never do this
   ```

2. **Don't call Howler.js directly**
   ```javascript
   import { Howler } from 'howler' // ❌ Only in audioPlayer.js
   Howler.volume(0.5) // ❌ Use events instead
   ```

3. **Don't import old howlerAudio module**
   ```javascript
   import { howlerAudio } from '@/composables/useHowlerAudio' // ❌ Deprecated
   ```

---

## Adding New Audio Events

To add a new audio event:

### 1. Define Event Type
```javascript
// src/composables/audioEventBus.js
export const AUDIO_EVENTS = {
  // ... existing events
  EFFECT_NEW_SOUND: 'effect:new:sound', // Add new event
}
```

### 2. Add Event Handler in Audio Player
```javascript
// src/composables/audioPlayer.js
setupEventListeners() {
  // ... existing listeners
  
  // Add handler for new event
  audioEvents.on(AUDIO_EVENTS.EFFECT_NEW_SOUND, (data) => {
    this.playEffect(data.audioKey, data.volume)
  })
}
```

### 3. Emit Event from UI
```javascript
// In your component
audioEvents.emit(AUDIO_EVENTS.EFFECT_NEW_SOUND, { 
  audioKey: 'new_sound',
  volume: 0.5 
})
```

### 4. (Optional) Add Helper Method
```javascript
// src/composables/useAudioEffects.js
export function useAudioEffects() {
  const playNewSound = () => {
    audioEvents.emit(AUDIO_EVENTS.EFFECT_NEW_SOUND, { audioKey: 'new_sound' })
  }
  
  return {
    // ... existing methods
    playNewSound
  }
}
```

---

## Troubleshooting

### Audio Not Playing

1. **Check if audio system is initialized**
   ```javascript
   console.log(audioManager.isAudioReady()) // Should be true
   ```

2. **Check if event is emitted correctly**
   ```javascript
   // Add temporary listener to debug
   audioEvents.on(AUDIO_EVENTS.EFFECT_PLAY, (data) => {
     console.log('Event received:', data)
   })
   ```

3. **Check game sound state**
   ```javascript
   console.log(audioManager.isGameSoundEnabled()) // Should be true
   ```

4. **Check browser console for errors**
   - Look for Howler.js errors
   - Check if AudioContext is unlocked (mobile)

### Event Not Received

1. **Verify event type is correct**
   ```javascript
   // Use constants, not strings
   audioEvents.emit(AUDIO_EVENTS.EFFECT_PLAY, { ... }) // ✅
   audioEvents.emit('effect:play', { ... }) // ⚠️ Works but use constants
   ```

2. **Check Audio Player is initialized**
   - Audio Player sets up listeners during initialization
   - Ensure `audioManager.initialize()` is called at app start

---

## File Structure

```
src/
├── composables/
│   ├── audioEventBus.js         ← Event types + Event bus
│   ├── audioPlayer.js           ← Audio playback logic (uses Howler.js)
│   ├── useAudioEffects.js       ← Helper for sound effects
│   ├── useBackgroundMusic.js    ← Helper for background music
│   ├── audioManager.js          ← Facade for initialization
│   └── useHowlerAudio.js        ← Legacy (not used anymore)
└── utils/
    └── imageLoader.js           ← Calls audioManager.initialize()
```

---

## Summary

The audio system is **event-driven** and **decoupled**:

1. **UI components** emit events via `audioEvents.emit()`
2. **Audio Player** listens to events automatically
3. **No direct coupling** between UI and audio playback logic

This makes the system:
- ✅ Easy to use (just emit events)
- ✅ Easy to test (mock event bus)
- ✅ Easy to maintain (audio logic in one place)
- ✅ Easy to extend (add new events)
