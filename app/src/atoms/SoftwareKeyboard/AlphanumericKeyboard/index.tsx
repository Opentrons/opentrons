import * as React from 'react'
import Keyboard from 'react-simple-keyboard'
import { alphanumericKeyboardLayout, customDisplay } from '../constants'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

import '../index.css'
import './index.css'

// TODO (kk:04/05/2024) add debug to make debugging easy
interface AlphanumericKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<KeyboardReactInterface | null>
  debug?: boolean
}

export function AlphanumericKeyboard({
  onChange,
  keyboardRef,
  debug = false, // If true, <ENTER> will input a \n
}: AlphanumericKeyboardProps): JSX.Element {
  const [layoutName, setLayoutName] = React.useState<string>('default')
  const onKeyPress = (button: string): void => {
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
      theme={'hg-theme-default oddTheme1 alphanumericKeyboard'}
      onChange={onChange}
      onKeyPress={onKeyPress}
      layoutName={layoutName}
      layout={alphanumericKeyboardLayout}
      display={customDisplay}
      mergeDisplay={true}
      useButtonTag={true}
      width="100%"
      debug={debug} // If true, <ENTER> will input a \n
    />
  )
}
