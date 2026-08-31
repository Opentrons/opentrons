/**
 * Allowed characters for CRS usernames and passwords.
 * Keep in sync with `auth-server/auth_server/users/credential_characters.py`
 * (`string.ascii_letters + string.digits + string.punctuation`).
 */
export const CREDENTIAL_SPECIAL_CHARACTERS =
  '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

export const CREDENTIAL_ALLOWED_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
  CREDENTIAL_SPECIAL_CHARACTERS

const ESCAPED_CREDENTIAL_ALLOWED_CHARACTERS =
  CREDENTIAL_ALLOWED_CHARACTERS.replace(/[\\^\-[\]]/g, '\\$&')

export const CREDENTIAL_ALLOWED_PATTERN = new RegExp(
  `^[${ESCAPED_CREDENTIAL_ALLOWED_CHARACTERS}]+$`
)

export function hasOnlyAllowedCredentialCharacters(value: string): boolean {
  return CREDENTIAL_ALLOWED_PATTERN.test(value)
}
