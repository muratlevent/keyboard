// Settings Manager - Handles OS layout and app settings

let currentLayout = 'macos' // Default to macOS

// OS-specific key labels
export const KEY_LABELS_MACOS = {
  'MetaLeft': '⌘',
  'MetaRight': '⌘',
  'AltLeft': '⌥',
  'AltRight': '⌥',
  'ControlLeft': '⌃',
  'ControlRight': '⌃',
  'Space': 'Space',
  'Escape': 'Esc',
  'Backspace': '⌫',
  'Tab': '⇥',
  'CapsLock': '⇪',
  'ShiftLeft': '⇧',
  'ShiftRight': '⇧',
  'Enter': '↵',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'ArrowLeft': '←',
  'ArrowRight': '→',
}

export const KEY_LABELS_WINDOWS = {
  'MetaLeft': '⊞ Win',
  'MetaRight': '⊞ Win',
  'AltLeft': 'Alt',
  'AltRight': 'Alt',
  'ControlLeft': 'Ctrl',
  'ControlRight': 'Ctrl',
  'Space': 'Space',
  'Escape': 'Esc',
  'Backspace': '⌫',
  'Tab': 'Tab',
  'CapsLock': 'Caps',
  'ShiftLeft': 'Shift',
  'ShiftRight': 'Shift',
  'Enter': 'Enter',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'ArrowLeft': '←',
  'ArrowRight': '→',
}

export function getCurrentLayout() {
  return currentLayout
}

export function setLayout(layout) {
  currentLayout = layout
  // Dispatch event for any listeners
  window.dispatchEvent(new CustomEvent('layoutchange', { detail: layout }))
}

export function getKeyLabel(code, key) {
  const labels = currentLayout === 'macos' ? KEY_LABELS_MACOS : KEY_LABELS_WINDOWS
  
  // If we have a specific label for this code, use it
  if (labels[code]) {
    return labels[code]
  }
  
  // For single character keys, return uppercase
  if (key && key.length === 1) {
    return key.toUpperCase()
  }
  
  // For other keys, return the key name
  return key || code
}

// Keycap labels for 3D keyboard legends (shorter symbols for keycaps)
export const KEYCAP_LABELS_MACOS = {
  'MetaLeft': '⌘',
  'MetaRight': '⌘',
  'AltLeft': '⌥',
  'AltRight': '⌥',
}

export const KEYCAP_LABELS_WINDOWS = {
  'MetaLeft': '⊞',
  'MetaRight': '⊞',
  'AltLeft': 'Alt',
  'AltRight': 'Alt',
}

export function getKeycapLabel(code, defaultLabel) {
  const labels = currentLayout === 'macos' ? KEYCAP_LABELS_MACOS : KEYCAP_LABELS_WINDOWS
  return labels[code] || defaultLabel
}

// Lighting Settings
let lightingSettings = {
  enabled: true,
  brightness: 50,       // 0-100
  color: '#00ffff',     // Hex color
  effect: 'cycle'       // stable, pulse, cycle, gemini
}

export function getLightingSettings() {
  return { ...lightingSettings }
}

export function setLightingEnabled(enabled) {
  lightingSettings.enabled = enabled
  dispatchLightingChange()
}

export function setLightingBrightness(brightness) {
  lightingSettings.brightness = Math.max(0, Math.min(100, brightness))
  dispatchLightingChange()
}

export function setLightingColor(color) {
  lightingSettings.color = color
  dispatchLightingChange()
}

export function setLightingEffect(effect) {
  lightingSettings.effect = effect
  dispatchLightingChange()
}

function dispatchLightingChange() {
  window.dispatchEvent(new CustomEvent('lightingchange', { 
    detail: { ...lightingSettings }
  }))
}

// Dark Mode
let darkMode = false

export function getDarkMode() {
  return darkMode
}

export function setDarkMode(enabled) {
  darkMode = enabled
  window.dispatchEvent(new CustomEvent('darkmodechange', { detail: enabled }))
}
