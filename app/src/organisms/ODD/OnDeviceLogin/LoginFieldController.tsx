import { Controller } from 'react-hook-form'

import { LoginFieldInput } from './LoginFieldInput'

import type { TFunction } from 'i18next'
import type { RefObject } from 'react'
import type { Control } from 'react-hook-form'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { LoginFormValues, LoginStep } from './index'

export interface LoginFieldControllerProps {
  control: Control<LoginFormValues>
  step: LoginStep
  t: TFunction
  isPasswordResetRequired: boolean
  loginError: string | null
  confirmPasswordError: string | null
  onClearFieldErrors: () => void
  keyboardRef: RefObject<KeyboardReactInterface | null>
}

export function LoginFieldController({
  control,
  step,
  t,
  isPasswordResetRequired,
  loginError,
  confirmPasswordError,
  onClearFieldErrors,
  keyboardRef,
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
            label={t('access_control:username')}
            error={null}
            isPasswordField={false}
            onClearError={onClearFieldErrors}
            autoFocus
            keyboardRef={keyboardRef}
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
                ? t('access_control:on_device_login_new_password')
                : t('access_control:login_form_password_field')
            }
            error={passwordError}
            isPasswordField={true}
            onClearError={onClearFieldErrors}
            autoFocus
            keyboardRef={keyboardRef}
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
            label={t('access_control:on_device_login_confirm_password')}
            error={confirmPasswordError}
            isPasswordField={true}
            onClearError={onClearFieldErrors}
            autoFocus
            keyboardRef={keyboardRef}
          />
        )}
      />
    )
  }

  return null
}
