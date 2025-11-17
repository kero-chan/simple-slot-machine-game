import { Container, Sprite, Texture } from 'pixi.js'
import { ASSETS } from '../../../config/assets'
import { useGameStore } from '../../../stores/gameStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { audioManager } from '../../audioManager'
import { howlerAudio } from '../../useHowlerAudio'
import { watch } from 'vue'
import { Howl } from 'howler'

/**
 * Creates a jackpot GIF overlay with audio
 * Shows immediately after bonus tiles are detected, before the free spins announcement
 */
export function createJackpotVideoOverlay() {
  const gameStore = useGameStore()
  const settingsStore = useSettingsStore()
  const container = new Container()
  container.visible = false
  container.zIndex = 1200 // Above everything else

  let isPlaying = false
  let onCompleteCallback = null
  let gifElement = null
  let audioHowl = null
  let canSkip = false // Flag to allow skipping after 2 seconds
  let skipEnableTimeout = null
  let gameSoundWatcher = null // Store watcher to cleanup later

  /**
   * Update audio volume based on gameSound state
   */
  function updateAudioVolume() {
    if (audioHowl) {
      const volume = settingsStore.gameSound ? 1.0 : 0
      audioHowl.volume(volume)
      console.log(`🔊 Audio volume set to: ${volume}`)
    }
  }

  /**
   * Enable skip after 2 seconds
   */
  function enableSkipAfterDelay() {
    // Clear any existing timeout
    if (skipEnableTimeout) {
      clearTimeout(skipEnableTimeout)
    }
    
    canSkip = false
    
    // Enable skip after 2 seconds
    skipEnableTimeout = setTimeout(() => {
      if (isPlaying) {
        canSkip = true
        console.log('✅ Video can now be skipped by clicking')
      }
    }, 2000) // 2 seconds
  }

  /**
   * Disable skip and clear timeout
   */
  function disableSkip() {
    canSkip = false
    
    if (skipEnableTimeout) {
      clearTimeout(skipEnableTimeout)
      skipEnableTimeout = null
    }
  }

  /**
   * Handle click on GIF to skip
   */
  function handleClick(event) {
    if (canSkip && isPlaying) {
      console.log('⏭️ GIF clicked - skipping')
      hide()
    } else {
      console.log('⏸️ GIF clicked but skip not yet enabled')
    }
  }

  /**
   * Create a GIF element for jackpot animation
   */
  function createGifElement() {
    const gifSrc = ASSETS.imagePaths?.jackpot_gif

    if (!gifSrc) {
      console.error('❌ Jackpot GIF source not found')
      return null
    }

    console.log('🖼️ Creating GIF:', gifSrc)

    // Create img element for GIF
    const gif = document.createElement('img')
    gif.src = gifSrc

    // Fullscreen styling
    gif.style.position = 'fixed'
    gif.style.top = '0'
    gif.style.left = '0'
    gif.style.width = '100%'
    gif.style.height = '100%'
    gif.style.objectFit = 'contain'
    gif.style.zIndex = '9999'
    gif.style.backgroundColor = 'black'
    gif.style.display = 'none'
    gif.style.cursor = 'pointer'

    document.body.appendChild(gif)
    gif.addEventListener('click', handleClick)

    console.log('✅ GIF created')
    return gif
  }

  /**
   * Show the GIF overlay with audio
   */
  async function show(canvasWidth, canvasHeight, onComplete) {
    container.visible = true
    isPlaying = true
    onCompleteCallback = onComplete

    console.log('🎬 Starting jackpot GIF with audio')

    // Resume AudioContext
    if (howlerAudio.isReady()) {
      await howlerAudio.resumeAudioContext()
    }

    // Pause background audio
    audioManager.pause()

    // Clean up old GIF
    if (gifElement) {
      gifElement.removeEventListener('click', handleClick)
      gifElement.remove()
      gifElement = null
    }

    // Clean up old audio
    if (audioHowl) {
      audioHowl.unload()
      audioHowl = null
    }

    // Create new GIF
    gifElement = createGifElement()
    if (!gifElement) {
      hide()
      return
    }

    // Create audio with Howler
    const audioSrc = ASSETS.audioPaths?.jackpot_video
    if (!audioSrc) {
      console.error('❌ Jackpot audio source not found')
      hide()
      return
    }

    audioHowl = new Howl({
      src: [audioSrc],
      volume: settingsStore.gameSound ? 1.0 : 0,
      onend: () => {
        console.log('✅ Audio ended')
        hide()
      },
      onloaderror: (id, err) => {
        console.error('❌ Audio load error:', err)
        hide()
      },
      onplayerror: (id, err) => {
        console.error('❌ Audio play error:', err)
        audioHowl.once('unlock', () => {
          audioHowl.play()
        })
      }
    })

    // Watch for gameSound changes
    if (!gameSoundWatcher) {
      gameSoundWatcher = watch(
        () => settingsStore.gameSound,
        () => {
          if (isPlaying && audioHowl) {
            updateAudioVolume()
          }
        }
      )
    }

    // Show GIF
    gifElement.style.display = 'block'
    console.log('🖼️ GIF displayed')

    // Play audio
    try {
      audioHowl.play()
      console.log('🔊 Audio playing')
    } catch (err) {
      console.error('❌ Failed to play audio:', err)
    }

    // Enable skip after 2 seconds
    enableSkipAfterDelay()
  }

  /**
   * Hide the GIF overlay
   */
  function hide() {
    container.visible = false
    isPlaying = false

    console.log('🔽 Hiding jackpot GIF')

    // Disable skip functionality
    disableSkip()

    // Stop watching gameSound changes
    if (gameSoundWatcher) {
      gameSoundWatcher()
      gameSoundWatcher = null
    }

    // Clean up GIF element completely
    if (gifElement) {
      gifElement.removeEventListener('click', handleClick)
      gifElement.remove() // Remove from DOM
      gifElement = null
    }

    // Clean up audio
    if (audioHowl) {
      audioHowl.stop()
      audioHowl.unload()
      audioHowl = null
    }

    // Don't resume music here - let free spin mode handle jackpot music

    // Trigger completion callback
    if (onCompleteCallback) {
      onCompleteCallback()
      onCompleteCallback = null
    }
  }

  /**
   * Update (not needed for GIF, but kept for consistency)
   */
  function update(timestamp) {
    // GIF playback is handled by the browser
  }

  /**
   * Build/rebuild for canvas resize (not needed for fullscreen GIF)
   */
  function build(canvasWidth, canvasHeight) {
    // GIF is always fullscreen via CSS
  }

  return {
    container,
    show,
    hide,
    update,
    build,
    isShowing: () => isPlaying || container.visible
  }
}
