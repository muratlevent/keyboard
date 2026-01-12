import { getSoundManager } from './SoundManager.js'
import { getKeyLabel } from './SettingsManager.js'

export class InputHandler {
  constructor(keyboard) {
    this.keyboard = keyboard
    this.pressedKeys = new Set()
    this.soundManager = getSoundManager()
    
    // Store bound event handlers for cleanup
    this.boundKeyDown = (e) => this.onKeyDown(e)
    this.boundKeyUp = (e) => this.onKeyUp(e)
    this.boundBlur = () => this.releaseAllKeys()
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    window.addEventListener('keydown', this.boundKeyDown)
    window.addEventListener('keyup', this.boundKeyUp)
    
    // Handle window blur - release all keys
    window.addEventListener('blur', this.boundBlur)
  }

  destroy() {
    // Remove all event listeners to prevent memory leaks and duplicate handlers
    window.removeEventListener('keydown', this.boundKeyDown)
    window.removeEventListener('keyup', this.boundKeyUp)
    window.removeEventListener('blur', this.boundBlur)
    
    // Clear any pending timeouts
    if (this.indicatorTimeout) {
      clearTimeout(this.indicatorTimeout)
    }
  }

  onKeyDown(event) {
    // Prevent default for most keys to avoid browser shortcuts
    if (!event.metaKey && !event.ctrlKey) {
      event.preventDefault()
    }
    
    const code = event.code
    
    // Avoid key repeat
    if (this.pressedKeys.has(code)) return
    
    this.pressedKeys.add(code)
    this.keyboard.pressKey(code)
    
    // Play switch sound
    this.soundManager.playKeySound()
    
    // Update key indicator with OS-specific label
    this.showKeyIndicator(event.key, code)
  }

  onKeyUp(event) {
    const code = event.code
    
    this.pressedKeys.delete(code)
    this.keyboard.releaseKey(code)
  }

  releaseAllKeys() {
    this.pressedKeys.forEach(code => {
      this.keyboard.releaseKey(code)
    })
    this.pressedKeys.clear()
  }

  showKeyIndicator(key, code) {
    let indicator = document.querySelector('.key-indicator')
    
    if (!indicator) {
      indicator = document.createElement('div')
      indicator.className = 'key-indicator'
      document.body.appendChild(indicator)
    }
    
    // Display the key pressed using OS-specific label
    const displayKey = getKeyLabel(code, key)
    indicator.textContent = `Key: ${displayKey}`
    indicator.classList.add('visible')
    
    // Hide after a delay
    clearTimeout(this.indicatorTimeout)
    this.indicatorTimeout = setTimeout(() => {
      indicator.classList.remove('visible')
    }, 800)
  }
}

