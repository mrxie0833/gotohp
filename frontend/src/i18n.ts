import { createI18n } from 'vue-i18n'

export const defaultLocale = 'zh-TW'

const messages = {
  'zh-TW': {
    app: {
      title: '拖放檔案上傳',
      connectGooglePhotos: '連接 Google 相簿',
      addGoogleAccount: '新增 Google 帳號',
      settings: '設定',
      uploadResults: '上傳結果',
      copied: '已複製！',
      copyJson: '複製為 JSON',
      success: '成功',
      fail: '失敗',
      skipped: '略過',
      warnings: '警告',
    },
    common: {
      cancel: '取消',
      upload: '上傳',
      loading: '正在讀取 ADB...',
      language: '介面語言',
      proxy: 'Proxy URL（選填）',
      selectAccountFailed: '更新選取帳號失敗。',
    },
    settings: {
      languageLabel: '介面語言',
      useQuota: '使用配額',
      saver: '儲存空間節省模式',
      recursive: '遞迴資料夾上傳',
      forceUpload: '強制上傳',
      pairLivePhotos: '配對 Apple Live Photo',
      skipIncompleteLivePhotos: '略過不完整的 Live Photo',
      updateExistingPhotosToLive: '將既有照片升級為 Live Photo',
      filterUnsupported: '停用不支援檔案過濾',
      setDateFromFilename: '依檔名設定上傳日期',
      deleteFromHost: '上傳後從來源端刪除',
      uploadThreads: '上傳執行緒',
    },
  },
  'en-US': {
    app: {
      title: 'Drop files to upload',
      connectGooglePhotos: 'Connect Google Photos',
      addGoogleAccount: 'Add Google Account',
      settings: 'Settings',
      uploadResults: 'Upload Results',
      copied: 'Copied!',
      copyJson: 'Copy as JSON',
      success: 'Success',
      fail: 'Fail',
      skipped: 'Skipped',
      warnings: 'Warnings',
    },
    common: {
      cancel: 'Cancel',
      upload: 'Upload',
      loading: 'Loading ADB...',
      language: 'Interface language',
      proxy: 'Proxy URL (optional)',
      selectAccountFailed: 'Failed to update selected account.',
    },
    settings: {
      languageLabel: 'Interface Language',
      useQuota: 'Use Quota',
      saver: 'Save Space Mode',
      recursive: 'Recursive Upload',
      forceUpload: 'Force Upload',
      pairLivePhotos: 'Pair Apple Live Photo',
      skipIncompleteLivePhotos: 'Skip incomplete Live Photo',
      updateExistingPhotosToLive: 'Upgrade existing photos to Live Photo',
      filterUnsupported: 'Disable unsupported file filter',
      setDateFromFilename: 'Set upload date from filename',
      deleteFromHost: 'Delete from source after upload',
      uploadThreads: 'Upload Threads',
    },
  },
}

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'zh-TW',
  messages,
})

export default i18n
