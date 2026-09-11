import {
  CREDENTIAL_ALLOWED_PATTERN,
  CREDENTIAL_SPECIAL_CHARACTERS,
} from './credentialCharacters'

/**
 * Default minimum password length used when auth settings do not specify one.
 * Keep in sync with `_DEFAULT_MIN_PASSWORD_LENGTH` in
 * `auth-server/auth_server/users/user_data_manager.py`.
 */
export const DEFAULT_MIN_PASSWORD_LENGTH = 8

/** Characters that satisfy the "require special characters" password rule. */
export const PASSWORD_SPECIAL_CHARACTERS = CREDENTIAL_SPECIAL_CHARACTERS

export interface PasswordComplexityRequirements {
  minLength: number
  requireSpecialCharacters: boolean
}

export type PasswordComplexityErrorKind =
  'tooShort' | 'invalidCharacters' | 'missingSpecialCharacters'

/**
 * Returns the first password-complexity failure for `password`.
 * Length is preferred, then disallowed characters, then the special-character rule.
 */
export function getPasswordComplexityError(
  password: string,
  requirements: PasswordComplexityRequirements
): PasswordComplexityErrorKind | null {
  if (Array.from(password).length < requirements.minLength) {
    return 'tooShort'
  }
  if (!CREDENTIAL_ALLOWED_PATTERN.test(password)) {
    return 'invalidCharacters'
  }
  if (
    requirements.requireSpecialCharacters &&
    !Array.from(password).some(character =>
      CREDENTIAL_SPECIAL_CHARACTERS.includes(character)
    )
  ) {
    return 'missingSpecialCharacters'
  }
  return null
}
