<script setup lang="ts">
import { ref, watch } from 'vue'
import { Browser } from '@wailsio/runtime'
import { toast } from 'vue-sonner'
import { ChevronDown, ExternalLink } from '@lucide/vue'
import { ConfigManager } from '../../bindings/app/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const embeddedSetupURL = 'https://accounts.google.com/EmbeddedSetup'

const emit = defineEmits<{
  (event: 'account-added'): void
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const oauthToken = ref('')
const rawCredential = ref('')
const isConnecting = ref(false)
const isAddingRawCredential = ref(false)
const showAdvanced = ref(false)

watch(isOpen, (open) => {
  if (!open) {
    oauthToken.value = ''
    rawCredential.value = ''
    showAdvanced.value = false
  }
})

async function openEmbeddedSetup() {
  try {
    await Browser.OpenURL(embeddedSetupURL)
  } catch (error) {
    toast.error('無法開啟系統瀏覽器', {
      description: error instanceof Error ? error.message : String(error),
    })
  }
}

async function connectAccount() {
  const normalizedToken = oauthToken.value.trim()
  if (!normalizedToken) return

  isConnecting.value = true
  try {
    const connectedEmail = await ConfigManager.AddGoogleAccount(normalizedToken)
    oauthToken.value = ''
    isOpen.value = false
    emit('account-added')
    toast.success('Google 帳號已連線。', {
      description: connectedEmail,
    })
  } catch (error) {
    toast.error('無法連線 Google 帳號', {
      description: error instanceof Error ? error.message : String(error),
    })
  } finally {
    oauthToken.value = ''
    isConnecting.value = false
  }
}

async function addRawCredential() {
  const credential = rawCredential.value.trim()
  if (!credential) return

  isAddingRawCredential.value = true
  try {
    await ConfigManager.AddCredentials(credential)
    rawCredential.value = ''
    isOpen.value = false
    emit('account-added')
    toast.success('憑證已新增。')
  } catch (error) {
    toast.error('無法新增憑證', {
      description: error instanceof Error ? error.message : String(error),
    })
  } finally {
    isAddingRawCredential.value = false
  }
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent
      side="bottom"
      class="max-h-[92vh] overflow-y-auto"
      style="--wails-draggable: none"
    >
      <div class="mx-auto flex w-full max-w-sm flex-col px-5 pt-1 pb-6">
        <SheetHeader class="gap-0 px-0 pb-4 text-center">
          <SheetTitle>連線 Google 相片</SheetTitle>
        </SheetHeader>

        <div class="flex flex-col gap-4">
          <!-- Step 1: open sign-in -->
          <div class="flex flex-col gap-2">
            <p class="flex items-center gap-2 text-sm font-medium select-none">
              <span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">1</span>
              開啟 Google 登入頁面
            </p>
            <Button
              type="button"
              variant="outline"
              class="cursor-pointer select-none"
              :disabled="isConnecting"
              @click="openEmbeddedSetup"
            >
              <ExternalLink class="size-4" />
              開啟登入頁面
            </Button>
            <ol class="list-decimal space-y-1 rounded-lg border bg-muted/30 py-2.5 pr-3 pl-7 text-xs leading-snug text-muted-foreground">
              <li>
                登入後，點選 <span class="text-foreground">我同意</span>。頁面可能卡在載入動畫，這是正常的。
              </li>
              <li>開啟開發者工具，然後進入 Application 或 Storage → Cookies → accounts.google.com。</li>
              <li>複製 <code class="text-foreground">oauth_token</code> Cookie 的值。</li>
            </ol>
          </div>

          <!-- Step 2: paste token -->
          <div class="flex flex-col gap-2">
            <Label
              for="google-oauth-token"
              class="flex items-center gap-2 text-sm font-medium"
            >
              <span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">2</span>
              貼上 oauth_token 的值
            </Label>
            <Input
              id="google-oauth-token"
              v-model="oauthToken"
              type="password"
              autocomplete="off"
              spellcheck="false"
              placeholder="貼上 Cookie 值"
              :disabled="isConnecting"
              @keydown.enter="connectAccount"
            />
            <Button
              type="button"
              class="cursor-pointer select-none"
              :disabled="!oauthToken.trim() || isConnecting"
              @click="connectAccount"
            >
              {{ isConnecting ? '連線中...' : '連線帳號' }}
            </Button>
          </div>
        </div>

        <div class="mt-4 border-t pt-3">
          <button
            type="button"
            class="flex w-full items-center gap-1 text-xs text-muted-foreground select-none hover:text-foreground"
            @click="showAdvanced = !showAdvanced"
          >
            <ChevronDown
              class="size-3.5 transition-transform"
              :class="showAdvanced && 'rotate-180'"
            />
            改為貼上擷取到的憑證
          </button>
          <div
            v-if="showAdvanced"
            class="mt-3 flex flex-col gap-2"
          >
            <Input
              id="google-raw-credential"
              v-model="rawCredential"
              type="password"
              autocomplete="off"
              spellcheck="false"
              placeholder="androidId=...&Email=..."
              :disabled="isAddingRawCredential"
              @keydown.enter="addRawCredential"
            />
            <Button
              type="button"
              variant="outline"
              class="cursor-pointer select-none"
              :disabled="!rawCredential.trim() || isAddingRawCredential"
              @click="addRawCredential"
            >
              {{ isAddingRawCredential ? '新增中...' : '新增憑證' }}
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

