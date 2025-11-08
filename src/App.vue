<template>
  <div id="app">
    <SplashScreen v-if="showSplash" @start="startGame" />
    <GameCanvas v-else />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SplashScreen from './components/SplashScreen.vue'
import GameCanvas from './components/GameCanvas.vue'

const showSplash = ref(true)

const startGame = () => {
  showSplash.value = false
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
