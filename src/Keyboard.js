import * as THREE from 'three'
import { Key } from './Key.js'
import { 
  KEYBOARD_LAYOUT, 
  COLORS, 
  KEY_UNIT, 
  KEYBOARD_WIDTH,
  KEYBOARD_HEIGHT,
} from './KeyboardLayout.js'
import { getKeycapLabel } from './SettingsManager.js'

export class Keyboard {
  constructor() {
    this.group = new THREE.Group()
    this.keys = new Map()
    
    // Case dimensions
    this.casePadding = 0.006       // Padding around keys
    this.caseBaseHeight = 0.014    // Height of case base
    this.plateHeight = 0.002       // Height of the mounting plate
    this.wallHeight = 0.006        // Walls extend above base
    this.sidePanelThickness = 0.003 // Thin side panels
    
    // Total keyboard depth (Z axis) and width (X axis)
    this.totalDepth = KEYBOARD_HEIGHT + this.casePadding * 2
    this.totalWidth = KEYBOARD_WIDTH + this.casePadding * 2
    
    this.createCaseBase()
    this.createWedgeSidePanels()
    this.createFrontBackWalls()
    this.createPlate()
    this.createKeys()
    
    // Center the keyboard
    this.group.position.x = -KEYBOARD_WIDTH / 2 - this.casePadding - this.sidePanelThickness
    this.group.position.z = -KEYBOARD_HEIGHT / 2 - this.casePadding
  }

  createCaseBase() {
    // Main case body
    const width = this.totalWidth
    const depth = this.totalDepth
    const height = this.caseBaseHeight
    
    // Create ribbed texture for the front/back
    const texture = this.createRibbedTexture()
    
    const geometry = new THREE.BoxGeometry(width, height, depth)
    
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.1,
      thickness: 0.02,
    })
    
    const ribbedMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      bumpMap: texture,
      bumpScale: 0.002,
    })

    const materials = [
      baseMaterial,   // Right
      baseMaterial,   // Left
      baseMaterial,   // Top
      baseMaterial,   // Bottom
      ribbedMaterial, // Front
      ribbedMaterial  // Back
    ]
    
    const base = new THREE.Mesh(geometry, materials)
    base.position.set(this.sidePanelThickness + width / 2, height / 2, depth / 2)
    base.castShadow = true
    base.receiveShadow = true
    this.group.add(base)
  }

  createRibbedTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 64, 512)
    
    ctx.fillStyle = '#000000'
    const numRibs = 40
    const ribHeight = 512 / numRibs
    
    for (let i = 0; i < numRibs; i++) {
        if (i % 2 === 0) {
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

  createWedgeSidePanels() {
    // Create WEDGE-shaped side panels
    // Profile when viewed from the SIDE (looking along X axis):
    // - Tall at BACK (low Z, near function row)
    // - Slopes down toward FRONT (high Z, near spacebar)
    // - Chamfered bottom-front corner
    
    const depth = this.totalDepth
    const backHeight = this.caseBaseHeight + this.wallHeight + 0.004  // Taller at back
    const frontHeight = this.caseBaseHeight + this.wallHeight - 0.002 // Shorter at front
    const chamferSize = 0.008  // Size of bottom-front chamfer
    
    // Create the wedge profile shape (viewed from side, XZ plane becomes the profile)
    // Z runs from 0 (back) to depth (front)
    // Y is height
    const createWedgeGeometry = () => {
      const shape = new THREE.Shape()
      
      // Local X=0 maps to World Z=depth (FRONT)
      // Local X=depth maps to World Z=0 (BACK)
      
      // Start at FRONT-BOTTOM (Local X=0, Y=0)
      shape.moveTo(chamferSize, 0)                 // Front-bottom (after chamfer)
      shape.lineTo(0, chamferSize)                 // Chamfer up
      shape.lineTo(0, frontHeight)                 // Front-top (short)
      
      // Slope up to BACK-TOP
      shape.lineTo(depth, backHeight)              // Back-top (tall)
      
      // Finish BACK edge
      shape.lineTo(depth, 0)                       // Back-bottom
      shape.lineTo(chamferSize, 0)                 // Close at front-bottom
      
      const extrudeSettings = {
        depth: this.sidePanelThickness,
        bevelEnabled: true,
        bevelThickness: 0.0005,
        bevelSize: 0.0005,
        bevelSegments: 2,
      }
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings)
    }
    
    const sideMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.keyboardCase,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    })
    
    // Left side panel
    const leftGeometry = createWedgeGeometry()
    const leftPanel = new THREE.Mesh(leftGeometry, sideMaterial)
    // Profile in XY is ZY in world space after rotation. 
    // Extrude depth is Local Z, which becomes World X.
    // rotation.y = PI/2 means: World X = Local Z, World Z = -Local X.
    leftPanel.rotation.y = Math.PI / 2
    // Local X is [0, depth]. After rotation Z becomes [-depth, 0].
    // Shift by +depth to bring it to [0, depth].
    leftPanel.position.set(0, 0, depth)
    leftPanel.castShadow = true
    leftPanel.receiveShadow = true
    this.group.add(leftPanel)
    
    // Right side panel
    const rightGeometry = createWedgeGeometry()
    const rightPanel = new THREE.Mesh(rightGeometry, sideMaterial)
    rightPanel.rotation.y = Math.PI / 2
    // Position at the far right edge
    const totalWidthWithPanels = this.totalWidth + this.sidePanelThickness * 2
    rightPanel.position.set(totalWidthWithPanels - this.sidePanelThickness, 0, depth)
    rightPanel.castShadow = true
    rightPanel.receiveShadow = true
    this.group.add(rightPanel)
  }

  createFrontBackWalls() {
    // Front and back walls on top of the base
    const width = this.totalWidth
    const wallHeight = this.wallHeight
    const wallThickness = 0.004
    const depth = this.totalDepth
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.keyboardCase,
      roughness: 0.1,
      metalness: 0.05,
    })
    
    // Front wall (high Z)
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(width, wallHeight, wallThickness),
      wallMaterial
    )
    frontWall.position.set(
      this.sidePanelThickness + width / 2,
      this.caseBaseHeight + wallHeight / 2,
      depth - wallThickness / 2
    )
    frontWall.castShadow = true
    this.group.add(frontWall)
    
    // Back wall (low Z)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(width, wallHeight, wallThickness),
      wallMaterial
    )
    backWall.position.set(
      this.sidePanelThickness + width / 2,
      this.caseBaseHeight + wallHeight / 2,
      wallThickness / 2
    )
    backWall.castShadow = true
    this.group.add(backWall)
  }

  createPlate() {
    // Dark mounting plate where keys sit
    const width = KEYBOARD_WIDTH + this.casePadding - 0.002
    const depth = KEYBOARD_HEIGHT + this.casePadding - 0.002
    
    const geometry = new THREE.BoxGeometry(width, this.plateHeight, depth)
    const material = new THREE.MeshPhysicalMaterial({
      color: COLORS.caseDark,
      roughness: 0.4,
      metalness: 0.7,
    })
    
    const plate = new THREE.Mesh(geometry, material)
    plate.position.set(
      this.sidePanelThickness + this.casePadding + KEYBOARD_WIDTH / 2,
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
      
      // Position key - offset by case padding and side panel
      key.group.position.x += this.casePadding + this.sidePanelThickness
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

  updateKeyLabels() {
    // Update key labels based on current OS layout
    const keysToUpdate = ['MetaLeft', 'MetaRight', 'AltLeft', 'AltRight']
    
    keysToUpdate.forEach(code => {
      const key = this.keys.get(code)
      if (key) {
        const keyData = KEYBOARD_LAYOUT.find(k => k.code === code)
        const newLabel = getKeycapLabel(code, keyData?.label || '')
        key.updateLabel(newLabel)
      }
    })
  }
}


