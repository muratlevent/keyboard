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
    
    // Key dimensions and geometry parameters
    const keyWidth = (this.width * KEY_UNIT) - KEY_GAP
    const keyDepth = KEY_UNIT - KEY_GAP
    const baseHeight = 0.008
    const taperOffset = 0.0015
    this.keyWidth = keyWidth
    this.keyDepth = keyDepth
    this.baseHeight = baseHeight
    
    this.group = new THREE.Group()
    const baseColor = COLORS[this.colorName] || COLORS.alphaKeys
    
    // Create realistic keycap geometry with rounding and scoops
    const keycapGeometry = this.createRealisticKeycapGeometry(
        keyWidth, keyDepth, baseHeight, taperOffset
    )
    
    const keycapMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.75, // Authentic plastic feel
      metalness: 0.05, // Slight highlight on curved edges
    })
    
    const keycap = new THREE.Mesh(keycapGeometry, keycapMaterial)
    keycap.position.y = 0 // Geometry is already centered/positioned in creator
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.keycapMesh = keycap
    this.originalColor = new THREE.Color(baseColor)
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
    
    // Lighting animation states
    this.pulseTime = 0
    this.hue = Math.random() // Random start hue for cycle
    this.hueSpeed = 0.1
    this.reactiveGlow = 0
    this.geminiTime = 0
    
    // Add underglow light
    this.createUnderglow(keyWidth, keyDepth)
    
    // Position the key group
    const xPos = (this.x + this.width / 2) * KEY_UNIT
    const zPos = (this.y + 0.5) * KEY_UNIT
    this.group.position.set(xPos, 0, zPos)
    
    this.mesh = this.group
  }

  createRealisticKeycapGeometry(width, depth, height, taperOffset) {
    const segments = 16
    const geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments)
    const position = geometry.attributes.position
    const vector = new THREE.Vector3()

    const halfW = width / 2
    const halfD = depth / 2
    const halfH = height / 2

    // Parameters for realism
    const cornerRadius = 0.0012 // Radius for vertical corners
    const topEdgeRadius = 0.0008 // Radius for top horizontal edges
    const scoopDepth = 0.0006   // Depth of the cylindrical scoop
    const topSurfaceY = halfH

    for (let i = 0; i < position.count; i++) {
        vector.fromBufferAttribute(position, i)

        let x = vector.x
        let y = vector.y
        let z = vector.z

        // 1. Tapering: Squeeze vertices based on height
        // height goes from -halfH to halfH
        // t is 0 at bottom, 1 at top
        const t = (y + halfH) / height
        const currentTaper = t * taperOffset
        
        // Apply taper (ensure we don't invert the geometry)
        const taperScaleX = (halfW - currentTaper) / halfW
        const taperScaleZ = (halfD - currentTaper) / halfD
        
        x *= taperScaleX
        z *= taperScaleZ

        // 2. Rounded Corners (Vertical)
        // We apply a soft clamp/round effect to the corners
        const absX = Math.abs(x)
        const absZ = Math.abs(z)
        const currentW = halfW - currentTaper
        const currentD = halfD - currentTaper
        
        const innerW = currentW - cornerRadius
        const innerD = currentD - cornerRadius
        
        if (absX > innerW && absZ > innerD) {
            // Vertex is in a corner region - round it
            const dx = absX - innerW
            const dz = absZ - innerD
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist > cornerRadius) {
                const scale = cornerRadius / dist
                x = (innerW + dx * scale) * Math.sign(x)
                z = (innerD + dz * scale) * Math.sign(z)
            }
        }

        // 3. Top Edge Rounding & Scoop
        if (y > halfH - topEdgeRadius * 2) {
            // Soften the top side edges
            const dy = halfH - y
            if (absX > currentW - topEdgeRadius) {
                const dx = absX - (currentW - topEdgeRadius)
                const dist = Math.sqrt(dx * dx + (topEdgeRadius - dy) * (topEdgeRadius - dy))
                if (dist > topEdgeRadius && y > halfH - topEdgeRadius) {
                    const scale = topEdgeRadius / dist
                    // We don't want to bring Y down too much, just round it
                    // y = halfH - topEdgeRadius + (topEdgeRadius - dy) * scale
                }
            }
            
            // Apply Cylindrical Scoop for non-spacebar keys
            if (this.code !== 'Space' && y > halfH * 0.9) {
                // Cylindrical scoop along X axis (so curve is visible from front)
                // Scoop depth depends on distance from center X
                const normX = x / (currentW - cornerRadius)
                const scoopEffect = Math.max(0, 1 - normX * normX)
                // Only apply if near the top
                if (y > halfH * 0.95) {
                    y -= scoopEffect * scoopDepth
                }
            }
        }
        
        // Special case for Spacebar: Convex (already handled by logic, but let's refine here)
        if (this.code === 'Space' && y > 0) {
            const normZ = z / (currentD - cornerRadius)
            const convexEffect = Math.max(0, 1 - normZ * normZ)
            y += convexEffect * 0.0015 
        }

        position.setXYZ(i, x, y + halfH, z)
    }

    geometry.computeVertexNormals()
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
