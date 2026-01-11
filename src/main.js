import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { Keyboard } from './Keyboard.js'
import { InputHandler } from './InputHandler.js'

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
    this.animate()
  }

  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0d0d0d)
  }

  initCamera() {
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.01, 100)
    
    // Position camera for an appealing product shot angle
    this.camera.position.set(0.15, 0.35, 0.55)
    this.camera.lookAt(0, 0.02, 0)
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
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    this.scene.add(ambient)
    
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
    
    // Fill light (left side) - cool
    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.5)
    fillLight.position.set(-0.5, 0.4, 0.3)
    this.scene.add(fillLight)
    
    // Rim light (back-right) - accent
    const rimLight = new THREE.DirectionalLight(0xffd4c4, 0.6)
    rimLight.position.set(0.3, 0.15, -0.4)
    this.scene.add(rimLight)
    
    // Top light for key highlights
    const topLight = new THREE.DirectionalLight(0xffffff, 0.4)
    topLight.position.set(0, 1, 0)
    this.scene.add(topLight)
    
    // Subtle point light for case reflection
    const caseLight = new THREE.PointLight(0xffd4c4, 0.3, 1)
    caseLight.position.set(0, 0.1, 0.4)
    this.scene.add(caseLight)
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
    
    // Slight tilt for natural typing angle
    this.keyboard.group.rotation.x = -0.03
    
    // Input handling
    this.inputHandler = new InputHandler(this.keyboard)
  }

  initGround() {
    // Subtle reflective surface under keyboard
    const groundGeometry = new THREE.PlaneGeometry(3, 3)
    const groundMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0a,
      roughness: 0.15,
      metalness: 0.0,
      transparent: true,
      opacity: 0.7,
    })
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.001
    ground.receiveShadow = true
    this.scene.add(ground)
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
