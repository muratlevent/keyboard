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
    // Simple box for the case base (bottom part)
    const width = KEYBOARD_WIDTH + this.casePadding * 2
    const depth = KEYBOARD_HEIGHT + this.casePadding * 2
    const height = this.caseBaseHeight
    
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshPhysicalMaterial({
      color: COLORS.keyboardCase,
      roughness: 0.25,
      metalness: 0.85,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    })
    
    const base = new THREE.Mesh(geometry, material)
    base.position.set(width / 2, height / 2, depth / 2)
    base.castShadow = true
    base.receiveShadow = true
    this.group.add(base)
  }

  createCaseWalls() {
    // Create 4 walls around the keyboard (on TOP of the base, surrounding keys)
    const width = KEYBOARD_WIDTH + this.casePadding * 2
    const depth = KEYBOARD_HEIGHT + this.casePadding * 2
    const wallHeight = this.wallHeight  // Walls as tall as keycaps
    const wallThickness = 0.006
    
    const wallMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.keyboardCase,
      roughness: 0.25,
      metalness: 0.85,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
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
