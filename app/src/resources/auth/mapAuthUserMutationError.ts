import axios from 'axios'

import { isDocumentedMutationError } from '@opentrons/react-api-client'

import type { TFunction } from 'i18next'
import type { FieldValues, Path } from 'react-hook-form'

export interface AuthUserMutationFormError<T extends FieldValues> {
  field: Path<T>
  error: {
    type: 'server'
    message: string
  }
}

export function mapAuthUserMutationError<T extends FieldValues>(
  error: unknown,
  t: TFunction
): AuthUserMutationFormError<T> | null {
  if (isDocumentedMutationError(error)) {
    return null
  }

  const errorId = axios.isAxiosError(error)
    ? error.response?.data?.errors?.[0]?.id
    : null

  if (errorId === 'userAlreadyExists') {
    return {
      field: 'username' as Path<T>,
      error: {
        type: 'server',
        message: t(
          'desktop_personal_account_settings_username_exists_error'
        ) as string,
      },
    }
  }

  if (errorId === 'passwordTooShort') {
    const requiredLength = axios.isAxiosError(error)
      ? error.response?.data?.errors?.[0]?.meta?.requiredLength
      : null

    return {
      field: 'password' as Path<T>,
      error: {
        type: 'server',
        message:
          requiredLength != null
            ? (t('desktop_password_too_short', {
                minLength: requiredLength,
              }) as string)
            : (t('desktop_personal_account_settings_save_error') as string),
      },
    }
  }

  if (errorId === 'passwordMissingSpecialCharacters') {
    return {
      field: 'password' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_password_missing_special_characters') as string,
      },
    }
  }

  if (errorId === 'passwordPreviouslyUsed') {
    return {
      field: 'password' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_password_previously_used') as string,
      },
    }
  }

  return {
    field: 'confirmPassword' as Path<T>,
    error: {
      type: 'server',
      message: t('desktop_personal_account_settings_save_error') as string,
    },
  }
}
