/**
 * Native Mobile & Web Notification Utility
 * Provides seamless bridge between Web Notifications and Capacitor Mobile Local Notifications.
 */

export const scheduleEmiNotification = async ({ id, title, message, dueDate }) => {
  try {
    // Calculate trigger time: 1 day before due date at 08:00 AM
    const due = new Date(dueDate)
    const alertDate = new Date(due)
    alertDate.setDate(alertDate.getDate() - 1)
    alertDate.setHours(8, 0, 0, 0) // 08:00 AM

    // 1. When running inside Capacitor Native Mobile App (Android / iOS)
    const LocalNotifications = window?.Capacitor?.Plugins?.LocalNotifications
    if (LocalNotifications) {
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display === 'granted') {
        const notifId =
          Math.floor(Math.abs(Number(String(id).replace(/\D/g, '').slice(-8)))) ||
          Math.floor(Math.random() * 100000)

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: title || '⏰ 1-Day EMI Due Alert',
              body: message,
              schedule: { at: alertDate },
              sound: 'default',
              actionTypeId: '',
              extra: { loanId: id, dueDate },
            },
          ],
        })
        console.log(`[CAPACITOR MOBILE] Scheduled native notification for ${alertDate.toISOString()}`)
        return true
      }
    }

    // 2. When running on Web Browser
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
      console.log(`[WEB NOTIF] 1-Day alert registered for ${alertDate.toDateString()}: ${message}`)
    }
  } catch (err) {
    console.warn('[NOTIF WARNING] Could not schedule native notification:', err.message)
  }
  return false
}
