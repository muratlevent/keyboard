import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { Keyboard } from "./Keyboard.js";
import { clearKeyCaches } from "./Key.js";
import { InputHandler } from "./InputHandler.js";
import { setLayout, setDarkMode, setTheme } from "./SettingsManager.js";

class App {
  constructor() {
    this.canvas = document.getElementById("keyboard-canvas");
    this.clock = new THREE.Clock();
    this.loadingOverlay = document.getElementById("loading-overlay");
    this.isReady = false;
    
    // FPS tracking
    this.fpsFrames = 0;
    this.fpsTime = 0;
    this.fpsDisplay = null;

    this.bootstrap();
  }

  getPixelRatio() {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: this.getPixelRatio(),
    };
  }

  setLoading(isLoading) {
    if (!this.loadingOverlay) return;
    this.loadingOverlay.classList.toggle("hidden", !isLoading);
    this.loadingOverlay.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  async bootstrap() {
    this.setLoading(true);

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initEnvironment();
    this.initControls();
    this.initGround();

    this.setupEventListeners();
    this.setupUI();

    // Apply initial room light intensity (70%)
    this.setRoomLightIntensity(70);

    this.initKeyboard();
    this.initPostProcessing();
    this.applyViewport();

    await this.warmUpRenderer();

    this.setLoading(false);
    this.isReady = true;
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f2f5); // Light gray background
  }

  initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.01, 100);

    // Position camera at ~30 degrees from vertical (more 3D depth)
    // At 30 degrees: y = cos(30°) * distance, z = sin(30°) * distance
    const distance = 0.55;
    const angle = 30 * (Math.PI / 180); // 30 degrees in radians
    this.camera.position.set(0, distance * Math.cos(angle), distance * Math.sin(angle));
    this.camera.lookAt(0, 0.01, 0);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    const { width, height, pixelRatio } = this.getViewport();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    // Disable shadow maps for performance - using fake shadows instead
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  initLights() {
    // Store lights for dynamic intensity control
    this.sceneLights = [];

    // Increased ambient for bright, even lighting (no real shadows)
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    this.sceneLights.push({ light: ambient, baseIntensity: 0.5 });

    // Main key light (top) - warm, no shadows for performance
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
    keyLight.position.set(0, 1, 0.2);
    this.scene.add(keyLight);
    this.sceneLights.push({ light: keyLight, baseIntensity: 1.0 });

    // Fill light (front-left) - cool
    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.4);
    fillLight.position.set(-0.5, 0.5, 0.5);
    this.scene.add(fillLight);
    this.sceneLights.push({ light: fillLight, baseIntensity: 0.4 });

    // Fill light from right for balanced lighting
    const secondaryLight = new THREE.DirectionalLight(0xfff0e8, 0.35);
    secondaryLight.position.set(0.5, 0.5, 0.3);
    this.scene.add(secondaryLight);
    this.sceneLights.push({ light: secondaryLight, baseIntensity: 0.35 });

    // Top light for key highlights
    const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topLight.position.set(0, 1, 0);
    this.scene.add(topLight);
    this.sceneLights.push({ light: topLight, baseIntensity: 0.5 });
  }

  setRoomLightIntensity(percent) {
    // Scale all scene lights by the given percentage (0-100)
    const scale = percent / 100;
    this.sceneLights.forEach(({ light, baseIntensity }) => {
      light.intensity = baseIntensity * scale;
    });
  }

  initEnvironment() {
    // Create high-quality studio HDR-style environment for realistic reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    // Higher resolution canvas for sharper reflections
    const gradientCanvas = document.createElement("canvas");
    gradientCanvas.width = 1024;
    gradientCanvas.height = 512;
    const ctx = gradientCanvas.getContext("2d");

    // Create studio backdrop gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#2a2a3e");
    gradient.addColorStop(0.3, "#1e1e2d");
    gradient.addColorStop(0.6, "#16161f");
    gradient.addColorStop(1, "#0a0a0f");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    // Add studio light sources for reflections
    // Main softbox (top-left)
    const softboxGradient1 = ctx.createRadialGradient(200, 80, 0, 200, 80, 120);
    softboxGradient1.addColorStop(0, "rgba(255, 252, 245, 0.25)");
    softboxGradient1.addColorStop(0.5, "rgba(255, 250, 240, 0.08)");
    softboxGradient1.addColorStop(1, "rgba(255, 248, 235, 0)");
    ctx.fillStyle = softboxGradient1;
    ctx.fillRect(80, 20, 240, 140);

    // Secondary softbox (right side)
    const softboxGradient2 = ctx.createRadialGradient(
      820,
      120,
      0,
      820,
      120,
      100
    );
    softboxGradient2.addColorStop(0, "rgba(230, 240, 255, 0.15)");
    softboxGradient2.addColorStop(0.6, "rgba(220, 235, 255, 0.05)");
    softboxGradient2.addColorStop(1, "rgba(210, 230, 255, 0)");
    ctx.fillStyle = softboxGradient2;
    ctx.fillRect(720, 40, 200, 180);

    // Rim light (back accent)
    const rimGradient = ctx.createRadialGradient(512, 400, 0, 512, 400, 200);
    rimGradient.addColorStop(0, "rgba(255, 220, 200, 0.08)");
    rimGradient.addColorStop(1, "rgba(255, 210, 180, 0)");
    ctx.fillStyle = rimGradient;
    ctx.fillRect(312, 320, 400, 180);

    // Subtle horizontal light bands for smooth reflections
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(0, 60, 1024, 30);
    ctx.fillRect(0, 150, 1024, 20);

    const envTexture = new THREE.CanvasTexture(gradientCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;

    this.scene.environment =
      pmremGenerator.fromEquirectangular(envTexture).texture;

    pmremGenerator.dispose();
    envTexture.dispose();
  }

  initControls() {
    // OrbitControls with zoom-only mode - rotation/panning disabled for fixed view
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // Disable rotation and panning - keep fixed camera angle
    this.controls.enableRotate = false;
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    
    // Zoom limits (min = close, max = far)
    this.controls.minDistance = 0.2;
    this.controls.maxDistance = 1.0;
    
    // Smooth zooming - damping DISABLED to prevent continuous re-renders when idle
    // With damping enabled, controls.update() triggers render every frame even when not zooming
    this.controls.zoomSpeed = 1.0;
    this.controls.enableDamping = false;
  }

  initKeyboard() {
    this.keyboard = new Keyboard();
    this.scene.add(this.keyboard.getMesh());

    // Slight tilt was removed as wedge geometry already provides ergonomic angle

    // Input handling
    this.inputHandler = new InputHandler(this.keyboard);
  }

  rebuildKeyboard() {
    // Remove old keyboard
    if (this.keyboard) {
      this.scene.remove(this.keyboard.getMesh());
      // Dispose of old keyboard resources
      this.keyboard.keys.forEach((key) => {
        if (key.keycapMesh) {
          key.keycapMesh.geometry.dispose();
          key.keycapMesh.material.dispose();
        }
        if (key.legendMesh) {
          key.legendMesh.geometry.dispose();
          key.legendMesh.material.dispose();
          if (key.legendMesh.material.map)
            key.legendMesh.material.map.dispose();
        }
      });

      // Dispose case/plate geometries and materials
      const keyboardGroup = this.keyboard.getMesh();
      keyboardGroup.traverse((child) => {
        // Only dispose meshes that are not keycaps or legends (which are handled above)
        // We check if it's a mesh and not one of the key objects to avoid double disposal
        // and ensure we target the case, plate, etc.
        if (
          child.isMesh &&
          !Array.from(this.keyboard.keys.values()).some(
            (key) => key.keycapMesh === child || key.legendMesh === child
          )
        ) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => {
                if (m.map) m.map.dispose();
                if (m.bumpMap) m.bumpMap.dispose(); // Also dispose bump maps if present
                m.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              if (child.material.bumpMap) child.material.bumpMap.dispose(); // Also dispose bump maps if present
              child.material.dispose();
            }
          }
        }
      });
    }

    // Destroy old input handler to remove event listeners
    if (this.inputHandler) {
      this.inputHandler.destroy();
    }

    // Clear cached materials and geometries before rebuild to prevent memory leaks
    clearKeyCaches();

    // Create new keyboard with new theme colors
    this.keyboard = new Keyboard();
    this.scene.add(this.keyboard.getMesh());

    // Re-attach input handler
    this.inputHandler = new InputHandler(this.keyboard);
  }

  initGround() {
    // OPTIMIZED: MeshStandardMaterial for ground (removed clearcoat)
    const groundGeometry = new THREE.PlaneGeometry(3, 3);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8eaed,
      roughness: 0.2,
      metalness: 0.0,
      envMapIntensity: 0.5,
    });

    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    this.applyViewport();
  }

  applyViewport() {
    const { width, height, pixelRatio } = this.getViewport();

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(pixelRatio);
    }

    if (this.composer) {
      this.composer.setPixelRatio(pixelRatio);
      this.composer.setSize(width, height);
    }

    // Post-processing passes auto-resize with composer
  }

  setupUI() {
    // Panel toggle functionality
    const panel = document.getElementById("settings-panel");
    const toggleBtn = document.getElementById("panel-toggle");

    if (toggleBtn && panel) {
      toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("collapsed");
      });
    }

    // OS Layout selector
    const layoutSelector = document.getElementById("os-layout");
    if (layoutSelector) {
      layoutSelector.addEventListener("change", (e) => {
        setLayout(e.target.value);
        this.keyboard.updateKeyLabels();
      });
    }

    // Theme selector
    const themeSelector = document.getElementById("keyboard-theme");
    if (themeSelector) {
      themeSelector.addEventListener("change", (e) => {
        setTheme(e.target.value);
        this.rebuildKeyboard();
      });
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    if (darkModeToggle) {
      darkModeToggle.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        setDarkMode(enabled);
        document.body.classList.toggle("dark-mode", enabled);
        // Update Three.js scene background
        this.scene.background = new THREE.Color(enabled ? 0x0d0d0f : 0xf0f2f5);
        // Update ground material
        if (this.groundMesh) {
          this.groundMesh.material.color.set(enabled ? 0x1a1a1e : 0xf0f2f5);
        }
      });
    }

    // Room light intensity slider
    const roomLightSlider = document.getElementById("room-light");
    const roomLightValue = document.getElementById("room-light-value");
    if (roomLightSlider) {
      roomLightSlider.addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        this.setRoomLightIntensity(value);
        if (roomLightValue) roomLightValue.textContent = `${value}%`;
      });
    }
    
    // Create FPS counter display
    this.createFPSCounter();
  }
  
  createFPSCounter() {
    const fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps-counter';
    fpsDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      pointer-events: none;
    `;
    fpsDiv.textContent = 'FPS: --';
    document.body.appendChild(fpsDiv);
    this.fpsDisplay = fpsDiv;
  }

  initPostProcessing() {
    // Create effect composer for post-processing
    // OPTIMIZED: Removed Bloom and SMAA for 100+ FPS target
    // Native WebGL antialias is already enabled in renderer
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.getPixelRatio());

    // Render pass - renders the scene
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom and SMAA REMOVED for performance (+30-40 FPS gain)
    // Native antialias: true provides sufficient AA quality

    // Custom vignette shader for photographic depth (cheap - single texture sample)
    const vignetteShader = {
      uniforms: {
        tDiffuse: { value: null },
        darkness: { value: 0.4 },
        offset: { value: 1.2 },
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
      `,
    };
    const vignettePass = new ShaderPass(vignetteShader);
    this.composer.addPass(vignettePass);

    // Output pass - applies tone mapping and color space conversion
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    
    // Update FPS counter
    this.fpsFrames++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 0.5) { // Update every 0.5 seconds
      const fps = Math.round(this.fpsFrames / this.fpsTime);
      if (this.fpsDisplay) {
        this.fpsDisplay.textContent = `FPS: ${fps}`;
        // Color code: green > 55, yellow > 30, red <= 30
        this.fpsDisplay.style.color = fps > 55 ? '#00ff00' : fps > 30 ? '#ffff00' : '#ff4444';
      }
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }

    // Update keyboard animations
    this.keyboard.update(deltaTime);

    // Update controls for smooth zoom damping
    if (this.controls) {
      this.controls.update();
    }

    // Render with post-processing
    this.composer.render();
  }

  async warmUpRenderer() {
    try {
      if (this.renderer?.compileAsync) {
        await this.renderer.compileAsync(this.scene, this.camera);
      } else if (this.renderer?.compile) {
        this.renderer.compile(this.scene, this.camera);
      }
    } catch (error) {
      console.warn("Renderer warm-up failed, continuing:", error);
    }

    if (this.composer) {
      this.composer.render();
    } else if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Start the app
new App();
