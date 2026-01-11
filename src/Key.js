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
    
    // HIGH PROFILE keycap dimensions (like Cherry/OEM profile)
    const keyHeight = 0.010  // 10mm tall keycap
    const topInset = 0.0015  // Top is smaller than bottom
    const dishDepth = 0.001  // Concave dish on top
    
    // Get color
    const baseColor = COLORS[this.colorName] || COLORS.darkGrey
    
    // Create the keycap body with proper height
    this.createKeycapBody(keyWidth, keyHeight, keyDepth, topInset, baseColor)
    
    // Create the dished top surface
    this.createDishTop(keyWidth, keyDepth, keyHeight, topInset, dishDepth, baseColor)
    
    // Create legend
    if (this.label) {
      this.createLegend(keyWidth, keyDepth, keyHeight)
    }
    
    // Position the key group
    const xPos = (this.x + this.width / 2) * KEY_UNIT
    const zPos = this.y * KEY_UNIT
    this.group.position.set(xPos, 0, zPos)
    
    this.mesh = this.group
  }

  createKeycapBody(width, height, depth, topInset, color) {
    // Create a tapered box for the keycap body
    // Bottom face is larger, top face is smaller (like a real keycap)
    
    const geometry = new THREE.BufferGeometry()
    
    const hw = width / 2
    const hd = depth / 2
    const ti = topInset  // How much smaller the top is on each side
    
    // 8 vertices: 4 bottom, 4 top (tapered inward)
    const vertices = new Float32Array([
      // Bottom face (y=0)
      -hw, 0, -hd,      // 0: back-left
       hw, 0, -hd,      // 1: back-right
       hw, 0,  hd,      // 2: front-right
      -hw, 0,  hd,      // 3: front-left
      // Top face (y=height, smaller)
      -hw + ti, height, -hd + ti,  // 4: back-left
       hw - ti, height, -hd + ti,  // 5: back-right
       hw - ti, height,  hd - ti,  // 6: front-right
      -hw + ti, height,  hd - ti,  // 7: front-left
    ])
    
    // Indices for faces (triangles)
    const indices = [
      // Bottom face
      0, 2, 1,  0, 3, 2,
      // Top face
      4, 5, 6,  4, 6, 7,
      // Front face
      3, 7, 6,  3, 6, 2,
      // Back face
      0, 1, 5,  0, 5, 4,
      // Left face
      0, 4, 7,  0, 7, 3,
      // Right face
      1, 2, 6,  1, 6, 5,
    ]
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.6,
    })
    
    const keycap = new THREE.Mesh(geometry, material)
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.keycapMesh = keycap
    this.group.add(keycap)
  }

  createDishTop(width, depth, height, topInset, dishDepth, color) {
    // Create a slightly concave (dished) top surface
    const dishWidth = width - topInset * 2 - 0.001
    const dishDepth2 = depth - topInset * 2 - 0.001
    
    // Simple dish using a slightly curved plane
    const dishGeometry = new THREE.PlaneGeometry(dishWidth, dishDepth2, 4, 4)
    
    // Create slight dish (curve vertices down in center)
    const positions = dishGeometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      // Parabolic dish
      const distFromCenter = Math.sqrt(x * x + y * y)
      const maxDist = Math.sqrt((dishWidth/2)**2 + (dishDepth2/2)**2)
      const dishAmount = dishDepth * (1 - (distFromCenter / maxDist) ** 2)
      positions.setZ(i, -dishAmount)
    }
    dishGeometry.computeVertexNormals()
    
    const dishMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.65,
      metalness: 0.0,
    })
    
    const dish = new THREE.Mesh(dishGeometry, dishMaterial)
    dish.rotation.x = -Math.PI / 2
    dish.position.y = height - 0.0001
    dish.receiveShadow = true
    this.group.add(dish)
  }

  createLegend(width, depth, height) {
    // Create canvas for legend text
    const canvas = document.createElement('canvas')
    const size = 256
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    // Clear with transparency
    ctx.clearRect(0, 0, size, size)
    
    // Determine text color based on key color
    const isLightKey = this.colorName === 'lightGrey'
    const textColor = isLightKey ? '#2a2a2a' : '#ffffff'
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Calculate font size based on label length
    let fontSize = 72
    if (this.label.length === 1) {
      fontSize = 90
    } else if (this.label.length === 2) {
      fontSize = 70
    } else if (this.label.length <= 4) {
      fontSize = 50
    } else {
      fontSize = 36
    }
    
    ctx.font = `bold ${fontSize}px "SF Pro Display", "Helvetica Neue", Arial, sans-serif`
    
    // Draw main label centered
    ctx.fillText(this.label, size / 2, size / 2)
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 16
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    
    // Create legend plane - sized to fit on keycap top
    const legendWidth = (width - 0.004) * 0.85
    const legendDepth = (depth - 0.004) * 0.85
    const legendGeometry = new THREE.PlaneGeometry(legendWidth, legendDepth)
    
    const legendMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    
    const legend = new THREE.Mesh(legendGeometry, legendMaterial)
    legend.rotation.x = -Math.PI / 2
    legend.position.y = height + 0.0002
    this.legendMesh = legend
    this.group.add(legend)
  }

  press() {
    if (this.isPressed) return
    this.isPressed = true
    this.targetY = this.originalY - 0.003
    
    if (this.keycapMesh && this.keycapMesh.material) {
      this.keycapMesh.material.emissive = new THREE.Color(0x111111)
    }
  }

  release() {
    if (!this.isPressed) return
    this.isPressed = false
    this.targetY = this.originalY
    
    if (this.keycapMesh && this.keycapMesh.material) {
      this.keycapMesh.material.emissive = new THREE.Color(0x000000)
    }
  }

  update(deltaTime) {
    if (this.targetY !== undefined) {
      const speed = 25
      const diff = this.targetY - this.group.position.y
      
      if (Math.abs(diff) > 0.0001) {
        this.group.position.y += diff * speed * deltaTime
      } else {
        this.group.position.y = this.targetY
      }
    }
  }
}
