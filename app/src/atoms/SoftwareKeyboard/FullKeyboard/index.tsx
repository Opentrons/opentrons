import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { KeyboardReact as Keyboard } from 'react-simple-keyboard'

import { getAppLanguage } from '/app/redux/config'

import {
  customDisplay,
  fullKeyboardLayout,
  layoutCandidates,
  softwareKeyboardButtonAttributes,
} from '../constants'

import type { MutableRefObject } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { KeyboardLanguage, LayoutName } from '../types'

import '../index.css'
import './index.css'

const SPECIAL_LAYOUT_KEYS = ['{numbers}', '{abc}', '{shift}', '{symbols}']
const PREVIEW_LABEL_RENDERING_DURATION_MS = 800
const PREVIEW_LABEL_EN = 'English (US)'
const PREVIEW_LABEL_CH = '简体拼音'

// TODO (kk:04/05/2024) add debug to make debugging easy
interface FullKeyboardProps {
  onChange: (input: string) => void
  keyboardRef: MutableRefObject<KeyboardReactInterface | null>
  debug?: boolean
}

export function FullKeyboard({
  onChange,
  keyboardRef,
  debug = false,
}: FullKeyboardProps): JSX.Element {
  const [layoutName, setLayoutName] = useState<LayoutName>('default')

  const appLanguage = useSelector(getAppLanguage)
  const initialKeyboardLanguage: KeyboardLanguage =
    appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US'
  const [keyboardLanguage, setKeyboardLanguage] = useState<KeyboardLanguage>(
    initialKeyboardLanguage
  )

  const [spacePreviewLabel, setSpacePreviewLabel] = useState<string | null>(
    null
  )
  const languageTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (languageTimerRef.current != null) {
        window.clearTimeout(languageTimerRef.current)
      }
    }
  }, [])

  const handleLayoutChange = (button: string): void => {
    switch (button) {
      case '{shift}':
        setLayoutName(prev => (prev === 'default' ? 'shift' : 'default'))
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

  const handleLanguageToggle = useCallback((): void => {
    if (languageTimerRef.current != null) {
      window.clearTimeout(languageTimerRef.current)
    }

    const nextLanguage: KeyboardLanguage =
      keyboardLanguage === 'en-US' ? 'zh-CN' : 'en-US'
    setKeyboardLanguage(nextLanguage)
    setSpacePreviewLabel(
      nextLanguage === 'zh-CN' ? PREVIEW_LABEL_CH : PREVIEW_LABEL_EN
    )

    languageTimerRef.current = window.setTimeout(() => {
      setSpacePreviewLabel(null)
    }, PREVIEW_LABEL_RENDERING_DURATION_MS)
  }, [keyboardLanguage])

  // Language switch by Ctrl + Shift + Space
  // not using Alt + Shift or Meta + Space because they should be handled by the OS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isLanguageToggle = e.ctrlKey && e.shiftKey && e.code === 'Space'
      if (!isLanguageToggle) return

      e.preventDefault()
      handleLanguageToggle()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleLanguageToggle])

  const onKeyPress = (button: string): void => {
    // layout change
    if (SPECIAL_LAYOUT_KEYS.includes(button)) {
      handleLayoutChange(button)
    }

    // language change
    if (button === '{globe}') {
      handleLanguageToggle()
    }
  }

  const display = useMemo(() => {
    const defaultSpaceLabel = keyboardLanguage === 'zh-CN' ? '空格' : 'space'
    const returnLabel = keyboardLanguage === 'zh-CN' ? '换行' : 'return'

    return {
      ...customDisplay,
      '{space}': spacePreviewLabel ?? defaultSpaceLabel,
      '{return}': returnLabel,
    }
  }, [keyboardLanguage, spacePreviewLabel])

  return (
    <Keyboard
      keyboardRef={r => {
        keyboardRef.current = r
      }}
      theme="hg-theme-default oddTheme1"
      onChange={onChange}
      onKeyPress={onKeyPress}
      layoutName={layoutName}
      layout={fullKeyboardLayout}
      layoutCandidates={
        keyboardLanguage != null
          ? layoutCandidates[keyboardLanguage]
          : undefined
      }
      display={display}
      mergeDisplay={true}
      useButtonTag={false} // Exclude from the tab order.
      buttonAttributes={softwareKeyboardButtonAttributes}
      debug={debug}
      baseClass="fullKeyboard"
      buttonTheme={[
        {
          class: 'hg-globe',
          buttons: '{globe}',
        },
        {
          class: 'hg-space-key',
          buttons: '{space}',
        },
        {
          class: 'hg-return',
          buttons: '{return}',
        },
        {
          class: 'hg-shift-icon',
          buttons: '{shift}',
        },
      ]}
      preventMouseDownDefault // Don't steal focus from inputs.
    />
  )
}
