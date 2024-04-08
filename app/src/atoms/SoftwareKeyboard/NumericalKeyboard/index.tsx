import * as React from 'react'
import { KeyboardReact as Keyboard } from 'react-simple-keyboard'
import { numericalKeyboardLayout, numericalCustom } from '../constants'
import '../index.css'
import './index.css'

// Note (kk:04/05/2024) add debug to make debugging easy
interface NumericalKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<null>
  isDecimal?: boolean
  hasHyphen?: boolean
  debug?: boolean
}

// the default keyboard layout intKeyboard that doesn't have decimal point and hyphen.
export function NumericalKeyboard({
  onChange,
  keyboardRef,
  isDecimal = false,
  hasHyphen = false,
  debug = false,
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
      keyboardRef={r => (keyboardRef.current = r)}
      theme={'hg-theme-default oddTheme1 numerical-keyboard'}
      onChange={onChange}
      display={numericalCustom}
      useButtonTag={true}
      layoutName={layoutName}
      layout={numericalKeyboardLayout}
      debug={debug} // If true, <ENTER> will input a \n
    />
  )
}
