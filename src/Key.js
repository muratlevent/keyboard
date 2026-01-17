import * as THREE from "three";
import { KEY_UNIT, KEY_GAP, getColors } from "./KeyboardLayout.js";
import { getKeycapLabel, getCurrentLayout } from "./SettingsManager.js";

// Material cache for performance - keyed by colorHex_style
const materialCache = new Map();

// Geometry cache for performance - keyed by dimensions + style + spacebar flag
const geometryCache = new Map();

// Painted shading texture cache - single shared texture
let paintedShadingTexture = null;

// Shared shadow texture cache - single texture for all keys
let sharedShadowTexture = null;

// Get or create the shared shadow texture (used by all keys)
function getSharedShadowTexture() {
  if (sharedShadowTexture) return sharedShadowTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  // Radial gradient for soft shadow edges
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.12)"); // Softer center
  gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.06)"); // Medium
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent edges

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  sharedShadowTexture = new THREE.CanvasTexture(canvas);
  return sharedShadowTexture;
}

// Create painted shading texture with baked lighting
// Create baked directional lighting texture
// Simulates fixed light source from Top-Left (no runtime light calc)
function getPaintedShadingTexture() {
  if (paintedShadingTexture) return paintedShadingTexture;

  // Optimized size (256 is plenty for smooth gradients)
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // 1. Base color (neutral)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Subtle micro-grain noise (kept very light to avoid dirty look)
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 2; // Very subtle noise (+-1 unit)
    data[i] += grain;
    data[i + 1] += grain;
    data[i + 2] += grain;
  }
  ctx.putImageData(imageData, 0, 0);

  // 2. Main Face Gradient (Light from Top-Right → Shadow to Bottom-Left)
  const faceGradient = ctx.createLinearGradient(size, 0, 0, size);
  faceGradient.addColorStop(0, "rgba(255, 255, 255, 0.08)"); // Highlight (right/top)
  faceGradient.addColorStop(1, "rgba(0, 0, 0, 0.04)"); // Shadow (left/bottom)
  ctx.fillStyle = faceGradient;
  ctx.fillRect(0, 0, size, size);

  // 3. Very subtle neutral lift (avoid warm tint / dirty look)
  const sssGradient = ctx.createLinearGradient(
    size * 0.2,
    size * 0.2,
    size * 0.8,
    size * 0.8,
  );
  sssGradient.addColorStop(0.4, "rgba(255, 220, 200, 0)"); // Transparent
  sssGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.025)"); // Neutral, very subtle
  sssGradient.addColorStop(0.6, "rgba(0, 0, 0, 0)"); // Transparent
  ctx.fillStyle = sssGradient;
  ctx.fillRect(0, 0, size, size);

  // 3.1 Gentle center lift (adds clean plastic depth)
  const centerLift = ctx.createRadialGradient(
    size * 0.55,
    size * 0.45,
    0,
    size * 0.55,
    size * 0.45,
    size * 0.7
  );
  centerLift.addColorStop(0, "rgba(255, 255, 255, 0.05)");
  centerLift.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = centerLift;
  ctx.fillRect(0, 0, size, size);

  // 4. Specular Bevel Highlight (Top-Right Edge)
  // Soft and subtle to avoid "drawn" look
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(size, size);
  ctx.lineWidth = size * 0.03;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.shadowBlur = 3;
  ctx.shadowColor = "rgba(255, 255, 255, 0.18)";
  ctx.stroke();
  ctx.restore();

  // 5. Deep Shadow (Bottom-Left Edge/Corner)
  const shadowGradient = ctx.createRadialGradient(
    0,
    size,
    0,
    0,
    size,
    size * 0.7,
  );
  shadowGradient.addColorStop(0, "rgba(10, 5, 20, 0.12)");
  shadowGradient.addColorStop(0.6, "rgba(20, 10, 30, 0.01)");
  shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadowGradient;
  ctx.fillRect(0, size * 0.3, size * 0.7, size * 0.7);

  // 5.1 Subtle lift (Bottom-Right Corner)
  const bottomRightLift = ctx.createRadialGradient(
    size,
    size,
    0,
    size,
    size,
    size * 0.55,
  );
  bottomRightLift.addColorStop(0, "rgba(255, 255, 255, 0.05)");
  bottomRightLift.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bottomRightLift;
  ctx.fillRect(size * 0.45, size * 0.45, size * 0.55, size * 0.55);

  // 6. Ambient Occlusion (soft, avoids dirty black)
  // Bottom AO (soft)
  const bottomAO = ctx.createLinearGradient(0, size * 0.85, 0, size);
  bottomAO.addColorStop(0, "rgba(0, 0, 0, 0)");
  bottomAO.addColorStop(1, "rgba(0, 0, 0, 0.08)");
  ctx.fillStyle = bottomAO;
  ctx.fillRect(0, size * 0.85, size, size * 0.15);

  // Left AO (soft)
  const leftAO = ctx.createLinearGradient(0, 0, size * 0.15, 0);
  leftAO.addColorStop(0, "rgba(0, 0, 0, 0.10)");
  leftAO.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = leftAO;
  ctx.fillRect(0, 0, size * 0.15, size);

  // 6.1 Subtle top/right rim highlight (cleaner edge definition)
  const topHighlight = ctx.createLinearGradient(0, 0, 0, size * 0.12);
  topHighlight.addColorStop(0, "rgba(255, 255, 255, 0.10)");
  topHighlight.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = topHighlight;
  ctx.fillRect(0, 0, size, size * 0.12);

  const rightHighlight = ctx.createLinearGradient(size * 0.88, 0, size, 0);
  rightHighlight.addColorStop(0, "rgba(255, 255, 255, 0)");
  rightHighlight.addColorStop(1, "rgba(255, 255, 255, 0.10)");
  ctx.fillStyle = rightHighlight;
  ctx.fillRect(size * 0.88, 0, size * 0.12, size);

  // Top Definition Line is covered by Bevel Highlight now

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  paintedShadingTexture = texture;
  return texture;
}

// Clear all caches (call on theme/style change to prevent memory leaks)
export function clearKeyCaches() {
  // Dispose materials
  materialCache.forEach((material) => {
    material.dispose();
  });
  materialCache.clear();

  // Dispose geometries
  geometryCache.forEach((geometry) => {
    geometry.dispose();
  });
  geometryCache.clear();

  // Dispose painted shading texture
  if (paintedShadingTexture) {
    paintedShadingTexture.dispose();
    paintedShadingTexture = null;
  }

  // Dispose shared shadow texture
  if (sharedShadowTexture) {
    sharedShadowTexture.dispose();
    sharedShadowTexture = null;
  }
}

function getKeycapMaterial(baseColor) {
  // Create unique cache key based on color
  const colorHex = baseColor.toString(16).padStart(6, "0");
  const cacheKey = `${colorHex}_rounded`;

  if (materialCache.has(cacheKey)) {
    return materialCache.get(cacheKey).clone();
  }

  // Get the painted shading texture (shared across all keys)
  const shadingMap = getPaintedShadingTexture();

  // OPTIMIZED: MeshStandardMaterial tuned for "High-Quality PBT/ABS Plastic"
  // Roughness 0.55 = smoother plastic
  // EnvMapIntensity 0.9 = slightly less reflective
  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.55,
    metalness: 0.05, // Reduced metalness to avoid weird specular
    envMapIntensity: 0.9,
    // Painted shading texture with grain & SSS
    map: shadingMap,
  });

  materialCache.set(cacheKey, material);
  return material.clone();
}

export class Key {
  constructor(keyData) {
    this.code = keyData.code;
    this.label = keyData.label;
    this.shiftLabel = keyData.shiftLabel || null; // Shift character for dual-legend keys
    this.subLabel = keyData.subLabel || null; // Text label under icon (e.g., 'command')
    this.width = keyData.width;
    this.x = keyData.x;
    this.y = keyData.y;
    this.colorName = keyData.color;
    this.isPressed = false;

    // Key dimensions and geometry parameters
    const keyWidth = this.width * KEY_UNIT - KEY_GAP;
    const keyDepth = KEY_UNIT - KEY_GAP;
    const baseHeight = 0.008;
    const taperOffset = 0.0018; // Slightly more taper for sculpted look
    this.keyWidth = keyWidth;
    this.keyDepth = keyDepth;
    this.baseHeight = baseHeight;
    this.row = Math.floor(keyData.y) + 1; // Row for profile (1=top function row, 5=bottom spacebar row)

    this.group = new THREE.Group();
    // Get current theme colors dynamically
    const colors = getColors();
    const baseColor = colors[this.colorName] || colors.alphaKeys;

    // Create realistic keycap geometry (with caching for performance)
    const isSpacebar = this.code === "Space";

    // Generate cache key based on dimensions that affect geometry
    const geomCacheKey = `${keyWidth.toFixed(4)}_${keyDepth.toFixed(4)}_${
      this.row
    }_rounded_${isSpacebar ? "space" : "std"}`;

    let keycapGeometry;
    if (geometryCache.has(geomCacheKey)) {
      keycapGeometry = geometryCache.get(geomCacheKey);
    } else {
      keycapGeometry = this.createRealisticKeycapGeometry(
        keyWidth,
        keyDepth,
        baseHeight,
        taperOffset,
        this.row,
      );
      geometryCache.set(geomCacheKey, keycapGeometry);
    }

    // Get cached material (cloned for per-key modifications)
    const keycapMaterial = getKeycapMaterial(baseColor);

    // Apply subtle per-key variations for realism
    const hsl = { h: 0, s: 0, l: 0 };
    keycapMaterial.color.getHSL(hsl);
    const satVar = (Math.random() - 0.5) * 0.02;
    const lightVar = (Math.random() - 0.5) * 0.025;
    keycapMaterial.color.setHSL(
      hsl.h,
      Math.max(0, Math.min(1, hsl.s + satVar)),
      Math.max(0.1, Math.min(0.95, hsl.l + lightVar)),
    );

    // Subtle roughness variation
    const roughnessVar = (Math.random() - 0.5) * 0.06;
    keycapMaterial.roughness = Math.max(
      0.35,
      Math.min(0.75, keycapMaterial.roughness + roughnessVar),
    );

    const keycap = new THREE.Mesh(keycapGeometry, keycapMaterial);
    keycap.position.y = 0; // Geometry is already centered/positioned in creator
    // Shadows disabled for performance - using fake shadows instead
    keycap.castShadow = false;
    keycap.receiveShadow = false;
    this.keycapMesh = keycap;
    this.originalColor = keycapMaterial.color.clone();
    this.group.add(keycap);

    // Add fake shadow plane under the key for visual depth
    this.createFakeShadow(keyWidth, keyDepth);

    // Add legend on top (calculating top surface dimensions based on taperOffset)
    const topWidth = Math.max(0.001, keyWidth - 2 * taperOffset);
    const topDepth = Math.max(0.001, keyDepth - 2 * taperOffset);
    const legendWidth = topWidth * 0.88;
    const legendDepth = topDepth * 0.88;
    this.legendDimensions = {
      width: legendWidth,
      depth: legendDepth,
      height: baseHeight,
    };

    if (this.label) {
      this.createLegend(legendWidth, legendDepth, baseHeight, baseColor);
    }

    // Position the key group
    const xPos = (this.x + this.width / 2) * KEY_UNIT;
    const zPos = (this.y + 0.5) * KEY_UNIT;
    this.group.position.set(xPos, 0, zPos);

    this.mesh = this.group;
  }

  createFakeShadow(keyWidth, keyDepth) {
    // Create a fixed directional shadow as if light comes from top-left
    // Uses SHARED texture for all keys - huge memory savings (70+ textures → 1)
    const shadowOffsetX = 0.0015; // Shadow offset to right (light from left)
    const shadowOffsetZ = 0.002; // Shadow offset to back (light from front)
    const shadowSize = 1.08; // Shadow slightly larger than key

    const shadowGeometry = new THREE.PlaneGeometry(
      keyWidth * shadowSize,
      keyDepth * shadowSize,
    );

    // Use shared shadow texture (created once, reused by all keys)
    const shadowTexture = getSharedShadowTexture();

    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.MultiplyBlending,
    });

    const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadowMesh.rotation.x = -Math.PI / 2; // Lay flat
    shadowMesh.position.y = -0.0005; // Just below the key base
    shadowMesh.position.x = shadowOffsetX; // Fixed offset for directional light
    shadowMesh.position.z = shadowOffsetZ;

    this.fakeShadowMesh = shadowMesh;
    this.group.add(shadowMesh);
  }

  createRealisticKeycapGeometry(width, depth, height, taperOffset, row = 3) {
    // FIXED: Increased segments 6→10 to avoid "low poly" look
    const segments = 10;
    const geometry = new THREE.BoxGeometry(
      width,
      height,
      depth,
      segments,
      segments,
      segments,
    );
    const position = geometry.attributes.position;
    const vector = new THREE.Vector3();

    const halfW = width / 2;
    const halfD = depth / 2;
    const halfH = height / 2;

    // Parameters for rounded style
    const cornerRadius = 0.0025;
    const topEdgeRadius = 0.0018;
    const scoopDepth = 0.0008;

    // Row-based profile adjustment
    const rowHeightAdjust = {
      1: 0.0006,
      2: 0.0003,
      3: 0.0,
      4: -0.0002,
      5: -0.0004,
    };
    const heightAdjust = rowHeightAdjust[row] || 0;

    for (let i = 0; i < position.count; i++) {
      vector.fromBufferAttribute(position, i);

      let x = vector.x;
      let y = vector.y;
      let z = vector.z;

      // 1. Tapering: Squeeze vertices based on height
      // height goes from -halfH to halfH
      // t is 0 at bottom, 1 at top
      const t = (y + halfH) / height;
      const currentTaper = t * taperOffset;

      // Apply taper (ensure we don't invert the geometry)
      const taperScaleX = (halfW - currentTaper) / halfW;
      const taperScaleZ = (halfD - currentTaper) / halfD;

      x *= taperScaleX;
      z *= taperScaleZ;

      // 2. Rounded Corners (Vertical)
      // We apply a soft clamp/round effect to the corners
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      const currentW = halfW - currentTaper;
      const currentD = halfD - currentTaper;

      const innerW = currentW - cornerRadius;
      const innerD = currentD - cornerRadius;

      if (absX > innerW && absZ > innerD) {
        // Vertex is in a corner region - apply rounded corner
        const dx = absX - innerW;
        const dz = absZ - innerD;

        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > cornerRadius) {
          const scale = cornerRadius / dist;
          x = (innerW + dx * scale) * Math.sign(x);
          z = (innerD + dz * scale) * Math.sign(z);
        }
      }

      // 3. Top Edge Rounding & Scoop
      if (y > halfH - topEdgeRadius * 2) {
        const dy = halfH - y;
        if (absX > currentW - topEdgeRadius) {
          const dx = absX - (currentW - topEdgeRadius);
          const dist = Math.sqrt(
            dx * dx + (topEdgeRadius - dy) * (topEdgeRadius - dy),
          );
          if (dist > topEdgeRadius && y > halfH - topEdgeRadius) {
            const scale = topEdgeRadius / dist;
          }
        }

        // Apply enhanced Cylindrical Scoop for non-spacebar keys
        if (this.code !== "Space" && y > halfH * 0.85) {
          // Cylindrical scoop along X axis (so curve is visible from front)
          // Scoop depth depends on distance from center X
          const normX = x / (currentW - cornerRadius);
          const normZ = z / (currentD - cornerRadius);
          // Combine X and Z for spherical-ish dish
          const scoopEffect = Math.max(
            0,
            1 - (normX * normX * 0.7 + normZ * normZ * 0.3),
          );
          // Gradual falloff near edges
          if (y > halfH * 0.9) {
            const yFactor = (y - halfH * 0.9) / (halfH * 0.1);
            y -= scoopEffect * scoopDepth * yFactor;
          }
        }
      }

      // Special case for Spacebar: Convex with enhanced curvature
      if (this.code === "Space" && y > 0) {
        const normZ = z / (currentD - cornerRadius);
        const convexEffect = Math.max(0, 1 - normZ * normZ);
        y += convexEffect * 0.002; // Slightly more pronounced convex
      }

      // Apply row-based height adjustment
      y += (heightAdjust * (y + halfH)) / height;

      position.setXYZ(i, x, y + halfH, z);
    }

    geometry.computeVertexNormals();

    // Shading is now handled by painted texture (getPaintedShadingTexture)
    // No vertex color calculations needed - maximum performance

    return geometry;
  }

  createLegend(width, depth, height, baseColor) {
    // Calculate proper aspect ratio for the legend
    const aspectRatio = width / depth;

    // Create canvas with proper aspect ratio to avoid distortion
    const canvas = document.createElement("canvas");
    // OPTIMIZED: Reduced 512→256 for less memory (+5 FPS)
    const baseSize = 256;
    // Make canvas match key aspect ratio for proper text scaling
    if (aspectRatio >= 1) {
      canvas.width = Math.round(baseSize * aspectRatio);
      canvas.height = baseSize;
    } else {
      canvas.width = baseSize;
      canvas.height = Math.round(baseSize / aspectRatio);
    }
    const ctx = canvas.getContext("2d");

    // Clear canvas for transparency (no background color)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // =====================================
    // Draw legend text (dual-legend support)
    // =====================================

    // Determine text color based on keycap color
    const useDarkText = ["alphaKeys", "modKeys", "accentYellow"].includes(
      this.colorName,
    );
    const textColor = useDarkText
      ? "rgba(60, 60, 65, 0.92)"
      : "rgba(255, 255, 255, 0.95)";

    ctx.fillStyle = textColor;

    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;

    // Check if this is a dual-legend key (has shiftLabel)

    if (this.shiftLabel) {
      // Dual-legend layout: shift character on top, main character below
      const shiftFontSize = canvasHeight * 0.32;
      ctx.font = `600 ${shiftFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.shiftLabel, canvasWidth / 2, canvasHeight * 0.3);

      const mainFontSize = canvasHeight * 0.38;
      ctx.font = `600 ${mainFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(this.label, canvasWidth / 2, canvasHeight * 0.68);
    } else if (this.subLabel) {
      // Special handling for Fn key (globe bottom-left, fn top-right)
      if (this.code === "Fn") {
        const padding = canvasWidth * 0.12;

        // "fn" text at top-right (smaller)
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        const fnFontSize = canvasHeight * 0.28;
        ctx.font = `600 ${fnFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(this.subLabel, canvasWidth - padding, padding);

        // Globe icon at bottom-left (larger)
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        const globeFontSize = canvasHeight * 0.35;
        ctx.font = `400 ${globeFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(this.label, padding, canvasHeight - padding);
      } else {
        // Icon + text label (like Apple modifier keys: ⌘ command)
        // Left-side modifier keys (x < 4.25) align right, right-side (x >= 10.75) align left
        const isLeftSide = this.x < 4.25;
        const isRightSide = this.x >= 10.75;

        let textAlign = "center";
        let xPos = canvasWidth / 2;
        const padding = canvasWidth * 0.12;

        if (isLeftSide) {
          textAlign = "right";
          xPos = canvasWidth - padding;
        } else if (isRightSide) {
          textAlign = "left";
          xPos = padding;
        }

        ctx.textAlign = textAlign;
        ctx.textBaseline = "middle";

        // Icon on top (larger)
        const iconFontSize = canvasHeight * 0.38;
        ctx.font = `600 ${iconFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(this.label, xPos, canvasHeight * 0.35);

        // Text label below (smaller)
        const textFontSize = canvasHeight * 0.21;
        ctx.font = `600 ${textFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(this.subLabel, xPos, canvasHeight * 0.72);
      }
    } else {
      // Single legend - centered
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let fontSize = canvasHeight * 0.4;
      let fontWeight = "600";

      if (this.label.length === 1) {
        fontSize = canvasHeight * 0.55;
      } else if (this.label.length === 2) {
        fontSize = canvasHeight * 0.4;
      } else if (this.label.length <= 4) {
        fontSize = canvasHeight * 0.24;
      } else {
        fontSize = canvasHeight * 0.22;
      }

      ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(this.label, canvasWidth / 2, canvasHeight / 2);
    }

    // Create texture with proper settings for seamless appearance
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    // Create top face plane with matching dimensions
    const topGeometry = new THREE.PlaneGeometry(width, depth);

    // OPTIMIZED: MeshBasicMaterial for legend (cheapest - no lighting calc)
    const topMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });

    const topFace = new THREE.Mesh(topGeometry, topMaterial);
    topFace.rotation.x = -Math.PI / 2;
    // Place legend exactly on keycap surface - account for scoop depth
    // Use very small offset (0.00005) to sit flush against surface
    topFace.position.y = height - 0.00005;
    this.legendMesh = topFace;
    this.legendCanvas = canvas;
    this.legendBaseColor = baseColor;
    this.group.add(topFace);
  }

  updateLabel(newLabel) {
    if (!this.legendMesh || !this.legendDimensions) return;

    this.label = newLabel;

    // Clear old canvas reference to help GC
    if (this.legendCanvas) {
      this.legendCanvas.width = 0;
      this.legendCanvas.height = 0;
    }

    // Calculate proper aspect ratio for the legend
    const { width, depth } = this.legendDimensions;
    const aspectRatio = width / depth;

    // Recreate the legend texture with proper aspect ratio
    const canvas = document.createElement("canvas");
    const baseSize = 512;
    if (aspectRatio >= 1) {
      canvas.width = Math.round(baseSize * aspectRatio);
      canvas.height = baseSize;
    } else {
      canvas.width = baseSize;
      canvas.height = Math.round(baseSize / aspectRatio);
    }
    const ctx = canvas.getContext("2d");

    // Clear canvas for transparency (no background color)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // NOTE: Removed sculpting gradients and edge highlights
    // These were causing a visible rectangle overlay on the keycap

    // =====================================
    // Draw legend text

    // Determine text color
    const useDarkText = ["alphaKeys", "modKeys", "accentYellow"].includes(
      this.colorName,
    );
    const textColor = useDarkText
      ? "rgba(60, 60, 65, 0.92)"
      : "rgba(255, 255, 255, 0.95)";

    ctx.fillStyle = textColor;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontSize = canvasHeight * 0.4;
    if (newLabel.length === 1) fontSize = canvasHeight * 0.45;
    else if (newLabel.length === 2) fontSize = canvasHeight * 0.35;
    else if (newLabel.length <= 4) fontSize = canvasHeight * 0.22;
    else fontSize = canvasHeight * 0.18;

    ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(newLabel, canvasWidth / 2, canvasHeight / 2);

    // Update texture with proper filter settings
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.colorSpace = THREE.SRGBColorSpace;
    newTexture.minFilter = THREE.LinearFilter;
    newTexture.magFilter = THREE.LinearFilter;
    newTexture.generateMipmaps = false;

    // Dispose old texture and apply new
    if (this.legendMesh.material.map) {
      this.legendMesh.material.map.dispose();
    }
    this.legendMesh.material.map = newTexture;
    this.legendMesh.material.needsUpdate = true;
  }

  press() {
    if (this.isPressed) return;
    this.isPressed = true;
    this.targetY = this.originalY - 0.003;

    // Lighten key color
    if (this.keycapMesh && this.originalColor) {
      const hsl = {};
      this.originalColor.getHSL(hsl);
      const lightenedColor = new THREE.Color().setHSL(
        hsl.h,
        hsl.s,
        Math.min(1, hsl.l + 0.2),
      );
      this.keycapMesh.material.color.copy(lightenedColor);
    }
  }

  release() {
    if (!this.isPressed) return;
    this.isPressed = false;
    this.targetY = this.originalY;

    // Restore original color
    if (this.keycapMesh && this.originalColor) {
      this.keycapMesh.material.color.copy(this.originalColor);
    }
  }

  update(deltaTime) {
    if (this.targetY !== undefined) {
      const speed = 30;
      const diff = this.targetY - this.group.position.y;

      if (Math.abs(diff) > 0.0001) {
        this.group.position.y += diff * speed * deltaTime;
      } else {
        this.group.position.y = this.targetY;
      }
    }
  }
}
