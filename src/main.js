import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import eruda from 'eruda'

// Initialize Eruda for mobile debugging (shows console on phone)
eruda.init()

const app = createApp(App)
const pinia = createPinia()

// Use persistedstate plugin
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.mount('#app')
