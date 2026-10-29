import chineseLayout from 'simple-keyboard-layouts/build/layouts/chinese'

type LayoutCandidates =
  | {
      [key: string]: string
    }
  | undefined

/**
 * Hack:
 *
 * Software keyboard buttons render as non-focusable <div>s (`useButtonTag={false}`) so
 * they stay out of tab order and don't steal focus from inputs. This is OK. However,
 * we have a lot of preexisting tests that were expecting real <button>s and looking
 * for `role="button"`. This restores the role for the tests' sake.
 *
 * This is a half-measure and a lie to accessibility tech. We could use real
 * <button>s and fix the focusability issues in some other way (but beware of
 * issues like https://github.com/hodgef/react-simple-keyboard/issues/44).
 * Or we could rewrite the tests to not rely on `role`.
 */
export const softwareKeyboardButtonAttributes = [
  { attribute: 'role', value: 'button' },
]

export const customDisplay = {
  '{numbers}': '123',
  '{shift}': 'ABC',
  '{space}': 'space',
  '{backspace}': 'del',
  '{abc}': 'abc',
  '{ABC}': 'ABC',
  '{symbols}': '#+=',
  '{globe}': '',
  '{return}': 'return',
}

export const customDisplayForIndividual = {
  '{backspace}': 'del',
}

// keyboard layout for Alphanumeric Keyboard
export const alphanumericKeyboardLayout = {
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

// keyboard layout for Full Keyboard
export const fullKeyboardLayout = {
  default: [
    'q w e r t y u i o p',
    '{numbers} a s d f g h j k l',
    '{shift} z x c v b n m {backspace}',
    '{globe} {space} {return}',
  ],
  shift: [
    'Q W E R T Y U I O P',
    '{numbers} A S D F G H J K L',
    '{shift} Z X C V B N M {backspace}',
    '{globe} {space} {return}',
  ],
  symbols: [
    '[ ] { } % ^ +',
    '{abc} _ \\ | < > # =',
    "{numbers} . , ? ! ' * ~ {backspace}",
    '{globe} {space} {return}',
  ],
  numbers: [
    '1 2 3 4 5 6 7 8 9 0',
    '{abc} - / : ; ( ) $ & @ "',
    "{symbols} . , ? ! ' * ~ {backspace}",
    '{globe} {space} {return}',
  ],
}

// Numerical keyboard layout
export const numericalKeyboardLayout = {
  // int without negative value
  intKeyboard: ['1 2 3', '4 5 6', '7 8 9', '0 {backspace}'],

  // int with negative value
  intNegKeyboard: ['1 2 3', '4 5 6', '7 8 9', '0 - {backspace}'],

  // float without negative value,
  floatKeyboard: ['1 2 3', '4 5 6', '7 8 9', '0 . {backspace}'],

  // float with negative value
  floatNegKeyboard: ['1 2 3', '4 5 6', '7 8 9', '0 . - {backspace}'],
}

export const numericalCustom = {
  '{backspace}': 'del',
}

export const layoutCandidates: {
  [key: string]: LayoutCandidates
} = {
  // @ts-expect-error layout candidates exists but is not on the type
  // in the simple-keyboard-layouts package
  'zh-CN': chineseLayout.layoutCandidates,
  'en-US': undefined,
}
