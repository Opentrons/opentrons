import { Controller } from 'react-hook-form'

import { LoginFieldInput } from './LoginFieldInput'

import type { TFunction } from 'i18next'
import type { Control } from 'react-hook-form'
import type { LoginFormValues, LoginStep } from './index'

export interface LoginFieldControllerProps {
  control: Control<LoginFormValues>
  step: LoginStep
  t: TFunction
  isPasswordResetRequired: boolean
  loginError: string | null
  confirmPasswordError: string | null
  onClearFieldErrors: () => void
  onFocus: () => void
}

export function LoginFieldController({
  control,
  step,
  t,
  isPasswordResetRequired,
  loginError,
  confirmPasswordError,
  onClearFieldErrors,
  onFocus,
}: LoginFieldControllerProps): JSX.Element | null {
  if (step === 'username') {
    return (
      <Controller
        key="username"
        control={control}
        name="username"
        render={({ field }) => (
          <LoginFieldInput
            field={field}
            label={t('device_settings:username')}
            error={null}
            isPasswordField={false}
            onClearError={onClearFieldErrors}
            onFocus={onFocus}
          />
        )}
      />
    )
  }

  if (step === 'password') {
    const passwordError =
      loginError != null && loginError !== '' ? loginError : null

    return (
      <Controller
        key="password"
        control={control}
        name="password"
        render={({ field }) => (
          <LoginFieldInput
            field={field}
            label={
              isPasswordResetRequired
                ? t('device_settings:on_device_login_new_password')
                : t('device_settings:password')
            }
            error={passwordError}
            isPasswordField={true}
            onClearError={onClearFieldErrors}
            onFocus={onFocus}
          />
        )}
      />
    )
  }

  if (step === 'confirmPassword') {
    return (
      <Controller
        key="confirmPassword"
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <LoginFieldInput
            field={field}
            label={t('device_settings:on_device_login_confirm_password')}
            error={confirmPasswordError}
            isPasswordField={true}
            onClearError={onClearFieldErrors}
            onFocus={onFocus}
          />
        )}
      />
    )
  }

  return null
}
