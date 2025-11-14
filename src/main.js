import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import VConsole from 'vconsole'

// Enable vConsole for mobile debugging
// Shows a floating debug console on mobile devices
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
if (isMobile) {
  const vConsole = new VConsole()
  console.log('📱 vConsole enabled for mobile debugging')
}

const app = createApp(App)
const pinia = createPinia()

// Use persistedstate plugin
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.mount('#app')
