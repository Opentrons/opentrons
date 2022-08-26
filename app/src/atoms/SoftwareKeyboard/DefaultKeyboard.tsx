import * as React from 'react'
import Keyboard from 'react-simple-keyboard'

interface DefaultKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<any>
}

export function DefaultKeyboard({
  onChange,
  keyboardRef,
}: DefaultKeyboardProps): JSX.Element {
  const [layoutName, setLayoutName] = React.useState<string>('default')
  const onKeyPress = (button: string): void => {
    if (button === '{shift}' || button === '{lock}') {
      setLayoutName(layoutName === 'default' ? 'shift' : 'default')
    }
  }

  return (
    <Keyboard
      keyboardRef={r => (keyboardRef.current = r)}
      onChange={onChange}
      onKeyPress={onKeyPress}
      layoutName={layoutName}
      autoUseTouchEvents={true}
      useButtonTag={true} // this is for testing purpose each key renders as a button
    />
  )
}
