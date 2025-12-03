import { ref } from 'vue'
import { LocalNotifications } from '@capacitor/local-notifications'
import { hashUUID } from '@/modules/notifications/notificationHelper'

const permissionGranted = ref(false)


// ## PERMISSION REQUEST ##
// Silent check for notifiction permission
const checkPermission = async () => {
  const check = await LocalNotifications.checkPermissions() // {display: "granted"}
  const result = check.display === 'granted'  // true or false
  permissionGranted.value = result
  return result
}

// Request user notification permission
const requestPermission = async () => {
  const request = await LocalNotifications.requestPermissions()  // {display: "granted"}
  const result = request.display === 'granted'  // true or false
  permissionGranted.value = result
  return result
}

// Request notification permission -> returns true if granted
const notificationPermission = async () => {
  const check = await checkPermission()
  console.log('[Notification] Permission check:', check)
  if (check) return check

  const request = await requestPermission()
  console.log('[Notification] Permission request:', request)
  return request
}


// ## SCHEDULE NOTIFICATIONS ##
// Schedule multiple notifications
const scheduleNotifications = async (notifications) => {
  const check = await checkPermission()  // silent check - no need to bother the user every time the function is called
  if (!check) return

  try {
    if (!notifications.length) { console.log('[Notification] No notifications to schedule'); return }

    await LocalNotifications.schedule({ notifications })
    console.log(`[Notification] Scheduled ${notifications.length} notification(s)`)
  }
  catch (err) { console.error('[Notification] Failed to schedule notifications:', err) }
}

// Lists all pending notifications, returns { notifications: [] }
const listPendingNotifications  = async () => await LocalNotifications.getPending()


// ## CANCEL NOTIFICATIONS ##
// Cancal single notification by related id
const cancelNotificationById = async (notifId) => {
  const id = hashUUID(notifId)
  await LocalNotifications.cancel({ notifications: [{ id }] })
  console.log(`[Notification] Canceled notification ${id} related to ${notifId}`)
}

// Cancal all pending notifications
const cancelPendingNotifications = async () => {
  const pending = await listPendingNotifications()

  try {
    if (!pending?.notifications?.length) { console.log('[Notification] No pending notifications to cancel'); return }

    await LocalNotifications.cancel(pending)
    console.log(`[Notification] Canceled ${pending.notifications.length} pending notifications`)
  }
  catch (err) { console.error('[Notification] Failed to cancel notifications:', err) }
}


// ## REMOVE NOTIFICATIONS ##
// Remove all delivered notifications
const removeDeliveredNotifications = async () => await LocalNotifications.removeAllDeliveredNotifications()

// Remove all notifications
const removeAllNotifications = async () => {
  await cancelPendingNotifications()
  await removeDeliveredNotifications()
}


export {
  permissionGranted, checkPermission, notificationPermission, scheduleNotifications,
  cancelNotificationById, removeDeliveredNotifications, removeAllNotifications
}