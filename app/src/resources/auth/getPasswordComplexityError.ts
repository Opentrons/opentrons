/**
 * Default minimum password length used when auth settings do not specify one.
 * Keep in sync with `_DEFAULT_MIN_PASSWORD_LENGTH` in
 * `auth-server/auth_server/users/user_data_manager.py`.
 */
export const DEFAULT_MIN_PASSWORD_LENGTH = 8

/**
 * Characters that satisfy the "require special characters" password rule.
 * Keep in sync with Python `string.punctuation` used by auth-server.
 */
export const PASSWORD_SPECIAL_CHARACTERS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

export interface PasswordComplexityRequirements {
  minLength: number
  requireSpecialCharacters: boolean
}

export type PasswordComplexityErrorKind =
  'tooShort' | 'missingSpecialCharacters'

/**
 * Returns the first password-complexity failure for `password`.
 * Length is preferred when both length and special-character rules fail.
 */
export function getPasswordComplexityError(
  password: string,
  requirements: PasswordComplexityRequirements
): PasswordComplexityErrorKind | null {
  if (Array.from(password).length < requirements.minLength) {
    return 'tooShort'
  }
  if (
    requirements.requireSpecialCharacters &&
    !Array.from(password).some(character =>
      PASSWORD_SPECIAL_CHARACTERS.includes(character)
    )
  ) {
    return 'missingSpecialCharacters'
  }
  return null
}
