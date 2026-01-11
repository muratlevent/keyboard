// Sound Manager for Mechanical Switch Sounds
// Supports 4 switch types: red, blue, brown, black
// Each switch type has 3 sound variations

export class SoundManager {
  constructor() {
    this.currentSwitch = 'blue'  // Default switch type
    this.sounds = {}
    this.isLoaded = false
    
    this.switchTypes = ['red', 'blue', 'brown', 'black']
    this.soundsPerSwitch = 3
    
    this.loadSounds()
    this.setupSelector()
  }
  
  loadSounds() {
    this.switchTypes.forEach(switchType => {
      this.sounds[switchType] = []
      
      for (let i = 1; i <= this.soundsPerSwitch; i++) {
        const audio = new Audio(`/sounds/${switchType}-${i}.mp3`)
        audio.preload = 'auto'
        audio.volume = 0.6
        this.sounds[switchType].push(audio)
      }
    })
    
    this.isLoaded = true
  }
  
  setupSelector() {
    const selector = document.getElementById('switch-type')
    if (selector) {
      selector.value = this.currentSwitch
      selector.addEventListener('change', (e) => {
        this.currentSwitch = e.target.value
      })
    }
  }
  
  playKeySound() {
    if (!this.isLoaded) return
    
    const sounds = this.sounds[this.currentSwitch]
    if (!sounds || sounds.length === 0) return
    
    // Pick a random sound from the selected switch type
    const randomIndex = Math.floor(Math.random() * sounds.length)
    const sound = sounds[randomIndex]
    
    // Clone the audio to allow overlapping sounds
    const soundClone = sound.cloneNode()
    soundClone.volume = 0.5 + Math.random() * 0.2  // Slight volume variation
    soundClone.playbackRate = 0.95 + Math.random() * 0.1  // Slight pitch variation
    
    soundClone.play().catch(() => {
      // Ignore autoplay errors - user interaction required
    })
  }
  
  setSwitch(switchType) {
    if (this.switchTypes.includes(switchType)) {
      this.currentSwitch = switchType
      const selector = document.getElementById('switch-type')
      if (selector) {
        selector.value = switchType
      }
    }
  }
  
  getCurrentSwitch() {
    return this.currentSwitch
  }
}

// Singleton instance
let soundManagerInstance = null

export function getSoundManager() {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager()
  }
  return soundManagerInstance
}
