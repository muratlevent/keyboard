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
    const keyWidth = this.width * KEY_UNIT - KEY_GAP * 0.6
    const keyDepth = KEY_UNIT - KEY_GAP * 0.6
    const keyHeight = 0.009
    const topInset = 0.002 // How much smaller the top is
    
    // Get color from COLORS object
    const baseColor = COLORS[this.colorName] || COLORS.darkGrey
    
    // Create keycap body using custom geometry for Cherry MX-like profile
    const geometry = this.createCherryProfileGeometry(keyWidth, keyHeight, keyDepth, topInset)
    
    // Create material with PBT-like appearance
    const material = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: 0.75,
      metalness: 0.0,
      clearcoat: 0.05,
      clearcoatRoughness: 0.8,
    })
    
    const keycap = new THREE.Mesh(geometry, material)
    keycap.castShadow = true
    keycap.receiveShadow = true
    this.group.add(keycap)
    
    // Add top face dish (slight concave depression)
    this.createTopDish(keyWidth, keyDepth, keyHeight, baseColor)
    
    // Add key legend
    if (this.label) {
      this.createLegend(keyWidth, keyDepth, keyHeight, baseColor)
    }
    
    // Position the key
    const xPos = (this.x + this.width / 2) * (KEY_UNIT + KEY_GAP * 0.1)
    const zPos = this.y * (KEY_UNIT + KEY_GAP * 0.1)
    
    this.group.position.set(xPos, keyHeight / 2 + 0.018, zPos)
    
    // Store reference to this Key object
    this.group.userData.key = this
    this.mesh = this.group // For compatibility
  }

  createCherryProfileGeometry(width, height, depth, topInset) {
    // Create a geometry with tapered sides like a real keycap
    const shape = new THREE.Shape()
    
    const hw = width / 2
    const hd = depth / 2
    const r = 0.002 // Corner radius for bottom
    
    // Bottom rectangle with rounded corners
    shape.moveTo(-hw + r, -hd)
    shape.lineTo(hw - r, -hd)
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r)
    shape.lineTo(hw, hd - r)
    shape.quadraticCurveTo(hw, hd, hw - r, hd)
    shape.lineTo(-hw + r, hd)
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r)
    shape.lineTo(-hw, -hd + r)
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd)
    
    // Extrude with bevel for smooth edges
    const extrudeSettings = {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: topInset,
      bevelOffset: 0,
      bevelSegments: 2,
    }
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, height / 2, 0)
    
    return geometry
  }

  createTopDish(width, depth, height, baseColor) {
    // Create a subtle dish/indent on top of keycap
    const dishGeometry = new THREE.PlaneGeometry(width * 0.75, depth * 0.75)
    const dishMaterial = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: 0.6,
      metalness: 0.0,
      transparent: true,
      opacity: 0.0, // Invisible, just for subtle shadow catching
    })
    
    const dish = new THREE.Mesh(dishGeometry, dishMaterial)
    dish.rotation.x = -Math.PI / 2
    dish.position.y = height + 0.0005
    dish.receiveShadow = true
    this.group.add(dish)
  }

  createLegend(width, depth, height, baseColor) {
    // Create canvas texture for key legend
    const canvas = document.createElement('canvas')
    const size = 128
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    // Transparent background
    ctx.clearRect(0, 0, size, size)
    
    // Determine text color based on key color
    const isLightKey = this.colorName === 'lightGrey' || this.colorName === 'keyboardCase'
    const textColor = isLightKey ? '#333333' : '#ffffff'
    
    // Draw legend text
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Adjust font size based on label length
    let fontSize = 42
    if (this.label.length > 3) fontSize = 28
    if (this.label.length > 5) fontSize = 20
    
    ctx.font = `bold ${fontSize}px "SF Pro Display", "Helvetica Neue", Arial, sans-serif`
    ctx.fillText(this.label, size / 2, size / 2)
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 16
    
    // Create legend plane
    const legendSize = Math.min(width, depth) * 0.7
    const legendGeometry = new THREE.PlaneGeometry(legendSize, legendSize)
    const legendMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    })
    
    const legend = new THREE.Mesh(legendGeometry, legendMaterial)
    legend.rotation.x = -Math.PI / 2
    legend.position.y = height + 0.001
    this.group.add(legend)
  }

  press() {
    if (this.isPressed) return
    this.isPressed = true
    this.targetY = this.originalY - 0.003
    
    // Change emissive for glow effect
    this.group.children.forEach(child => {
      if (child.material && child.material.emissive) {
        child.material.emissive = new THREE.Color(0x111111)
      }
    })
  }

  release() {
    if (!this.isPressed) return
    this.isPressed = false
    this.targetY = this.originalY
    
    this.group.children.forEach(child => {
      if (child.material && child.material.emissive) {
        child.material.emissive = new THREE.Color(0x000000)
      }
    })
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
