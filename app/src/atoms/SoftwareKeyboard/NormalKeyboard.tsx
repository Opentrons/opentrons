import * as React from 'react'
import Keyboard from 'react-simple-keyboard'

interface NormalKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: React.MutableRefObject<any>
}

// Note the design team request is the following
// Input type: characters, numbers and special characters

const customLayout = {
  default: [
    'q w e r t y u i o p',
    'a s d f g h j k l',
    '{shift} z x c v b n m {backspace}',
    '{numbers} {space}',
  ],
  shift: [
    'Q W E R T Y U I O P',
    'A S D F G H J K L',
    '{shift} Z X C V B N M {backspace}',
    '{numbers} {space}',
  ],
  symbols: [
    '[ ] { } # % ^ * + =',
    '_ \\ | ~ < > € £ ¥ ·',
    "{numbers} . , ? ! ' {backspace}",
    '{abc} {space}',
  ],
  numbers: [
    '1 2 3 4 5 6 7 8 9 0',
    '- / : ; ( ) $ & @ "',
    "{symbols} . , ? ! ' {backspace}",
    '{abc} {space}',
  ],
}

const customDisplay = {
  '{numbers}': '123',
  '{shift}': '⬆︎',
  '{space}': 'space',
  '{backspace}': '⌫',
  '{abc}': 'ABC',
  '{symbols}': '#+=',
}

export function NormalKeyboard({
  onChange,
  keyboardRef,
}: NormalKeyboardProps): JSX.Element {
  const [layoutName, setLayoutName] = React.useState<string>('default')
  const handleShift = (button: string): void => {
    switch (button) {
      case '{shift}':
        setLayoutName(layoutName === 'default' ? 'shift' : 'default')
        break
      case '{numbers}':
        setLayoutName('numbers')
        break
      case '{symbols}':
        setLayoutName('symbols')
        break
      case '{abc}':
        setLayoutName('default')
        break
      default:
        break
    }
  }

  const onKeyPress = (button: string): void => {
    if (
      button === '{numbers}' ||
      button === '{abc}' ||
      button === '{shift}' ||
      button === '{symbols}'
    )
      handleShift(button)
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
