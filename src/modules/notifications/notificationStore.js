import { defineStore } from 'pinia'
import { watch, onMounted } from 'vue'
import { App } from '@capacitor/app'
import { useDataStore } from '@/stores/dataStore'

import { EVENT_FIELDS, STUDENT_FIELDS, BIRTHDAY_FIELDS, eventNotification, birthdayNotification, isNewDay } from '@/modules/notifications/notificationHelper'
import { registerNotificationActions, addActionListeners } from '@/modules/notifications/notificationActions'
import { permissionGranted, checkPermission, notificationPermission, scheduleNotifications, removeAllNotifications } from '@/modules/notifications/notificationMain'
import { markEventDirty, markBirthdayDirty } from '@/modules/notifications/notificationDirty'

export const useNotificationStore = defineStore('notificationStore', () => {
  const dataStore = useDataStore()
  
  // create notifications for all events and birthdays
  const setAllNotifications = async () => {
    const check = await checkPermission()  // silent check
    if (!check) return

    const students = dataStore.data.students
    const events = dataStore.data.events
    const config = dataStore.data.config

    await removeAllNotifications()

    const evNotifications = []
    events.forEach(event => {
      const student = students.find(s => s.id_student === event.id_student)
      const notification = eventNotification(event, student, config)
      if(notification) evNotifications.push(notification)
    })

    const birthdays = []
    if (config.notifyBirthday) {
      students.forEach(student => {
        const notification = birthdayNotification(student)
        if (notification) birthdays.push(notification)
      })
    }
    
    console.log(`[Notification] Scheduling notifications for ${evNotifications.length} event(s) and ${birthdays.length} birthdays(s)`)
    const notifications = [...evNotifications, ...birthdays]
    await scheduleNotifications(notifications)
  }

  const morningRefresh = async () => {
    const lastRefreshDate = dataStore.data.config.lastRefreshDate

    const newDay = isNewDay(lastRefreshDate)
    if (!newDay) return

    dataStore.data.config.lastRefreshDate = newDay
    console.log('[Notification] New day detected - refreshing notifications...')
    await setAllNotifications()
  }
  

  // On app launch: check and request permissions, register actions, add action listeners, and, finally, schedule notifications
  onMounted(async () => {
    console.log('[Notification] Checking permission on app start...')
    await notificationPermission()
    await registerNotificationActions()
    await addActionListeners()
    await morningRefresh()

    App.addListener('appStateChange', async (state) => {
      if (state.isActive) await morningRefresh()
    })
  })


  //Watch for events-relevant notifications events changes
  const setupNotificationWatcher = () => {
    watch(
      () => dataStore.data.events.map(e => ({ ...e })), // shallow copy for diffing
      (newEvents, oldEvents) => {

        // added events
        const addedEvents = newEvents.filter(n => !oldEvents.find(o => o.id_event === n.id_event))
        addedEvents.forEach(e => markEventDirty(e.id_event))

        // removed events
        const removedEvents = oldEvents.filter(o => !newEvents.find(n => n.id_event === o.id_event))
        removedEvents.forEach(e => markEventDirty(e.id_event))

        // changed events
        for (const ne of newEvents) {
          const oe = oldEvents?.find(e => e.id_event === ne.id_event)
          if (!oe) continue

          const changed = EVENT_FIELDS.some(key => ne[key] !== oe[key])  // check only notification-relevant properties
          if (changed) markEventDirty(ne.id_event)
        }
      },
      { deep: false }
    )

    // Watch for events-relevant notifications student changes
    watch(
      () => dataStore.data.students.map(s => ({ ...s })),
      (newStudents, oldStudents) => {
        for (const ns of newStudents) {
          const os = oldStudents?.find(s => s.id_student === ns.id_student)
          if (!os) continue

          const changed = STUDENT_FIELDS.some(key => ns[key] !== os[key])   // check only notification-relevant properties
          if (changed) dataStore.data.events.filter(e => e.id_student === ns.id_student).forEach(e => markEventDirty(e.id_event))
        }
      },
      { deep: false }
    )

    // Watch for birthday-relevant notifications student changes
    watch(
      () => dataStore.data.students.map(s => ({ ...s })),
      (newStudents, oldStudents) => {

        // added students
        const addedStudents = newStudents.filter(n => !oldStudents?.find(o => o.id_student === n.id_student))
        addedStudents.forEach(s => { if (s.dob) { markBirthdayDirty(s.id_student) }})

        // removed events
        const removedStudents = oldStudents.filter(o => !newStudents.find(n => n.id_student === o.id_student))
        removedStudents.forEach(s => markBirthdayDirty(s.id_student))

        // changed students
        for (const ns of newStudents) {
          const os = oldStudents?.find(s => s.id_student === ns.id_student)
          if (!os) continue

          const changed = BIRTHDAY_FIELDS.some(key => ns[key] !== os[key])
          if (changed) markBirthdayDirty(ns.id_student)
        }
      },
      { deep: false }
    )
  }

  watch(permissionGranted, (newVal, oldVal) => {
    if (!newVal) removeAllNotifications()         // permission removed
    if (newVal && !oldVal) setAllNotifications()  // permission has just been granted
  })

  return { setupNotificationWatcher }
})