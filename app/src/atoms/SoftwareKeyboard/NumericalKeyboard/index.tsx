import { useRef } from 'react'
import { KeyboardReact as Keyboard } from 'react-simple-keyboard'

import { numericalCustom, numericalKeyboardLayout } from '../constants'
import { applyNumericalKeyboardKey, toNumericalKeyboardKey } from './utils'

import type { MutableRefObject } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { NumericalKeyboardKey } from './utils'

import '../index.css'
import './index.css'

// Note (kk:04/05/2024) add debug to make debugging easy
interface NumericalKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: MutableRefObject<KeyboardReactInterface | null>
  isDecimal?: boolean
  hasHyphen?: boolean
  debug?: boolean
  initialValue?: string
}

// the default keyboard layout intKeyboard that doesn't have decimal point and hyphen.
export function NumericalKeyboard({
  onChange,
  keyboardRef,
  isDecimal = false,
  hasHyphen = false,
  debug = false,
  initialValue = '',
}: NumericalKeyboardProps): JSX.Element {
  const layoutName = `${isDecimal ? 'float' : 'int'}${
    hasHyphen ? 'NegKeyboard' : 'Keyboard'
  }`

  return (
    /*
     *  autoUseTouchEvents: for Flex on-device app
     *  useButtonTag: this is for testing purpose that each key renders as a button
     */
    <Keyboard
      keyboardRef={r => {
        keyboardRef.current = r
      }}
      theme="hg-theme-default oddTheme1 numerical-keyboard"
      onInit={keyboard => {
        keyboard.setInput(initialValue)
      }}
      onChange={onChange}
      display={numericalCustom}
      useButtonTag={true}
      layoutName={layoutName}
      layout={numericalKeyboardLayout}
      debug={debug} // If true, <ENTER> will input a \n
    />
  )
}

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
      useButtonTag={true}
      layoutName={layoutName}
      layout={numericalKeyboardLayout}
      debug={debug}
    />
  )
}

export type { NumericalKeyboardKey }
export { applyNumericalKeyboardKey, isValidNumericalInput } from './utils'
