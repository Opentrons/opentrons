import { useEffect, useRef, useState } from 'react'

import { InputField } from '@opentrons/components'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './login.module.css'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

export function Login(): JSX.Element {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  // Keep react-simple-keyboard’s buffer in sync when the field value changes (e.g. typing
  // in the input, or when the keyboard mounts with an existing value).
  useEffect(() => {
    if (!showKeyboard) return
    const id = window.setTimeout(() => {
      keyboardRef.current?.setInput(value)
    }, 0)
    return () => window.clearTimeout(id)
  }, [showKeyboard, value])

  return (
    <>
      <div className={styles.nav_container}>
        <ChildNavigation
          header="Login"
          buttonText="next"
          secondaryButtonProps={{
            buttonText: 'cancel',
            buttonType: 'tertiaryLowLight',
            onClick: () => {
              // navigate(-1)
            },
          }}
          onClickButton={() => {}}
        />
      </div>
      <div className={styles.form_container}>
        <h4 className={styles.field_label}>Username</h4>
        <InputField
          type="text"
          size="medium"
          value={value}
          onChange={e => {
            setValue(e.target.value)
          }}
          onFocus={() => setShowKeyboard(true)}
        />
      </div>
      {showKeyboard && (
        <div
          className={styles.keyboard_container}
          onMouseDown={event => {
            event.preventDefault()
          }}
        >
          <FullKeyboard
            onChange={(input: string) => {
              setValue(input)
            }}
            keyboardRef={keyboardRef}
          />
        </div>
      )}
    </>
  )
}
