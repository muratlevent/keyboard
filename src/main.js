import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { Keyboard } from './Keyboard.js'
import { InputHandler } from './InputHandler.js'
import { 
  setLayout, 
  setLightingEnabled, 
  setLightingBrightness, 
  setLightingColor, 
  setLightingEffect,
  setDarkMode,
  setTheme
} from './SettingsManager.js'

class App {
  constructor() {
    this.canvas = document.getElementById('keyboard-canvas')
    this.clock = new THREE.Clock()
    
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initLights()
    this.initEnvironment()
    this.initControls()
    this.initKeyboard()
    this.initGround()
    
    this.setupEventListeners()
    this.setupUI()
    this.animate()
  }

  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f2f5)  // Light gray background
  }

  initCamera() {
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.01, 100)
    
    // Position camera for front-facing slightly elevated view (like reference)
    this.camera.position.set(0, 0.18, 0.45)
    this.camera.lookAt(0, 0.01, 0)
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
  }

  initLights() {
    // Store lights for dynamic intensity control
    this.sceneLights = []
    
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    this.scene.add(ambient)
    this.sceneLights.push({ light: ambient, baseIntensity: 0.35 })
    
    // Main key light (top-front-right) - warm
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.2)
    keyLight.position.set(0.4, 0.8, 0.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.1
    keyLight.shadow.camera.far = 3
    keyLight.shadow.camera.left = -0.5
    keyLight.shadow.camera.right = 0.5
    keyLight.shadow.camera.top = 0.5
    keyLight.shadow.camera.bottom = -0.5
    keyLight.shadow.bias = -0.0005
    keyLight.shadow.radius = 2
    this.scene.add(keyLight)
    this.sceneLights.push({ light: keyLight, baseIntensity: 1.2 })
    
    // Fill light (left side) - cool
    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.5)
    fillLight.position.set(-0.5, 0.4, 0.3)
    this.scene.add(fillLight)
    this.sceneLights.push({ light: fillLight, baseIntensity: 0.5 })
    
    // Rim light (back-right) - accent
    const rimLight = new THREE.DirectionalLight(0xffd4c4, 0.6)
    rimLight.position.set(0.3, 0.15, -0.4)
    this.scene.add(rimLight)
    this.sceneLights.push({ light: rimLight, baseIntensity: 0.6 })
    
    // Top light for key highlights
    const topLight = new THREE.DirectionalLight(0xffffff, 0.4)
    topLight.position.set(0, 1, 0)
    this.scene.add(topLight)
    this.sceneLights.push({ light: topLight, baseIntensity: 0.4 })
    
    // Subtle point light for case reflection
    const caseLight = new THREE.PointLight(0xffd4c4, 0.3, 1)
    caseLight.position.set(0, 0.1, 0.4)
    this.scene.add(caseLight)
    this.sceneLights.push({ light: caseLight, baseIntensity: 0.3 })
  }

  setRoomLightIntensity(percent) {
    // Scale all scene lights by the given percentage (0-100)
    const scale = percent / 100
    this.sceneLights.forEach(({ light, baseIntensity }) => {
      light.intensity = baseIntensity * scale
    })
  }

  initEnvironment() {
    // Create procedural environment for reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    pmremGenerator.compileEquirectangularShader()
    
    // Create a simple gradient environment
    const envScene = new THREE.Scene()
    
    // Create gradient background
    const gradientCanvas = document.createElement('canvas')
    gradientCanvas.width = 256
    gradientCanvas.height = 256
    const ctx = gradientCanvas.getContext('2d')
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f0f1a')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)
    
    // Add some subtle "studio light" spots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.beginPath()
    ctx.arc(200, 50, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(50, 100, 30, 0, Math.PI * 2)
    ctx.fill()
    
    const envTexture = new THREE.CanvasTexture(gradientCanvas)
    envTexture.mapping = THREE.EquirectangularReflectionMapping
    
    this.scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture
    
    pmremGenerator.dispose()
    envTexture.dispose()
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 0.25
    this.controls.maxDistance = 1.2
    this.controls.minPolarAngle = Math.PI * 0.15
    this.controls.maxPolarAngle = Math.PI * 0.55
    this.controls.target.set(0, 0.02, 0)
    this.controls.update()
  }

  initKeyboard() {
    this.keyboard = new Keyboard()
    this.scene.add(this.keyboard.getMesh())
    
    // Slight tilt was removed as wedge geometry already provides ergonomic angle
    
    // Input handling
    this.inputHandler = new InputHandler(this.keyboard)
  }

  rebuildKeyboard() {
    // Remove old keyboard
    if (this.keyboard) {
      this.scene.remove(this.keyboard.getMesh())
      // Dispose of old keyboard resources
      this.keyboard.keys.forEach(key => {
        if (key.keycapMesh) {
          key.keycapMesh.geometry.dispose()
          key.keycapMesh.material.dispose()
        }
        if (key.legendMesh) {
          key.legendMesh.geometry.dispose()
          key.legendMesh.material.dispose()
          if (key.legendMesh.material.map) key.legendMesh.material.map.dispose()
        }
      })
    }
    
    // Create new keyboard with new theme colors
    this.keyboard = new Keyboard()
    this.scene.add(this.keyboard.getMesh())
    
    // Re-attach input handler
    this.inputHandler = new InputHandler(this.keyboard)
  }

  initGround() {
    // Subtle reflective surface under keyboard
    const groundGeometry = new THREE.PlaneGeometry(3, 3)
    const groundMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf0f2f5,
      roughness: 0.3,
      metalness: 0.0,
      transparent: true,
      opacity: 0.8,
    })
    
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    this.groundMesh.rotation.x = -Math.PI / 2
    this.groundMesh.position.y = 0
    this.groundMesh.receiveShadow = true
    this.scene.add(this.groundMesh)
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize())
  }

  onResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  setupUI() {
    // Panel toggle functionality
    const panel = document.getElementById('settings-panel')
    const toggleBtn = document.getElementById('panel-toggle')
    
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed')
      })
    }
    
    // OS Layout selector
    const layoutSelector = document.getElementById('os-layout')
    if (layoutSelector) {
      layoutSelector.addEventListener('change', (e) => {
        setLayout(e.target.value)
        this.keyboard.updateKeyLabels()
      })
    }
    
    // Theme selector
    const themeSelector = document.getElementById('keyboard-theme')
    if (themeSelector) {
      themeSelector.addEventListener('change', (e) => {
        setTheme(e.target.value)
        this.rebuildKeyboard()
      })
    }
    
    // Lighting toggle
    const lightingToggle = document.getElementById('lighting-toggle')
    if (lightingToggle) {
      lightingToggle.addEventListener('change', (e) => {
        setLightingEnabled(e.target.checked)
      })
    }
    
    // Brightness slider
    const brightnessSlider = document.getElementById('lighting-brightness')
    const brightnessValue = document.getElementById('brightness-value')
    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        setLightingBrightness(value)
        if (brightnessValue) brightnessValue.textContent = `${value}%`
      })
    }
    
    // Color picker
    const colorPicker = document.getElementById('lighting-color')
    const colorHex = document.getElementById('color-hex')
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        const color = e.target.value
        setLightingColor(color)
        if (colorHex) colorHex.textContent = color.toUpperCase()
      })
    }
    
    // Effect selector
    const effectSelector = document.getElementById('lighting-effect')
    if (effectSelector) {
      effectSelector.addEventListener('change', (e) => {
        setLightingEffect(e.target.value)
      })
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle')
    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked
        setDarkMode(enabled)
        document.body.classList.toggle('dark-mode', enabled)
        // Update Three.js scene background
        this.scene.background = new THREE.Color(enabled ? 0x0d0d0f : 0xf0f2f5)
        // Update ground material
        if (this.groundMesh) {
          this.groundMesh.material.color.set(enabled ? 0x1a1a1e : 0xf0f2f5)
        }
      })
    }
    
    // Room light intensity slider
    const roomLightSlider = document.getElementById('room-light')
    const roomLightValue = document.getElementById('room-light-value')
    if (roomLightSlider) {
      roomLightSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.setRoomLightIntensity(value)
        if (roomLightValue) roomLightValue.textContent = `${value}%`
      })
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    
    const deltaTime = this.clock.getDelta()
    
    // Update keyboard animations
    this.keyboard.update(deltaTime)
    
    // Update orbit controls
    this.controls.update()
    
    // Render
    this.renderer.render(this.scene, this.camera)
  }
}

// Start the app
new App()
