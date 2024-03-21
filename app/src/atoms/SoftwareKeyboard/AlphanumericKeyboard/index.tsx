import * as React from 'react'
import Keyboard from 'react-simple-keyboard'
import { alphanumericKeyboardLayout, customDisplay } from '../constants'

interface AlphanumericKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<any>
}

export function AlphanumericKeyboard({
  onChange,
  keyboardRef,
}: AlphanumericKeyboardProps): JSX.Element {
  const [layoutName, setLayoutName] = React.useState<string>('default')
  const onKeyPress = (button: string): void => {
    console.log(button)
    if (button === '{ABC}') handleShift()
    if (button === '{numbers}') handleNumber()
    if (button === '{abc}') handleUnShift()
  }

  const handleShift = (): void => {
    setLayoutName(layoutName === 'default' ? 'shift' : 'default')
  }

  const handleNumber = (): void => {
    setLayoutName(
      layoutName === 'default' || layoutName === 'shift' ? 'numbers' : 'default'
    )
  }

  const handleUnShift = (): void => {
    setLayoutName('default')
  }

  return (
    <Keyboard
      keyboardRef={r => (keyboardRef.current = r)}
      theme={'hg-theme-default oddTheme1'}
      onChange={onChange}
      onKeyPress={onKeyPress}
      layoutName={layoutName}
      layout={alphanumericKeyboardLayout}
      display={customDisplay}
      mergeDisplay={true}
      autoUseTouchEvents={true}
      useButtonTag={true}
    />
  )
}
