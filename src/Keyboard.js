import * as THREE from 'three'
import { Key } from './Key.js'
import { 
  KEYBOARD_LAYOUT, 
  COLORS, 
  KEY_UNIT, 
  KEY_GAP,
  KEYBOARD_WIDTH,
  KEYBOARD_HEIGHT,
} from './KeyboardLayout.js'

export class Keyboard {
  constructor() {
    this.group = new THREE.Group()
    this.keys = new Map()
    
    // Case dimensions - keys sit INSIDE the case
    this.caseWallThickness = 0.006  // 6mm walls
    this.caseBaseHeight = 0.008    // 8mm base
    this.caseWallHeight = 0.012    // 12mm wall height above base
    this.plateHeight = 0.003       // 3mm plate
    
    this.createCase()
    this.createPlate()
    this.createKeys()
    
    // Center the keyboard
    this.group.position.x = -KEYBOARD_WIDTH / 2
    this.group.position.z = -KEYBOARD_HEIGHT / 2
  }

  createCase() {
    const innerWidth = KEYBOARD_WIDTH
    const innerDepth = KEYBOARD_HEIGHT
    const wall = this.caseWallThickness
    const baseHeight = this.caseBaseHeight
    const wallHeight = this.caseWallHeight
    
    const outerWidth = innerWidth + wall * 2
    const outerDepth = innerDepth + wall * 2
    const totalHeight = baseHeight + wallHeight
    
    // Create case as a hollow box (outer - inner)
    // Using separate meshes for better materials
    
    // Outer shell
    const outerShape = new THREE.Shape()
    const bevel = 0.004  // Corner radius
    
    outerShape.moveTo(bevel, 0)
    outerShape.lineTo(outerWidth - bevel, 0)
    outerShape.quadraticCurveTo(outerWidth, 0, outerWidth, bevel)
    outerShape.lineTo(outerWidth, outerDepth - bevel)
    outerShape.quadraticCurveTo(outerWidth, outerDepth, outerWidth - bevel, outerDepth)
    outerShape.lineTo(bevel, outerDepth)
    outerShape.quadraticCurveTo(0, outerDepth, 0, outerDepth - bevel)
    outerShape.lineTo(0, bevel)
    outerShape.quadraticCurveTo(0, 0, bevel, 0)
    
    // Inner cutout (hole for keys)
    const holePath = new THREE.Path()
    const holeX = wall
    const holeZ = wall
    const holeW = innerWidth
    const holeD = innerDepth
    const holeR = 0.002
    
    holePath.moveTo(holeX + holeR, holeZ)
    holePath.lineTo(holeX + holeW - holeR, holeZ)
    holePath.quadraticCurveTo(holeX + holeW, holeZ, holeX + holeW, holeZ + holeR)
    holePath.lineTo(holeX + holeW, holeZ + holeD - holeR)
    holePath.quadraticCurveTo(holeX + holeW, holeZ + holeD, holeX + holeW - holeR, holeZ + holeD)
    holePath.lineTo(holeX + holeR, holeZ + holeD)
    holePath.quadraticCurveTo(holeX, holeZ + holeD, holeX, holeZ + holeD - holeR)
    holePath.lineTo(holeX, holeZ + holeR)
    holePath.quadraticCurveTo(holeX, holeZ, holeX + holeR, holeZ)
    
    outerShape.holes.push(holePath)
    
    const extrudeSettings = {
      depth: totalHeight,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 3,
    }
    
    const caseGeometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings)
    caseGeometry.rotateX(-Math.PI / 2)
    
    // Premium aluminum material
    const caseMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.keyboardCase,
      roughness: 0.25,
      metalness: 0.9,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
    })
    
    const caseMesh = new THREE.Mesh(caseGeometry, caseMaterial)
    caseMesh.position.set(-wall, 0, -wall)
    caseMesh.castShadow = true
    caseMesh.receiveShadow = true
    this.group.add(caseMesh)
    
    // Add bottom panel
    const bottomGeometry = new THREE.BoxGeometry(outerWidth, baseHeight, outerDepth)
    const bottomMesh = new THREE.Mesh(bottomGeometry, caseMaterial.clone())
    bottomMesh.position.set(
      innerWidth / 2,
      baseHeight / 2,
      innerDepth / 2
    )
    bottomMesh.receiveShadow = true
    this.group.add(bottomMesh)
  }

  createPlate() {
    // Dark metal plate where keys mount
    const plateWidth = KEYBOARD_WIDTH - 0.002
    const plateDepth = KEYBOARD_HEIGHT - 0.002
    const plateHeight = this.plateHeight
    
    const plateGeometry = new THREE.BoxGeometry(plateWidth, plateHeight, plateDepth)
    const plateMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.caseDark,
      roughness: 0.4,
      metalness: 0.8,
    })
    
    const plate = new THREE.Mesh(plateGeometry, plateMaterial)
    plate.position.set(
      KEYBOARD_WIDTH / 2,
      this.caseBaseHeight + plateHeight / 2,
      KEYBOARD_HEIGHT / 2
    )
    plate.receiveShadow = true
    this.group.add(plate)
  }

  createKeys() {
    // Keys sit on top of the plate
    const keyBaseY = this.caseBaseHeight + this.plateHeight
    
    KEYBOARD_LAYOUT.forEach(keyData => {
      const key = new Key(keyData)
      
      // Position key on the plate
      key.group.position.y = keyBaseY
      
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
