import { useRef, useState } from 'react'

import { InputField } from '@opentrons/components'

import { usePlaceCaretAtEndOnToggle } from '/app/local-resources/access-control/usePlaceCaretAtEndOnToggle'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'

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
  const inputRef = useRef<HTMLInputElement>(null)

  usePlaceCaretAtEndOnToggle(inputRef, showPassword, true)

  const handleTogglePasswordVisibility = (): void => {
    setShowPassword(current => !current)
  }

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
        <PasswordVisibilityToggle
          isVisible={showPassword}
          onToggle={handleTogglePasswordVisibility}
          iconOnly
        />
      }
    />
  )
}
