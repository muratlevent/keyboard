import * as THREE from 'three'
import { KEY_UNIT, KEY_GAP, COLORS } from './KeyboardLayout.js'

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
  }

  createKeycap() {
    const keyWidth = this.width * KEY_UNIT - KEY_GAP
    const keyDepth = KEY_UNIT - KEY_GAP
    
    // mSA profile - taller keycaps with sculpted profile
    const baseHeight = 0.0115  // Total keycap height
    
    // Get base color
    const baseColor = COLORS[this.colorName] || COLORS.modKeys
    
    // mSA Taper ratios - narrower at top, wider at bottom
    const topTaper = 0.78       // Top is 78% of bottom width - more pronounced taper
    
    // Create mSA keycap with proper tapered sides
    let keycapGeometry
    if (this.code === 'Space') {
        keycapGeometry = this.createConvexKeycapGeometry(
            keyWidth, keyDepth, baseHeight, topTaper
        )
    } else {
        keycapGeometry = this.createTaperedBoxGeometry(
            keyWidth, keyDepth, baseHeight, topTaper
        )
    }
    
    const keycapMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.52,
      metalness: 0.02,
    })
    
    const keycap = new THREE.Mesh(keycapGeometry, keycapMaterial)
    keycap.position.y = baseHeight / 2
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.keycapMesh = keycap
    this.group.add(keycap)
    
    // Add legend on top
    if (this.label) {
      this.createLegend(
        keyWidth * topTaper * 0.88, 
        keyDepth * topTaper * 0.88, 
        baseHeight, 
        baseColor
      )
    }
    
    // Position the key group
    const xPos = (this.x + this.width / 2) * KEY_UNIT
    const zPos = (this.y + 0.5) * KEY_UNIT
    this.group.position.set(xPos, 0, zPos)
    
    this.mesh = this.group
  }

  createTaperedBoxGeometry(width, depth, height, topTaper) {
    // Create a box that tapers from bottom (full size) to top (smaller)
    // This creates the characteristic mSA profile where sides angle inward
    
    const hw = width / 2   // Half width at bottom
    const hd = depth / 2   // Half depth at bottom
    const thw = hw * topTaper  // Half width at top
    const thd = hd * topTaper  // Half depth at top
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

  createConvexKeycapGeometry(width, depth, height, topTaper) {
      // Create a CONVEX (rounded top) profile for the spacebar
      // Use ExtrudeGeometry to extrude the profile along the width (X axis)

      const shape = new THREE.Shape()

      const hd = depth / 2
      const thd = (depth / 2) * topTaper // Top half depth

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
      // ExtrudeGeometry extrudes along Z by default. 
      // Our shape is in XY plane (actually we designed it as YZ profile in mind but drew in XY)
      // Let's re-orient:
      // We drew: X = depth axis, Y = height axis.
      // Extrusion depth = key width.
      
      // Rotate to align:
      // Currently: Shape X is Depth, Shape Y is Height. Extrusion Z is Width.
      // Target: World X is Width, World Y is Height, World Z is Depth.
      
      geometry.center()
      
      // After center():
      // X axis is Depth-ish
      // Y axis is Height
      // Z axis is Width-ish
      
      // We want:
      // X -> Width
      // Y -> Height
      // Z -> Depth 
      
      // So verify axes of created geometry:
      // Our shape was drawn in "XY" plane of Shape.
      //   Shape X: [-hd, hd] (Depth)
      //   Shape Y: [0, height] (Height)
      // Extrusion is along Z: [0, width] (Width)
      
      // So we have:
      // Local X = Depth
      // Local Y = Height
      // Local Z = Width
      
      // We want to map:
      // Local Z -> World X (Width)
      // Local Y -> World Y (Height)
      // Local X -> World Z (Depth)
      
      geometry.rotateY(Math.PI / 2) 
      // Now: 
      // Old X (Depth) -> New Z (Depth)
      // Old Z (Width) -> New X (Width)
      
      return geometry
  }

  createLegend(width, depth, height, baseColor) {
    // Create solid canvas with color + legend
    const canvas = document.createElement('canvas')
    const size = 512
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    // Fill with solid keycap color
    const colorHex = '#' + baseColor.toString(16).padStart(6, '0')
    ctx.fillStyle = colorHex
    ctx.fillRect(0, 0, size, size)
    
    // Determine text color based on keycap color
    const useDarkText = ['alphaKeys', 'modKeys', 'accentYellow'].includes(this.colorName)
    const textColor = useDarkText ? 'rgba(80, 80, 85, 0.9)' : 'rgba(255, 255, 255, 0.95)'
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Font size based on label length
    let fontSize = 160
    if (this.label.length === 1) fontSize = 200
    else if (this.label.length === 2) fontSize = 140
    else if (this.label.length <= 4) fontSize = 90
    else fontSize = 70
    
    // Use system font for clean look
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillText(this.label, size / 2, size / 2)
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    
    // Create top face plane
    const topGeometry = new THREE.PlaneGeometry(width, depth)
    
    const topMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.02,
      transparent: true,
    })
    
    const topFace = new THREE.Mesh(topGeometry, topMaterial)
    topFace.rotation.x = -Math.PI / 2
    topFace.position.y = height + 0.0003
    this.group.add(topFace)
  }

  press() {
    if (this.isPressed) return
    this.isPressed = true
    this.targetY = this.originalY - 0.003
  }

  release() {
    if (!this.isPressed) return
    this.isPressed = false
    this.targetY = this.originalY
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
  }
}
