<script setup lang="ts">
import { nextTick, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConfigManager } from '../bindings/app/core'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from '@lucide/vue'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'

const { locale, t } = useI18n()

interface Settings {
  proxy: string
  language: string
  useQuota: boolean
  saver: boolean
  recursive: boolean
  forceUpload: boolean
  pairLivePhotos: boolean
  skipIncompleteLivePhotos: boolean
  updateExistingPhotosToLive: boolean
  deleteFromHost: boolean
  disableUnsupportedFilesFilter: boolean
  setDateFromFilename: boolean
  uploadThreads: number
}

type BooleanSetting = Exclude<keyof Settings, 'proxy' | 'uploadThreads' | 'language'>

const settings = ref<Settings>({
  proxy: '',
  language: 'zh-TW',
  useQuota: false,
  saver: false,
  recursive: false,
  forceUpload: false,
  pairLivePhotos: false,
  skipIncompleteLivePhotos: true,
  updateExistingPhotosToLive: false,
  deleteFromHost: false,
  disableUnsupportedFilesFilter: false,
  setDateFromFilename: false,
  uploadThreads: 1,
})
const isHydrating = ref(true)

const toggleSetting = (setting: BooleanSetting, enabled = true) => {
  if (!enabled) return
  settings.value[setting] = !settings.value[setting]
}

onMounted(async () => {
  try {
    const config = await ConfigManager.GetSettings()
    settings.value = {
      proxy: config.proxy || '',
      language: config.language || 'zh-TW',
      useQuota: config.useQuota || false,
      saver: config.saver || false,
      recursive: config.recursive || false,
      forceUpload: config.forceUpload || false,
      pairLivePhotos: config.pairLivePhotos || false,
      skipIncompleteLivePhotos: config.skipIncompleteLivePhotos ?? true,
      updateExistingPhotosToLive: config.updateExistingPhotosToLive || false,
      deleteFromHost: config.deleteFromHost || false,
      disableUnsupportedFilesFilter: config.disableUnsupportedFilesFilter || false,
      setDateFromFilename: config.setDateFromFilename || false,
      uploadThreads: config.uploadThreads || 1,
    }
    locale.value = settings.value.language
  } finally {
    await nextTick()
    isHydrating.value = false
  }
})

watch(() => settings.value.proxy, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetProxy(newValue)
})

watch(() => settings.value.language, async (newValue) => {
  if (isHydrating.value) return
  locale.value = newValue
  await ConfigManager.SetLanguage(newValue)
})

watch(() => settings.value.useQuota, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetUseQuota(newValue)
})

watch(() => settings.value.saver, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetSaver(newValue)
})

watch(() => settings.value.recursive, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetRecursive(newValue)
})

watch(() => settings.value.forceUpload, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetForceUpload(newValue)
})

watch(() => settings.value.pairLivePhotos, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetPairLivePhotos(newValue)
  if (newValue && !settings.value.skipIncompleteLivePhotos) {
    settings.value.skipIncompleteLivePhotos = true
    await ConfigManager.SetSkipIncompleteLivePhotos(true)
  }
})

watch(() => settings.value.skipIncompleteLivePhotos, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetSkipIncompleteLivePhotos(newValue)
})

watch(() => settings.value.updateExistingPhotosToLive, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetUpdateExistingPhotosToLive(newValue)
})

watch(() => settings.value.deleteFromHost, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetDeleteFromHost(newValue)
})

watch(() => settings.value.disableUnsupportedFilesFilter, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetDisableUnsupportedFilesFilter(newValue)
})

watch(() => settings.value.setDateFromFilename, async (newValue) => {
  if (isHydrating.value) return
  await ConfigManager.SetSetDateFromFilename(newValue)
})

watch(() => settings.value.uploadThreads, async (newValue) => {
  if (isHydrating.value) return
  if (newValue < 1) {
    settings.value.uploadThreads = 1
  } else {
    await ConfigManager.SetUploadThreads(newValue)
  }
})
</script>

<template>
  <div class="flex flex-col gap-2.5 m-4">
    <div class="flex items-center justify-between">
      <Label for="app-language" class="size-full cursor-pointer">
        {{ t('settings.languageLabel') }}
      </Label>

      <Select v-model="settings.language">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh-TW">繁體中文</SelectItem>
          <SelectItem value="en-US">English</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <NumberField
      v-model="settings.uploadThreads"
      class="flex items-center justify-between"
    >
      <Label
        for="upload-threads"
        class="size-full"
      >{{ t('settings.uploadThreads') }}</Label>
      <NumberFieldContent>
        <NumberFieldDecrement
          class="cursor-pointer"
          :disabled="settings.uploadThreads <= 1"
        />
        <NumberFieldInput />
        <NumberFieldIncrement class="cursor-pointer" />
      </NumberFieldContent>
    </NumberField>

    <div class="flex items-center justify-between">
      <Label
        for="use-quota"
        class="size-full cursor-pointer"
      >{{ t('settings.useQuota') }}</Label>
      <Switch
        id="use-quota"
        v-model="settings.useQuota"
      />
    </div>

    <div class="flex items-center justify-between">
      <Label
        for="saver-mode"
        class="size-full cursor-pointer"
      >{{ t('settings.saver') }}</Label>
      <Switch
        id="saver-mode"
        v-model="settings.saver"
      />
    </div>

    <div class="flex items-center justify-between">
      <Label
        for="recursive"
        class="size-full cursor-pointer"
      >{{ t('settings.recursive') }}</Label>
      <Switch
        id="recursive"
        v-model="settings.recursive"
      />
    </div>

    <div class="flex items-center justify-between">
      <div
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5"
        @click.self="toggleSetting('forceUpload')"
      >
        <Label
          for="force-upload"
          class="cursor-pointer"
        >{{ t('settings.forceUpload') }}</Label>
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="About force upload"
            >
              <Info class="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent class="max-w-72">
            {{ t('settings.forceUpload') }}
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id="force-upload"
        v-model="settings.forceUpload"
      />
    </div>

    <div class="flex items-center justify-between">
      <div
        class="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 pr-4"
        @click.self="toggleSetting('pairLivePhotos')"
      >
        <Label
          for="pair-live-photos"
          class="cursor-pointer"
        >{{ t('settings.pairLivePhotos') }}</Label>
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="About pair live photo"
            >
              <Info class="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent class="max-w-72">
            {{ t('settings.pairLivePhotos') }}
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id="pair-live-photos"
        v-model="settings.pairLivePhotos"
      />
    </div>

    <div
      class="flex items-center justify-between pl-4 transition-opacity"
      :class="settings.pairLivePhotos ? 'opacity-100' : 'opacity-45'"
    >
      <div
        class="flex min-w-0 flex-1 items-center gap-1.5 pr-4"
        :class="settings.pairLivePhotos ? 'cursor-pointer' : 'cursor-not-allowed'"
        @click.self="toggleSetting('skipIncompleteLivePhotos', settings.pairLivePhotos)"
      >
        <Label
          for="skip-incomplete-live-photos"
          :class="settings.pairLivePhotos ? 'cursor-pointer' : 'cursor-not-allowed'"
        >{{ t('settings.skipIncompleteLivePhotos') }}</Label>
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="About skip incomplete live photos"
            >
              <Info class="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent class="max-w-72">
            {{ t('settings.skipIncompleteLivePhotos') }}
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id="skip-incomplete-live-photos"
        v-model="settings.skipIncompleteLivePhotos"
        :disabled="!settings.pairLivePhotos"
      />
    </div>

    <div
      class="flex items-center justify-between pl-4 transition-opacity"
      :class="settings.pairLivePhotos ? 'opacity-100' : 'opacity-45'"
    >
      <div
        class="flex min-w-0 flex-1 items-center gap-1.5 pr-4"
        :class="settings.pairLivePhotos ? 'cursor-pointer' : 'cursor-not-allowed'"
        @click.self="toggleSetting('updateExistingPhotosToLive', settings.pairLivePhotos)"
      >
        <Label
          for="update-existing-photos-to-live"
          :class="settings.pairLivePhotos ? 'cursor-pointer' : 'cursor-not-allowed'"
        >{{ t('settings.updateExistingPhotosToLive') }}</Label>
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="About update existing photos to live"
            >
              <Info class="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent class="max-w-72">
            {{ t('settings.updateExistingPhotosToLive') }}
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id="update-existing-photos-to-live"
        v-model="settings.updateExistingPhotosToLive"
        :disabled="!settings.pairLivePhotos"
      />
    </div>

    <div class="flex items-center justify-between">
      <Label
        for="filter-unsupported"
        class="size-full cursor-pointer"
      >{{ t('settings.filterUnsupported') }}</Label>
      <Switch
        id="filter-unsupported"
        v-model="settings.disableUnsupportedFilesFilter"
      />
    </div>

    <div class="flex items-center justify-between">
      <Label
        for="set-date-from-filename"
        class="size-full cursor-pointer"
      >{{ t('settings.setDateFromFilename') }}</Label>
      <Switch
        id="set-date-from-filename"
        v-model="settings.setDateFromFilename"
      />
    </div>

    <div class="flex items-center justify-between">
      <Label
        for="delete-host"
        class="size-full cursor-pointer"
      >{{ t('settings.deleteFromHost') }}</Label>
      <Switch
        id="delete-host"
        v-model="settings.deleteFromHost"
        variant="destructive"
      />
    </div>

    <div>
      <Input
        v-model="settings.proxy"
        type="text"
        :placeholder="t('common.proxy')"
      />
    </div>
  </div>
</template>
