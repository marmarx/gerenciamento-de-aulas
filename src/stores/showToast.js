import { Capacitor } from '@capacitor/core'
import { Toast } from '@capacitor/toast'  // npm install @capacitor/toast
import { useToastStore } from '@/stores/toastStore'

export const showToast = async (message) => {
  if (Capacitor.isNativePlatform()) return Toast.show({ text: message })  // Native Android or iOS

  // Web fallback using Vue component
  const toast = useToastStore()
  toast.show(message)
}