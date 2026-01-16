import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { Keyboard } from './Keyboard.js'
import { clearKeyCaches } from './Key.js'
import { InputHandler } from './InputHandler.js'
import { 
  setLayout, 
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
    this.initGround()
    
    this.setupEventListeners()
    this.setupUI()
    
    // Apply initial room light intensity (70%)
    this.setRoomLightIntensity(70)
    
    // Defer keyboard creation until after environment is fully ready
    // This fixes the whitish first-load issue where materials render
    // before environment map is applied
    requestAnimationFrame(() => {
      this.initKeyboard()
      this.initPostProcessing()
      this.animate()
    })
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
    
    // Reduced ambient for more dramatic shadows
    const ambient = new THREE.AmbientLight(0xffffff, 0.25)
    this.scene.add(ambient)
    this.sceneLights.push({ light: ambient, baseIntensity: 0.25 })
    
    // Main key light (top-front-left) - warm, positioned to match reference
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.2)
    keyLight.position.set(-0.35, 0.8, 0.45)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048  // Optimized shadow resolution
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.1
    keyLight.shadow.camera.far = 3
    keyLight.shadow.camera.left = -0.5
    keyLight.shadow.camera.right = 0.5
    keyLight.shadow.camera.top = 0.5
    keyLight.shadow.camera.bottom = -0.5
    keyLight.shadow.bias = -0.0003
    keyLight.shadow.normalBias = 0.001  // Reduces shadow acne
    keyLight.shadow.radius = 3  // Crisp but not hard shadows
    this.scene.add(keyLight)
    this.sceneLights.push({ light: keyLight, baseIntensity: 1.2 })
    
    // Fill light (left side) - cool, with soft shadows
    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.4)
    fillLight.position.set(-0.5, 0.4, 0.3)
    fillLight.castShadow = true
    fillLight.shadow.mapSize.width = 1024  // Reduced for performance
    fillLight.shadow.mapSize.height = 1024
    fillLight.shadow.camera.near = 0.1
    fillLight.shadow.camera.far = 2
    fillLight.shadow.camera.left = -0.5
    fillLight.shadow.camera.right = 0.5
    fillLight.shadow.camera.top = 0.5
    fillLight.shadow.camera.bottom = -0.5
    fillLight.shadow.bias = -0.0003
    fillLight.shadow.radius = 6  // Very soft secondary shadows
    this.scene.add(fillLight)
    this.sceneLights.push({ light: fillLight, baseIntensity: 0.4 })
    
    // Secondary key light from right for realistic multi-directional shadows
    const secondaryLight = new THREE.DirectionalLight(0xfff0e8, 0.35)
    secondaryLight.position.set(0.5, 0.6, 0.3)
    secondaryLight.castShadow = true
    secondaryLight.shadow.mapSize.width = 1024  // Reduced for performance
    secondaryLight.shadow.mapSize.height = 1024
    secondaryLight.shadow.camera.near = 0.1
    secondaryLight.shadow.camera.far = 2
    secondaryLight.shadow.camera.left = -0.5
    secondaryLight.shadow.camera.right = 0.5
    secondaryLight.shadow.camera.top = 0.5
    secondaryLight.shadow.camera.bottom = -0.5
    secondaryLight.shadow.bias = -0.0003
    secondaryLight.shadow.radius = 5
    this.scene.add(secondaryLight)
    this.sceneLights.push({ light: secondaryLight, baseIntensity: 0.35 })
    
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
    // Create high-quality studio HDR-style environment for realistic reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    pmremGenerator.compileEquirectangularShader()
    
    // Higher resolution canvas for sharper reflections
    const gradientCanvas = document.createElement('canvas')
    gradientCanvas.width = 1024
    gradientCanvas.height = 512
    const ctx = gradientCanvas.getContext('2d')
    
    // Create studio backdrop gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#2a2a3e')
    gradient.addColorStop(0.3, '#1e1e2d')
    gradient.addColorStop(0.6, '#16161f')
    gradient.addColorStop(1, '#0a0a0f')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1024, 512)
    
    // Add studio light sources for reflections
    // Main softbox (top-left)
    const softboxGradient1 = ctx.createRadialGradient(200, 80, 0, 200, 80, 120)
    softboxGradient1.addColorStop(0, 'rgba(255, 252, 245, 0.25)')
    softboxGradient1.addColorStop(0.5, 'rgba(255, 250, 240, 0.08)')
    softboxGradient1.addColorStop(1, 'rgba(255, 248, 235, 0)')
    ctx.fillStyle = softboxGradient1
    ctx.fillRect(80, 20, 240, 140)
    
    // Secondary softbox (right side)
    const softboxGradient2 = ctx.createRadialGradient(820, 120, 0, 820, 120, 100)
    softboxGradient2.addColorStop(0, 'rgba(230, 240, 255, 0.15)')
    softboxGradient2.addColorStop(0.6, 'rgba(220, 235, 255, 0.05)')
    softboxGradient2.addColorStop(1, 'rgba(210, 230, 255, 0)')
    ctx.fillStyle = softboxGradient2
    ctx.fillRect(720, 40, 200, 180)
    
    // Rim light (back accent)
    const rimGradient = ctx.createRadialGradient(512, 400, 0, 512, 400, 200)
    rimGradient.addColorStop(0, 'rgba(255, 220, 200, 0.08)')
    rimGradient.addColorStop(1, 'rgba(255, 210, 180, 0)')
    ctx.fillStyle = rimGradient
    ctx.fillRect(312, 320, 400, 180)
    
    // Subtle horizontal light bands for smooth reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
    ctx.fillRect(0, 60, 1024, 30)
    ctx.fillRect(0, 150, 1024, 20)
    
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
      
      // Dispose case/plate geometries and materials
      const keyboardGroup = this.keyboard.getMesh()
      keyboardGroup.traverse((child) => {
        // Only dispose meshes that are not keycaps or legends (which are handled above)
        // We check if it's a mesh and not one of the key objects to avoid double disposal
        // and ensure we target the case, plate, etc.
        if (child.isMesh && !Array.from(this.keyboard.keys.values()).some(key => key.keycapMesh === child || key.legendMesh === child)) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                if (m.map) m.map.dispose()
                if (m.bumpMap) m.bumpMap.dispose() // Also dispose bump maps if present
                m.dispose()
              })
            } else {
              if (child.material.map) child.material.map.dispose()
              if (child.material.bumpMap) child.material.bumpMap.dispose() // Also dispose bump maps if present
              child.material.dispose()
            }
          }
        }
      })
    }
    
    // Destroy old input handler to remove event listeners
    if (this.inputHandler) {
      this.inputHandler.destroy()
    }
    
    // Clear cached materials and geometries before rebuild to prevent memory leaks
    clearKeyCaches()
    
    // Create new keyboard with new theme colors
    this.keyboard = new Keyboard()
    this.scene.add(this.keyboard.getMesh())
    
    // Re-attach input handler
    this.inputHandler = new InputHandler(this.keyboard)
  }

  initGround() {
    // Highly reflective desk surface for realistic keyboard reflections
    const groundGeometry = new THREE.PlaneGeometry(3, 3)
    const groundMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe8eaed,
      roughness: 0.15,           // Very smooth for clear reflections
      metalness: 0.0,
      clearcoat: 0.8,            // Strong clearcoat like polished desk
      clearcoatRoughness: 0.1,
      reflectivity: 0.5,
      envMapIntensity: 0.6,
      transparent: true,
      opacity: 0.95,
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
    
    // Resize post-processing
    if (this.composer) {
      this.composer.setSize(width, height)
    }
    if (this.ssaoPass) {
      this.ssaoPass.setSize(width, height)
    }
    if (this.bloomPass) {
      this.bloomPass.setSize(width, height)
    }
    if (this.smaaPass) {
      this.smaaPass.setSize(width, height)
    }
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

  initPostProcessing() {
    // Create effect composer for post-processing
    this.composer = new EffectComposer(this.renderer)
    
    // Render pass - renders the scene
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)
    
    // Extreme SSAO pass - deep ambient occlusion for highly realistic contact shadows
    this.ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight)
    this.ssaoPass.kernelRadius = 0.04        // Larger radius for deeper shadows
    this.ssaoPass.minDistance = 0.00002
    this.ssaoPass.maxDistance = 0.05
    this.ssaoPass.output = SSAOPass.OUTPUT.Default
    this.composer.addPass(this.ssaoPass)
    
    // Subtle bloom for realistic light glow on bright edges
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.15,   // Bloom strength - very subtle
      0.4,    // Radius
      0.9     // Threshold - only brightest areas
    )
    this.bloomPass = bloomPass
    this.composer.addPass(bloomPass)
    
    // SMAA for high-quality anti-aliasing
    const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight)
    this.smaaPass = smaaPass
    this.composer.addPass(smaaPass)
    
    // Custom vignette shader for photographic depth
    const vignetteShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'darkness': { value: 0.4 },
        'offset': { value: 1.2 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float darkness;
        uniform float offset;
        varying vec2 vUv;
        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
          float vignette = 1.0 - dot(uv, uv);
          vignette = clamp(pow(vignette, darkness), 0.0, 1.0);
          gl_FragColor = vec4(texel.rgb * (0.85 + 0.15 * vignette), texel.a);
        }
      `
    }
    const vignettePass = new ShaderPass(vignetteShader)
    this.composer.addPass(vignettePass)
    
    // Output pass - applies tone mapping and color space conversion
    const outputPass = new OutputPass()
    this.composer.addPass(outputPass)
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate())
    
    const deltaTime = this.clock.getDelta()
    
    // Update keyboard animations
    this.keyboard.update(deltaTime)
    
    // Update orbit controls
    this.controls.update()
    
    // Render with post-processing
    this.composer.render()
  }
}

// Start the app
new App()
