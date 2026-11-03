import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { triggerNativeNotification } from './nativeNotifications'

/**
 * Universal File Downloader
 * Directly writes files to the device's Documents / Files folder without opening a share sheet.
 */
export const downloadFile = async ({
  fileUrl,
  fileName = 'download',
  textContent = null,
  mimeType = 'application/octet-stream',
}) => {
  try {
    const isNative = Capacitor.isNativePlatform()

    // ==========================================
    // 1. NATIVE MOBILE APP (Android & iOS)
    // ==========================================
    if (isNative) {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')

      // Request Storage Permission if needed
      try {
        const permStatus = await Filesystem.checkPermissions()
        if (permStatus.publicStorage !== 'granted') {
          await Filesystem.requestPermissions()
        }
      } catch (permErr) {
        console.warn('Filesystem permission check:', permErr)
      }

      let destinationDir = Directory.Documents

      // Case A: Raw text content (e.g. CSV, Markdown)
      if (textContent !== null && textContent !== undefined) {
        try {
          await Filesystem.writeFile({
            path: sanitizedName,
            data: textContent,
            directory: destinationDir,
            encoding: Encoding.UTF8,
            recursive: true,
          })
        } catch {
          // Fallback to Data directory if Documents is restricted
          destinationDir = Directory.Data
          await Filesystem.writeFile({
            path: sanitizedName,
            data: textContent,
            directory: destinationDir,
            encoding: Encoding.UTF8,
            recursive: true,
          })
        }
      }
      // Case B: Data URL (Base64)
      else if (fileUrl && fileUrl.startsWith('data:')) {
        const base64Data = fileUrl.includes(',') ? fileUrl.split(',')[1] : fileUrl
        try {
          await Filesystem.writeFile({
            path: sanitizedName,
            data: base64Data,
            directory: destinationDir,
            recursive: true,
          })
        } catch {
          destinationDir = Directory.Data
          await Filesystem.writeFile({
            path: sanitizedName,
            data: base64Data,
            directory: destinationDir,
            recursive: true,
          })
        }
      }
      // Case C: Remote HTTP / HTTPS URL
      else if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
        try {
          await Filesystem.downloadFile({
            url: fileUrl,
            path: sanitizedName,
            directory: destinationDir,
            recursive: true,
          })
        } catch {
          destinationDir = Directory.Data
          await Filesystem.downloadFile({
            url: fileUrl,
            path: sanitizedName,
            directory: destinationDir,
            recursive: true,
          })
        }
      }

      // Trigger high-priority native notification in phone notification bar
      triggerNativeNotification({
        title: '📥 File Downloaded',
        body: `${sanitizedName} has been saved to your device Documents.`,
      })

      // In-app visual feedback
      alert(`✅ Downloaded: "${sanitizedName}" has been saved to your device.`)
      return true
    }

    // ==========================================
    // 2. WEB BROWSER FALLBACK
    // ==========================================
    let urlToDownload = fileUrl

    if (textContent !== null && textContent !== undefined) {
      const blob = new Blob([textContent], { type: mimeType })
      urlToDownload = URL.createObjectURL(blob)
    }

    if (urlToDownload) {
      const link = document.createElement('a')
      link.href = urlToDownload
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      if (textContent !== null) {
        setTimeout(() => URL.revokeObjectURL(urlToDownload), 1000)
      }
      return true
    }
  } catch (err) {
    console.error('[Download] Failed to save file to device:', err)
    alert('Failed to save file to device. Please ensure storage permissions are granted.')
    return false
  }
}

/**
 * Dedicated Share File helper (for when the user explicitly wants to share via WhatsApp, Email, etc.)
 */
export const shareFile = async ({ fileUrl, fileName = 'document', textContent = null }) => {
  try {
    const isNative = Capacitor.isNativePlatform()
    if (!isNative) {
      if (navigator.share) {
        await navigator.share({ title: fileName, url: fileUrl })
        return true
      }
      return false
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    let fileUri = null

    if (textContent !== null) {
      const saved = await Filesystem.writeFile({
        path: sanitizedName,
        data: textContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      })
      fileUri = saved.uri
    } else if (fileUrl && fileUrl.startsWith('data:')) {
      const base64Data = fileUrl.includes(',') ? fileUrl.split(',')[1] : fileUrl
      const saved = await Filesystem.writeFile({
        path: sanitizedName,
        data: base64Data,
        directory: Directory.Cache,
      })
      fileUri = saved.uri
    } else if (fileUrl) {
      const res = await Filesystem.downloadFile({
        url: fileUrl,
        path: sanitizedName,
        directory: Directory.Cache,
      })
      fileUri = res.path
    }

    if (!fileUri) {
      fileUri = (await Filesystem.getUri({ path: sanitizedName, directory: Directory.Cache })).uri
    }

    await Share.share({
      title: sanitizedName,
      url: fileUri,
      dialogTitle: 'Share Document',
    })
    return true
  } catch (err) {
    console.warn('Share file error:', err)
    return false
  }
}
