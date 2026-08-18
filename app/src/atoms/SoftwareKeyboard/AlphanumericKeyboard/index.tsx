import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Keyboard from 'react-simple-keyboard'

import { getAppLanguage } from '/app/redux/config'

import {
  alphanumericKeyboardLayout,
  customDisplay,
  layoutCandidates,
  softwareKeyboardButtonAttributes,
} from '../constants'

import type { MutableRefObject } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { LayoutName } from '../types'

import '../index.css'
import './index.css'

// TODO (kk:04/05/2024) add debug to make debugging easy
interface AlphanumericKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: MutableRefObject<KeyboardReactInterface | null>
  value?: string
  debug?: boolean
}

export function AlphanumericKeyboard({
  onChange,
  keyboardRef,
  value,
  debug = false,
}: AlphanumericKeyboardProps): JSX.Element {
  const [layoutName, setLayoutName] = useState<LayoutName>('default')

  useEffect(() => {
    if (value !== undefined && keyboardRef.current != null) {
      keyboardRef.current.setInput(value)
    }
  }, [value, keyboardRef])
  const appLanguage = useSelector(getAppLanguage)

  const onKeyPress = (button: string): void => {
    switch (button) {
      case '{ABC}':
        handleShift()
        break
      case '{numbers}':
        handleNumber()
        break
      case '{abc}':
        handleUnShift()
        break
      default:
        break
    }
  }

  const handleShift = (): void => {
    setLayoutName(prev => (prev === 'default' ? 'shift' : 'default'))
  }

  const handleNumber = (): void => {
    setLayoutName(prev => {
      if (prev === 'default' || prev === 'shift') return 'numbers'
      if (prev === 'numbers') return 'default'
      return 'default'
    })
  }

  const handleUnShift = (): void => {
    setLayoutName('default')
  }

  return (
    <Keyboard
      keyboardRef={r => {
        keyboardRef.current = r
      }}
      theme="hg-theme-default oddTheme1 alphanumericKeyboard"
      onChange={onChange}
      onKeyPress={onKeyPress}
      layoutName={layoutName}
      layout={alphanumericKeyboardLayout}
      layoutCandidates={
        appLanguage != null ? layoutCandidates[appLanguage] : undefined
      }
      display={customDisplay}
      mergeDisplay={true}
      useButtonTag={false} // Exclude from the tab order.
      buttonAttributes={softwareKeyboardButtonAttributes}
      width="100%"
      debug={debug}
      preventMouseDownDefault // Don't steal focus from inputs.
    />
  )
}
