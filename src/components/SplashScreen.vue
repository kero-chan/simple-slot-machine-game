<template>
  <div class="splash-screen" :style="pageBgStyle">
    <div class="canvas-holder">
      <canvas ref="canvasRef"></canvas>
      <button class="start-button" @click="emit('start')">开始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
const emit = defineEmits(['start'])
import bgUrl from '../assets/background.jpg'
import dragonGreenUrl from '../assets/dragon_green.png'
import wildUrl from '../assets/wild.png'
import bambooUrl from '../assets/bamboo.png'
import windEastUrl from '../assets/wind_east.png'
import windSouthUrl from '../assets/wind_south.png'
import pageBgUrl from '../assets/background.jpg'
import startBgUrl from '../assets/start_game_bg.jpg'

const bgStyle = {
  backgroundImage: `url(${bgUrl})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat'
}

const canvasRef = ref(null)
let ctx = null
let img = null

const pageBgStyle = {
  backgroundImage: `url(${pageBgUrl})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat'
}

const draw = () => {
  if (!canvasRef.value || !ctx || !img) return

  const vh = window.innerHeight
  const vw = window.innerWidth
  const aspect = img.height / img.width // H/W

  // Full page height canvas; width derived from image aspect
  const h = vh
  const w = Math.round(h / aspect)

  // Device pixel ratio scaling for crisp rendering
  const dpr = window.devicePixelRatio || 1
  canvasRef.value.style.width = `${w}px`
  canvasRef.value.style.height = `${h}px`
  canvasRef.value.width = Math.floor(w * dpr)
  canvasRef.value.height = Math.floor(h * dpr)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.drawImage(img, 0, 0, w, h)
  ctx.restore()
}

const handleResize = () => draw()

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  img = new Image()
  img.onload = draw
  img.src = startBgUrl
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-holder {
  position: relative;
  height: 100vh;
  /* full page height */
  display: flex;
  align-items: center;
  /* center horizontally by canvas intrinsic width */
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

canvas {
  display: block;
}

.start-button {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  padding: 12px 36px;
  font-size: 18px;
  font-weight: 700;
  border: none;
  border-radius: 32px;
  color: #111;
  background: linear-gradient(145deg, #FFD700, #FFA500);
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.5);
}

.start-button:hover {
  transform: translateX(-50%) scale(1.03);
}

.start-button:active {
  transform: translateX(-50%) scale(0.98);
}
</style>
