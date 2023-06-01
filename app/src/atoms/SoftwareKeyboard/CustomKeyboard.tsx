import * as React from 'react'
import Keyboard from 'react-simple-keyboard'

interface CustomKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<any>
}

const customLayout = {
  default: [
    'q w e r t y u i o p',
    'a s d f g h j k l',
    '{shift} z x c v b n m {backspace}',
    '{numbers}',
  ],
  shift: [
    'Q W E R T Y U I O P',
    'A S D F G H J K L',
    '{shift} Z X C V B N M {backspace}',
    '{numbers}',
  ],
  numbers: ['1 2 3', '4 5 6', '7 8 9', '{abc} 0 {backspace}'],
}

const customDisplay = {
  '{numbers}': '123',
  '{ent}': 'enter',
  '{escape}': 'esc ⎋',
  '{tab}': 'tab ⇥',
  '{backspace}': 'del',
  '{capslock}': 'caps lock ⇪',
  '{shift}': 'shift',
  '{controlleft}': 'ctrl ⌃',
  '{controlright}': 'ctrl ⌃',
  '{altleft}': 'alt ⌥',
  '{altright}': 'alt ⌥',
  '{metaleft}': 'cmd ⌘',
  '{metaright}': 'cmd ⌘',
  '{abc}': 'ABC',
  '{space}': 'space',
}

export function CustomKeyboard({
  onChange,
  keyboardRef,
}: CustomKeyboardProps): JSX.Element {
  const [layoutName, setLayoutName] = React.useState<string>('default')
  const onKeyPress = (button: string): void => {
    if (button === '{shift}' || button === '{lock}') handleShift()
    if (button === '{numbers}' || button === '{abc}') handleNumber()
  }

  const handleShift = (): void => {
    setLayoutName(layoutName === 'default' ? 'shift' : 'default')
  }

  const handleNumber = (): void => {
    setLayoutName(layoutName === 'default' ? 'numbers' : 'default')
  }

  return (
    <Keyboard
      keyboardRef={r => (keyboardRef.current = r)}
      theme={'hg-theme-default oddTheme1'}
      onChange={onChange}
      onKeyPress={onKeyPress}
      layoutName={layoutName}
      layout={customLayout}
      display={customDisplay}
      mergeDisplay={true}
      autoUseTouchEvents={true}
      useButtonTag={true}
    />
  )
}
