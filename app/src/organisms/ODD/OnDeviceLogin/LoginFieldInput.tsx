import { useRef, useState } from 'react'

import { setRefs, TouchInputField } from '@opentrons/components'

import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'

import styles from './OnDeviceLogin.module.css'

import type { TFunction } from 'i18next'
import type { ChangeEvent } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import type { LoginFieldName, LoginFormValues, LoginStep } from './index'

export interface LoginFieldInputProps {
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
export function LoginFieldInput({
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
