import { createApp } from 'vue'
import App from './App.vue'
import 'vue-sonner/style.css'
import i18n from './i18n'
import { ConfigManager } from '../bindings/app/core'

const isSupportedLocale = (value: string): value is 'en-US' | 'zh-TW' =>
  value === 'en-US' || value === 'zh-TW'

const bootstrap = async () => {
  try {
    const config = await ConfigManager.GetSettings()
    const language = config.language

    if (isSupportedLocale(language)) {
      i18n.global.locale.value = language
    } else {
      i18n.global.locale.value = 'en-US'
    }
  } catch (error) {
    console.warn('Failed to load language preference on startup:', error)
    i18n.global.locale.value = 'en-US'
  }

  createApp(App).use(i18n).mount('#app')
}

void bootstrap()
