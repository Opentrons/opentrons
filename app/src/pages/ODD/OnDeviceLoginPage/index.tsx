import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import {
  Button,
  Icon,
  InputField,
  LEGACY_INPUT_TYPE_PASSWORD,
  setRefs,
  StyledText,
} from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useToaster } from '/app/organisms/ToasterOven'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import styles from './OnDeviceLoginPage.module.css'

import type { ChangeEvent } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

type LoginField = 'username' | 'password'

interface LoginFormValues {
  username: string
  password: string
}

export function OnDeviceLoginPage(): JSX.Element {
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
  const { control, watch, setValue, getValues } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
    },
  })
  const [step, setStep] = useState<LoginField>('username')
  const [showPassword, setShowPassword] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const username = watch('username')
  const password = watch('password')
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
  }, [step])

  const handleCancel = (): void => {
    navigate(-1)
  }

  const handleNext = (): void => {
    const { username: u, password: p } = getValues()
    if (step === 'username') {
      if (u.trim() === '') return
      setStep('password')
      return
    }
    if (p.trim() === '') return
    submitPassword(u, p)
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

  const activeFieldName = step === 'username' ? 'username' : 'password'

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
        <div className={styles.form_inner_container}>
          <StyledText oddStyle="bodyTextRegular" className={styles.field_label}>
            {step === 'username' ? 'Username' : 'Password'}
          </StyledText>
          <Controller
            key={activeFieldName}
            control={control}
            name={activeFieldName}
            render={({ field }) => (
              <InputField
                ref={setRefs(inputRef, field.ref)}
                autoFocus={step === 'password'}
                type={inputType}
                size="medium"
                value={field.value ?? ''}
                name={field.name}
                onBlur={field.onBlur}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e.target.value)
                }}
                onFocus={() => {
                  setShowKeyboard(true)
                }}
                rightElement={
                  step === 'password' ? (
                    <div>
                      <Button
                        type="button"
                        title="Toggle password visibility"
                        onClick={() => {
                          setShowPassword(current => !current)
                          inputRef.current?.focus()
                        }}
                      >
                        <Icon
                          name={showPassword ? 'eye-slash' : 'eye'}
                          size="1.5rem"
                        />
                      </Button>
                    </div>
                  ) : null
                }
              />
            )}
          />
        </div>
      </div>
      {showKeyboard ? (
        <div
          className={styles.keyboard_container}
          onMouseDown={event => {
            event.preventDefault()
          }}
        >
          <AccordionKeyboard isOpen={showKeyboard} onToggle={() => {}}>
            <FullKeyboard
              onChange={(input: string) => {
                setValue(step === 'username' ? 'username' : 'password', input, {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }}
              keyboardRef={keyboardRef}
            />
          </AccordionKeyboard>
        </div>
      ) : null}
    </>
  )
}
