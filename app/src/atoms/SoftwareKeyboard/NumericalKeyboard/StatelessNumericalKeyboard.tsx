import { useRef } from 'react'
import { KeyboardReact as Keyboard } from 'react-simple-keyboard'

import {
  numericalCustom,
  numericalKeyboardLayout,
  softwareKeyboardButtonAttributes,
} from '../constants'
import { applyNumericalKeyboardKey } from '../utils/applyNumericalKeyboardKey'
import { toNumericalKeyboardKey } from '../utils/toNumericalKeyboardKey'

import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { NumericalKeyboardKey } from '../types'

interface StatelessNumericalKeyboardProps {
  value: string
  onChange: (input: string) => void
  isDecimal?: boolean
  hasHyphen?: boolean
  debug?: boolean
  onKeyPress?: (key: NumericalKeyboardKey) => void
}

export function StatelessNumericalKeyboard({
  value,
  onChange,
  isDecimal = false,
  hasHyphen = false,
  debug = false,
  onKeyPress,
}: StatelessNumericalKeyboardProps): JSX.Element {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const valueRef = useRef(value)
  const layoutName = `${isDecimal ? 'float' : 'int'}${
    hasHyphen ? 'NegKeyboard' : 'Keyboard'
  }`
  valueRef.current = value

  return (
    <Keyboard
      keyboardRef={r => {
        keyboardRef.current = r
      }}
      theme="hg-theme-default oddTheme1 numerical-keyboard"
      onKeyPress={keyboardButton => {
        const key = toNumericalKeyboardKey(keyboardButton)
        keyboardRef.current?.setInput('')
        if (key == null) {
          return
        }
        onKeyPress?.(key)
        onChange(
          applyNumericalKeyboardKey(valueRef.current, key, {
            allowDecimal: isDecimal,
            allowNegative: hasHyphen,
          })
        )
      }}
      display={numericalCustom}
      useButtonTag={false}
      buttonAttributes={softwareKeyboardButtonAttributes}
      layoutName={layoutName}
      layout={numericalKeyboardLayout}
      debug={debug}
      preventMouseDownDefault
    />
  )
}
