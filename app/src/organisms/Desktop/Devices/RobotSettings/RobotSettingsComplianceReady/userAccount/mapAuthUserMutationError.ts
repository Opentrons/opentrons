import axios from 'axios'

import { isDocumentedMutationError } from '@opentrons/react-api-client'

import type { TFunction } from 'i18next'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

interface AuthUserFieldErrors {
  usernameError: string | null
  fullNameError: string | null
  passwordError: string | null
  confirmPasswordError: string | null
}

const EMPTY_FIELD_ERRORS: AuthUserFieldErrors = {
  usernameError: null,
  fullNameError: null,
  passwordError: null,
  confirmPasswordError: null,
}

export function mapAuthUserMutationError(
  error: unknown,
  t: TFunction
): AuthUserFieldErrors {
  const errorId = axios.isAxiosError(error)
    ? error.response?.data?.errors?.[0]?.id
    : null

  if (errorId === 'userAlreadyExists') {
    return {
      ...EMPTY_FIELD_ERRORS,
      usernameError: t(
        'desktop_personal_account_settings_username_exists_error'
      ) as string,
    }
  }

  if (errorId === 'passwordTooShort') {
    const requiredLength = axios.isAxiosError(error)
      ? error.response?.data?.errors?.[0]?.meta?.requiredLength
      : null

    return {
      ...EMPTY_FIELD_ERRORS,
      passwordError:
        requiredLength != null
          ? (t('desktop_password_too_short', {
              minLength: requiredLength,
            }) as string)
          : (t('desktop_personal_account_settings_save_error') as string),
    }
  }

  if (errorId === 'passwordMissingSpecialCharacters') {
    return {
      ...EMPTY_FIELD_ERRORS,
      passwordError: t('desktop_password_missing_special_characters') as string,
    }
  }

  return {
    ...EMPTY_FIELD_ERRORS,
    confirmPasswordError: t(
      'desktop_personal_account_settings_save_error'
    ) as string,
  }
}

export function applyAuthUserMutationError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  t: TFunction
): void {
  if (isDocumentedMutationError(error)) {
    return
  }

  const fieldErrors = mapAuthUserMutationError(error, t)

  if (fieldErrors.usernameError != null) {
    setError('username' as Path<T>, {
      type: 'server',
      message: fieldErrors.usernameError,
    })
  }

  if (fieldErrors.fullNameError != null) {
    setError('fullName' as Path<T>, {
      type: 'server',
      message: fieldErrors.fullNameError,
    })
  }

  if (fieldErrors.passwordError != null) {
    setError('password' as Path<T>, {
      type: 'server',
      message: fieldErrors.passwordError,
    })
  }

  if (fieldErrors.confirmPasswordError != null) {
    setError('confirmPassword' as Path<T>, {
      type: 'server',
      message: fieldErrors.confirmPasswordError,
    })
  }
}
