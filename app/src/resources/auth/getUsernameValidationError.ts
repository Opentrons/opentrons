import { CREDENTIAL_ALLOWED_PATTERN } from './credentialCharacters'

export type UsernameValidationErrorKind = 'tooLong' | 'invalidCharacters'

export function getUsernameValidationError(
  username: string,
  usernameMaxLength?: number
): UsernameValidationErrorKind | null {
  if (username === '') {
    return null
  }
  if (usernameMaxLength != null && username.length > usernameMaxLength) {
    return 'tooLong'
  }
  if (!CREDENTIAL_ALLOWED_PATTERN.test(username)) {
    return 'invalidCharacters'
  }
  return null
}
