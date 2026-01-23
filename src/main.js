import './style.css'
import { createPageOne } from './pages/PageOne.js'
import { createPageTwo } from './pages/PageTwo.js'
import { createIcpFooter } from './components/IcpFooter.js'
import { createPageThree } from './pages/PageThree.js'
import { createPageFour } from './pages/PageFour.js'
import { createPageFive } from './pages/PageFive.js'
import { createPageSix } from './pages/PageSix.js'
import { createPageSeven } from './pages/PageSeven.js'
import { createPageEight } from './pages/PageEight.js'
import { createPageNine } from './pages/PageNine.js'
import { isMobileDevice, MOBILE_SINGLE_PAGE_MODE } from './utils/deviceDetector.js'

// Initialize app
const app = document.querySelector('#app')

// Check if mobile device and single page mode is enabled
if (isMobileDevice() && MOBILE_SINGLE_PAGE_MODE) {
  // Mobile: Show only PageThree
  const pageThree = createPageThree()
  pageThree.style.height = '100vh'
  app.appendChild(pageThree)

  // Still add ICP footer
  const icpFooter = createIcpFooter()
  app.appendChild(icpFooter)
} else {
  // Desktop (or Mobile with full site): Show all pages with scrolling and lazy loading

  // Create container for all pages
  const container = document.createElement('div')
  container.className = 'pages-container'

  // Define page factories
  const pageFactories = [
    createPageOne,
    createPageTwo,
    createPageThree,
    createPageFour,
    createPageFive,
    createPageSix,
    createPageSeven,
    createPageEight,
    createPageNine
  ]

  // We need slots for: [Clone 9] + [1..9] + [Clone 1] = 11 slots
  const slots = []

  // Helper to create a slot wrapper
  function createSlot(factoryIndex) {
    const wrapper = document.createElement('div')
    wrapper.className = 'page-wrapper'
    wrapper.style.height = '100vh'
    wrapper.style.width = '100%'
    wrapper.style.position = 'relative'
    
    return {
      wrapper,
      instance: null,
      factory: pageFactories[factoryIndex]
    }
  }

  // 0. Clone of PageNine (index 8)
  slots.push(createSlot(8))

  // 1-9. Real pages (indices 0-8)
  for (let i = 0; i < pageFactories.length; i++) {
    slots.push(createSlot(i))
  }

  // 10. Clone of PageOne (index 0)
  slots.push(createSlot(0))

  // Append wrappers to container
  slots.forEach(slot => container.appendChild(slot.wrapper))
  app.appendChild(container)

  // Create and append ICP footer
  const icpFooter = createIcpFooter()
  app.appendChild(icpFooter)

  // Lazy Loading Logic
  function loadPage(slotIndex) {
    const slot = slots[slotIndex]
    if (!slot) return

    if (!slot.instance) {
      // Create instance
      slot.instance = slot.factory()
      slot.wrapper.appendChild(slot.instance)
      if (slot.instance.play) slot.instance.play()
    } else {
      // Ensure it's playing
      if (slot.instance.play) slot.instance.play()
    }
  }

  function unloadPage(slotIndex) {
    const slot = slots[slotIndex]
    if (!slot) return

    if (slot.instance) {
      // Cleanup instance
      if (slot.instance._cleanup) slot.instance._cleanup()
      // Remove from DOM
      if (slot.instance.parentNode) {
        slot.instance.parentNode.removeChild(slot.instance)
      }
      slot.instance = null
    }
  }

  // Ensure only the current page and its immediate neighbors are loaded
  function updateActivePages(currentIndex) {
    // Range of pages to keep active (current +/- 1)
    // This keeps maximum 3 WebGL contexts active, which is safe for mobile
    const range = 1 
    
    for (let i = 0; i < slots.length; i++) {
      if (Math.abs(i - currentIndex) <= range) {
        loadPage(i)
      } else {
        unloadPage(i)
      }
    }
  }

  // Initialize at the first real page (index 1)
  let currentPage = 1
  container.style.transform = `translateY(-${currentPage * 100}vh)`
  updateActivePages(currentPage)

  // Full page scroll logic
  let isScrolling = false

  function scrollToPage(index) {
    if (isScrolling) return

    const totalPages = slots.length

    // Normalize index
    if (index < 0) index = 0
    if (index >= totalPages) index = totalPages - 1

    // Pre-load the target page (and neighbors) before scrolling
    // This ensures the page we are scrolling to is ready
    updateActivePages(index)

    isScrolling = true
    currentPage = index

    container.style.transition = 'transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)'
    container.style.transform = `translateY(-${currentPage * 100}vh)`

    // Wait for transition to complete
    container.addEventListener('transitionend', function handler() {
      // Teleport logic for infinite scroll
      let newIndex = currentPage

      // If at Clone 9 (index 0), jump to Real 9 (index 9)
      if (currentPage === 0) {
        newIndex = pageFactories.length // 9
      }
      // If at Clone 1 (index 10), jump to Real 1 (index 1)
      else if (currentPage === slots.length - 1) {
        newIndex = 1
      }

      if (newIndex !== currentPage) {
        container.style.transition = 'none'
        currentPage = newIndex
        container.style.transform = `translateY(-${currentPage * 100}vh)`
        // Force reflow
        container.offsetHeight
        
        // Update active pages for the new position (in case we jumped far)
        updateActivePages(currentPage)
      }

      isScrolling = false
    }, { once: true })
  }

  // Mouse wheel scroll handler
  let scrollTimeout
  window.addEventListener('wheel', (e) => {
    e.preventDefault()

    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      if (e.deltaY > 0) {
        scrollToPage(currentPage + 1)
      } else {
        scrollToPage(currentPage - 1)
      }
    }, 50)
  }, { passive: false })

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      scrollToPage(currentPage + 1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      scrollToPage(currentPage - 1)
    }
  })

  // Touch support for mobile
  let touchStartY = 0
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY
  })

  window.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY - touchEndY

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        scrollToPage(currentPage + 1)
      } else {
        scrollToPage(currentPage - 1)
      }
    }
  })
}