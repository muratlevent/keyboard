// 65% Keyboard Layout Data
// Based on reference image with dark grey main keys and light grey modifiers

export const COLORS = {
  darkGrey: 0x505050,      // Main alphanumeric keys
  lightGrey: 0xe0e0e0,     // Modifier keys (Shift, Ctrl, etc.)
  escBlack: 0x2d2d2d,      // Escape key
  enterDark: 0x3d3d3d,     // Enter key
  keyboardCase: 0xc5c5c5,  // Aluminum case color (silver-white)
  caseDark: 0x252525,      // Case plate (dark gunmetal)
}

// Key sizes in units (1 unit = standard key width)
export const KEY_UNIT = 0.019  // 19mm per unit in meters
export const KEY_GAP = 0.001   // 1mm gap

// Key definitions: [keyCode, label, width, x, y, color]
// x and y are in units from top-left
export const KEYBOARD_LAYOUT = [
  // Row 0 - Number row
  { code: 'Escape', label: 'Esc', width: 1, x: 0, y: 0, color: 'escBlack' },
  { code: 'Digit1', label: '1', width: 1, x: 1, y: 0, color: 'darkGrey' },
  { code: 'Digit2', label: '2', width: 1, x: 2, y: 0, color: 'darkGrey' },
  { code: 'Digit3', label: '3', width: 1, x: 3, y: 0, color: 'darkGrey' },
  { code: 'Digit4', label: '4', width: 1, x: 4, y: 0, color: 'darkGrey' },
  { code: 'Digit5', label: '5', width: 1, x: 5, y: 0, color: 'darkGrey' },
  { code: 'Digit6', label: '6', width: 1, x: 6, y: 0, color: 'darkGrey' },
  { code: 'Digit7', label: '7', width: 1, x: 7, y: 0, color: 'darkGrey' },
  { code: 'Digit8', label: '8', width: 1, x: 8, y: 0, color: 'darkGrey' },
  { code: 'Digit9', label: '9', width: 1, x: 9, y: 0, color: 'darkGrey' },
  { code: 'Digit0', label: '0', width: 1, x: 10, y: 0, color: 'darkGrey' },
  { code: 'Minus', label: '-', width: 1, x: 11, y: 0, color: 'darkGrey' },
  { code: 'Equal', label: '=', width: 1, x: 12, y: 0, color: 'darkGrey' },
  { code: 'Backspace', label: '←', width: 2, x: 13, y: 0, color: 'lightGrey' },
  { code: 'Home', label: 'Home', width: 1, x: 15, y: 0, color: 'lightGrey' },

  // Row 1 - QWERTY row
  { code: 'Tab', label: 'Tab', width: 1.5, x: 0, y: 1, color: 'lightGrey' },
  { code: 'KeyQ', label: 'Q', width: 1, x: 1.5, y: 1, color: 'darkGrey' },
  { code: 'KeyW', label: 'W', width: 1, x: 2.5, y: 1, color: 'darkGrey' },
  { code: 'KeyE', label: 'E', width: 1, x: 3.5, y: 1, color: 'darkGrey' },
  { code: 'KeyR', label: 'R', width: 1, x: 4.5, y: 1, color: 'darkGrey' },
  { code: 'KeyT', label: 'T', width: 1, x: 5.5, y: 1, color: 'darkGrey' },
  { code: 'KeyY', label: 'Y', width: 1, x: 6.5, y: 1, color: 'darkGrey' },
  { code: 'KeyU', label: 'U', width: 1, x: 7.5, y: 1, color: 'darkGrey' },
  { code: 'KeyI', label: 'I', width: 1, x: 8.5, y: 1, color: 'darkGrey' },
  { code: 'KeyO', label: 'O', width: 1, x: 9.5, y: 1, color: 'darkGrey' },
  { code: 'KeyP', label: 'P', width: 1, x: 10.5, y: 1, color: 'darkGrey' },
  { code: 'BracketLeft', label: '[', width: 1, x: 11.5, y: 1, color: 'darkGrey' },
  { code: 'BracketRight', label: ']', width: 1, x: 12.5, y: 1, color: 'darkGrey' },
  { code: 'Backslash', label: '\\', width: 1.5, x: 13.5, y: 1, color: 'lightGrey' },
  { code: 'PageUp', label: 'PgUp', width: 1, x: 15, y: 1, color: 'lightGrey' },

  // Row 2 - Home row
  { code: 'CapsLock', label: 'Caps', width: 1.75, x: 0, y: 2, color: 'lightGrey' },
  { code: 'KeyA', label: 'A', width: 1, x: 1.75, y: 2, color: 'darkGrey' },
  { code: 'KeyS', label: 'S', width: 1, x: 2.75, y: 2, color: 'darkGrey' },
  { code: 'KeyD', label: 'D', width: 1, x: 3.75, y: 2, color: 'darkGrey' },
  { code: 'KeyF', label: 'F', width: 1, x: 4.75, y: 2, color: 'darkGrey' },
  { code: 'KeyG', label: 'G', width: 1, x: 5.75, y: 2, color: 'darkGrey' },
  { code: 'KeyH', label: 'H', width: 1, x: 6.75, y: 2, color: 'darkGrey' },
  { code: 'KeyJ', label: 'J', width: 1, x: 7.75, y: 2, color: 'darkGrey' },
  { code: 'KeyK', label: 'K', width: 1, x: 8.75, y: 2, color: 'darkGrey' },
  { code: 'KeyL', label: 'L', width: 1, x: 9.75, y: 2, color: 'darkGrey' },
  { code: 'Semicolon', label: ';', width: 1, x: 10.75, y: 2, color: 'darkGrey' },
  { code: 'Quote', label: "'", width: 1, x: 11.75, y: 2, color: 'darkGrey' },
  { code: 'Enter', label: 'Enter', width: 2.25, x: 12.75, y: 2, color: 'enterDark' },
  { code: 'PageDown', label: 'PgDn', width: 1, x: 15, y: 2, color: 'lightGrey' },

  // Row 3 - Shift row
  { code: 'ShiftLeft', label: 'Shift', width: 2.25, x: 0, y: 3, color: 'lightGrey' },
  { code: 'KeyZ', label: 'Z', width: 1, x: 2.25, y: 3, color: 'darkGrey' },
  { code: 'KeyX', label: 'X', width: 1, x: 3.25, y: 3, color: 'darkGrey' },
  { code: 'KeyC', label: 'C', width: 1, x: 4.25, y: 3, color: 'darkGrey' },
  { code: 'KeyV', label: 'V', width: 1, x: 5.25, y: 3, color: 'darkGrey' },
  { code: 'KeyB', label: 'B', width: 1, x: 6.25, y: 3, color: 'darkGrey' },
  { code: 'KeyN', label: 'N', width: 1, x: 7.25, y: 3, color: 'darkGrey' },
  { code: 'KeyM', label: 'M', width: 1, x: 8.25, y: 3, color: 'darkGrey' },
  { code: 'Comma', label: ',', width: 1, x: 9.25, y: 3, color: 'darkGrey' },
  { code: 'Period', label: '.', width: 1, x: 10.25, y: 3, color: 'darkGrey' },
  { code: 'Slash', label: '/', width: 1, x: 11.25, y: 3, color: 'darkGrey' },
  { code: 'ShiftRight', label: 'Shift', width: 1.75, x: 12.25, y: 3, color: 'lightGrey' },
  { code: 'ArrowUp', label: '↑', width: 1, x: 14, y: 3, color: 'lightGrey' },
  { code: 'End', label: 'End', width: 1, x: 15, y: 3, color: 'lightGrey' },

  // Row 4 - Bottom row
  { code: 'ControlLeft', label: 'Ctrl', width: 1.25, x: 0, y: 4, color: 'lightGrey' },
  { code: 'MetaLeft', label: '⌘', width: 1.25, x: 1.25, y: 4, color: 'lightGrey' },
  { code: 'AltLeft', label: 'Alt', width: 1.25, x: 2.5, y: 4, color: 'lightGrey' },
  { code: 'Space', label: '', width: 6.25, x: 3.75, y: 4, color: 'lightGrey' },
  { code: 'AltRight', label: 'Alt', width: 1, x: 10, y: 4, color: 'lightGrey' },
  { code: 'Fn', label: 'Fn', width: 1, x: 11, y: 4, color: 'lightGrey' },
  { code: 'ControlRight', label: 'Ctrl', width: 1, x: 12, y: 4, color: 'lightGrey' },
  { code: 'ArrowLeft', label: '←', width: 1, x: 13, y: 4, color: 'lightGrey' },
  { code: 'ArrowDown', label: '↓', width: 1, x: 14, y: 4, color: 'lightGrey' },
  { code: 'ArrowRight', label: '→', width: 1, x: 15, y: 4, color: 'lightGrey' },
]

// Keyboard dimensions
export const KEYBOARD_WIDTH = 16 * KEY_UNIT + 15 * KEY_GAP  // 16 keys wide
export const KEYBOARD_HEIGHT = 5 * KEY_UNIT + 4 * KEY_GAP   // 5 rows
export const CASE_PADDING = 0.008  // Extra padding around keys
export const CASE_HEIGHT = 0.012   // Case thickness
