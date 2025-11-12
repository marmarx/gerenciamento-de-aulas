import { ref, watch, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router';

// Android back button action
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'      // npm install @capacitor/app
import { Toast } from '@capacitor/toast'  // npm install @capacitor/toast

let backGestureSet = false
let swipeGestureSet = false

const setBackGesture = () => {
  if(backGestureSet) return
  backGestureSet = true

  const router = useRouter()
  let lastPress = 0

  const handleBack = async () => {
    //({ canGoBack }) => {}  //  `canGoBack` is provided by Capacitor, but we'll rely on Vue Router history
    if (router.options.history.state.back) router.back()
    else {
      const now = Date.now()
      if (now - lastPress < 2000) App.exitApp()
      else {
        lastPress = now
        await Toast.show({ text: 'Press back again to exit' })
      }
    }
  }

  if (Capacitor.getPlatform() === 'android') App.addListener('backButton', handleBack)
  
  onUnmounted(() => App.removeAllListeners('backButton'))
}

//Swipe left or right actions
const transitionName = ref('slide-left')

const setSwipeGesture = () => {
  if(swipeGestureSet) return
  swipeGestureSet = true

  const route = useRoute()
  const router = useRouter()

  const homeViews = ['/agenda','/alunos','/panorama']
  const currentIndex = ref(0) //agenda is the starting view

  let touchStart = [0, 0]
  const SWIPE_THRESHOLD = 70

  const handleTouchStart = (event) => touchStart = [event.touches[0].clientX, event.touches[0].clientY]
  const handleTouchEnd = (event) => {
    if (!route || !homeViews.some(v => route.path.includes(v))) return //break if current view isn't one of the home views

    const h_diff = touchStart[0] - event.changedTouches[0].clientX
    const v_diff = touchStart[1] - event.changedTouches[0].clientY
    // const transitionName = ref('slide-left')

    if (Math.abs(v_diff) > Math.abs(h_diff)) return //ignore if vertical swipe

    if (h_diff > SWIPE_THRESHOLD) {
      currentIndex.value++
      transitionName.value = 'slide-left'
    }
    else if (h_diff < -SWIPE_THRESHOLD) {
      currentIndex.value--
      transitionName.value = 'slide-right'
    }

    currentIndex.value = (currentIndex.value + homeViews.length) % homeViews.length  //infinite wrap-around
  }

  let isNavigating = false
  watch(currentIndex, async (idx) => {
    if (isNavigating) return //safe guard - if the user swipes repeatedly before navigation finishes
    isNavigating = true
    await router.push(homeViews[idx])
    isNavigating = false
  })

  watch(() => route.path, (newPath) => {
    if (isNavigating) return
    const idx = homeViews.findIndex(v => newPath.includes(v))
    if (idx !== -1) {
      transitionName.value = currentIndex.value > idx ? 'slide-right' : 'slide-left'
      currentIndex.value = idx
    }
  }, { immediate: true })

  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend',   handleTouchEnd,   { passive: true })

  onUnmounted(() => {
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchend',   handleTouchEnd)
  })
}

//window resize
const windowWidth = ref(window.innerWidth)
window.addEventListener('resize', () => windowWidth.value = window.innerWidth)
const isMob = computed(() => windowWidth.value < 993)

export { setBackGesture, setSwipeGesture, transitionName, isMob }