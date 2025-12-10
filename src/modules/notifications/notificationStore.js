import { defineStore } from 'pinia'
import { watch, onMounted } from 'vue'
import { App } from '@capacitor/app'
import { useDataStore } from '@/stores/dataStore'

import { EVENT_FIELDS, STUDENT_FIELDS, BIRTHDAY_FIELDS, CONFIG_FIELDS, eventNotification, birthdayNotification, isNewDay } from '@/modules/notifications/notificationHelper'
import { registerNotificationActions, unregisterNotificationActions, addActionListeners, removeActionListeners } from '@/modules/notifications/notificationActions'
import { permissionGranted, checkPermission, notificationPermission, scheduleNotifications, cancelNotificationById, removeAllNotifications } from '@/modules/notifications/notificationMain'
import { markEventDirty, markBirthdayDirty } from '@/modules/notifications/notificationDirty'

export const useNotificationStore = defineStore('notificationStore', () => {
  const dataStore = useDataStore()
  
  // create notifications for all events and birthdays
  const setAllNotifications = async () => {
    const check = await checkPermission()  // silent check
    if (!check) return

    const students = dataStore.sortedStudents
    const events = dataStore.sortedEvents
    const config = dataStore.sortedConfig

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
        const notification = birthdayNotification(student, config)
        if (notification) birthdays.push(notification)
      })
    }
    
    console.log(`[Notification] Scheduling notifications for ${evNotifications.length} event(s) and ${birthdays.length} birthdays(s)`)
    await scheduleNotifications([...evNotifications, ...birthdays])
  }

  // re-run setAllNotifications() in case today is a new day -> create notifications without watching for a events change
  const morningRefresh = async () => {
    const lastRefreshDate = dataStore.sortedConfig.lastRefreshDate

    const newDay = isNewDay(lastRefreshDate)
    if (!newDay) return

    dataStore.sortedConfig.lastRefreshDate = newDay
    console.log('[Notification] New day detected - refreshing notifications...')
    await setAllNotifications()
  }
  

  // Watch for event changes
  const setupNotificationWatcher = () => {
    watch(
      () => dataStore.sortedEvents.map(e => ({ ...e })), // shallow copy for diffing
      (newEvents, oldEvents) => {
        if (!permissionGranted.value) return

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

    // Watch for student changes affecting events
    watch(
      () => dataStore.sortedStudents.map(s => ({ ...s })),
      (newStudents, oldStudents) => {
        if (!permissionGranted.value) return

        for (const ns of newStudents) {
          const os = oldStudents?.find(s => s.id_student === ns.id_student)
          if (!os) continue

          const changed = STUDENT_FIELDS.some(key => ns[key] !== os[key])   // check only notification-relevant properties
          if (changed) dataStore.sortedEvents.filter(e => e.id_student === ns.id_student).forEach(e => markEventDirty(e.id_event))
        }
      },
      { deep: false }
    )

    // Watch for birthday changes
    watch(
      () => dataStore.sortedStudents.map(s => ({ ...s })),
      (newStudents, oldStudents) => {
        if (!permissionGranted.value) return

        // added students
        const addedStudents = newStudents.filter(n => !oldStudents?.find(o => o.id_student === n.id_student))
        addedStudents.forEach(s => { if (s.dob) { markBirthdayDirty(s.id_student) }})

        // removed students
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

    // Watch for config changes affecting birthdays
    watch(
      () => CONFIG_FIELDS.map(key => dataStore.sortedConfig[key]),
      async (newValues, oldValues) => {
        if (!permissionGranted.value) return

        const changed = newValues.some((v, i) => v !== oldValues[i])
        if (!changed) return

        const [notifyBirthday] = newValues
        if (!notifyBirthday) {
          dataStore.sortedStudents.forEach(s => { if (s.dob) cancelNotificationById(s.id_student) })
          return
        }

        dataStore.sortedStudents.forEach(s => { if (s.dob) markBirthdayDirty(s.id_student) })
      },
      { deep: false }
    )

  }

  // prevents re-registering watchers, also, there's no way to de-register watchers
  let watchersInitialized = false   

  // register actions, add action listeners, schedule notifications and run a morning refresh -> set up notifications
  const bootupNotifications = async () => {
    console.log('[Notification] Starting up notifications module')
    await registerNotificationActions()
    await addActionListeners()
    await morningRefresh()
  }

  // de-register actions, remove action listeners, remove all notifications (pending and delivered)
  const shutdownNotifications = async () => {
    console.log('[Notification] Shutting down notifications module')
    await removeAllNotifications()
    await removeActionListeners()
    await unregisterNotificationActions()
  }

  watch(permissionGranted, async (newVal) => {
    // permission granted
    if (newVal) {
      await bootupNotifications()

      if (watchersInitialized) return
      watchersInitialized = true
      setupNotificationWatcher()
    }

    // permission removed
    else await shutdownNotifications()                     
  })

  // On app launch: check and request permissions
  onMounted(async () => {
    await notificationPermission()  // Active request -> ask the user if they allow notifications

    App.addListener('appStateChange', async (state) => {
      if (!state.isActive) return

      const check = await checkPermission() // Silent check (no need to bother the user again) -> in case settings were changed in the device's settings

      if (check) await morningRefresh()
      else await shutdownNotifications()
    })
  })

})