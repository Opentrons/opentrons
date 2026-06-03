import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { setRefs, TouchInputField } from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './OnDeviceLogin.module.css'

import type { TFunction } from 'i18next'
import type { ChangeEvent } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

export type LoginStep = 'username' | 'password' | 'confirmPassword'

interface LoginFormValues {
  username: string
  password: string
  confirmPassword: string
}

type LoginFieldName = keyof LoginFormValues

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
  const { t } = useTranslation(['shared', 'device_settings'])
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const { control, watch, setValue, getValues } = useForm<LoginFormValues>({
    defaultValues: {
      username: initialUsername ?? '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (initialUsername != null && initialUsername !== '') {
      setValue('username', initialUsername)
    }
  }, [initialUsername, setValue])

  const [showKeyboard, setShowKeyboard] = useState(false)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const username = watch('username')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  const activeFieldName: LoginFieldName =
    step === 'confirmPassword'
      ? 'confirmPassword'
      : step === 'username'
        ? 'username'
        : 'password'

  const keyboardFieldValue =
    activeFieldName === 'username'
      ? username
      : activeFieldName === 'confirmPassword'
        ? confirmPassword
        : password

  // reset keyboard input when switching steps
  useEffect(() => {
    if (!showKeyboard) return
    const kb = keyboardRef.current
    if (kb == null) return
    kb.setInput(keyboardFieldValue)
  }, [step, showKeyboard, keyboardFieldValue])

  const handleNext = (): void => {
    const { username, password, confirmPassword: confirm } = getValues()
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
    if (confirm.trim() === '') return
    if (confirm !== password) {
      setConfirmPasswordError(
        t('on_device_login_password_mismatch', {
          ns: 'device_settings',
        }) as string
      )
      return
    }
    setConfirmPasswordError(null)
    submitPassword(username, password)
  }

  const primaryDisabled =
    step === 'username'
      ? username.trim() === ''
      : step === 'password'
        ? password.trim() === '' || isAuthLoading
        : confirmPassword.trim() === '' || isAuthLoading

  const passwordLabelHasError =
    step === 'password' && loginError != null && loginError !== ''

  const fieldError =
    step === 'confirmPassword'
      ? confirmPasswordError
      : passwordLabelHasError
        ? loginError
        : null

  const header = isPasswordResetRequired
    ? t('on_device_login_new_password', { ns: 'device_settings' })
    : t('on_device_login', { ns: 'device_settings' })

  const primaryButtonLabel =
    step === 'username' || (step === 'password' && isPasswordResetRequired)
      ? t('next', { ns: 'shared' })
      : t('confirm', { ns: 'shared' })

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
                  setConfirmPasswordError(null)
                  onClearLoginError?.()
                  onStepChange('password')
                }
              : step === 'password' && !isPasswordResetRequired
                ? () => {
                    onClearLoginError?.()
                    onStepChange('username')
                  }
                : undefined
          }
          secondaryButtonProps={{
            buttonText: t('cancel', { ns: 'shared' }),
            buttonType: 'tertiaryLowLight',
            onClick: onCancel,
          }}
          onClickButton={handleNext}
        />
        <div className={styles.content_container}>
          <div className={styles.form_inner_container}>
            <Controller
              key={activeFieldName}
              control={control}
              name={activeFieldName}
              render={({ field }) => (
                <LoginFieldInput
                  field={field}
                  step={step}
                  t={t}
                  isPasswordResetRequired={isPasswordResetRequired}
                  loginError={fieldError}
                  onClearLoginError={() => {
                    setConfirmPasswordError(null)
                    onClearLoginError?.()
                  }}
                  onFocus={() => {
                    setShowKeyboard(true)
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>
      {showKeyboard ? (
        <div className={styles.keyboard_container}>
          <AccordionKeyboard isOpen={showKeyboard} onToggle={() => {}}>
            <FullKeyboard
              onChange={(input: string) => {
                setValue(activeFieldName, input, {
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

interface LoginFieldInputProps {
  field: ControllerRenderProps<LoginFormValues, LoginFieldName>
  step: LoginStep
  isPasswordResetRequired: boolean
  loginError: string | null
  t: TFunction
  onClearLoginError?: () => void
  onFocus: () => void
}

/**
 * Renders the active username/password field with label. Lives inside the Controller
 * render prop so its `showPassword` state is reset automatically when the
 * Controller remounts on step change (via its `key` prop).
 */
function LoginFieldInput({
  field,
  step,
  isPasswordResetRequired,
  loginError,
  onClearLoginError,
  onFocus,
  t,
}: LoginFieldInputProps): JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPasswordField = step === 'password' || step === 'confirmPassword'
  const isPasswordHidden = isPasswordField && !showPassword
  const inputType: 'text' | 'password' = isPasswordHidden ? 'password' : 'text'

  const togglePasswordVisibility = (): void => {
    setShowPassword(current => !current)
    inputRef.current?.focus()
  }

  const label =
    step === 'username'
      ? t('device_settings:username')
      : step === 'confirmPassword'
        ? t('device_settings:on_device_login_confirm_password')
        : isPasswordResetRequired
          ? t('device_settings:on_device_login_new_password')
          : t('device_settings:password')

  const inputField = (
    <TouchInputField
      ref={setRefs(inputRef, field.ref)}
      autoFocus={isPasswordField}
      type={inputType}
      label={label}
      error={loginError}
      value={field.value ?? ''}
      name={field.name}
      id={field.name}
      onBlur={field.onBlur}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        field.onChange(e.target.value)
        onClearLoginError?.()
      }}
      onFocus={onFocus}
    />
  )

  if (!isPasswordField) return inputField

  return (
    <div className={styles.password_field_row}>
      <div className={styles.password_field_input}>{inputField}</div>
      <PasswordVisibilityToggle
        isVisible={showPassword}
        onToggle={togglePasswordVisibility}
      />
    </div>
  )
}
