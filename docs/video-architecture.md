# Video Architecture - Event-Based System with Video.js

## Overview

The video system uses an **event-driven architecture** with **Video.js** as the underlying playback library. All video operations are triggered by emitting events through a centralized event bus, completely decoupling video playback from UI components.

**Key Feature for Mobile:** Videos are preloaded during user interaction to maintain autoplay context, solving mobile browser restrictions.

## Architecture Diagram

```
┌─────────────────────────┐
│   UI Components         │
│   Game Logic            │
└──────────┬──────────────┘
           │
           │ emit video events
           ▼
┌─────────────────────────┐
│   Video Event Bus       │  ◄── Central communication layer
│   (videoEventBus.js)    │      Event types + Emit/Listen
└──────────┬──────────────┘
           │
           │ auto-handled by
           ▼
┌─────────────────────────┐
│   Video Player Module   │  ◄── Standalone video handler
│   (videoPlayer.js)      │      Listens to events
│   Uses Video.js         │      Manages preloading
└──────────┬──────────────┘
           │
           │ controls
           ▼
┌─────────────────────────┐
│   Video.js Library      │  ◄── Professional video player
│   HTML5 Video API       │      Cross-browser compatibility
└──────────┬──────────────┘
           │
           │ also emits to
           ▼
┌─────────────────────────┐
│   Audio Event Bus       │  ◄── Pause/Resume music during video
└─────────────────────────┘
```

## Core Components

### 1. Video Event Bus
**File:** `src/composables/videoEventBus.js`

The central event communication system for videos. It provides:
- Event type constants (`VIDEO_EVENTS`)
- Event emitter (`emit()`)
- Event listener (`on()`, `off()`)

### 2. Video Player Module
**File:** `src/composables/videoPlayer.js`

Standalone module that:
- Uses **Video.js** library for professional video playback
- Automatically listens to all video events
- **Preloads videos** during user interaction (critical for mobile)
- Manages video state (playing, buffering, etc.)
- Automatically pauses/resumes background music
- Handles touch events for mobile devices
- **No direct imports from UI code**

### 3. Video Playback Composable
**File:** `src/composables/useVideoPlayback.js`

Helper composable that provides convenient wrappers but **just emits events internally**.

---

## Available Video Events

### Control Events (Emit these from UI)

| Event | Data | Description |
|-------|------|-------------|
| `VIDEO_PRELOAD` | `{ videoKey: string }` | Preload video during user interaction (mobile) |
| `VIDEO_PLAY` | `{ videoKey: string, onComplete?: function, skipDelay?: number }` | Play a video |
| `VIDEO_PAUSE` | none | Pause current video |
| `VIDEO_STOP` | none | Stop current video |
| `VIDEO_SKIP` | none | Skip current video (if allowed) |
| `VIDEO_SET_VOLUME` | `{ volume: boolean }` | Enable/disable video volume |
| `VIDEO_SET_MUTED` | `{ muted: boolean }` | Mute/unmute video |

### Lifecycle Events (Listen to these for feedback)

| Event | Data | Description |
|-------|------|-------------|
| `VIDEO_STARTED` | `{ videoKey: string }` | Video has started playing |
| `VIDEO_ENDED` | none | Video has finished or was stopped |
| `VIDEO_ERROR` | `{ error: Error }` | Video encountered an error |
| `VIDEO_READY` | none | Video is buffered and ready |
| `VIDEO_BUFFERING` | none | Video is buffering |

---

## Usage Examples

### Mobile-Optimized: Preload During User Interaction

**Critical for Mobile:** Videos must be preloaded during user gesture to maintain autoplay context.

```javascript
import { videoEvents, VIDEO_EVENTS } from '@/composables/videoEventBus'

// In spin button click handler (user interaction)
function handleSpinClick() {
  // Preload videos immediately during user gesture
  videoEvents.emit(VIDEO_EVENTS.VIDEO_PRELOAD, { videoKey: 'jackpot' })
  videoEvents.emit(VIDEO_EVENTS.VIDEO_PRELOAD, { videoKey: 'jackpot_result' })
  
  // Start game logic...
  startSpin()
}

// Later (even after 5+ seconds), video will play successfully
function onJackpotWin() {
  videoEvents.emit(VIDEO_EVENTS.VIDEO_PLAY, {
    videoKey: 'jackpot',
    skipDelay: 2000
  })
}
```

### Method 1: Direct Event Emission

```javascript
import { videoEvents, VIDEO_EVENTS } from '@/composables/videoEventBus'

// Play a video
videoEvents.emit(VIDEO_EVENTS.VIDEO_PLAY, {
  videoKey: 'jackpot',
  skipDelay: 2000, // Allow skip after 2 seconds
  onComplete: () => {
    console.log('Video finished!')
  }
})

// Skip video (if allowed)
videoEvents.emit(VIDEO_EVENTS.VIDEO_SKIP)

// Stop video
videoEvents.emit(VIDEO_EVENTS.VIDEO_STOP)
```

### Method 2: Using Helper Composable (Recommended)

```javascript
import { useVideoPlayback } from '@/composables/useVideoPlayback'

const { 
  playVideo, 
  skipVideo, 
  stopVideo,
  onVideoEnded 
} = useVideoPlayback()

// Play jackpot video
playVideo('jackpot', {
  skipDelay: 2000,
  onComplete: () => {
    console.log('Video complete!')
  }
})

// Listen for video end
const unsubscribe = onVideoEnded(() => {
  console.log('Video ended!')
})

// Later: skip video
skipVideo()
```

### Method 3: In Vue Component

```vue
<script setup>
import { useVideoPlayback } from '@/composables/useVideoPlayback'
import { onUnmounted } from 'vue'

const { playVideo, onVideoEnded, onVideoError } = useVideoPlayback()

// Play video when jackpot is triggered
const handleJackpot = () => {
  playVideo('jackpot', {
    skipDelay: 2000,
    onComplete: () => {
      // Show bonus overlay
      showBonusOverlay()
    }
  })
}

// Listen to video events
const unsubscribeEnded = onVideoEnded(() => {
  console.log('Video finished')
})

const unsubscribeError = onVideoError((data) => {
  console.error('Video error:', data.error)
})

// Cleanup on unmount
onUnmounted(() => {
  unsubscribeEnded()
  unsubscribeError()
})
</script>
```

---

## Common Patterns

### Playing Video After Animation

```javascript
import { videoEvents, VIDEO_EVENTS } from '@/composables/videoEventBus'

// After animation completes
await playBonusTilePopAnimation()

// Then play video
videoEvents.emit(VIDEO_EVENTS.VIDEO_PLAY, {
  videoKey: 'jackpot',
  onComplete: () => {
    // Show next screen
  }
})
```

### Syncing Video with Game Sound Settings

```javascript
import { watch } from 'vue'
import { videoEvents, VIDEO_EVENTS } from '@/composables/videoEventBus'

watch(() => settingsStore.gameSound, (enabled) => {
  videoEvents.emit(VIDEO_EVENTS.VIDEO_SET_VOLUME, { volume: enabled })
})
```

### Playing Multiple Videos in Sequence

```javascript
import { useVideoPlayback } from '@/composables/useVideoPlayback'

const { playVideo } = useVideoPlayback()

const playVideoSequence = async () => {
  // Play first video
  await new Promise(resolve => {
    playVideo('jackpot', { onComplete: resolve })
  })
  
  // Then play second video
  await new Promise(resolve => {
    playVideo('jackpot_result', { onComplete: resolve })
  })
  
  console.log('All videos complete!')
}
```

---

## Integration with Audio System

The Video Player automatically pauses/resumes background music:

```javascript
// When video starts:
videoPlayer → audioEvents.emit(AUDIO_EVENTS.MUSIC_PAUSE)

// When video ends:
videoPlayer → audioEvents.emit(AUDIO_EVENTS.MUSIC_RESUME)
```

This happens automatically - no need to manually control audio when playing videos!

---

## Event Flow

### Playing a Video

```
UI triggers video
    ↓
videoEvents.emit(VIDEO_PLAY, { videoKey: 'jackpot' })
    ↓
Video Player receives event
    ↓
Video Player emits: MUSIC_PAUSE
    ↓
Video Player creates <video> element
    ↓
Video Player emits: VIDEO_STARTED
    ↓
Video plays 🎬
    ↓
Video ends (or skipped)
    ↓
Video Player emits: VIDEO_ENDED
    ↓
Video Player emits: MUSIC_RESUME
    ↓
onComplete callback fires
```

---

## Key Principles

### ✅ DO

1. **Emit events to play videos**
   ```javascript
   videoEvents.emit(VIDEO_EVENTS.VIDEO_PLAY, { videoKey: 'jackpot' })
   ```

2. **Use helper composable for convenience**
   ```javascript
   const { playVideo } = useVideoPlayback()
   playVideo('jackpot', { onComplete: () => {...} })
   ```

3. **Listen to lifecycle events for feedback**
   ```javascript
   onVideoEnded(() => {
     // Video finished
   })
   ```

### ❌ DON'T

1. **Don't create video elements manually**
   ```javascript
   const video = document.createElement('video') // ❌ Use events
   ```

2. **Don't import Video Player in UI code**
   ```javascript
   import { videoPlayer } from '@/composables/videoPlayer' // ❌ Never do this
   ```

3. **Don't manually pause/resume audio**
   ```javascript
   audioManager.pause() // ❌ Video Player handles this automatically
   ```

---

## Adding New Video Types

To add a new video:

### 1. Add Video to Assets
```javascript
// src/config/assets.js
export const ASSETS = {
  videoPaths: {
    jackpot: '...',
    jackpot_result: '...',
    new_video: new URL('../assets/videos/new_video.mp4', import.meta.url).href // Add here
  }
}
```

### 2. Use in Code
```javascript
// Play the new video
playVideo('new_video', {
  onComplete: () => {
    console.log('New video finished!')
  }
})
```

That's it! The Video Player module will handle everything automatically.

---

## Migrating from Old Code

### Before (Direct video element management):
```javascript
const video = document.createElement('video')
video.src = ASSETS.videoPaths.jackpot
video.play()
video.addEventListener('ended', () => {
  // Cleanup
  video.remove()
  audioManager.resume()
})
```

### After (Event-driven):
```javascript
import { useVideoPlayback } from '@/composables/useVideoPlayback'

const { playVideo } = useVideoPlayback()

playVideo('jackpot', {
  onComplete: () => {
    // All cleanup handled automatically
  }
})
```

---

## Troubleshooting

### Video Not Playing on Mobile

**Most Common Issue:** Video not preloaded during user interaction

**Solution:**
```javascript
// ✅ Correct: Preload during user click
function onSpinButtonClick() {
  videoEvents.emit(VIDEO_EVENTS.VIDEO_PRELOAD, { videoKey: 'jackpot' })
  // ... game logic
}

// ❌ Wrong: Create video later without preload
function onJackpotWin() {
  videoEvents.emit(VIDEO_EVENTS.VIDEO_PLAY, { videoKey: 'jackpot' })
  // Will fail on mobile if >5 seconds since last interaction
}
```

### Video Not Playing on Desktop

1. **Check video key exists in assets**
   ```javascript
   console.log(ASSETS.videoPaths.jackpot) // Should be defined
   ```

2. **Check if video system is initialized**
   - Video Player is imported in `imageLoader.js`
   - Should log "📹 Video system initialized" at startup

3. **Check browser console for errors**
   - Look for video loading errors
   - Check network tab for video file

### Video Has No Sound

1. **Check game sound setting**
   ```javascript
   console.log(settingsStore.gameSound) // Should be true
   ```

2. **Emit volume event**
   ```javascript
   videoEvents.emit(VIDEO_EVENTS.VIDEO_SET_VOLUME, { volume: true })
   ```

### Skip Not Working on Mobile

- Skip requires touch event handler (not just click)
- Touch is enabled in videoPlayer.js with `touchend` event
- User must tap video to skip (after skipDelay)
- Check console for "✅ Video can now be skipped by clicking"

---

## File Structure

```
src/
├── composables/
│   ├── videoEventBus.js         ← Event types + Event bus
│   ├── videoPlayer.js           ← Video playback logic
│   └── useVideoPlayback.js      ← Helper composable
├── composables/slotMachine/overlay/
│   └── jackpotVideoOverlay.js   ← Uses event system
└── utils/
    └── imageLoader.js           ← Imports videoPlayer to initialize
```

---

## Summary

The video system is **event-driven** and **decoupled**:

1. **UI components** emit video events
2. **Video Player** listens and handles playback
3. **Automatic audio management** (pause/resume music)
4. **No direct coupling** between UI and video logic

Benefits:
- ✅ Simple to use (just emit events)
- ✅ Automatic audio coordination
- ✅ Easy to test (mock event bus)
- ✅ Easy to maintain (video logic in one place)
- ✅ Consistent with audio architecture
