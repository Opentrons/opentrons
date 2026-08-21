import { useState } from 'react'

import { InputField } from '@opentrons/components'

import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'

import styles from './passwordinputfield.module.css'

import type { ChangeEvent, FocusEvent, JSX } from 'react'

export interface PasswordInputFieldProps {
  value: string
  placeholder?: string
  error?: string | null
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

export function PasswordInputField({
  value,
  placeholder,
  error,
  onChange,
  onBlur,
}: PasswordInputFieldProps): JSX.Element {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={styles.password_field_row}>
      <div className={styles.password_field_input}>
        <InputField
          type={showPassword ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          error={error}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      <PasswordVisibilityToggle
        isVisible={showPassword}
        onToggle={() => {
          setShowPassword(current => !current)
        }}
      />
    </div>
  )
}
