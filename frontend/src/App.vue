<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useColorMode } from '@vueuse/core'
import { UserPlus } from '@lucide/vue'
import { ConfigManager } from '../bindings/app/core'
import { Events } from '@wailsio/runtime'
import Button from "./components/ui/button/Button.vue"
import GoogleAccountSelect from './components/GoogleAccountSelect.vue'
import GoogleAuthSetup from "./components/GoogleAuthSetup.vue"
import './index.css'
import SettingsPanel from "./SettingsPanel.vue"
import Upload from './Upload.vue'
import { uploadManager } from './utils/UploadManager'
import Toaster from './components/ui/sonner/Sonner.vue'

import { toast } from "vue-sonner"

useColorMode().value = "dark"

const { t } = useI18n()
const { state: uploadState } = uploadManager
const copyState = ref(false)
const copyButtonText = computed(() => copyState.value ? t('app.copied') : t('app.copyJson'))

// Drag state for dual drop zones
const isDraggingFiles = ref(false)

// Album upload flow state
const showAlbumInput = ref(false)
const pendingFiles = ref<string[]>([])
const pendingFileCount = ref(0)

const selectedOption = ref('')
const options = ref<string[]>([])
const accountNeedsTokenBinding = ref<Record<string, boolean>>({})
const albumNameOrKey = ref('')
const tokenBindingEmail = ref('')
const isExtractingTokenBinding = ref(false)
const isAccountSetupOpen = ref(false)
const removingAccount = ref('')

watch(selectedOption, async (newValue) => {
  if (newValue) {
    try {
      await ConfigManager.SetSelected(newValue)
      await updateTokenBindingPrompt(newValue)
      console.log('Successfully updated selected value:', newValue)
    } catch (error) {
      console.error('Failed to update selected value:', error)
      toast.error(t('common.selectAccountFailed'))
    }
  } else {
    tokenBindingEmail.value = ''
  }
})

async function updateTokenBindingPrompt(email: string) {
  tokenBindingEmail.value = accountNeedsTokenBinding.value[email] ? email : ''
}

async function refreshCredentials() {
  try {
    const state = await ConfigManager.GetAccounts()
    const nextNeedsTokenBinding: Record<string, boolean> = {}
    const nextOptions = state.accounts.map(account => {
      nextNeedsTokenBinding[account.email] = account.needsTokenBinding
      return account.email
    })

    accountNeedsTokenBinding.value = nextNeedsTokenBinding
    options.value = nextOptions
    selectedOption.value = state.selected || ''
    if (state.selected) {
      await updateTokenBindingPrompt(state.selected)
    } else {
      tokenBindingEmail.value = ''
    }
  } catch (error) {
    console.error('Failed to refresh Google accounts:', error)
    toast.error(t('app.cannotStartUpload'), {
      description: error instanceof Error ? error.message : String(error),
    })
  }
}

async function addTokenBindingAliasFromADB() {
  if (!tokenBindingEmail.value) return

  isExtractingTokenBinding.value = true
  try {
    await ConfigManager.AddTokenBindingAliasFromADB(tokenBindingEmail.value)
    await refreshCredentials()
    tokenBindingEmail.value = ''
    toast.success(t('app.addTokenBindingSuccess'))
  } catch (error) {
    console.error('Failed to add token binding key:', error)
    toast.error(t('app.addTokenBindingFailed'), {
      description: error instanceof Error ? error.message : String(error),
    })
  } finally {
    isExtractingTokenBinding.value = false
  }
}

async function removeCredentials(email: string) {
  removingAccount.value = email
  try {
    await ConfigManager.RemoveCredentials(email)

    const removedSelectedAccount = selectedOption.value === email
    await refreshCredentials()
    if (removedSelectedAccount && options.value.length > 0 && !selectedOption.value) {
      selectedOption.value = options.value[0]
    }
    toast.success(t('app.removeCredential'))
    return true
  } catch (error) {
    console.error('Failed to remove credentials:', error)
    toast.error(t('app.removeCredentialFailed'))
    return false
  } finally {
    removingAccount.value = ''
  }
}

function openAccountSetup() {
  isAccountSetupOpen.value = true
}

onMounted(async () => {
  await refreshCredentials()
})

const handleCopyClick = () => {
  uploadManager.copyResultsAsJson()
  copyState.value = true
  setTimeout(() => {
    copyState.value = false
  }, 1000)
}

// Global drag event handlers to detect file dragging
let dragLeaveTimeout: ReturnType<typeof setTimeout> | null = null

const onDragEnter = (e: DragEvent) => {
  if (!e.dataTransfer?.types.includes('Files')) return

  // Clear any pending drag leave timeout
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout)
    dragLeaveTimeout = null
  }

  isDraggingFiles.value = true
}

const onDragOver = (e: DragEvent) => {
  if (!e.dataTransfer?.types.includes('Files')) return
  e.preventDefault()

  // Clear any pending drag leave timeout - we're still dragging
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout)
    dragLeaveTimeout = null
  }
}

const onDragLeave = (e: DragEvent) => {
  if (!e.dataTransfer?.types.includes('Files')) return

  // Use timeout to detect if we've truly left the window
  // dragover will cancel this if we're still in the window
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout)
  }
  dragLeaveTimeout = setTimeout(() => {
    isDraggingFiles.value = false
    dragLeaveTimeout = null
  }, 50)
}

const onDrop = () => {
  // Clear any pending timeout
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout)
    dragLeaveTimeout = null
  }

  // Delay resetting isDraggingFiles to allow Wails to process the drop target
  // before Vue re-renders and hides the drop zones
  setTimeout(() => {
    isDraggingFiles.value = false
  }, 100)
}

// Album upload confirmation
const confirmAlbumUpload = async () => {
  // Set album name in backend (not persisted to disk)
  await ConfigManager.SetAlbumName(albumNameOrKey.value)
  await ConfigManager.SetAlbumAutoMode(false)
  // Start upload with pending files
  Events.Emit('startUpload', { files: pendingFiles.value })
  showAlbumInput.value = false
  pendingFiles.value = []
  pendingFileCount.value = 0
  albumNameOrKey.value = '' // Reset for next upload
}

const cancelAlbumUpload = () => {
  showAlbumInput.value = false
  pendingFiles.value = []
  pendingFileCount.value = 0
  albumNameOrKey.value = '' // Reset on cancel too
}

// Handle album error event
const albumErrorHandler = (e: Event) => {
  const event = e as CustomEvent<{ AlbumName: string; Error: string }>
  const { AlbumName, Error } = event.detail
  if (Error.includes('404')) {
    toast.error(t('app.albumNotFound'), {
      description: t('app.albumNotFoundDescription', { album: AlbumName }),
    })
  } else {
    toast.error(t('app.albumCreateFailed'), {
      description: t('app.albumCreateFailedDescription', { album: AlbumName, error: Error }),
    })
  }
}

const uploadErrorHandler = (e: Event) => {
  const event = e as CustomEvent<{ FileName: string; Message: string }>
  const { FileName, Message } = event.detail
  const errorMessage = Message.replace(/^Error:\s*/, '')
  toast.error(FileName ? `${t('app.uploadFailed')}: ${FileName}` : t('app.uploadFailed'), {
    description: errorMessage,
    duration: 10000,
    important: true,
  })
}

onMounted(() => {
  document.addEventListener('dragenter', onDragEnter)
  document.addEventListener('dragleave', onDragLeave)
  document.addEventListener('dragover', onDragOver)
  document.addEventListener('drop', onDrop)
  window.addEventListener('albumError', albumErrorHandler)
  window.addEventListener('uploadError', uploadErrorHandler)

  // Listen for files-dropped event from backend
  Events.On('files-dropped', async (event: { data: { files: string[]; dropZone: string } }) => {
    const { files, dropZone } = event.data

    if (dropZone === 'album') {
      // Show album input screen
      pendingFiles.value = files
      pendingFileCount.value = files.length
      showAlbumInput.value = true
    } else {
      try {
        await ConfigManager.SetAlbumName('')
        await ConfigManager.SetAlbumAutoMode(dropZone === 'auto-album')
        await Events.Emit('startUpload', { files })
      } catch (error) {
        console.error('Failed to start upload:', error)
        toast.error(t('app.cannotStartUpload'), {
          description: error instanceof Error ? error.message : String(error),
        })
      }
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('dragenter', onDragEnter)
  document.removeEventListener('dragleave', onDragLeave)
  document.removeEventListener('dragover', onDragOver)
  document.removeEventListener('drop', onDrop)
  window.removeEventListener('albumError', albumErrorHandler)
  window.removeEventListener('uploadError', uploadErrorHandler)
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout)
  }
})
</script>

<template>
  <main
    class="w-screen h-screen flex flex-col items-center"
    style="--wails-draggable: drag"
  >
    <!-- Drop zones shown when dragging files -->
    <div
      v-if="!uploadState.isUploading && isDraggingFiles && options.length > 0"
      class="w-screen h-screen flex flex-col gap-3 p-6"
      style="--wails-draggable: none"
    >
      <div
        data-file-drop-target
        data-drop-zone="regular"
        class="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/50 rounded-xl transition-all duration-200 drop-zone"
      >
        <h2 class="text-xl font-semibold select-none text-muted-foreground">
          {{ t('app.uploadOnly') }}
        </h2>
        <p class="text-sm text-muted-foreground/70 mt-2 select-none text-center px-4">
          {{ t('app.uploadOnlyDescription') }}
        </p>
      </div>
      <div
        data-file-drop-target
        data-drop-zone="album"
        class="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/50 rounded-xl transition-all duration-200 drop-zone"
      >
        <h2 class="text-xl font-semibold select-none text-muted-foreground">
          {{ t('app.uploadToAlbum') }}
        </h2>
        <p class="text-sm text-muted-foreground/70 mt-2 select-none text-center px-4">
          {{ t('app.uploadToAlbumDescription') }}
        </p>
      </div>
      <div
        data-file-drop-target
        data-drop-zone="auto-album"
        class="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/50 rounded-xl transition-all duration-200 drop-zone"
      >
        <h2 class="text-xl font-semibold select-none text-muted-foreground">
          {{ t('app.autoAlbum') }}
        </h2>
        <p class="text-sm text-muted-foreground/70 mt-2 select-none text-center px-4">
          {{ t('app.autoAlbumDescription') }}
        </p>
      </div>
    </div>

    <!-- Normal UI (not dragging) -->
    <div
      v-else-if="!uploadState.isUploading"
      class="w-screen h-screen flex flex-col items-center gap-4 max-w-md px-6 pt-30"
      data-file-drop-target
    >
      <template v-if="options.length === 0">
        <div class="flex max-w-xs flex-col items-center gap-4 text-center">
          <div class="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserPlus class="size-5" />
          </div>
          <div class="flex flex-col gap-1">
            <h1 class="text-xl font-semibold select-none">
              {{ t('app.accountRequiredTitle') }}
            </h1>
            <p class="text-sm text-muted-foreground select-none">
              {{ t('app.accountRequiredDescription') }}
            </p>
          </div>
          <Button
            class="cursor-pointer select-none"
            @click="openAccountSetup"
          >
            {{ t('app.openAccountSetup') }}
          </Button>
        </div>
      </template>

      <template v-else>
        <!-- Show album input screen when files dropped on album zone -->
        <template v-if="showAlbumInput">
          <div
            class="flex flex-col items-center justify-center gap-6 p-8"
            style="--wails-draggable: none"
          >
            <h1 class="text-xl font-semibold select-none">
              {{ t('app.uploadToAlbum') }}
            </h1>
            <p class="text-muted-foreground select-none">
              {{ t('app.uploadReadyDescription', { count: pendingFileCount }) }}
            </p>

            <div class="flex flex-col gap-2 w-full max-w-xs">
              <Label
                for="album-input"
                class="text-muted-foreground text-sm"
              >{{ t('app.albumNameOrKey') }}</Label>
              <Input
                id="album-input"
                v-model="albumNameOrKey"
                :placeholder="t('app.albumPlaceholder')"
                autofocus
              />
            </div>

            <div class="flex gap-4">
              <Button
                variant="outline"
                class="cursor-pointer select-none"
                @click="cancelAlbumUpload"
              >
                {{ t('common.cancel') }}
              </Button>
              <Button
                class="cursor-pointer select-none"
                :disabled="!albumNameOrKey.trim()"
                @click="confirmAlbumUpload"
              >
                {{ t('app.upload') }}
              </Button>
            </div>
          </div>
        </template>

        <!-- Normal UI when not dragging -->
        <template v-else>
          <h1 class="text-xl font-semibold select-none">
            {{ t('app.title') }}
          </h1>
          <GoogleAccountSelect
            v-model="selectedOption"
            :options="options"
            :removing-account="removingAccount"
            @item-removed="removeCredentials"
            @add="openAccountSetup"
          />
          <div
            v-if="tokenBindingEmail"
            class="w-full max-w-xs border rounded-lg p-3 flex flex-col gap-3"
            style="--wails-draggable: none"
          >
            <p class="text-sm text-muted-foreground">
              {{ t('app.tokenBindingDescription') }}
            </p>
            <Button
              class="cursor-pointer select-none"
              :disabled="isExtractingTokenBinding"
              @click="addTokenBindingAliasFromADB"
            >
              {{ isExtractingTokenBinding ? t('app.readingADB') : t('app.readFromADB') }}
            </Button>
          </div>

          <Sheet>
            <SheetTrigger>
              <Button
                variant="outline"
                class="cursor-pointer select-none"
              >
                {{ t('app.settings') }}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <TooltipProvider disable-hoverable-content>
                <SettingsPanel />
              </TooltipProvider>
            </SheetContent>
          </Sheet>

          <div
            v-if="uploadState.uploadedFiles > 0 || uploadState.results.fail.length > 0"
            class="flex flex-col items-center gap-2 border rounded-lg p-5 mt-5"
          >
            <h2 class="text-l font-semibold select-none ">
              {{ t('app.uploadResults') }}
            </h2>
            <Label class="text-muted-foreground">{{ t('app.success') }}：{{ uploadState.results.success.length }}</Label>
            <Label class="text-muted-foreground">{{ t('app.fail') }}：{{ uploadState.results.fail.length }}</Label>
            <Label class="text-muted-foreground">{{ t('app.skipped') }}：{{ uploadState.results.skipped.length }}</Label>
            <Label class="text-muted-foreground">{{ t('app.warnings') }}：{{ uploadState.results.warnings.length }}</Label>
            <Button
              variant="outline"
              class="cursor-pointer select-none min-w-[125px]"
              @click="handleCopyClick"
            >
              {{ copyButtonText }}
            </Button>
          </div>
        </template>
      </template>
    </div>
    <div
      v-if="uploadState.isUploading"
      class="w-full h-full"
    >
      <Upload />
    </div>
    <GoogleAuthSetup
      v-model:open="isAccountSetupOpen"
      @account-added="refreshCredentials"
    />
    <Toaster
      position="bottom-center"
      rich-colors
      expand
      :visible-toasts="4"
    />
  </main>
</template>
