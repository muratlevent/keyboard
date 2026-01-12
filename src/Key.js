import * as THREE from 'three'
import { KEY_UNIT, KEY_GAP, COLORS } from './KeyboardLayout.js'
import { getKeycapLabel, getCurrentLayout, getLightingSettings } from './SettingsManager.js'

export class Key {
  constructor(keyData) {
    this.code = keyData.code
    this.label = keyData.label
    this.width = keyData.width
    this.x = keyData.x
    this.y = keyData.y
    this.colorName = keyData.color
    this.isPressed = false
    
    this.group = new THREE.Group()
    this.createKeycap()
    this.originalY = this.group.position.y
    this.hue = Math.random() // Random starting hue for rainbow effect
    this.hueSpeed = 0.5      // Hue cycle speed
  }

  createKeycap() {
    const keyWidth = this.width * KEY_UNIT - KEY_GAP
    const keyDepth = KEY_UNIT - KEY_GAP
    
    // mSA profile - taller keycaps with sculpted profile
    const baseHeight = 0.0115  // Total keycap height
    
    // Get base color
    const baseColor = COLORS[this.colorName] || COLORS.modKeys
    
    // mSA Taper offset - fixed reduction from base to top for consistent slopes
    const taperOffset = 0.0022  // 2.2mm reduction on each side
    
    // Create mSA keycap with proper tapered sides
    let keycapGeometry
    if (this.code === 'Space') {
        keycapGeometry = this.createConvexKeycapGeometry(
            keyWidth, keyDepth, baseHeight, taperOffset
        )
    } else {
        keycapGeometry = this.createTaperedBoxGeometry(
            keyWidth, keyDepth, baseHeight, taperOffset
        )
    }
    
    const keycapMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.85, // Matte finish, no more shine
      metalness: 0.0,
    })
    
    const keycap = new THREE.Mesh(keycapGeometry, keycapMaterial)
    keycap.position.y = baseHeight / 2
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.keycapMesh = keycap
    this.originalColor = new THREE.Color(baseColor) // Store original color for lighting effect
    this.group.add(keycap)
    
    // Add legend on top (calculating top surface dimensions based on taperOffset)
    const topWidth = Math.max(0.001, keyWidth - 2 * taperOffset)
    const topDepth = Math.max(0.001, keyDepth - 2 * taperOffset)
    const legendWidth = topWidth * 0.88
    const legendDepth = topDepth * 0.88
    this.legendDimensions = { width: legendWidth, depth: legendDepth, height: baseHeight }
    
    if (this.label) {
      this.createLegend(
        legendWidth, 
        legendDepth, 
        baseHeight, 
        baseColor
      )
    }
    
    // Add underglow light (always on rainbow)
    this.createUnderglow(keyWidth, keyDepth)
    
    // Position the key group
    const xPos = (this.x + this.width / 2) * KEY_UNIT
    const zPos = (this.y + 0.5) * KEY_UNIT
    this.group.position.set(xPos, 0, zPos)
    
    this.mesh = this.group
  }

  createTaperedBoxGeometry(width, depth, height, taperOffset) {
    // Create a box that tapers from bottom (full size) to top (smaller)
    // This creates the characteristic mSA profile with consistent slope angles
    
    const hw = width / 2   // Half width at bottom
    const hd = depth / 2   // Half depth at bottom
    const thw = Math.max(0.001, hw - taperOffset)  // Fixed offset for consistent slope
    const thd = Math.max(0.001, hd - taperOffset)  // Fixed offset for consistent slope
    const hh = height / 2
    
    // Define 8 vertices of tapered box
    // Bottom face (y = -hh), larger
    // Top face (y = +hh), smaller
    const vertices = new Float32Array([
      // Bottom face - 4 vertices
      -hw, -hh,  hd,   // 0: front-left bottom
       hw, -hh,  hd,   // 1: front-right bottom
       hw, -hh, -hd,   // 2: back-right bottom
      -hw, -hh, -hd,   // 3: back-left bottom
      
      // Top face - 4 vertices (tapered inward)
      -thw, hh,  thd,  // 4: front-left top
       thw, hh,  thd,  // 5: front-right top
       thw, hh, -thd,  // 6: back-right top
      -thw, hh, -thd,  // 7: back-left top
    ])
    
    // Define face indices (triangles)
    const indices = [
      // Bottom face
      0, 2, 1,
      0, 3, 2,
      
      // Top face
      4, 5, 6,
      4, 6, 7,
      
      // Front face
      0, 1, 5,
      0, 5, 4,
      
      // Back face
      2, 3, 7,
      2, 7, 6,
      
      // Left face
      3, 0, 4,
      3, 4, 7,
      
      // Right face
      1, 2, 6,
      1, 6, 5,
    ]
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    return geometry
  }

  createConvexKeycapGeometry(width, depth, height, taperOffset) {
      // Create a CONVEX (rounded top) profile for the spacebar
      // Use ExtrudeGeometry to extrude the profile along the width (X axis)

      const shape = new THREE.Shape()

      const hd = depth / 2
      const thd = Math.max(0.001, hd - taperOffset)  // Fixed offset for consistent slope

      // Side view profile (YZ plane, looking from side)
      // Starting from bottom-right (back-bottom in local coordinates) clockwise

      // 1. Bottom-Back
      shape.moveTo(hd, 0)
      
      // 2. Tapered Back Side
      shape.lineTo(thd, height)

      // 3. Convex Top (Curve from Back-Top to Front-Top)
      // Quadratic curve for a gentle rounded top
      // Control point is higher than height to create the bump
      const controlY = height + 0.002 // convex amount
      shape.quadraticCurveTo(0, controlY, -thd, height)

      // 4. Front Side
      shape.lineTo(-hd, 0)

      // 5. Close bottom
      shape.lineTo(hd, 0)

      const extrudeSettings = {
          steps: 1,
          depth: width, // Extrude along width
          bevelEnabled: true,
          bevelThickness: 0.0005,
          bevelSize: 0.0005,
          bevelSegments: 2
      }

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      
      // Center the geometry
      geometry.center()
      
      geometry.rotateY(Math.PI / 2) 
      
      return geometry
  }

  createLegend(width, depth, height, baseColor) {
    // Calculate proper aspect ratio for the legend
    const aspectRatio = width / depth
    
    // Create canvas with proper aspect ratio to avoid distortion
    const canvas = document.createElement('canvas')
    const baseSize = 512
    // Make canvas match key aspect ratio for proper text scaling
    if (aspectRatio >= 1) {
      canvas.width = Math.round(baseSize * aspectRatio)
      canvas.height = baseSize
    } else {
      canvas.width = baseSize
      canvas.height = Math.round(baseSize / aspectRatio)
    }
    const ctx = canvas.getContext('2d')
    
    // Clear canvas for transparency (no background color)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Determine text color based on keycap color
    const useDarkText = ['alphaKeys', 'modKeys', 'accentYellow'].includes(this.colorName)
    const textColor = useDarkText ? 'rgba(70, 70, 75, 0.95)' : 'rgba(255, 255, 255, 0.98)'
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Font size based on label length - relative to canvas height for proper scaling
    const baseHeight = canvas.height
    let fontSize = baseHeight * 0.4
    if (this.label.length === 1) fontSize = baseHeight * 0.45
    else if (this.label.length === 2) fontSize = baseHeight * 0.35
    else if (this.label.length <= 4) fontSize = baseHeight * 0.22
    else fontSize = baseHeight * 0.18
    
    // Use system font for clean look
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillText(this.label, canvas.width / 2, canvas.height / 2)
    
    // Create texture with proper settings for seamless appearance
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    
    // Create top face plane with matching dimensions
    const topGeometry = new THREE.PlaneGeometry(width, depth)
    
    const topMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.02,
      transparent: true,     // Enable transparency
      opacity: 1.0,
      depthWrite: false,     // Don't write to depth buffer to avoid z-fighting issues with transparency
      polygonOffset: true,   // Use polygon offset to prevent z-fighting
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    
    const topFace = new THREE.Mesh(topGeometry, topMaterial)
    topFace.rotation.x = -Math.PI / 2
    // Place legend flush with keycap top for seamless integration
    topFace.position.y = height + 0.0001
    this.legendMesh = topFace
    this.legendCanvas = canvas
    this.legendBaseColor = baseColor
    this.group.add(topFace)
  }

  createUnderglow(width, depth) {
    // Create a larger glow plane that extends beyond keycap edges for smooth light bleed
    const glowGeometry = new THREE.PlaneGeometry(width * 1.15, depth * 1.15)
    
    // Use MeshBasicMaterial with soft glow
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35, // More visible for smoother effect
      side: THREE.DoubleSide,
    })
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.0005 // Slightly above the plate
    this.underglowMesh = glow
    this.group.add(glow)
  }

  updateLabel(newLabel) {
    if (!this.legendMesh || !this.legendDimensions) return
    
    this.label = newLabel
    
    // Calculate proper aspect ratio for the legend
    const { width, depth } = this.legendDimensions
    const aspectRatio = width / depth
    
    // Recreate the legend texture with proper aspect ratio
    const canvas = document.createElement('canvas')
    const baseSize = 512
    if (aspectRatio >= 1) {
      canvas.width = Math.round(baseSize * aspectRatio)
      canvas.height = baseSize
    } else {
      canvas.width = baseSize
      canvas.height = Math.round(baseSize / aspectRatio)
    }
    const ctx = canvas.getContext('2d')
    
    // Clear canvas for transparency (no background color)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Determine text color
    const useDarkText = ['alphaKeys', 'modKeys', 'accentYellow'].includes(this.colorName)
    const textColor = useDarkText ? 'rgba(70, 70, 75, 0.95)' : 'rgba(255, 255, 255, 0.98)'
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Font size based on label length - relative to canvas height
    const baseHeight = canvas.height
    let fontSize = baseHeight * 0.4
    if (newLabel.length === 1) fontSize = baseHeight * 0.45
    else if (newLabel.length === 2) fontSize = baseHeight * 0.35
    else if (newLabel.length <= 4) fontSize = baseHeight * 0.22
    else fontSize = baseHeight * 0.18
    
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillText(newLabel, canvas.width / 2, canvas.height / 2)
    
    // Update texture with proper filter settings
    const newTexture = new THREE.CanvasTexture(canvas)
    newTexture.colorSpace = THREE.SRGBColorSpace
    newTexture.minFilter = THREE.LinearFilter
    newTexture.magFilter = THREE.LinearFilter
    newTexture.generateMipmaps = false
    
    // Dispose old texture and apply new
    if (this.legendMesh.material.map) {
      this.legendMesh.material.map.dispose()
    }
    this.legendMesh.material.map = newTexture
    this.legendMesh.material.needsUpdate = true
  }

  press() {
    if (this.isPressed) return
    this.isPressed = true
    this.targetY = this.originalY - 0.003
    
    // Lighten key color
    if (this.keycapMesh && this.originalColor) {
      const hsl = {}
      this.originalColor.getHSL(hsl)
      const lightenedColor = new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.2))
      this.keycapMesh.material.color.copy(lightenedColor)
    }
    
    // Intensify underglow
    if (this.underglowMesh) {
      this.underglowMesh.material.opacity = 0.9
    }
  }

  release() {
    if (!this.isPressed) return
    this.isPressed = false
    this.targetY = this.originalY
    
    // Restore original color
    if (this.keycapMesh && this.originalColor) {
      this.keycapMesh.material.color.copy(this.originalColor)
    }
    
    // Dim underglow
    if (this.underglowMesh) {
      this.underglowMesh.material.opacity = 0.25
    }
  }

  update(deltaTime) {
    if (this.targetY !== undefined) {
      const speed = 30
      const diff = this.targetY - this.group.position.y
      
      if (Math.abs(diff) > 0.0001) {
        this.group.position.y += diff * speed * deltaTime
      } else {
        this.group.position.y = this.targetY
      }
    }

    // Update underglow based on lighting settings
    if (this.underglowMesh && deltaTime) {
      const settings = getLightingSettings()
      
      if (!settings.enabled) {
        // Lighting off
        this.underglowMesh.material.opacity = 0
        return
      }
      
      // Base opacity from brightness (0-100 -> 0.1-0.9)
      const baseOpacity = 0.1 + (settings.brightness / 100) * 0.8
      const pressOpacity = this.isPressed ? 0.95 : baseOpacity
      
      // Apply lighting effect
      switch (settings.effect) {
        case 'stable':
          // Solid color from picker
          this.underglowMesh.material.color.set(settings.color)
          this.underglowMesh.material.opacity = pressOpacity
          break
          
        case 'pulse':
          // Breathing effect with custom color
          this.pulseTime = (this.pulseTime || 0) + deltaTime
          const pulseRate = 1.5 // seconds per cycle
          const pulse = (Math.sin(this.pulseTime * Math.PI * 2 / pulseRate) + 1) / 2
          this.underglowMesh.material.color.set(settings.color)
          this.underglowMesh.material.opacity = (0.2 + pulse * 0.6) * (settings.brightness / 100)
          if (this.isPressed) this.underglowMesh.material.opacity = 0.95
          break
          
        case 'cycle':
          // Rainbow wave
          this.hue = (this.hue + this.hueSpeed * deltaTime) % 1
          const cycleColor = new THREE.Color().setHSL(this.hue, 0.9, 0.5)
          this.underglowMesh.material.color.copy(cycleColor)
          this.underglowMesh.material.opacity = pressOpacity
          break
          
        case 'reactive':
          // Lights only on when pressed, uses custom color
          this.underglowMesh.material.color.set(settings.color)
          // Fade out effect
          if (this.isPressed) {
            this.reactiveGlow = 1.0
          } else {
            this.reactiveGlow = (this.reactiveGlow || 0) * 0.92 // Decay
          }
          this.underglowMesh.material.opacity = this.reactiveGlow * (settings.brightness / 100) * 0.9
          break
          
        case 'gemini':
          // Smooth flowing wave animation (blue -> purple -> pink -> cyan)
          this.geminiTime = (this.geminiTime || 0) + deltaTime * 0.8
          
          // Position-based phase offset for wave effect
          const wavePhase = this.geminiTime + this.x * 0.5 + this.y * 0.3
          
          // Smooth hue transition through blue-purple-pink spectrum
          const geminiHue = 0.55 + Math.sin(wavePhase) * 0.15 // 0.4 to 0.7 (cyan to magenta)
          const geminiSat = 0.85 + Math.sin(wavePhase * 1.5) * 0.1
          const geminiLight = 0.5 + Math.sin(wavePhase * 2) * 0.1
          
          const geminiColor = new THREE.Color().setHSL(geminiHue, geminiSat, geminiLight)
          this.underglowMesh.material.color.copy(geminiColor)
          
          // Subtle intensity wave
          const waveOpacity = baseOpacity * (0.8 + Math.sin(wavePhase * 1.5) * 0.2)
          this.underglowMesh.material.opacity = this.isPressed ? 0.95 : waveOpacity
          break
          
        default:
          this.underglowMesh.material.opacity = pressOpacity
      }
    }
  }
}
