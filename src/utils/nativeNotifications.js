import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

/**
 * Native Mobile & Web Notification Utility
 * Provides true OS push/phone notifications on Android/iOS via Capacitor Local Notifications,
 * and standard Web Notification API fallback on desktop browsers.
 */

/**
 * Trigger an immediate Phone Notification
 */
export const triggerNativeNotification = async ({ title, body, id }) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display === 'granted') {
        const notifId =
          Math.floor(Math.abs(Number(String(id || '').replace(/\D/g, '').slice(-8)))) ||
          Math.floor(Math.random() * 100000)

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: title || 'FinWise Alert',
              body: body || 'You have a new update in FinWise.',
              schedule: { at: new Date(Date.now() + 500) }, // 500ms immediate
              sound: 'default',
            },
          ],
        })
        return true
      }
    }

    // Desktop browser fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body })
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') {
          new Notification(title, { body })
        }
      }
    }
  } catch (err) {
    console.warn('[NOTIF] Could not send phone notification:', err)
  }
  return false
}

/**
 * Schedule 1-Day Before EMI Notification for Phones
 */
export const scheduleEmiNotification = async ({ id, title, message, dueDate }) => {
  try {
    // Trigger time: 1 day before due date at 08:00 AM
    const due = new Date(dueDate)
    const alertDate = new Date(due)
    alertDate.setDate(alertDate.getDate() - 1)
    alertDate.setHours(8, 0, 0, 0) // 08:00 AM

    // If the 1-day before alert is in the past, alert today in 5 seconds
    const scheduleAt = alertDate > new Date() ? alertDate : new Date(Date.now() + 5000)

    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display === 'granted') {
        const notifId =
          Math.floor(Math.abs(Number(String(id || '').replace(/\D/g, '').slice(-8)))) ||
          Math.floor(Math.random() * 100000)

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: title || '⏰ 1-Day EMI Due Alert',
              body: message,
              schedule: { at: scheduleAt },
              sound: 'default',
              extra: { loanId: id, dueDate },
            },
          ],
        })
        console.log(`[PHONE NOTIF] Scheduled native phone notification for ${scheduleAt.toISOString()}`)
        return true
      }
    }

    // Web Browser fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }
  } catch (err) {
    console.warn('[NOTIF] Could not schedule EMI notification:', err)
  }
  return false
}

/**
 * General Schedule Local Notification for Meetings & Reminders
 */
export const scheduleLocalNotification = async ({ id, title, body, scheduleAt }) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display === 'granted') {
        const notifId =
          typeof id === 'number'
            ? id
            : Math.floor(Math.abs(Number(String(id || '').replace(/\D/g, '').slice(-8)))) ||
              Math.floor(Math.random() * 100000)

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: title || 'FinWise Reminder',
              body: body || 'You have an upcoming event.',
              schedule: { at: scheduleAt || new Date(Date.now() + 500) },
              sound: 'default',
            },
          ],
        })
        return true
      }
    }

    // Web Browser fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const delay = scheduleAt ? Math.max(0, new Date(scheduleAt).getTime() - Date.now()) : 500
        if (delay > 0 && delay < 2147483647) {
          setTimeout(() => new Notification(title, { body }), delay)
        }
      }
    }
  } catch (err) {
    console.warn('[NOTIF] Could not schedule local notification:', err)
  }
  return false
}
