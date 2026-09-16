import { KeyboardReact as Keyboard } from 'react-simple-keyboard'

import {
  numericalCustom,
  numericalKeyboardLayout,
  softwareKeyboardButtonAttributes,
} from '../constants'
import { useSoftwareKeyboardControl } from '../utils/useSoftwareKeyboardControl'

import type { MutableRefObject } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { SoftwareKeyboardControlOptions } from '../utils/useSoftwareKeyboardControl'

import '../index.css'
import './index.css'

interface NumericalKeyboardProps {
  keyboardRef: MutableRefObject<KeyboardReactInterface | null>
  /**
   * The underlying element that the software keyboard should type into.
   * See `useSoftwareKeyboardControl()`.
   */
  inputElementRef: SoftwareKeyboardControlOptions['inputElementRef']
  isDecimal?: boolean
  hasHyphen?: boolean
  debug?: boolean
}

// the default keyboard layout intKeyboard that doesn't have decimal point and hyphen.
export function NumericalKeyboard({
  keyboardRef,
  inputElementRef,
  isDecimal = false,
  hasHyphen = false,
  debug = false,
}: NumericalKeyboardProps): JSX.Element {
  const layoutName = `${isDecimal ? 'float' : 'int'}${
    hasHyphen ? 'NegKeyboard' : 'Keyboard'
  }`

  const { beforeInputUpdate, onChange } = useSoftwareKeyboardControl({
    keyboardRef,
    inputElementRef,
  })

  return (
    <Keyboard
      keyboardRef={r => {
        keyboardRef.current = r
      }}
      theme="hg-theme-default oddTheme1 numerical-keyboard"
      onChange={onChange}
      beforeInputUpdate={beforeInputUpdate}
      display={numericalCustom}
      useButtonTag={false} // Exclude from the tab order.
      buttonAttributes={softwareKeyboardButtonAttributes}
      layoutName={layoutName}
      layout={numericalKeyboardLayout}
      debug={debug}
      preventMouseDownDefault // Don't steal focus from inputs.
    />
  )
}
