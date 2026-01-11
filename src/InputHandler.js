import { getSoundManager } from './SoundManager.js'

export class InputHandler {
  constructor(keyboard) {
    this.keyboard = keyboard
    this.pressedKeys = new Set()
    this.soundManager = getSoundManager()
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e))
    window.addEventListener('keyup', (e) => this.onKeyUp(e))
    
    // Handle window blur - release all keys
    window.addEventListener('blur', () => this.releaseAllKeys())
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
    
    // Update key indicator
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
    
    // Display the key pressed
    const displayKey = key.length === 1 ? key.toUpperCase() : key
    indicator.textContent = `Key: ${displayKey}`
    indicator.classList.add('visible')
    
    // Hide after a delay
    clearTimeout(this.indicatorTimeout)
    this.indicatorTimeout = setTimeout(() => {
      indicator.classList.remove('visible')
    }, 800)
  }
}
