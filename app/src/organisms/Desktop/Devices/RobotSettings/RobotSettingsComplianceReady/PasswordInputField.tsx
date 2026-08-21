import { useLayoutEffect, useRef, useState } from 'react'

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

interface InputSelection {
  start: number
  end: number
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
  const selectionRef = useRef<InputSelection | null>(null)

  useLayoutEffect(() => {
    const input = inputRef.current
    const selection = selectionRef.current
    if (input == null || selection == null) {
      return
    }

    // Chrome resets the caret to the start when input type changes.
    // Restore immediately, then again on the next frame in case Chrome
    // overwrites the selection after the type attribute update.
    const restoreSelection = (): void => {
      input.setSelectionRange(selection.start, selection.end)
    }
    restoreSelection()
    const frameId = requestAnimationFrame(restoreSelection)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [showPassword])

  const handleToggle = (): void => {
    const input = inputRef.current
    if (input != null) {
      selectionRef.current = {
        start: input.selectionStart ?? input.value.length,
        end: input.selectionEnd ?? input.value.length,
      }
    }
    setShowPassword(current => !current)
  }

  return (
    <div className={styles.password_field_row}>
      <div className={styles.password_field_input}>
        <InputField
          ref={inputRef}
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
        onToggle={handleToggle}
      />
    </div>
  )
}
