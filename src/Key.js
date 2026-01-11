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
    const keyHeight = 0.008  // 8mm tall keycap
    
    // Get base color
    const baseColor = COLORS[this.colorName] || COLORS.darkGrey
    
    // Create simple box keycap (most reliable rendering)
    const geometry = new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth)
    
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.65,
      metalness: 0.0,
    })
    
    const keycap = new THREE.Mesh(geometry, material)
    keycap.position.y = keyHeight / 2  // Center the box above origin
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.keycapMesh = keycap
    this.group.add(keycap)
    
    // Add legend on top
    if (this.label) {
      this.createLegend(keyWidth, keyDepth, keyHeight, baseColor)
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
    const size = 256
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    // Fill with solid keycap color
    const colorHex = '#' + baseColor.toString(16).padStart(6, '0')
    ctx.fillStyle = colorHex
    ctx.fillRect(0, 0, size, size)
    
    // Draw legend text
    const isLightKey = this.colorName === 'lightGrey'
    const textColor = isLightKey ? '#222222' : '#ffffff'
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Font size based on label length
    let fontSize = 90
    if (this.label.length === 1) fontSize = 110
    else if (this.label.length === 2) fontSize = 85
    else if (this.label.length <= 4) fontSize = 55
    else fontSize = 40
    
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.fillText(this.label, size / 2, size / 2)
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas)
    
    // Create top face plane (slightly smaller than keycap)
    const topWidth = width * 0.92
    const topDepth = depth * 0.92
    const topGeometry = new THREE.PlaneGeometry(topWidth, topDepth)
    
    const topMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.0,
    })
    
    const topFace = new THREE.Mesh(topGeometry, topMaterial)
    topFace.rotation.x = -Math.PI / 2
    topFace.position.y = height + 0.0002
    this.group.add(topFace)
  }

  press() {
    if (this.isPressed) return
    this.isPressed = true
    this.targetY = this.originalY - 0.002
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
