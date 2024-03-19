import * as React from 'react'
import Keyboard from 'react-simple-keyboard'

const customDisplay = {
  '{backspace}': 'del',
}
interface NumericalKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<null>
  isDecimal?: boolean
}

const decimalOffKeyboard = ['1 2 3', '4 5 6', '7 8 9', ' 0 {backspace}']
const decimalOnKeyboard = ['1 2 3', '4 5 6', '7 8 9', '. 0 {backspace}']

export function NumericalKeyboard({
  onChange,
  keyboardRef,
  isDecimal = false,
}: NumericalKeyboardProps): JSX.Element {
  const numericalKeyboard = {
    layout: {
      default: isDecimal ? decimalOnKeyboard : decimalOffKeyboard,
    },
  }
  return (
    /*
     *  autoUseTouchEvents: for Flex on-device app
     *  useButtonTag: this is for testing purpose that each key renders as a button
     */
    <Keyboard
      keyboardRef={r => (keyboardRef.current = r)}
      theme={'hg-theme-default oddTheme1 numerical-keyboard'}
      onChange={onChange}
      layoutName="default"
      buttonTheme={[
        {
          class: 'hg-decimal-point',
          buttons: '.',
        },
      ]}
      display={customDisplay}
      autoUseTouchEvents={true}
      useButtonTag={true}
      {...numericalKeyboard}
    />
  )
}
