import { defineStore } from 'pinia'
import { ref, watch, onMounted } from 'vue'
import router from '@/router'

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Browser } from '@capacitor/browser'

import { useDataStore } from '@/stores/dataStore'
import { whatsappLink, mapsLink } from '@/stores/utility'

export const useNotificationStore = defineStore('notificationStore', () => {
  const dataStore = useDataStore()
  const permissionGranted = ref(false)

  // Silent check for notifiction permission
  const checkPermissions = async () => {
    const check = await LocalNotifications.checkPermissions() // {receive: "granted"}
    return check.receive === 'granted' // returns true or false
  }

  // Request user notification permission
  const requestPermissions = async () => {
    const request = await LocalNotifications.requestPermissions()  // {display: "granted"}
    return request.display === 'granted' // returns true or false
  }

  // Request notification permission on the device -> returns true if granted
  const notificationPermission = async () => {
    const check = await checkPermissions()
    const request = check ? check : await requestPermissions()
    permissionGranted.value = request
    console.log('[notificationStore] Permission granted:', request)
    return request
  }
  
  const removeDeliveredNotifications  = async () => await LocalNotifications.removeAllDeliveredNotifications() // remove all delivered notifications
  const listPendingNotifications      = async () => await LocalNotifications.getPending()  // lists all pending notifications, returns { notifications: [] }

  // Cancel all pending notifications
  const cancelPendingNotifications = async () => {
    try {
      const pending = await listPendingNotifications()
      console.log('[notificationStore] Cancelling pending notifications:', JSON.stringify(pending))
      if (pending?.notifications?.length) await LocalNotifications.cancel(pending)  // Android & iOS compatible
      else console.log('[notificationStore] No pending notifications to cancel.')
    }
    catch (err) { console.error('[notificationStore] Failed to cancel notifications:', err) }
  }

  const hashUUID = (uuid) => {
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash << 5) - hash + uuid.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

  // Schedule notifications
  const scheduleNotifications = async (students, events, minutesBefore = 15) => {
    const permission = await notificationPermission()
    if (!permission) return

    console.log(`[notificationStore] Scheduling notifications for ${events.length} event(s), ${minutesBefore} minute(s) before each.`)
    await removeDeliveredNotifications()
    await cancelPendingNotifications()
    const now = Date.now()
    const notifications = []

    const dummyEvents = events.slice(0, 3) // debug - get only the first 3 events
    let offset = 0  // debug

    // for (const e of events) {
    for (const e of dummyEvents) {  // debug
      offset++; // debug
      const dummyTrigger = new Date(Date.now() + offset * 30 * 1000)  // debug - 30 seconds

      if (!e.date || !e.time) continue
      const eventDate = new Date(`${e.date}T${e.time}`)
      const trigger = new Date(eventDate.getTime() - minutesBefore * 60 * 1000) // mileseconds -> minutes
      const id = hashUUID(e.id_event)

      const student = students.find(s => s.id_student === e.id_student)
      const phone = student.student_phone ? student.student_phone : student.parent_phone
      const address = student.address
      
      if (trigger.getTime() > now) {
  
        const body = `Sua próxima aula com ${e.student_name} é em ${minutesBefore} minuto${minutesBefore==1?'':'s'} (duração: ${e.duration} hora${e.duration==1?'':'s'})`
        notifications.push({
          id, // must be numeric and unique
          title: e.student_name.trim().replace(/\s+/g, ' '),
          body: body.trim().replace(/\s+/g, ' '),
          // schedule: { at: trigger },
          schedule: { at: dummyTrigger, allowWhileIdle: true }, // debug
          sound: null,
          smallIcon: 'ic_launcher',
          actionTypeId: 'event_actions',
          extra: { whatsapp: whatsappLink(phone), maps: mapsLink(address), eventId: e.id_event }
        })
        console.log(`[notificationStore] Notification set for event ${e.id_event} - ${id}\n${trigger.toLocaleString()}\n${trigger}`)  // debug
      }
    }

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications })
      console.log(`[notificationStore] Scheduled ${notifications.length} notification(s):`, notifications)
    } else console.log('[notificationStore] No upcoming events to schedule.')
  }

  // Register actions/buttons for notifictions
  const registerNotificationActions = async () => {
    if (Capacitor.getPlatform() === 'web') return // No actions on web platform
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'event_actions',
        actions: [
          { id: 'details',  title: 'Editar' },
          { id: 'maps',     title: 'Navegar' },
          { id: 'whatsapp', title: 'Whatsapp' }
        ]
      }]
    })
    console.log('[notificationStore] Notification actions registered.')
  }

  // Add listeners for notification actions
  const addActionListeners = async () => {
    if (Capacitor.getPlatform() === 'web') return // No actions on web platform
    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      const { actionId, notification: notif } = notification
      console.log('[notificationStore] Action triggered:', actionId, notif)

      switch (actionId) {

        case 'tap':
          router.push('/')
          break

        case 'details':
          console.log('[notificationStore] User opened details for', notif.title)
          if(notif.extra?.eventId){
            useDataStore().selectedEvent = notif.extra?.eventId
            router.push('/aula/editar')
          } else router.push('/')
          break

        case 'maps':
          console.log('[notificationStore] User needs navigation to', notif.title)
          if(notif.extra?.maps) await Browser.open({ url: notif.extra?.maps })
          else {
            router.push('/')
            alert('Não há endereço cadastrado')
          }
          break

        case 'whatsapp':
          console.log('[notificationStore] User decided to message', notif.title)
          if(notif.extra?.whatsapp) await Browser.open({ url: notif.extra?.whatsapp })
          else {
            router.push('/')
            alert('Não há telefone cadastrado')
          }
          break
          
      }
    })
    console.log('[notificationStore] Notification listeners attached.')
  }

  // On app launch: check and request permissions, register actions, add action listeners, and, finally, schedule notifications
  onMounted(async () => {
    console.log('[notificationStore] Checking permission on app start...')
    await notificationPermission()

    await registerNotificationActions()
    await addActionListeners()
    await new Promise(r => setTimeout(r, 1000))
    await scheduleNotifications(dataStore.data.students, dataStore.data.events, dataStore.data.config.minutesBefore)
  })

  // Watch events and resync when list changes
  const setupNotificationWatcher = () => {
    watch(
      [() => dataStore.data.events, () => dataStore.data.config.minutesBefore],
      async () => {
        console.log('[notificationStore] Re-scheduling pending events on data change.')
        await scheduleNotifications(dataStore.data.students, dataStore.data.events, dataStore.data.config.minutesBefore)
      },
      { deep: true }
    )
  }

  return { setupNotificationWatcher }
})