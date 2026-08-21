import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon, InputField } from '@opentrons/components'

import { usePlaceCaretAtEndOnToggle } from '/app/local-resources/access-control/usePlaceCaretAtEndOnToggle'

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
  const { t } = useTranslation('device_settings')
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  usePlaceCaretAtEndOnToggle(inputRef, showPassword, true)

  return (
    <InputField
      ref={inputRef}
      type={showPassword ? 'text' : 'password'}
      value={value}
      placeholder={placeholder}
      error={error}
      onChange={onChange}
      onBlur={onBlur}
      rightElement={
        <button
          type="button"
          className={styles.password_visibility_button}
          aria-label={t('toggle_password_visibility')}
          onPointerDown={e => {
            e.preventDefault()
          }}
          onMouseDown={e => {
            // This prevents focus from moving from the password field to this toggle button,
            // but lets the click event go through.
            e.preventDefault()
          }}
          onClick={() => {
            setShowPassword(current => !current)
          }}
        >
          <Icon name={showPassword ? 'eye-slash' : 'eye'} size="1.25rem" />
        </button>
      }
    />
  )
}
