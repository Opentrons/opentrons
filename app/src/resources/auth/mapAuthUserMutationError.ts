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

  const preferredError = getPreferredAuthErrorItem(error)
  const errorId = preferredError?.id ?? null

  if (errorId === 'userAlreadyExists') {
    return {
      field: 'username' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_personal_account_settings_username_exists_error'),
      },
    }
  } else if (errorId === 'usernameContainsInvalidCharacters') {
    return {
      field: 'username' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_username_invalid_characters'),
      },
    }
  } else if (errorId === 'passwordTooShort') {
    const requiredLength = preferredError?.meta?.requiredLength ?? null

    return {
      field: 'password' as Path<T>,
      error: {
        type: 'server',
        message:
          requiredLength != null
            ? t('desktop_password_too_short', {
                minLength: requiredLength,
              })
            : t('desktop_personal_account_settings_save_error'),
      },
    }
  } else if (errorId === 'passwordMissingSpecialCharacters') {
    return {
      field: 'password' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_password_missing_special_characters'),
      },
    }
  } else if (errorId === 'passwordContainsInvalidCharacters') {
    return {
      field: 'password' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_password_invalid_characters'),
      },
    }
  } else if (errorId === 'passwordPreviouslyUsed') {
    return {
      field: 'password' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_password_previously_used'),
      },
    }
  } else {
    return {
      field: 'confirmPassword' as Path<T>,
      error: {
        type: 'server',
        message: t('desktop_personal_account_settings_save_error'),
      },
    }
  }
}

/** User-facing copy for the set-new-password (password reset) flow. */
export function mapSetNewPasswordError(error: unknown, t: TFunction): string {
  const preferredError = getPreferredAuthErrorItem(error)
  const errorId = preferredError?.id ?? null

  if (errorId === 'passwordTooShort') {
    const requiredLength = preferredError?.meta?.requiredLength
    return requiredLength != null
      ? t('must_be_at_least_characters', {
          ns: 'access_control',
          minLength: requiredLength,
        })
      : t('set_new_password_error_update_failed', {
          ns: 'access_control',
        })
  } else if (errorId === 'passwordMissingSpecialCharacters') {
    return t('must_include_at_least_one_special_character', {
      ns: 'access_control',
    })
  } else if (errorId === 'passwordContainsInvalidCharacters') {
    return t('password_invalid_characters', {
      ns: 'access_control',
    })
  } else if (errorId === 'passwordPreviouslyUsed') {
    return t('desktop_password_previously_used')
  } else {
    return t('set_new_password_error_update_failed', {
      ns: 'access_control',
    })
  }
}

interface AuthErrorItem {
  id?: string
  meta?: {
    requiredLength?: number
  }
}

function getAuthErrorItems(error: unknown): AuthErrorItem[] {
  if (!axios.isAxiosError(error)) {
    return []
  }

  const errors = error.response?.data?.errors
  if (!Array.isArray(errors)) {
    return []
  }

  return errors.filter(
    (item): item is AuthErrorItem => item != null && typeof item === 'object'
  )
}

/**
 * Prefer length failures, then disallowed characters, then special-character failures.
 */
function getPreferredAuthErrorItem(error: unknown): AuthErrorItem | null {
  const items = getAuthErrorItems(error)
  const tooShort = items.find(item => item.id === 'passwordTooShort')
  if (tooShort != null) {
    return tooShort
  }
  const invalidCharacters = items.find(
    item => item.id === 'passwordContainsInvalidCharacters'
  )
  if (invalidCharacters != null) {
    return invalidCharacters
  }
  const missingSpecialCharacters = items.find(
    item => item.id === 'passwordMissingSpecialCharacters'
  )
  if (missingSpecialCharacters != null) {
    return missingSpecialCharacters
  }
  return items[0] ?? null
}
