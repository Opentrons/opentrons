import { useRef, useState } from 'react'

import { setRefs, TouchInputField } from '@opentrons/components'

import { usePlaceCaretAtEndOnToggle } from '/app/local-resources/access-control/usePlaceCaretAtEndOnToggle'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'

import type { ChangeEvent, RefObject } from 'react'
import type { ControllerRenderProps, FieldPath } from 'react-hook-form'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
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
  keyboardRef?: RefObject<KeyboardReactInterface | null>
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
  keyboardRef,
}: LoginFieldInputProps<TFieldName>): JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPasswordHidden = isPasswordField && !showPassword
  const inputType: 'text' | 'password' = isPasswordHidden ? 'password' : 'text'

  usePlaceCaretAtEndOnToggle(inputRef, showPassword, isPasswordField, end => {
    keyboardRef?.current?.setCaretPosition(end)
  })

  return (
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
}
