import { defineStore } from 'pinia'
import { ref, watch, onMounted } from 'vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

export const useNotificationStore = defineStore('notificationStore', () => {
  const permissionGranted = ref(false)

  // --- Ask for permission ---
  async function requestPermission() {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações.')
      return false
    }

    const result = await Notification.requestPermission()
    permissionGranted.value = result === 'granted'
    dataStore.data.config.permissionGranted = permissionGranted.value
    return permissionGranted.value
  }

  // --- Check current browser permission ---
  function checkBrowserPermission() {
    const current = Notification.permission
    const granted = current === 'granted'
    permissionGranted.value = granted
    dataStore.data.config.permissionGranted = granted
    console.log(`[Notifications] Browser permission check → ${current}`)
    return granted
  }

  // --- Send schedule data to Service Worker ---
  function sendDataToServiceWorker() {
    if (!navigator.serviceWorker.controller) return

    const events = dataStore.data.events.map(e => ({
      id: e.id_event,
      name: e.student_name,
      date: e.date,
      time: e.time,
    }))

    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_NOTIFICATIONS',
      payload: { events, minutesBefore: dataStore.data.config.minutesBefore },
    })
  }

  // --- Tell Service Worker to clear everything ---
  function clearServiceWorkerNotifications() {
    if (!navigator.serviceWorker.controller) return
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_NOTIFICATIONS' })
  }

  // --- Handle permission toggle from UI ---
  async function handlePermissionToggle(newValue) {
    if (newValue) {
      const granted = await requestPermission()
      if (!granted) {
        console.log('[Notifications] Permission denied by user.')
        dataStore.data.config.permissionGranted = false
        return
      }
      console.log('[Notifications] Permission granted.')
      sendDataToServiceWorker()
    } else {
      dataStore.data.config.permissionGranted = false
      console.log('[Notifications] Notifications disabled by user.')
      clearServiceWorkerNotifications()
    }
  }

  // --- Watch events and resync ---
  watch(
    [() => dataStore.data.events, () => dataStore.data.config.minutesBefore],
    () => { if (dataStore.data.config.permissionGranted) sendDataToServiceWorker() },
    { deep: true }
  )

  // --- Initialize ---
  onMounted(() => {
    const granted = checkBrowserPermission()
    if (granted) navigator.serviceWorker.ready.then(sendDataToServiceWorker)
  })

  return {
    permissionGranted,
    requestPermission,
    sendDataToServiceWorker,
    clearServiceWorkerNotifications,
    handlePermissionToggle,
    checkBrowserPermission,
  }
})
