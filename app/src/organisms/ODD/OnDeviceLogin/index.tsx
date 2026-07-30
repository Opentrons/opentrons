import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { LoginFieldController } from './LoginFieldController'
import styles from './OnDeviceLogin.module.css'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

export type LoginStep = 'username' | 'password' | 'confirmPassword'

export interface LoginFormValues {
  username: string
  password: string
  confirmPassword: string
}

export type LoginFieldName = keyof LoginFormValues

export interface OnDeviceLoginProps {
  step: LoginStep
  onStepChange: (step: LoginStep) => void
  submitPassword: (username: string, password: string) => void
  isAuthLoading: boolean
  onCancel: () => void
  /** New-password + confirm step after temporary-password login. */
  isPasswordResetRequired?: boolean
  initialUsername?: string
  /** Shown under the password field with error styling when login fails */
  loginError?: string | null
  onClearLoginError?: () => void
}

export function OnDeviceLogin({
  step,
  onStepChange,
  submitPassword,
  isAuthLoading,
  onCancel,
  isPasswordResetRequired = false,
  initialUsername,
  loginError = null,
  onClearLoginError,
}: OnDeviceLoginProps): JSX.Element {
  const { t } = useTranslation(['shared', 'access_control'])
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const { control, watch, setValue } = useForm<LoginFormValues>({
    defaultValues: {
      username: initialUsername ?? '',
      password: '',
      confirmPassword: '',
    },
  })

  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const username = watch('username')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  const activeFieldName: LoginFieldName =
    step === 'username'
      ? 'username'
      : step === 'confirmPassword'
        ? 'confirmPassword'
        : 'password'

  const keyboardFieldValue =
    step === 'username'
      ? username
      : step === 'confirmPassword'
        ? confirmPassword
        : password

  const clearFieldErrors = (): void => {
    setConfirmPasswordError(null)
    onClearLoginError?.()
  }

  // reset keyboard input when switching steps
  useEffect(() => {
    const kb = keyboardRef.current
    if (kb == null) return
    kb.setInput(keyboardFieldValue)
  }, [step, keyboardFieldValue])

  const handleNext = useCallback((): void => {
    if (step === 'username') {
      if (username.trim() === '') return
      onStepChange('password')
      return
    }
    if (step === 'password') {
      if (password.trim() === '') return
      if (isPasswordResetRequired) {
        setConfirmPasswordError(null)
        onStepChange('confirmPassword')
        return
      }
      submitPassword(username, password)
      return
    }
    if (confirmPassword.trim() === '') return
    if (confirmPassword !== password) {
      setConfirmPasswordError(
        t('on_device_login_password_mismatch', {
          ns: 'access_control',
        }) as string
      )
      return
    }
    setConfirmPasswordError(null)
    submitPassword(username, password)
  }, [
    step,
    username,
    password,
    confirmPassword,
    isPasswordResetRequired,
    onStepChange,
    submitPassword,
    t,
  ])

  const primaryDisabled =
    step === 'username'
      ? username.trim() === ''
      : step === 'password'
        ? password.trim() === '' || isAuthLoading
        : confirmPassword.trim() === '' || isAuthLoading

  const header = isPasswordResetRequired
    ? t('on_device_login_new_password', { ns: 'access_control' })
    : t('on_device_login', { ns: 'access_control' })

  const primaryButtonLabel =
    step === 'username' || (step === 'password' && isPasswordResetRequired)
      ? t('next', { ns: 'shared' })
      : t('confirm', { ns: 'shared' })

  // NOTE: this pattern only works because usernames and passwords are single line inputs
  // if we need multi-line inputs like in documentation required, this will not work
  const handleEnterPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || primaryDisabled) return
      handleNext()
    },
    [primaryDisabled, handleNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleEnterPress)
    return () => {
      window.removeEventListener('keydown', handleEnterPress)
    }
  }, [handleEnterPress])

  return (
    <>
      <div className={styles.container}>
        <ChildNavigation
          header={header}
          buttonText={primaryButtonLabel}
          buttonIsDisabled={primaryDisabled}
          onClickBack={
            step === 'confirmPassword'
              ? () => {
                  clearFieldErrors()
                  onStepChange('password')
                }
              : step === 'password' && !isPasswordResetRequired
                ? () => {
                    onClearLoginError?.()
                    onStepChange('username')
                  }
                : undefined
          }
          secondaryButtonProps={
            isPasswordResetRequired
              ? undefined
              : {
                  buttonText: t('cancel', { ns: 'shared' }),
                  buttonType: 'tertiaryLowLight',
                  onClick: onCancel,
                }
          }
          onClickButton={handleNext}
        />
        <div className={styles.content_container}>
          <div className={styles.form_inner_container}>
            <LoginFieldController
              control={control}
              step={step}
              t={t}
              isPasswordResetRequired={isPasswordResetRequired}
              loginError={loginError}
              confirmPasswordError={confirmPasswordError}
              onClearFieldErrors={clearFieldErrors}
            />
          </div>
        </div>
      </div>
      <div className={styles.keyboard_container}>
        <FullKeyboard
          onChange={(input: string) => {
            setValue(activeFieldName, input, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }}
          keyboardRef={keyboardRef}
        />
      </div>
    </>
  )
}
