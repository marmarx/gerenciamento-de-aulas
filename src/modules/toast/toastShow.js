import { useToastStore } from '@/modules/toast/toastStore'

export const toastShow = (title, text, confirm, duration = 2500) => {
  const toast = useToastStore()
  return toast.createToast(title, text, confirm, duration)
}