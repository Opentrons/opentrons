import { forwardRef } from 'react'
import { Controller } from 'react-hook-form'

import { LoginFieldInput } from './LoginFieldInput'

import type { TFunction } from 'i18next'
import type { Control } from 'react-hook-form'
import type { AuthUserResetPasswordReason } from '@opentrons/api-client'
import type { LoginFormValues, LoginStep } from './index'

export interface LoginFieldControllerProps {
  control: Control<LoginFormValues>
  step: LoginStep
  t: TFunction
  isPasswordResetRequired: boolean
  resetPasswordReason: AuthUserResetPasswordReason | null
  loginError: string | null
  confirmPasswordError: string | null
  usernameError: string | null
  onClearFieldErrors: () => void
}

export const LoginFieldController = forwardRef<
  HTMLInputElement,
  LoginFieldControllerProps
>(function LoginFieldController(
  {
    control,
    step,
    t,
    isPasswordResetRequired,
    resetPasswordReason,
    loginError,
    confirmPasswordError,
    usernameError,
    onClearFieldErrors,
  },
  ref
): JSX.Element | null {
  if (step === 'username') {
    return (
      <Controller
        key="username"
        control={control}
        name="username"
        render={({ field }) => (
          <LoginFieldInput
            ref={ref}
            field={field}
            label={t('access_control:username')}
            error={usernameError}
            isPasswordField={false}
            onClearError={onClearFieldErrors}
            autoFocus
          />
        )}
      />
    )
  }

  if (step === 'password') {
    const passwordError =
      loginError != null && loginError !== '' ? loginError : null
    const passwordLabel = isPasswordResetRequired
      ? t('access_control:on_device_login_new_password')
      : resetPasswordReason === 'FIRST_TIME_LOGIN'
        ? t('access_control:on_device_login_one_time_password')
        : t('access_control:login_form_password_field')

    return (
      <Controller
        key="password"
        control={control}
        name="password"
        render={({ field }) => (
          <LoginFieldInput
            ref={ref}
            field={field}
            label={passwordLabel}
            error={passwordError}
            isPasswordField={true}
            onClearError={onClearFieldErrors}
            autoFocus
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
            ref={ref}
            field={field}
            label={t('access_control:on_device_login_confirm_password')}
            error={confirmPasswordError}
            isPasswordField={true}
            onClearError={onClearFieldErrors}
            autoFocus
          />
        )}
      />
    )
  }

  return null
})
