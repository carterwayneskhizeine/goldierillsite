import './style.css'
import { createPageOne } from './pages/PageOne.js'
import { createPageTwo } from './pages/PageTwo.js'
import { createPageThree } from './pages/PageThree.js'
import { createPageFour } from './pages/PageFour.js'
import { createPageFive } from './pages/PageFive.js'
import { createPageSix } from './pages/PageSix.js'
import { createPageSeven } from './pages/PageSeven.js'
import { createPageEight } from './pages/PageEight.js'
import { createPageNine } from './pages/PageNine.js'
import { createPageTen } from './pages/PageTen.js'

// Initialize app
const app = document.querySelector('#app')

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
  createPageNine(),
  createPageTen()
]

// Append all pages to container
pages.forEach(page => container.appendChild(page))
app.appendChild(container)

// Full page scroll logic
let currentPage = 0
let isScrolling = false

function scrollToPage(index) {
  if (index < 0 || index >= pages.length || isScrolling) return

  isScrolling = true
  currentPage = index

  container.style.transform = `translateY(-${currentPage * 100}vh)`

  setTimeout(() => {
    isScrolling = false
  }, 800)
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
