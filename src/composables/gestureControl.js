import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router';

// Android back button action
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'      // npm install @capacitor/app
import { showToast } from '@/composables/showToast'

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
        await showToast(message)
      }
    }
  }

  if (Capacitor.getPlatform() === 'android') App.addListener('backButton', handleBack)
  
  onBeforeUnmount(() => App.removeAllListeners('backButton'))
}

//Route, swipe gesture and animation direction
const transitionName = ref('slide-left')

const setSwipeGesture = () => {
  if(swipeGestureSet) return
  swipeGestureSet = true

  const route = useRoute()
  const router = useRouter()

  const homeViews = ['/agenda','/alunos','/panorama']
  const routeLevels = {
    '/': 0, '/agenda': 0, '/alunos': 0, '/panorama': 0, '/config': 0,
    '/aluno': 1, '/aulas': 1, '/pagamentos': 1,
    '/extrato': 2, '/relatorio': 2,
    '/aluno/editar': 3, '/aula': 3, '/pagamento': 3
  }

  const currentIndex = ref(0) //agenda is the starting view
  const SWIPE_THRESHOLD = 70
  let touchStart = [0, 0]

  // swipe gesture
  const handleTouchStart = (event) => touchStart = [event.touches[0].clientX, event.touches[0].clientY]
  const handleTouchEnd = (event) => {
    //if (!route || !homeViews.some(v => route.path.includes(v))) return //break if current view isn't one of the home views
    if (!route || !homeViews.includes(route.path)) return

    const h_diff = touchStart[0] - event.changedTouches[0].clientX
    const v_diff = touchStart[1] - event.changedTouches[0].clientY

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
    if (isNavigating) return //safe guard - if the user swipes repeatedly before navigation finishes, also prevents watcher
    isNavigating = true
    await router.push(homeViews[idx])
    isNavigating = false
  })

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

  onBeforeUnmount(() => {
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchend',   handleTouchEnd)
  })
}

//window resize
const windowWidth = ref(window.innerWidth)
window.addEventListener('resize', () => windowWidth.value = window.innerWidth)
const isMob = computed(() => windowWidth.value < 993)

export { setBackGesture, setSwipeGesture, transitionName, isMob }