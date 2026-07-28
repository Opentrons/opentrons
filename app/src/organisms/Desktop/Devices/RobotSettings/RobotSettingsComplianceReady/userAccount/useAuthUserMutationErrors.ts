import { useCallback, useState } from 'react'
import axios from 'axios'

import { isDocumentedMutationError } from '@opentrons/react-api-client'

import type { TFunction } from 'i18next'

export interface AuthUserFieldErrors {
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

function mapAuthUserMutationError(
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
      ),
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
          ? t('desktop_password_too_short', { minLength: requiredLength })
          : t('desktop_personal_account_settings_save_error'),
    }
  }

  if (errorId === 'passwordMissingSpecialCharacters') {
    return {
      ...EMPTY_FIELD_ERRORS,
      passwordError: t('desktop_password_missing_special_characters'),
    }
  }

  return {
    ...EMPTY_FIELD_ERRORS,
    confirmPasswordError: t('desktop_personal_account_settings_save_error'),
  }
}

export function useAuthUserMutationErrors(t: TFunction): {
  fieldErrors: AuthUserFieldErrors
  clearFieldErrors: () => void
  handleMutationError: (error: unknown) => void
} {
  const [fieldErrors, setFieldErrors] =
    useState<AuthUserFieldErrors>(EMPTY_FIELD_ERRORS)

  const clearFieldErrors = useCallback((): void => {
    setFieldErrors(EMPTY_FIELD_ERRORS)
  }, [])

  const handleMutationError = useCallback(
    (error: unknown): void => {
      if (isDocumentedMutationError(error)) {
        return
      }

      setFieldErrors(mapAuthUserMutationError(error, t))
    },
    [t]
  )

  return {
    fieldErrors,
    clearFieldErrors,
    handleMutationError,
  }
}
