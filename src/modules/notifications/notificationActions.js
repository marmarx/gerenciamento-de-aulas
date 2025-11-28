import router from '@/router'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Browser } from '@capacitor/browser'
import { showToast } from '@/composables/showToast'
import { useDataStore } from '@/stores/dataStore'

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
  console.log('[Notification] Notification actions registered')
}

// Add listeners for notification actions
const addActionListeners = async () => {
  if (Capacitor.getPlatform() === 'web') return // No actions on web platform

  LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
    const { actionId, notification: notif } = notification
    console.log('[Notification] Action triggered:', actionId, notif)

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
  console.log('[Notification] Notification listeners attached.')
}

export { registerNotificationActions, addActionListeners }