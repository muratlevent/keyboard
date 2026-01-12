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
