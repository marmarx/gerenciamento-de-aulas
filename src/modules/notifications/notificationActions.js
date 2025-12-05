import router from '@/router'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Browser } from '@capacitor/browser'
import { toastShow } from '@/modules/toast/toastShow'
import { useDataStore } from '@/stores/dataStore'


// ## NOTIFICATIONS ACTION BUTTONS ##
// Remove actions/buttons for notifications
const unregisterNotificationActions = async () => {
  if (Capacitor.getPlatform() === 'web') return
  await LocalNotifications.registerActionTypes({
    types: [{ id: 'event_actions', actions: [] }]
  })
}

// Register actions/buttons for notifictions
const registerNotificationActions = async () => {
  if (Capacitor.getPlatform() === 'web') return // No actions on web platform
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: 'event_actions_full',
        actions: [
          { id: 'student',  title: 'Aluno' },
          { id: 'maps',     title: 'Map' },
          { id: 'whatsapp', title: 'Whatsapp' }
        ]
      },
      {
        id: 'event_actions_no_maps',
        actions: [
          { id: 'student',  title: 'Aluno' },
          { id: 'whatsapp', title: 'Whatsapp' }
        ]
      },
      {
        id: 'birthday_actions',
        actions: [
          { id: 'call',      title: 'Ligar' },
          { id: 'whatsapp',  title: 'Whatsapp' }
        ]
      }
    ]
  })
  console.log('[Notification] Notification actions registered')
}


// ## NOTIFICATIONS ACTION LISTENERS ##
// Remove listeners for notification actions
const removeActionListeners = async () => {
  if (Capacitor.getPlatform() === 'web') return
  await LocalNotifications.removeAllListeners()
}

// Add listeners for notification actions
const addActionListeners = async () => {
  if (Capacitor.getPlatform() === 'web') return // No actions on web platform

  await LocalNotifications.removeAllListeners()

  LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
    const { actionId, notification: notif } = notification
    console.log('[Notification] Action triggered:', actionId, notif)

    const toastRoute = (msg) => { router.push('/'); toastShow(msg) }

    switch (actionId) {

      case 'tap':
        if(notif.extra?.eventId){
          useDataStore().selectedEvent = notif.extra.eventId
          router.push('/aula')  //'/aula/editar'
        } else if(notif.extra?.studentId) {
          useDataStore().selectedStudent = notif.extra.studentId
          router.push('/aluno')
        } else toastRoute('Não encontrado')
        break

      case 'student':
        if(notif.extra?.studentId){
          useDataStore().selectedStudent = notif.extra.studentId
          router.push('/aluno')
        } else toastRoute('Aluno não encontrado')
        break

      case 'maps':
        if(notif.extra?.maps) await Browser.open({ url: notif.extra.maps })
        else toastRoute('Não há endereço cadastrado')
        break

      case 'whatsapp':
        if(notif.extra?.whatsapp) await Browser.open({ url: notif.extra.whatsapp })
        else toastRoute('Sem contato disponível')
        break

      case 'call':
        if (notif.extra?.phone) await Browser.open({ url: `tel:${notif.extra.phone}` })
        else toastRoute('Sem telefone cadastrado')
        break
        
    }
  })
  console.log('[Notification] Notification listeners attached.')
}

export { registerNotificationActions, unregisterNotificationActions, addActionListeners, removeActionListeners }