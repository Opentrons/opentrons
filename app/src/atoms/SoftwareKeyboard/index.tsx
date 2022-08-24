import * as React from 'react'
import Keyboard from 'react-simple-keyboard'

interface SoftwareKeyboardProps {
  onChange: (e: React.ChangeEvent<string>) => void
  keyboardRef: React.MutableRefObject<any>
}

export function SoftwareKeyboard({
  onChange,
  keyboardRef,
}: SoftwareKeyboardProps): JSX.Element {
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
    />
  )
}
