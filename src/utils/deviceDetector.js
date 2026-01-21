/**
 * Detect if the current device is a mobile device
 * @returns {boolean} true if mobile device, false otherwise
 */
export function isMobileDevice() {
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera

  // Common mobile device patterns
  const mobilePatterns = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /IEMobile/i,
    /Opera Mini/i,
    /Mobile/i
  ]

  const isMobileUA = mobilePatterns.some(pattern => pattern.test(userAgent))

  // Check screen width as additional indicator
  const isMobileWidth = window.innerWidth <= 768

  // Check touch support
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Consider it mobile if it matches user agent OR has small screen with touch
  return isMobileUA || (isMobileWidth && hasTouchScreen)
}
