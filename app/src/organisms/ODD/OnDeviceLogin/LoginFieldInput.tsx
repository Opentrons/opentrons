import { useRef, useState } from 'react'

import { setRefs, TouchInputField } from '@opentrons/components'

import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'

import styles from './OnDeviceLogin.module.css'

import type { ChangeEvent } from 'react'
import type { ControllerRenderProps, FieldPath } from 'react-hook-form'
import type { LoginFormValues } from './index'

export interface LoginFieldInputProps<
  TFieldName extends FieldPath<LoginFormValues> = FieldPath<LoginFormValues>,
> {
  field: ControllerRenderProps<LoginFormValues, TFieldName>
  label: string
  error: string | null
  isPasswordField: boolean
  onClearError?: () => void
  autoFocus?: boolean
}

export function LoginFieldInput<
  TFieldName extends FieldPath<LoginFormValues> = FieldPath<LoginFormValues>,
>({
  field,
  label,
  error,
  isPasswordField,
  onClearError,
  autoFocus,
}: LoginFieldInputProps<TFieldName>): JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPasswordHidden = isPasswordField && !showPassword
  const inputType: 'text' | 'password' = isPasswordHidden ? 'password' : 'text'

  const inputField = (
    <TouchInputField
      ref={setRefs(inputRef, field.ref)}
      autoFocus={autoFocus}
      type={inputType}
      label={label}
      error={error}
      value={field.value ?? ''}
      name={field.name}
      id={field.name}
      onBlur={field.onBlur}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        field.onChange(e.target.value)
        onClearError?.()
      }}
    />
  )

  if (!isPasswordField) return inputField

  return (
    <div className={styles.password_field_row}>
      <div className={styles.password_field_input}>{inputField}</div>
      <PasswordVisibilityToggle
        isVisible={showPassword}
        onToggle={() => {
          setShowPassword(prev => !prev)
        }}
      />
    </div>
  )
}
