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
    const keyHeight = 0.014  // Increased to 14mm for high-profile look
    
    // Get base color
    const baseColor = COLORS[this.colorName] || COLORS.darkGrey
    
    // Create base box geometry
    const geometry = new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth)
    
    // Taper the top of the keycap
    const positions = geometry.attributes.position
    const count = positions.count
    const taperFactor = 0.75 // Top is 75% of bottom width
    
    for (let i = 0; i < count; i++) {
        const y = positions.getY(i)
        
        // If this is a top vertex (y > 0)
        if (y > 0) {
            const x = positions.getX(i)
            const z = positions.getZ(i)
            
            positions.setX(i, x * taperFactor)
            positions.setZ(i, z * taperFactor)
        }
    }
    
    // Recompute normals for correct lighting after modifying vertices
    geometry.computeVertexNormals()
    
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.65,
      metalness: 0.1, // Slight metalness for plastic sheen
    })
    
    const keycap = new THREE.Mesh(geometry, material)
    keycap.position.y = keyHeight / 2
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.keycapMesh = keycap
    this.group.add(keycap)
    
    // Add legend on top - adjust size for taper
    if (this.label) {
      // Calculate top surface dimensions based on taper
      const topWidth = keyWidth * taperFactor
      const topDepth = keyDepth * taperFactor
      this.createLegend(topWidth, topDepth, keyHeight, baseColor)
    }
    
    // Position the key group
    const xPos = (this.x + this.width / 2) * KEY_UNIT
    const zPos = (this.y + 0.5) * KEY_UNIT
    this.group.position.set(xPos, 0, zPos)
    
    this.mesh = this.group
  }

  createLegend(width, depth, height, baseColor) {
    // Create solid canvas with color + legend
    const canvas = document.createElement('canvas')
    const size = 512 // Increased resolution
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    // Fill with solid keycap color
    const colorHex = '#' + baseColor.toString(16).padStart(6, '0')
    ctx.fillStyle = colorHex
    ctx.fillRect(0, 0, size, size)
    
    // Draw legend text
    const isLightKey = this.colorName === 'lightGrey'
    const textColor = isLightKey ? '#222222' : '#eeeeee'
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Font size based on label length
    let fontSize = 180
    if (this.label.length === 1) fontSize = 220
    else if (this.label.length === 2) fontSize = 160
    else if (this.label.length <= 4) fontSize = 100
    else fontSize = 80
    
    // Use a rounded font for better look
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillText(this.label, size / 2, size / 2)
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace // Ensure correct color space
    
    // Create top face plane
    // Use slightly smaller plane to avoid z-fighting at sharp edges if any
    const topGeometry = new THREE.PlaneGeometry(width * 0.95, depth * 0.95)
    
    const topMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true, // Allow blending
    })
    
    const topFace = new THREE.Mesh(topGeometry, topMaterial)
    topFace.rotation.x = -Math.PI / 2
    topFace.position.y = height + 0.0005 // Slightly above to prevent z-fighting
    this.group.add(topFace)
  }

  press() {
    if (this.isPressed) return
    this.isPressed = true
    this.targetY = this.originalY - 0.004 // Deeper press for taller keys
  }

  release() {
    if (!this.isPressed) return
    this.isPressed = false
    this.targetY = this.originalY
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
