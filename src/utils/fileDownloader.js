import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Browser } from '@capacitor/browser'

/**
 * Universal File Downloader for Web and Native Mobile (Android/iOS)
 * Handles data URIs, Blobs, Remote URLs, and Text content seamlessly.
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

      // Case A: Raw text content (e.g., CSV export, Markdown notes)
      if (textContent !== null && textContent !== undefined) {
        const saved = await Filesystem.writeFile({
          path: sanitizedName,
          data: textContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        })

        const fileUri = saved.uri || (await Filesystem.getUri({ path: sanitizedName, directory: Directory.Cache })).uri

        // Open native Android/iOS Share & Save Dialog
        await Share.share({
          title: sanitizedName,
          text: `Download ${sanitizedName}`,
          url: fileUri,
          dialogTitle: 'Save or Share File',
        })
        return true
      }

      // Case B: Data URL (Base64, e.g. data:image/png;base64,... or data:application/pdf;base64,...)
      if (fileUrl && fileUrl.startsWith('data:')) {
        const base64Data = fileUrl.includes(',') ? fileUrl.split(',')[1] : fileUrl

        const saved = await Filesystem.writeFile({
          path: sanitizedName,
          data: base64Data,
          directory: Directory.Cache,
        })

        const fileUri = saved.uri || (await Filesystem.getUri({ path: sanitizedName, directory: Directory.Cache })).uri

        await Share.share({
          title: sanitizedName,
          text: `Download ${sanitizedName}`,
          url: fileUri,
          dialogTitle: 'Save or Share File',
        })
        return true
      }

      // Case C: Remote HTTP / HTTPS URL (e.g. Supabase Storage Public URL)
      if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
        try {
          const downloadRes = await Filesystem.downloadFile({
            url: fileUrl,
            path: sanitizedName,
            directory: Directory.Cache,
          })

          const localPath = downloadRes.path || (await Filesystem.getUri({ path: sanitizedName, directory: Directory.Cache })).uri

          await Share.share({
            title: sanitizedName,
            text: `Download ${sanitizedName}`,
            url: localPath,
            dialogTitle: 'Save or Share File',
          })
          return true
        } catch (downloadErr) {
          console.warn('Native downloadFile failed, opening in system browser:', downloadErr)
          // Fallback to opening URL in device browser which triggers native download
          await Browser.open({ url: fileUrl })
          return true
        }
      }
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
    console.error('[Download] Failed to download or save file:', err)
    alert('Could not download file. Please try again.')
    return false
  }
}

