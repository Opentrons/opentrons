import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Btn,
  Icon,
  InputField,
  LEGACY_INPUT_TYPE_PASSWORD,
} from '@opentrons/components'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useToaster } from '/app/organisms/ToasterOven'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import styles from './login.module.css'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

type LoginField = 'username' | 'password'

export function Login(): JSX.Element {
  const navigate = useNavigate()
  const { makeSnackbar } = useToaster()
  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: () => {
      navigate(-1)
    },
    onError: message => {
      makeSnackbar(message)
    },
  })
  const [step, setStep] = useState<LoginField>('username')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const fieldValue = step === 'username' ? username : password

  useEffect(() => {
    if (!showKeyboard) return
    const id = window.setTimeout(() => {
      keyboardRef.current?.setInput(fieldValue)
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [showKeyboard, fieldValue, step])

  useEffect(() => {
    setShowPassword(false)
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
    submitPassword(username, password)
  }

  const primaryDisabled =
    step === 'username'
      ? username.trim() === ''
      : password.trim() === '' || isAuthLoading

  const inputType =
    step === 'username'
      ? 'text'
      : showPassword
        ? 'text'
        : LEGACY_INPUT_TYPE_PASSWORD

  return (
    <>
      <div className={styles.nav_container}>
        <ChildNavigation
          header="Login"
          buttonText={step === 'username' ? 'next' : 'confirm'}
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
          type={inputType}
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
          rightElement={
            step === 'password' ? (
              <Btn
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => {
                  setShowPassword(current => !current)
                  inputRef.current?.focus()
                }}
              >
                <Icon
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size="1.5rem"
                  data-testid={
                    showPassword ? 'login-password-hide' : 'login-password-show'
                  }
                />
              </Btn>
            ) : undefined
          }
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
