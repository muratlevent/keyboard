import * as THREE from 'three'
import { Key } from './Key.js'
import { 
  KEYBOARD_LAYOUT, 
  COLORS, 
  KEY_UNIT, 
  KEY_GAP,
  KEYBOARD_WIDTH,
  KEYBOARD_HEIGHT,
  CASE_PADDING,
  CASE_HEIGHT
} from './KeyboardLayout.js'

export class Keyboard {
  constructor() {
    this.group = new THREE.Group()
    this.keys = new Map()
    
    this.createCase()
    this.createKeys()
    
    // Center the keyboard
    this.group.position.x = -KEYBOARD_WIDTH / 2 + 0.05
    this.group.position.z = -KEYBOARD_HEIGHT / 2
  }

  createCase() {
    const caseWidth = KEYBOARD_WIDTH + CASE_PADDING * 2.5
    const caseDepth = KEYBOARD_HEIGHT + CASE_PADDING * 2.5
    const caseHeight = CASE_HEIGHT
    const bevelRadius = 0.008
    
    // Main case body - extruded rounded rectangle
    const caseShape = new THREE.Shape()
    const hw = caseWidth / 2
    const hd = caseDepth / 2
    
    caseShape.moveTo(-hw + bevelRadius, -hd)
    caseShape.lineTo(hw - bevelRadius, -hd)
    caseShape.quadraticCurveTo(hw, -hd, hw, -hd + bevelRadius)
    caseShape.lineTo(hw, hd - bevelRadius)
    caseShape.quadraticCurveTo(hw, hd, hw - bevelRadius, hd)
    caseShape.lineTo(-hw + bevelRadius, hd)
    caseShape.quadraticCurveTo(-hw, hd, -hw, hd - bevelRadius)
    caseShape.lineTo(-hw, -hd + bevelRadius)
    caseShape.quadraticCurveTo(-hw, -hd, -hw + bevelRadius, -hd)
    
    const extrudeSettings = {
      depth: caseHeight,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 4,
    }
    
    const caseGeometry = new THREE.ExtrudeGeometry(caseShape, extrudeSettings)
    caseGeometry.rotateX(-Math.PI / 2)
    
    // Premium aluminum material
    const caseMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.keyboardCase,
      roughness: 0.25,
      metalness: 0.9,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    })
    
    const caseMesh = new THREE.Mesh(caseGeometry, caseMaterial)
    caseMesh.position.set(
      KEYBOARD_WIDTH / 2 - 0.05,
      0,
      KEYBOARD_HEIGHT / 2
    )
    caseMesh.receiveShadow = true
    caseMesh.castShadow = true
    this.group.add(caseMesh)
    
    // Top plate (dark metal mounting plate)
    const plateWidth = caseWidth - 0.012
    const plateDepth = caseDepth - 0.012
    
    const plateShape = new THREE.Shape()
    const phw = plateWidth / 2
    const phd = plateDepth / 2
    const pr = 0.005
    
    plateShape.moveTo(-phw + pr, -phd)
    plateShape.lineTo(phw - pr, -phd)
    plateShape.quadraticCurveTo(phw, -phd, phw, -phd + pr)
    plateShape.lineTo(phw, phd - pr)
    plateShape.quadraticCurveTo(phw, phd, phw - pr, phd)
    plateShape.lineTo(-phw + pr, phd)
    plateShape.quadraticCurveTo(-phw, phd, -phw, phd - pr)
    plateShape.lineTo(-phw, -phd + pr)
    plateShape.quadraticCurveTo(-phw, -phd, -phw + pr, -phd)
    
    const plateExtrudeSettings = {
      depth: 0.004,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 2,
    }
    
    const plateGeometry = new THREE.ExtrudeGeometry(plateShape, plateExtrudeSettings)
    plateGeometry.rotateX(-Math.PI / 2)
    
    const plateMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.caseDark,
      roughness: 0.35,
      metalness: 0.85,
    })
    
    const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial)
    plateMesh.position.set(
      KEYBOARD_WIDTH / 2 - 0.05,
      caseHeight + 0.003,
      KEYBOARD_HEIGHT / 2
    )
    plateMesh.receiveShadow = true
    this.group.add(plateMesh)
    
    // Add subtle chamfer highlight on case edge
    const edgeGeometry = new THREE.RingGeometry(
      Math.min(hw, hd) - 0.002,
      Math.min(hw, hd),
      32
    )
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 1.0,
      transparent: true,
      opacity: 0.15,
    })
    
    // Front edge accent strip
    const accentGeometry = new THREE.BoxGeometry(caseWidth - 0.01, 0.001, 0.002)
    const accentMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 1.0,
      transparent: true,
      opacity: 0.25,
    })
    
    const accentMesh = new THREE.Mesh(accentGeometry, accentMaterial)
    accentMesh.position.set(
      KEYBOARD_WIDTH / 2 - 0.05,
      caseHeight / 2,
      KEYBOARD_HEIGHT / 2 + caseDepth / 2 + 0.002
    )
    this.group.add(accentMesh)
  }

  createKeys() {
    KEYBOARD_LAYOUT.forEach(keyData => {
      const key = new Key(keyData)
      
      // Position keys to sit on the plate
      const plateTop = CASE_HEIGHT + 0.007 // Top of plate
      
      key.group.position.x += CASE_PADDING
      key.group.position.y = plateTop
      key.group.position.z += CASE_PADDING
      
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
