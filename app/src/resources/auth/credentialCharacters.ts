/**
 * CRS username/password helpers over the ODD software keyboard allowlist.
 * Keep in sync with `auth-server/auth_server/users/software_keyboard_characters.py`.
 * Allowlist is derived from Full Keyboard layouts in atoms.
 */
export {
  SOFTWARE_KEYBOARD_SYMBOLS as CREDENTIAL_SPECIAL_CHARACTERS,
  SOFTWARE_KEYBOARD_SYMBOLS,
  hasOnlyAllowedPasswordCharacters,
  hasOnlyAllowedPasswordCharacters as hasOnlyAllowedCredentialCharacters,
  hasOnlyAllowedUsernameCharacters,
} from '/app/atoms/SoftwareKeyboard/softwareKeyboardCharacters'
