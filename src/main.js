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
  // Desktop: Show all pages with scrolling

  // Create container for all pages
  const container = document.createElement('div')
  container.className = 'pages-container'

  // Create all pages
  const pages = [
    createPageOne(),
    createPageTwo(),
    createPageThree(),
    createPageFour(),
    createPageFive(),
    createPageSix(),
    createPageSeven(),
    createPageEight(),
    createPageNine()
  ]

  // Create new instances for seamless circular scrolling
  // (We can't use cloneNode because it doesn't copy WebGL context)
  const firstPageClone = createPageOne()   // New instance of first page
  const lastPageClone = createPageNine()   // New instance of last page

  // Build DOM: [lastPageClone] + [real pages] + [firstPageClone]
  container.appendChild(lastPageClone)     // Clone of last page at the beginning
  pages.forEach(page => container.appendChild(page))  // Real pages in the middle
  container.appendChild(firstPageClone)    // Clone of first page at the end

  app.appendChild(container)

  // Create and append ICP footer
  const icpFooter = createIcpFooter()
  app.appendChild(icpFooter)

  // Initialize at the first real page (index 1, after the clone)
  container.style.transform = 'translateY(-100vh)'

  // Optimization: Pause all pages initially, then play the current one
  const allPages = Array.from(container.children);
  allPages.forEach(p => p.pause && p.pause());
  if (allPages[1] && allPages[1].play) allPages[1].play();

  // Full page scroll logic
  // currentPage represents the actual position in the DOM (including clones)
  // 0 = lastPageClone, 1-9 = real pages, 10 = firstPageClone
  let currentPage = 1  // Start at the real first page
  let isScrolling = false

  function scrollToPage(index) {
    if (isScrolling) return

    // Calculate boundaries (1 page before real first, 1 page after real last)
    const totalPages = pages.length + 2  // 11 total (9 real + 2 clones)

    // Normalize index to stay within bounds
    if (index < 0) index = 0
    if (index >= totalPages) index = totalPages - 1

    // Optimization: Play the target page before scrolling
    const allPages = Array.from(container.children);
    if (allPages[index] && allPages[index].play) allPages[index].play();

    isScrolling = true
    currentPage = index

    container.style.transition = 'transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)'
    container.style.transform = `translateY(-${currentPage * 100}vh)`

    // Wait for transition to complete, then check if we need to jump to real page
    container.addEventListener('transitionend', function handler() {
      // If we're at the clone of the last page (index 0), jump to real last page (index 9)
      if (currentPage === 0) {
        container.style.transition = 'none'
        currentPage = pages.length  // Jump to real last page
        container.style.transform = `translateY(-${currentPage * 100}vh)`
        // Force reflow
        container.offsetHeight
      }
      // If we're at the clone of the first page (index 10), jump to real first page (index 1)
      else if (currentPage === pages.length + 1) {
        container.style.transition = 'none'
        currentPage = 1  // Jump to real first page
        container.style.transform = `translateY(-${currentPage * 100}vh)`
        // Force reflow
        container.offsetHeight
      }

      // Optimization: Pause all pages except the current one
      allPages.forEach((p, i) => {
        if (i === currentPage) {
             if (p.play) p.play();
        } else {
             if (p.pause) p.pause();
        }
      });

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
