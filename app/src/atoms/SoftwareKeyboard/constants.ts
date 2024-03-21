export const customDisplay = {
  '{numbers}': '123',
  '{shift}': 'SHIFT',
  '{space}': 'space',
  '{backspace}': 'del',
  '{abc}': 'abc',
  '{ABC}': 'ABC',
  '{symbols}': '#+=',
}

// keyboard layout for Alphanumeric Keyboard
export const alphanumericLayout = {
  default: [
    'q w e r t y u i o p',
    '{numbers} a s d f g h j k l',
    '{ABC} z x c v b n m {backspace}',
  ],
  shift: [
    'Q W E R T Y U I O P',
    '{numbers} A S D F G H J K L',
    '{abc} Z X C V B N M {backspace}',
  ],
  numbers: ['1 2 3', '4 5 6', '7 8 9', '{abc} 0 {backspace}'],
}
