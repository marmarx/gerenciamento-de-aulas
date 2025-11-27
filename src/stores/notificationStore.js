import { defineStore } from 'pinia'
import { watch, onMounted } from 'vue'
import router from '@/router'

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Browser } from '@capacitor/browser'
import { showToast } from '@/composables/showToast'

import { useDataStore } from '@/stores/dataStore'
import { parseDate, formatDuration, whatsappLink, mapsLink } from '@/composables/utility'

export const useNotificationStore = defineStore('notificationStore', () => {
  const dataStore = useDataStore()

  // Silent check for notifiction permission
  const checkPermission = async () => {
    const check = await LocalNotifications.checkPermissions() // {display: "granted"}
    return check.display === 'granted' // returns true or false
  }

  // Request user notification permission
  const requestPermission = async () => {
    const request = await LocalNotifications.requestPermissions()  // {display: "granted"}
    return request.display === 'granted' // returns true or false
  }

  // Request notification permission on the device -> returns true if granted
  const notificationPermission = async () => {
    const check = await checkPermission()
    console.log('[notificationStore] Permission check:', check)
    if (check) return check

    const request = await requestPermission()
    console.log('[notificationStore] Permission request:', request)
    return request
  }
  
  const removeDeliveredNotifications  = async () => await LocalNotifications.removeAllDeliveredNotifications() // remove all delivered notifications
  const listPendingNotifications      = async () => await LocalNotifications.getPending()  // lists all pending notifications, returns { notifications: [] }

  // Cancel all pending notifications
  const cancelPendingNotifications = async () => {
    try {
      const pending = await listPendingNotifications()
      if (pending?.notifications?.length) {
        console.log(`[notificationStore] Cancelling ${pending.notifications.length} pending notifications`)
        await LocalNotifications.cancel(pending)
      } else console.log('[notificationStore] No pending notifications to cancel')
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

  const getNextBirthday = (dob) => {
    if (!dob) return null     // dob must be 'YYYY-MM-DD'

    const [year, month, day] = dob.split('-').map(Number)
    const now = new Date()
    let birthday = new Date(now.getFullYear(), month - 1, day)

    if (birthday < now) birthday = new Date(now.getFullYear() + 1, month - 1, day)  // If birthday already passed this year → use next year

    return birthday
  }

  // Schedule notifications
  const scheduleNotifications = async (students, events, minutesBefore = 15) => {
    const check = await checkPermission()  // silent check - no need to bother the user every time the function is called
    // console.log('[notificationStore] Permission check:', check)
    if (!check) return

    await removeDeliveredNotifications()
    const a = await cancelPendingNotifications()
    const now = Date.now()
    const notifications = []

    for (const e of events) {
      if(!e.id_student) return
      if (!e.date || !e.time) continue
      const eventDate = parseDate(e.date, e.time)
      const timeBefore = e.minutesBefore || minutesBefore
      const trigger = new Date(eventDate.getTime() - timeBefore * 60 * 1000) // mileseconds -> minutes
      const id = hashUUID(e.id_event)

      const student = students.find(s => s.id_student === e.id_student)
      const phone = student.student_phone ? student.student_phone : student.parent_phone
      const address = student.address
      
      if (trigger.getTime() > now) {
        const body = `Sua próxima aula com ${e.student_name} é em ${formatDuration(timeBefore/60)} (duração: ${formatDuration(e.duration)})`
        notifications.push({
          id, // must be numeric and unique
          title: e.student_name.trim().replace(/\s+/g, ' '),
          body: body.trim().replace(/\s+/g, ' '),
          schedule: { at: trigger, allowWhileIdle: true },
          // sound: null,
          smallIcon: 'notification_icon',
          actionTypeId: 'event_actions',
          extra: { whatsapp: whatsappLink(phone), maps: mapsLink(address), eventId: e.id_event }
        })
      }
    }
    console.log(`[notificationStore] Scheduling notifications for ${notifications.length} event(s)`)

    if(dataStore.data.config.notifyBirthday){
      const birthdays = []
      for (const s of students) {
        if (!s.dob) continue

        const birthday = getNextBirthday(s.dob)
        if (!birthday) continue

        birthday.setHours(9, 0, 0, 0)  // Set birthday time to 9 AM
        const diff = birthday.getTime() - now
        const sevenDays = 7 * 24 * 60 * 60 * 1000

        if (diff > 0 && diff <= sevenDays) {
          const id = hashUUID(s.id_student)

          birthdays.push({
            id,
            title: `Aniversário de ${s.student_name}`,
            body: `${s.student_name} faz aniversário hoje! 🎉🎂`,
            schedule: { at: birthday, allowWhileIdle: true },
            smallIcon: 'notification_icon',
            extra: { studentId: s.id_student }
          })
        }
      }
      console.log(`[notificationStore] Scheduling notifications for ${birthdays.length} birthday(s)`)
      notifications.push(...birthdays)
    }

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications })
      console.log(`[notificationStore] Scheduled ${notifications.length} notification(s)`)
    }
    else console.log('[notificationStore] No upcoming events to schedule')
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
    console.log('[notificationStore] Notification actions registered')
  }

  // Add listeners for notification actions
  const addActionListeners = async () => {
    if (Capacitor.getPlatform() === 'web') return // No actions on web platform
    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      const { actionId, notification: notif } = notification
      console.log('[notificationStore] Action triggered:', actionId, notif)

      const toastRoute = (msg) => { router.push('/'); showToast(msg) }

      switch (actionId) {

        case 'tap':
          router.push('/')
          break

        case 'details':
          if(notif.extra?.eventId){
            useDataStore().selectedEvent = notif.extra?.eventId
            router.push('/aula')  //'/aula/editar'
          } else toastRoute('Aula não encontrada')
          break

        case 'maps':
          if(notif.extra?.maps) await Browser.open({ url: notif.extra?.maps })
          else toastRoute('Não há endereço cadastrado')
          break

        case 'whatsapp':
          if(notif.extra?.whatsapp) await Browser.open({ url: notif.extra?.whatsapp })
          else toastRoute('Não há telefone cadastrado')
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
        console.log('[notificationStore] Re-scheduling pending events on data change')
        await scheduleNotifications(dataStore.data.students, dataStore.data.events, dataStore.data.config.minutesBefore)
      },
      { deep: true }
    )
  }

  return { setupNotificationWatcher, listPendingNotifications }
})