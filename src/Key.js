import * as THREE from 'three'
import { KEY_UNIT, KEY_GAP, getColors } from './KeyboardLayout.js'
import { getKeycapLabel, getCurrentLayout, getLightingSettings, getKeycapStyle } from './SettingsManager.js'

export class Key {
  constructor(keyData) {
    this.code = keyData.code
    this.label = keyData.label
    this.shiftLabel = keyData.shiftLabel || null  // Shift character for dual-legend keys
    this.subLabel = keyData.subLabel || null      // Text label under icon (e.g., 'command')
    this.width = keyData.width
    this.x = keyData.x
    this.y = keyData.y
    this.colorName = keyData.color
    this.isPressed = false
    
    // Key dimensions and geometry parameters
    const keyWidth = (this.width * KEY_UNIT) - KEY_GAP
    const keyDepth = KEY_UNIT - KEY_GAP
    const baseHeight = 0.008
    const taperOffset = 0.0018 // Slightly more taper for sculpted look
    this.keyWidth = keyWidth
    this.keyDepth = keyDepth
    this.baseHeight = baseHeight
    this.row = Math.floor(keyData.y) + 1 // Row for profile (1=top function row, 5=bottom spacebar row)
    
    this.group = new THREE.Group()
    // Get current theme colors dynamically
    const colors = getColors()
    const baseColor = colors[this.colorName] || colors.alphaKeys
    
    // Create realistic keycap geometry
    const style = getKeycapStyle()
    const keycapGeometry = this.createRealisticKeycapGeometry(
        keyWidth, keyDepth, baseHeight, taperOffset, this.row, style
    )
    
    // Use MeshPhysicalMaterial for plastic finish
    // Extremely realistic with enhanced reflections and plastic properties
    const isSharp = style === 'sharp'
    
    // Subtle per-key color variation for realism (no two keys exactly alike)
    const colorVariation = new THREE.Color(baseColor)
    const hsl = { h: 0, s: 0, l: 0 }
    colorVariation.getHSL(hsl)
    // Add tiny random variations to saturation and lightness
    const satVar = (Math.random() - 0.5) * 0.02   // ±1% saturation
    const lightVar = (Math.random() - 0.5) * 0.025 // ±1.25% lightness
    colorVariation.setHSL(
      hsl.h,
      Math.max(0, Math.min(1, hsl.s + satVar)),
      Math.max(0.1, Math.min(0.95, hsl.l + lightVar))
    )
    
    // Add subtle roughness variation per key for realistic manufacturing differences
    const roughnessVar = (Math.random() - 0.5) * 0.06  // ±3% roughness variation
    const baseRoughness = isSharp ? 0.55 : 0.48
    
    const keycapMaterial = new THREE.MeshPhysicalMaterial({
      color: colorVariation,
      roughness: Math.max(0.35, Math.min(0.75, baseRoughness + roughnessVar)),
      metalness: 0.0,
      clearcoat: isSharp ? 0.15 : 0.25,      // Enhanced clearcoat for plastic sheen
      clearcoatRoughness: 0.35,
      reflectivity: 0.35,                     // Stronger reflections
      ior: 1.49,                              // IOR for PBT plastic
      thickness: 0.003,
      transmission: 0.015,                    // Subtle translucency
      attenuationColor: colorVariation,
      attenuationDistance: 0.04,
      sheen: 0.08,                            // Subtle sheen for plastic fiber effect
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(0xffffff),
      envMapIntensity: 0.8,                   // Strong environment reflections
      specularIntensity: 0.6,                 // Enhanced specular highlights
      specularColor: new THREE.Color(0xffffff),
    })
    
    const keycap = new THREE.Mesh(keycapGeometry, keycapMaterial)
    keycap.position.y = 0 // Geometry is already centered/positioned in creator
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.keycapMesh = keycap
    this.originalColor = new THREE.Color(colorVariation)
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

  createRealisticKeycapGeometry(width, depth, height, taperOffset, row = 3, style = 'rounded') {
    const isSharp = style === 'sharp'
    const segments = isSharp ? 8 : 20 // Sharp style needs fewer segments for hard edges
    const geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments)
    const position = geometry.attributes.position
    const vector = new THREE.Vector3()

    const halfW = width / 2
    const halfD = depth / 2
    const halfH = height / 2

    // Parameters based on style
    const cornerRadius = isSharp ? 0.0004 : 0.0025
    const topEdgeRadius = isSharp ? 0.0006 : 0.0018
    const scoopDepth = isSharp ? 0.0012 : 0.0008 // Vintage keys often have deeper scoops
    
    // Row-based profile adjustment
    const rowHeightAdjust = {
      1: 0.0006,   
      2: 0.0003,   
      3: 0.0,      
      4: -0.0002,  
      5: -0.0004,  
    }
    const heightAdjust = rowHeightAdjust[row] || 0

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
            // Vertex is in a corner region
            const dx = absX - innerW
            const dz = absZ - innerD
            
            if (isSharp) {
                // 2.1 Sharp Corner Chamfer (The "Inverse Triangle" look)
                // Instead of a curve, we cut a flat facet (dx + dz > radius)
                const chamferRadius = cornerRadius * 1.5 // Slightly larger for visibility
                if (dx + dz > chamferRadius) {
                    const over = (dx + dz) - chamferRadius
                    // Push vertex back along the 45-degree angle
                    const push = over / 2
                    x = (absX - push) * Math.sign(x)
                    z = (absZ - push) * Math.sign(z)
                }
            } else {
                // 2.2 Rounded Corners (Original behavior)
                const dist = Math.sqrt(dx * dx + dz * dz)
                if (dist > cornerRadius) {
                    const scale = cornerRadius / dist
                    x = (innerW + dx * scale) * Math.sign(x)
                    z = (innerD + dz * scale) * Math.sign(z)
                }
            }
        }

        // 3. Top Edge Rounding & Scoop
        if (y > halfH - topEdgeRadius * 2) {
            const dy = halfH - y
            if (absX > currentW - topEdgeRadius) {
                const dx = absX - (currentW - topEdgeRadius)
                const dist = Math.sqrt(dx * dx + (topEdgeRadius - dy) * (topEdgeRadius - dy))
                if (dist > topEdgeRadius && y > halfH - topEdgeRadius && !isSharp) {
                    const scale = topEdgeRadius / dist
                    // Skip for sharp style to maintain crisp edges
                }
            }
            
            // Apply enhanced Cylindrical Scoop for non-spacebar keys
            if (this.code !== 'Space' && y > halfH * 0.85) {
                // Cylindrical scoop along X axis (so curve is visible from front)
                // Scoop depth depends on distance from center X
                const normX = x / (currentW - cornerRadius)
                const normZ = z / (currentD - cornerRadius)
                // Combine X and Z for spherical-ish dish
                const scoopEffect = Math.max(0, 1 - (normX * normX * 0.7 + normZ * normZ * 0.3))
                // Gradual falloff near edges
                if (y > halfH * 0.9) {
                    const yFactor = (y - halfH * 0.9) / (halfH * 0.1)
                    y -= scoopEffect * scoopDepth * yFactor
                }
            }
        }
        
        // Special case for Spacebar: Convex with enhanced curvature
        if (this.code === 'Space' && y > 0) {
            const normZ = z / (currentD - cornerRadius)
            const convexEffect = Math.max(0, 1 - normZ * normZ)
            y += convexEffect * 0.0020  // Slightly more pronounced convex
        }
        
        // Apply row-based height adjustment
        y += heightAdjust * (y + halfH) / height

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
    
    // =====================================
    // Draw legend text (dual-legend support)
    // =====================================
    
    // Determine text color based on keycap color
    const useDarkText = ['alphaKeys', 'modKeys', 'accentYellow'].includes(this.colorName)
    const textColor = useDarkText ? 'rgba(60, 60, 65, 0.92)' : 'rgba(255, 255, 255, 0.95)'
    
    ctx.fillStyle = textColor
    
    const canvasHeight = canvas.height
    const canvasWidth = canvas.width

    const isSharp = getKeycapStyle() === 'sharp'
    
    // Add subtle right/bottom edge highlights for sharp style
    if (isSharp) {
      ctx.save()
      // Draw a very subtle highlight on the right and bottom edges
      // This gives the impression of light catching the sharp interior edges
      ctx.lineWidth = canvasWidth * 0.015
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.beginPath()
      // Bottom edge
      ctx.moveTo(canvasWidth * 0.1, canvasHeight - ctx.lineWidth/2)
      ctx.lineTo(canvasWidth * 0.9, canvasHeight - ctx.lineWidth/2)
      // Right edge
      ctx.moveTo(canvasWidth - ctx.lineWidth/2, canvasHeight * 0.1)
      ctx.lineTo(canvasWidth - ctx.lineWidth/2, canvasHeight * 0.9)
      ctx.stroke()
      ctx.restore()
    }
    
    // Check if this is a dual-legend key (has shiftLabel)
    
    if (this.shiftLabel) {
      if (isSharp) {
        // Sharp/Vintage dual-legend: both top-aligned, shift on left
        const fontSize = canvasHeight * 0.22
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        const padding = canvasWidth * 0.08
        ctx.fillText(this.shiftLabel, padding, padding)
        ctx.fillText(this.label, padding, padding + fontSize * 1.3)
      } else {
        // Dual-legend layout: shift character on top, main character below
        const shiftFontSize = canvasHeight * 0.32
        ctx.font = `600 ${shiftFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(this.shiftLabel, canvasWidth / 2, canvasHeight * 0.30)
        
        const mainFontSize = canvasHeight * 0.38
        ctx.font = `600 ${mainFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.fillText(this.label, canvasWidth / 2, canvasHeight * 0.68)
      }
    } else if (this.subLabel) {
      // Special handling for Fn key (globe bottom-left, fn top-right)
      if (this.code === 'Fn') {
        const padding = canvasWidth * 0.12
        
        // "fn" text at top-right (smaller)
        ctx.textAlign = 'right'
        ctx.textBaseline = 'top'
        const fnFontSize = canvasHeight * 0.28
        ctx.font = `600 ${fnFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.fillText(this.subLabel, canvasWidth - padding, padding)
        
        // Globe icon at bottom-left (larger)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        const globeFontSize = canvasHeight * 0.35
        ctx.font = `400 ${globeFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.fillText(this.label, padding, canvasHeight - padding)
      } else {
        // Icon + text label (like Apple modifier keys: ⌘ command)
        // Left-side modifier keys (x < 4.25) align right, right-side (x >= 10.75) align left
        const isLeftSide = this.x < 4.25
        const isRightSide = this.x >= 10.75
        
        let textAlign = 'center'
        let xPos = canvasWidth / 2
        const padding = canvasWidth * 0.12
        
        if (isLeftSide) {
          textAlign = 'right'
          xPos = canvasWidth - padding
        } else if (isRightSide) {
          textAlign = 'left'
          xPos = padding
        }
        
        ctx.textAlign = textAlign
        ctx.textBaseline = 'middle'
        
        // Icon on top (larger)
        const iconFontSize = canvasHeight * 0.38
        ctx.font = `600 ${iconFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.fillText(this.label, xPos, canvasHeight * 0.35)
        
        // Text label below (smaller)
        const textFontSize = canvasHeight * 0.21
        ctx.font = `600 ${textFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.fillText(this.subLabel, xPos, canvasHeight * 0.72)
      }
    } else {
      if (isSharp) {
        // Sharp/Vintage single legend: Top-left, smaller font
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        const padding = canvasWidth * 0.08
        const fontSize = this.label.length === 1 ? canvasHeight * 0.35 : canvasHeight * 0.22
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.fillText(this.label, padding, padding)
      } else {
        // Single legend - centered
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        let fontSize = canvasHeight * 0.4
        let fontWeight = '600'
        
        if (this.label.length === 1) {
          fontSize = canvasHeight * 0.55
        } else if (this.label.length === 2) {
          fontSize = canvasHeight * 0.4
        } else if (this.label.length <= 4) {
          fontSize = canvasHeight * 0.28
        } else {
          fontSize = canvasHeight * 0.22
        }
        
        ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.fillText(this.label, canvasWidth / 2, canvasHeight / 2)
      }
    }
    
    // Create texture with proper settings for seamless appearance
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    
    // Create top face plane with matching dimensions
    const topGeometry = new THREE.PlaneGeometry(width, depth)
    
    // Use MeshPhysicalMaterial for consistency with satin keycap finish
    const topMaterial = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.45,         // Match keycap roughness for satin finish
      metalness: 0.0,
      clearcoat: 0.15,         // Subtle clearcoat to match keycap
      clearcoatRoughness: 0.4,
      transparent: true,       // Enable transparency
      opacity: 1.0,
      depthWrite: false,       // Don't write to depth buffer to avoid z-fighting issues with transparency
      polygonOffset: true,     // Use polygon offset to prevent z-fighting
      polygonOffsetFactor: -4, // Stronger offset to ensure legend sits flush
      polygonOffsetUnits: -4,  // Stronger units offset
    })
    
    const topFace = new THREE.Mesh(topGeometry, topMaterial)
    topFace.rotation.x = -Math.PI / 2
    // Place legend exactly on keycap surface - account for scoop depth
    // Use very small offset (0.00005) to sit flush against surface
    topFace.position.y = height - 0.00005
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
    
    // NOTE: Removed sculpting gradients and edge highlights
    // These were causing a visible rectangle overlay on the keycap
    
    // =====================================
    // Draw legend text
    const isSharp = getKeycapStyle() === 'sharp'
    
    // Determine text color
    const useDarkText = ['alphaKeys', 'modKeys', 'accentYellow'].includes(this.colorName)
    const textColor = useDarkText ? 'rgba(60, 60, 65, 0.92)' : 'rgba(255, 255, 255, 0.95)'
    
    ctx.fillStyle = textColor
    const canvasHeight = canvas.height
    const canvasWidth = canvas.width
    
    if (isSharp) {
      // Vitange/Sharp style: Top-left
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const padding = canvasWidth * 0.08
      const fontSize = newLabel.length === 1 ? canvasHeight * 0.35 : canvasHeight * 0.22
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.fillText(newLabel, padding, padding)
    } else {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      let fontSize = canvasHeight * 0.4
      if (newLabel.length === 1) fontSize = canvasHeight * 0.45
      else if (newLabel.length === 2) fontSize = canvasHeight * 0.35
      else if (newLabel.length <= 4) fontSize = canvasHeight * 0.22
      else fontSize = canvasHeight * 0.18
      
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.fillText(newLabel, canvasWidth / 2, canvasHeight / 2)
    }
    
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
