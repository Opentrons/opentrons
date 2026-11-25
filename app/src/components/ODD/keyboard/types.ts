// keyboard layout
export type LayoutName = 'default' | 'shift' | 'symbols' | 'numbers'

// keyboard language
export type KeyboardLanguage = 'en-US' | 'zh-CN'

export type NumericalKeyboardKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | '-'
  | 'del'

export interface NumericalInputOptions {
  allowDecimal?: boolean
  allowNegative?: boolean
}
