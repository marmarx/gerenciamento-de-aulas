import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { toastShow } from '@/modules/toast/toastShow'

// shared state
const transitionName = ref('slide-left')
const windowWidth = ref(window.innerWidth)
const isMob = computed(() => windowWidth.value < 993)

let handleTouchStart, handleTouchEnd, resizeHandler, backHandler = null
let backGestureSet, swipeGestureSet, resizeGestureSet = false
const isAndroid = Capacitor.getPlatform() === 'android'   // true or false


// back gesture -> go to previous page
const setBackGesture = () => {
  if(backGestureSet) return
  backGestureSet = true

  if (!isAndroid) return

  const router = useRouter()
  let lastPress = 0

  const handleBack = async () => {
    //({ canGoBack }) => {}  // `canGoBack` is provided by Capacitor, but we'll rely on Vue Router history
    if (router.options.history.state.back) router.back()
    else {
      const now = Date.now()
      if (now - lastPress < 2000) App.exitApp()
      else {
        lastPress = now
        await toastShow('Retorne novamente para sair do app.')
      }
    }
  }

  App.addListener('backButton', handleBack)
}


// swipe gesture -> change route and animation
const setSwipeGesture = () => {
  if(swipeGestureSet) return
  swipeGestureSet = true

  const route = useRoute()
  const router = useRouter()

  const homeViews = ['/agenda','/alunos','/panorama']
  const currentIndex = ref(0) // agenda is the starting view
  const SWIPE_THRESHOLD = 70
  let touchStart = [0, 0]

  const routeLevels = {
    '/': 0, '/agenda': 0, '/alunos': 0, '/panorama': 0, '/config': 0,
    '/aluno': 1, '/aulas': 1, '/pagamentos': 1,
    '/extrato': 2, '/relatorio': 2,
    '/aluno/editar': 3, '/aula': 3, '/pagamento': 3
  }

  handleTouchStart = (event) => touchStart = [event.touches[0].clientX, event.touches[0].clientY]
  handleTouchEnd = (event) => {
    if (!route || !homeViews.includes(route.path)) return // break if current view isn't one of the home views

    const h_diff = touchStart[0] - event.changedTouches[0].clientX
    const v_diff = touchStart[1] - event.changedTouches[0].clientY

    if (Math.abs(v_diff) > Math.abs(h_diff)) return // ignore if vertical swipe
    if (Math.abs(h_diff) < SWIPE_THRESHOLD) return  // ignore if horizontal swipe is too small

    const left = h_diff > 0

    transitionName.value = left ? 'slide-left' : 'slide-right'
    currentIndex.value = (currentIndex.value + (left ? 1 : -1) + homeViews.length) % homeViews.length //infinite wrap-around
  }

  let isNavigating = false
  watch(currentIndex, async (idx) => {
    if (isNavigating) return //safe guard - if the user swipes repeatedly before navigation finishes, also prevents watcher
    isNavigating = true
    await router.push(homeViews[idx])
    isNavigating = false
  })

  // watch path and path hierarchy to determine transition diretion
  watch(() => route.path, (newPath, oldPath) => {
    if (isNavigating) return
    const oldDepth = routeLevels[oldPath] ?? 0
    const newDepth = routeLevels[newPath] ?? 0
    const idx = homeViews.findIndex(v => newPath.includes(v))

    if (oldDepth === newDepth && idx !== -1) { // animation for main views: homeViews
      transitionName.value = currentIndex.value > idx ? 'slide-right' : 'slide-left'
      currentIndex.value = idx
    }
    else transitionName.value = newDepth > oldDepth ? 'slide-left' : 'slide-right' // animation based on route path depth (hierarchy)
  }, { immediate: true })

  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend',   handleTouchEnd,   { passive: true })
}


// resize gesture -> check if screen is mobile sized
const setResizeGesture = () => {
  if(resizeGestureSet) return
  resizeGestureSet = true

  resizeHandler = () => windowWidth.value = window.innerWidth
  window.addEventListener('resize', resizeHandler)
}


// cleanup -> remove gestures event listeners
const cleanupAll = () => {
  if (backHandler && isAndroid) App.removeAllListeners('backButton')
  if (handleTouchStart) window.removeEventListener('touchstart', handleTouchStart)
  if (handleTouchEnd)   window.removeEventListener('touchend', handleTouchEnd)
  if (resizeHandler)    window.removeEventListener('resize', resizeHandler)

  handleTouchStart, handleTouchEnd, resizeHandler, backHandler = null
  backGestureSet, swipeGestureSet, resizeGestureSet = false
}

// setup -> add gesture event listeners
const setupAll = () => { setBackGesture(); setSwipeGesture(); setResizeGesture() }


// public composable
const useGestures = () => {
  onMounted(() => setupAll())
  onUnmounted(() => cleanupAll())
}

export { useGestures, transitionName, isMob }