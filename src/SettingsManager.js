// Settings Manager - Handles OS layout, themes, and app settings

let currentLayout = 'macos' // Default to macOS
let currentTheme = 'default' // Default theme

// =====================================
// Keyboard Color Themes
// =====================================
export const KEYBOARD_THEMES = {
  default: {
    name: 'Classic',
    colors: {
      alphaKeys: 0xf8f8f8,     // Warm white
      modKeys: 0xb5bac0,       // Light gray
      accentEsc: 0x4dd4c4,     // Mint/Teal
      accentEnter: 0xe85d4c,   // Coral
      accentSpace: 0xf5c836,   // Golden Yellow
      keyboardCase: 0xf2f4f6,  // Off-white
      caseDark: 0xe5e7ea,      // Light gray plate
    }
  },
  slate: {
    name: 'Slate Gray',
    colors: {
      alphaKeys: 0xd8dce3,     // Cool gray-white
      modKeys: 0x9ca3af,       // Medium gray
      accentEsc: 0x6366f1,     // Indigo
      accentEnter: 0x8b5cf6,   // Purple
      accentSpace: 0xa5b4c4,   // Steel blue
      keyboardCase: 0xc8cdd5,  // Light slate
      caseDark: 0xb0b8c4,      // Slate plate
    }
  },
  arctic: {
    name: 'Arctic Blue',
    colors: {
      alphaKeys: 0xeef4f8,     // Ice white
      modKeys: 0xa8c5d9,       // Soft blue-gray
      accentEsc: 0x4a90d9,     // Sky blue
      accentEnter: 0x2563eb,   // Bold blue
      accentSpace: 0x7dd3fc,   // Light cyan
      keyboardCase: 0xe0eaf3,  // Pale blue
      caseDark: 0xc5d5e5,      // Blue-gray plate
    }
  },
  midnight: {
    name: 'Midnight Navy',
    colors: {
      alphaKeys: 0xc8d4e8,     // Soft blue-white
      modKeys: 0x7890b0,       // Navy gray
      accentEsc: 0x3b82f6,     // Royal blue
      accentEnter: 0x1d4ed8,   // Deep blue
      accentSpace: 0x60a5fa,   // Sky blue
      keyboardCase: 0xb8c8e0,  // Blue-gray
      caseDark: 0x94a8c8,      // Deep blue-gray plate
    }
  },
  sunset: {
    name: 'Sunset Glow',
    colors: {
      alphaKeys: 0xfff5eb,     // Warm cream
      modKeys: 0xffc9a8,       // Peach
      accentEsc: 0xff6b6b,     // Coral red
      accentEnter: 0xff8c42,   // Tangerine
      accentSpace: 0xffd93d,   // Sunshine yellow
      keyboardCase: 0xffeedd,  // Warm white
      caseDark: 0xf5d5c5,      // Peachy plate
    }
  },
  forest: {
    name: 'Forest Green',
    colors: {
      alphaKeys: 0xf0f5f0,     // Soft sage white
      modKeys: 0xa8c5a8,       // Sage green
      accentEsc: 0x2d8a5e,     // Emerald
      accentEnter: 0x4ade80,   // Bright green
      accentSpace: 0xbef264,   // Lime
      keyboardCase: 0xe8f0e8,  // Mint white
      caseDark: 0xc5d8c5,      // Green-gray plate
    }
  },
  lavender: {
    name: 'Lavender Dream',
    colors: {
      alphaKeys: 0xf8f5fc,     // Soft lavender white
      modKeys: 0xd4c5e8,       // Light purple
      accentEsc: 0xa855f7,     // Vivid purple
      accentEnter: 0xec4899,   // Pink
      accentSpace: 0xc084fc,   // Orchid
      keyboardCase: 0xf3e8f8,  // Lavender tint
      caseDark: 0xe0d0ea,      // Purple-gray plate
    }
  },
  rosegold: {
    name: 'Rose Gold',
    colors: {
      alphaKeys: 0xfff5f5,     // Soft pink white
      modKeys: 0xf0c8c8,       // Dusty rose
      accentEsc: 0xf472b6,     // Hot pink
      accentEnter: 0xfb7185,   // Coral pink
      accentSpace: 0xfcd34d,   // Gold
      keyboardCase: 0xfce7e7,  // Rose tint
      caseDark: 0xe8d0d0,      // Rose plate
    }
  },
  ocean: {
    name: 'Ocean Depths',
    colors: {
      alphaKeys: 0xe8f4f8,     // Sea foam white
      modKeys: 0x94d2e5,       // Aqua
      accentEsc: 0x0ea5e9,     // Bright cyan
      accentEnter: 0x06b6d4,   // Teal
      accentSpace: 0x22d3ee,   // Light cyan
      keyboardCase: 0xd0ecf4,  // Pale aqua
      caseDark: 0xb0d8e8,      // Aqua plate
    }
  },
  monochrome: {
    name: 'Monochrome',
    colors: {
      alphaKeys: 0xffffff,     // Pure white
      modKeys: 0xe0e0e0,       // Light gray
      accentEsc: 0x404040,     // Dark gray
      accentEnter: 0x606060,   // Medium gray
      accentSpace: 0xc0c0c0,   // Silver
      keyboardCase: 0xf0f0f0,  // White
      caseDark: 0xd0d0d0,      // Gray plate
    }
  },
  retro: {
    name: 'Retro Beige',
    colors: {
      alphaKeys: 0xf5f0e6,     // Vintage cream
      modKeys: 0xd4c8b0,       // Beige
      accentEsc: 0xc9a227,     // Mustard yellow
      accentEnter: 0xb85c38,   // Rust orange
      accentSpace: 0xe8dcc8,   // Light tan
      keyboardCase: 0xe8e0d0,  // Cream
      caseDark: 0xd0c8b8,      // Tan plate
    }
  },
  coral: {
    name: 'Coral Reef',
    colors: {
      alphaKeys: 0xfff0f0,     // Soft coral white
      modKeys: 0xf8b4b4,       // Light coral
      accentEsc: 0x14b8a6,     // Teal
      accentEnter: 0xf97316,   // Orange
      accentSpace: 0xfbbf24,   // Amber
      keyboardCase: 0xfce8e8,  // Pink tint
      caseDark: 0xf0d0d0,      // Coral plate
    }
  },
}

export function getCurrentTheme() {
  return currentTheme
}

export function setTheme(themeName) {
  if (KEYBOARD_THEMES[themeName]) {
    currentTheme = themeName
    window.dispatchEvent(new CustomEvent('themechange', { detail: themeName }))
  }
}

export function getThemeColors() {
  return KEYBOARD_THEMES[currentTheme]?.colors || KEYBOARD_THEMES.default.colors
}

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
  enabled: false,        // Default off
  brightness: 50,        // 0-100
  color: '#00ffff',      // Hex color
  effect: 'cycle'        // stable, pulse, cycle, gemini
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
