import { createApp } from 'vue'
import App from './App.vue'
import 'vue-sonner/style.css'
import i18n from './i18n'
import { ConfigManager } from '../bindings/app/core'

const bootstrap = async () => {
  try {
    const config = await ConfigManager.GetSettings()
    if (config.language) {
      i18n.global.locale.value = config.language
    }
  } catch (error) {
    console.warn('Failed to load language preference on startup:', error)
  }

  createApp(App).use(i18n).mount('#app')
}

void bootstrap()
