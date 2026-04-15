import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { InputField, LEGACY_INPUT_TYPE_PASSWORD } from '@opentrons/components'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './login.module.css'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

type LoginField = 'username' | 'password'

export function Login(): JSX.Element {
  const navigate = useNavigate()
  const [step, setStep] = useState<LoginField>('username')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const fieldValue = step === 'username' ? username : password

  useEffect(() => {
    if (!showKeyboard) return
    const id = window.setTimeout(() => {
      keyboardRef.current?.setInput(fieldValue)
    }, 0)
    return () => window.clearTimeout(id)
  }, [showKeyboard, fieldValue, step])

  useEffect(() => {
    if (step === 'password') {
      inputRef.current?.focus()
    }
  }, [step])

  const handleCancel = (): void => {
    navigate(-1)
  }

  const handleNext = (): void => {
    if (step === 'username') {
      if (username.trim() === '') return
      setStep('password')
      return
    }
    if (password.trim() === '') return
    // TODO: call auth API with username + password
  }

  const primaryDisabled =
    step === 'username'
      ? username.trim() === ''
      : password.trim() === ''

  return (
    <>
      <div className={styles.nav_container}>
        <ChildNavigation
          header="Login"
          buttonText="next"
          buttonIsDisabled={primaryDisabled}
          secondaryButtonProps={{
            buttonText: 'cancel',
            buttonType: 'tertiaryLowLight',
            onClick: handleCancel,
          }}
          onClickButton={handleNext}
        />
      </div>
      <div className={styles.form_container}>
        <h4 className={styles.field_label}>
          {step === 'username' ? 'Username' : 'Password'}
        </h4>
        <InputField
          ref={inputRef}
          testId="login-field"
          type={
            step === 'username' ? 'text' : LEGACY_INPUT_TYPE_PASSWORD
          }
          size="medium"
          value={fieldValue}
          onChange={e => {
            const next = e.target.value
            if (step === 'username') {
              setUsername(next)
            } else {
              setPassword(next)
            }
          }}
          onFocus={() => {
            setShowKeyboard(true)
          }}
        />
      </div>
      {showKeyboard ? (
        <div
          className={styles.keyboard_container}
          onMouseDown={event => {
            event.preventDefault()
          }}
        >
          <FullKeyboard
            onChange={(input: string) => {
              if (step === 'username') {
                setUsername(input)
              } else {
                setPassword(input)
              }
            }}
            keyboardRef={keyboardRef}
          />
        </div>
      ) : null}
    </>
  )
}
