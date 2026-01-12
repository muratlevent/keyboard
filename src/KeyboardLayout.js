// 65% Keyboard Layout Data
// Based on NuPhy Halo reference

export const COLORS = {
  alphaKeys: 0xf8f8f8,     // Warm white alphanumeric keys
  modKeys: 0xb5bac0,       // Light gray modifiers (matching reference)
  accentTeal: 0x4dd4c4,    // Mint/Teal Escape key
  accentOrange: 0xe85d4c,  // Coral/Salmon Enter key
  accentYellow: 0xf5c836,  // Golden Yellow Spacebar
  keyboardCase: 0xf2f4f6,  // Off-white case
  caseDark: 0xe5e7ea,      // Light gray plate
}

// Key sizes in units (1 unit = standard key width ~19.05mm)
export const KEY_UNIT = 0.019  // 19mm per unit
export const KEY_GAP = 0.0015  // 1.5mm gap between keys

// Full 65% layout with proper labels and shift labels for dual-legend keys
export const KEYBOARD_LAYOUT = [
  // Row 0 - Number row (Esc, 1-9, 0, -, =, Backspace, Home)
  { code: 'Escape', label: 'Esc', width: 1, x: 0, y: 0, color: 'accentTeal' },
  { code: 'Digit1', label: '1', shiftLabel: '!', width: 1, x: 1, y: 0, color: 'alphaKeys' },
  { code: 'Digit2', label: '2', shiftLabel: '@', width: 1, x: 2, y: 0, color: 'alphaKeys' },
  { code: 'Digit3', label: '3', shiftLabel: '#', width: 1, x: 3, y: 0, color: 'alphaKeys' },
  { code: 'Digit4', label: '4', shiftLabel: '$', width: 1, x: 4, y: 0, color: 'alphaKeys' },
  { code: 'Digit5', label: '5', shiftLabel: '%', width: 1, x: 5, y: 0, color: 'alphaKeys' },
  { code: 'Digit6', label: '6', shiftLabel: '^', width: 1, x: 6, y: 0, color: 'alphaKeys' },
  { code: 'Digit7', label: '7', shiftLabel: '&', width: 1, x: 7, y: 0, color: 'alphaKeys' },
  { code: 'Digit8', label: '8', shiftLabel: '*', width: 1, x: 8, y: 0, color: 'alphaKeys' },
  { code: 'Digit9', label: '9', shiftLabel: '(', width: 1, x: 9, y: 0, color: 'alphaKeys' },
  { code: 'Digit0', label: '0', shiftLabel: ')', width: 1, x: 10, y: 0, color: 'alphaKeys' },
  { code: 'Minus', label: '-', shiftLabel: '_', width: 1, x: 11, y: 0, color: 'alphaKeys' },
  { code: 'Equal', label: '=', shiftLabel: '+', width: 1, x: 12, y: 0, color: 'alphaKeys' },
  { code: 'Backspace', label: '⌫', width: 2, x: 13, y: 0, color: 'modKeys' },
  { code: 'Home', label: 'Home', width: 1, x: 15, y: 0, color: 'modKeys' },

  // Row 1 - QWERTY row (macOS labels by default)
  { code: 'Tab', label: '⇥', width: 1.5, x: 0, y: 1, color: 'modKeys' },
  { code: 'KeyQ', label: 'Q', width: 1, x: 1.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyW', label: 'W', width: 1, x: 2.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyE', label: 'E', width: 1, x: 3.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyR', label: 'R', width: 1, x: 4.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyT', label: 'T', width: 1, x: 5.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyY', label: 'Y', width: 1, x: 6.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyU', label: 'U', width: 1, x: 7.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyI', label: 'I', width: 1, x: 8.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyO', label: 'O', width: 1, x: 9.5, y: 1, color: 'alphaKeys' },
  { code: 'KeyP', label: 'P', width: 1, x: 10.5, y: 1, color: 'alphaKeys' },
  { code: 'BracketLeft', label: '[', shiftLabel: '{', width: 1, x: 11.5, y: 1, color: 'alphaKeys' },
  { code: 'BracketRight', label: ']', shiftLabel: '}', width: 1, x: 12.5, y: 1, color: 'alphaKeys' },
  { code: 'Backslash', label: '\\', shiftLabel: '|', width: 1.5, x: 13.5, y: 1, color: 'modKeys' },
  { code: 'PageUp', label: 'PgUp', width: 1, x: 15, y: 1, color: 'modKeys' },

  // Row 2 - Home row
  { code: 'CapsLock', label: '⇪', width: 1.75, x: 0, y: 2, color: 'modKeys' },
  { code: 'KeyA', label: 'A', width: 1, x: 1.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyS', label: 'S', width: 1, x: 2.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyD', label: 'D', width: 1, x: 3.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyF', label: 'F', width: 1, x: 4.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyG', label: 'G', width: 1, x: 5.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyH', label: 'H', width: 1, x: 6.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyJ', label: 'J', width: 1, x: 7.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyK', label: 'K', width: 1, x: 8.75, y: 2, color: 'alphaKeys' },
  { code: 'KeyL', label: 'L', width: 1, x: 9.75, y: 2, color: 'alphaKeys' },
  { code: 'Semicolon', label: ';', shiftLabel: ':', width: 1, x: 10.75, y: 2, color: 'alphaKeys' },
  { code: 'Quote', label: "'", shiftLabel: '"', width: 1, x: 11.75, y: 2, color: 'alphaKeys' },
  { code: 'Enter', label: '↵', width: 2.25, x: 12.75, y: 2, color: 'accentOrange' },
  { code: 'PageDown', label: 'PgDn', width: 1, x: 15, y: 2, color: 'modKeys' },

  // Row 3 - Shift row
  { code: 'ShiftLeft', label: '⇧', width: 2.25, x: 0, y: 3, color: 'modKeys' },
  { code: 'KeyZ', label: 'Z', width: 1, x: 2.25, y: 3, color: 'alphaKeys' },
  { code: 'KeyX', label: 'X', width: 1, x: 3.25, y: 3, color: 'alphaKeys' },
  { code: 'KeyC', label: 'C', width: 1, x: 4.25, y: 3, color: 'alphaKeys' },
  { code: 'KeyV', label: 'V', width: 1, x: 5.25, y: 3, color: 'alphaKeys' },
  { code: 'KeyB', label: 'B', width: 1, x: 6.25, y: 3, color: 'alphaKeys' },
  { code: 'KeyN', label: 'N', width: 1, x: 7.25, y: 3, color: 'alphaKeys' },
  { code: 'KeyM', label: 'M', width: 1, x: 8.25, y: 3, color: 'alphaKeys' },
  { code: 'Comma', label: ',', shiftLabel: '<', width: 1, x: 9.25, y: 3, color: 'alphaKeys' },
  { code: 'Period', label: '.', shiftLabel: '>', width: 1, x: 10.25, y: 3, color: 'alphaKeys' },
  { code: 'Slash', label: '/', shiftLabel: '?', width: 1, x: 11.25, y: 3, color: 'alphaKeys' },
  { code: 'ShiftRight', label: '⇧', width: 1.75, x: 12.25, y: 3, color: 'modKeys' },
  { code: 'ArrowUp', label: '↑', width: 1, x: 14, y: 3, color: 'modKeys' },
  { code: 'End', label: 'End', width: 1, x: 15, y: 3, color: 'modKeys' },

  // Row 4 - Bottom row (macOS layout)
  { code: 'ControlLeft', label: '⌃', width: 1.25, x: 0, y: 4, color: 'modKeys' },
  { code: 'MetaLeft', label: '⌘', width: 1.25, x: 1.25, y: 4, color: 'modKeys' },
  { code: 'AltLeft', label: '⌥', width: 1.25, x: 2.5, y: 4, color: 'modKeys' },
  { code: 'Space', label: '', width: 6.25, x: 3.75, y: 4, color: 'accentYellow' },
  { code: 'AltRight', label: '⌥', width: 1, x: 10, y: 4, color: 'modKeys' },
  { code: 'MetaRight', label: '⌘', width: 1, x: 11, y: 4, color: 'modKeys' },
  { code: 'Fn', label: 'Fn', width: 1, x: 12, y: 4, color: 'modKeys' },
  { code: 'ArrowLeft', label: '←', width: 1, x: 13, y: 4, color: 'modKeys' },
  { code: 'ArrowDown', label: '↓', width: 1, x: 14, y: 4, color: 'modKeys' },
  { code: 'ArrowRight', label: '→', width: 1, x: 15, y: 4, color: 'modKeys' },
]

// Keyboard dimensions (16 units wide, 5 rows)
export const KEYBOARD_WIDTH = 16 * KEY_UNIT
export const KEYBOARD_HEIGHT = 5 * KEY_UNIT
