import { Controller } from 'react-hook-form'

import { LoginFieldInput } from './LoginFieldInput'

import type { TFunction } from 'i18next'
import type { Control } from 'react-hook-form'
import type { LoginFieldName, LoginFormValues, LoginStep } from './index'

export interface LoginFieldControllerProps {
  control: Control<LoginFormValues>
  activeFieldName: LoginFieldName
  step: LoginStep
  t: TFunction
  isPasswordResetRequired: boolean
  fieldError: string | null
  onClearFieldErrors: () => void
  onFocus: () => void
}

export function LoginFieldController({
  control,
  activeFieldName,
  step,
  t,
  isPasswordResetRequired,
  fieldError,
  onClearFieldErrors,
  onFocus,
}: LoginFieldControllerProps): JSX.Element {
  return (
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
          onClearLoginError={onClearFieldErrors}
          onFocus={onFocus}
        />
      )}
    />
  )
}
