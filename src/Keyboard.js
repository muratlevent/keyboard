import * as THREE from 'three'
import { Key } from './Key.js'
import { 
  KEYBOARD_LAYOUT, 
  COLORS, 
  KEY_UNIT, 
  KEYBOARD_WIDTH,
  KEYBOARD_HEIGHT,
} from './KeyboardLayout.js'

export class Keyboard {
  constructor() {
    this.group = new THREE.Group()
    this.keys = new Map()
    
    // Case dimensions
    this.casePadding = 0.008     // Padding around keys
    this.caseBaseHeight = 0.012  // Height of case base
    this.plateHeight = 0.002     // Height of the mounting plate
    this.wallHeight = 0.012      // Walls extend above base
    
    this.createCaseBase()
    this.createCaseWalls()
    this.createPlate()
    this.createKeys()
    
    // Center the keyboard
    this.group.position.x = -KEYBOARD_WIDTH / 2 - this.casePadding
    this.group.position.z = -KEYBOARD_HEIGHT / 2 - this.casePadding
  }

  createCaseBase() {
    // Halo style: Thick bottom base with "ribbed" texture
    const width = KEYBOARD_WIDTH + this.casePadding * 2
    const depth = KEYBOARD_HEIGHT + this.casePadding * 2
    const height = 0.012
    
    // Create ribbed texture for the sides
    const texture = this.createRibbedTexture()
    
    const geometry = new THREE.BoxGeometry(width, height, depth)
    
    // Material 0: Right (Ribbed)
    // Material 1: Left (Ribbed)
    // Material 2: Top (Smooth/Covered)
    // Material 3: Bottom (Smooth)
    // Material 4: Front (Ribbed)
    // Material 5: Back (Ribbed)
    
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.1, // Slight translucency for "Halo" effect
      thickness: 0.02,
    })
    
    const ribbedMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      bumpMap: texture,
      bumpScale: 0.002, // Deep ribs
    })

    const materials = [
      ribbedMaterial, // Right
      ribbedMaterial, // Left
      baseMaterial,   // Top
      baseMaterial,   // Bottom
      ribbedMaterial, // Front
      ribbedMaterial  // Back
    ]
    
    const base = new THREE.Mesh(geometry, materials)
    base.position.set(width / 2, height / 2, depth / 2)
    base.castShadow = true
    base.receiveShadow = true
    this.group.add(base)
  }

  createRibbedTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 64, 512)
    
    // Draw dark stripes for grooves (bump map: dark = low)
    ctx.fillStyle = '#000000'
    const numRibs = 40
    const ribHeight = 512 / numRibs
    
    for (let i = 0; i < numRibs; i++) {
        // Draw separate lines
        if (i % 2 === 0) {
           // Gradient for smooth groove
           const gradient = ctx.createLinearGradient(0, i * ribHeight, 0, (i + 1) * ribHeight)
           gradient.addColorStop(0, '#ffffff')
           gradient.addColorStop(0.5, '#404040') 
           gradient.addColorStop(1, '#ffffff')
           ctx.fillStyle = gradient
           ctx.fillRect(0, i * ribHeight, 64, ribHeight)
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }

  createCaseWalls() {
    // Create 4 walls around the keyboard (on TOP of the base, surrounding keys)
    const width = KEYBOARD_WIDTH + this.casePadding * 2
    const depth = KEYBOARD_HEIGHT + this.casePadding * 2
    const wallHeight = this.wallHeight  // Walls as tall as keycaps
    const wallThickness = 0.006
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.keyboardCase, // Solid White
      roughness: 0.1, // Smooth plastic
      metalness: 0.05, // Almost no metal
    })
    
    // Front wall (near camera)
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(width, wallHeight, wallThickness),
      wallMaterial
    )
    frontWall.position.set(width / 2, this.caseBaseHeight + wallHeight / 2, depth - wallThickness / 2)
    frontWall.castShadow = true
    this.group.add(frontWall)
    
    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(width, wallHeight, wallThickness),
      wallMaterial
    )
    backWall.position.set(width / 2, this.caseBaseHeight + wallHeight / 2, wallThickness / 2)
    backWall.castShadow = true
    this.group.add(backWall)
    
    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, depth),
      wallMaterial
    )
    leftWall.position.set(wallThickness / 2, this.caseBaseHeight + wallHeight / 2, depth / 2)
    leftWall.castShadow = true
    this.group.add(leftWall)
    
    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, depth),
      wallMaterial
    )
    rightWall.position.set(width - wallThickness / 2, this.caseBaseHeight + wallHeight / 2, depth / 2)
    rightWall.castShadow = true
    this.group.add(rightWall)
  }

  createPlate() {
    // Dark mounting plate where keys sit
    const width = KEYBOARD_WIDTH + this.casePadding - 0.004
    const depth = KEYBOARD_HEIGHT + this.casePadding - 0.004
    
    const geometry = new THREE.BoxGeometry(width, this.plateHeight, depth)
    const material = new THREE.MeshPhysicalMaterial({
      color: COLORS.caseDark,
      roughness: 0.4,
      metalness: 0.7,
    })
    
    const plate = new THREE.Mesh(geometry, material)
    plate.position.set(
      this.casePadding + KEYBOARD_WIDTH / 2,
      this.caseBaseHeight + this.plateHeight / 2,
      this.casePadding + KEYBOARD_HEIGHT / 2
    )
    plate.receiveShadow = true
    this.group.add(plate)
  }

  createKeys() {
    // Keys sit on top of the plate
    const keyBaseY = this.caseBaseHeight + this.plateHeight
    
    KEYBOARD_LAYOUT.forEach(keyData => {
      const key = new Key(keyData)
      
      // Position key - offset by case padding
      key.group.position.x += this.casePadding
      key.group.position.y = keyBaseY
      key.group.position.z += this.casePadding
      
      // Update original Y for animation
      key.originalY = key.group.position.y
      key.targetY = key.originalY
      
      this.keys.set(keyData.code, key)
      this.group.add(key.group)
    })
  }

  pressKey(code) {
    const key = this.keys.get(code)
    if (key) {
      key.press()
    }
  }

  releaseKey(code) {
    const key = this.keys.get(code)
    if (key) {
      key.release()
    }
  }

  update(deltaTime) {
    this.keys.forEach(key => {
      key.update(deltaTime)
    })
  }

  getMesh() {
    return this.group
  }
}
