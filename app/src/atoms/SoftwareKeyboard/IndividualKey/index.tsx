import * as React from 'react'
import Keyboard from 'react-simple-keyboard'

const customDisplay = {
  '{backspace}': 'del',
}
interface IndividualKeyProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<null>
  keyText: string
}

export function IndividualKey({
  onChange,
  keyboardRef,
  keyText,
}: IndividualKeyProps): JSX.Element {
  const numericalKeyboard = {
    layout: {
      default: [`${keyText}`],
    },
  }
  return (
    /*
     *  autoUseTouchEvents: for Flex on-device app
     *  useButtonTag: this is for testing purpose that each key renders as a button
     */
    <Keyboard
      keyboardRef={r => (keyboardRef.current = r)}
      theme={'hg-theme-default oddTheme1 individual-key'}
      onChange={onChange}
      layoutName="default"
      display={customDisplay}
      autoUseTouchEvents={true}
      useButtonTag={true}
      {...numericalKeyboard}
      width="100%"
    />
  )
}
