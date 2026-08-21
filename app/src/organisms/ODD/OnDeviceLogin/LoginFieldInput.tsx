import { forwardRef, useRef, useState } from 'react'

import { setRefs, TouchInputField } from '@opentrons/components'

import { usePlaceCaretAtEndOnToggle } from '/app/local-resources/access-control/usePlaceCaretAtEndOnToggle'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'

import type { ChangeEvent, RefObject } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { LoginFormValues } from './index'

// todo(mm, 2026-08-21): It seems like LoginFieldInput and LoginFieldController could
// be refactored so only one needs to know about form fields.
type FieldProps =
  | ControllerRenderProps<LoginFormValues, 'username'>
  | ControllerRenderProps<LoginFormValues, 'password'>
  | ControllerRenderProps<LoginFormValues, 'confirmPassword'>

export interface LoginFieldInputProps {
  field: FieldProps
  label: string
  error: string | null
  isPasswordField: boolean
  onClearError?: () => void
  autoFocus?: boolean
  keyboardRef?: RefObject<KeyboardReactInterface | null>
}

export const LoginFieldInput = forwardRef<
  HTMLInputElement,
  LoginFieldInputProps
>(function LoginFieldInput(
  {
    field,
    label,
    error,
    isPasswordField,
    onClearError,
    autoFocus,
    keyboardRef,
  },
  ref
): JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPasswordHidden = isPasswordField && !showPassword
  const inputType: 'text' | 'password' = isPasswordHidden ? 'password' : 'text'

  usePlaceCaretAtEndOnToggle(inputRef, showPassword, isPasswordField, end => {
    keyboardRef?.current?.setCaretPosition(end)
  })

  return (
    <TouchInputField
      ref={setRefs(ref, inputRef, field.ref)}
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
      accessory={
        isPasswordField ? (
          <PasswordVisibilityToggle
            isVisible={showPassword}
            onToggle={() => {
              setShowPassword(prev => !prev)
            }}
          />
        ) : null
      }
    />
  )
})
