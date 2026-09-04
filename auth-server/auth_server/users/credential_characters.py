"""CRS credential helpers over the ODD software keyboard allowlist.

Keep in sync with `app/src/resources/auth/credentialCharacters.ts`.
"""

from __future__ import annotations

from auth_server.users.software_keyboard_characters import (
    SOFTWARE_KEYBOARD_ASCII,
    SOFTWARE_KEYBOARD_SYMBOLS,
    has_only_allowed_password_characters,
    has_only_allowed_username_characters,
)

# Password-complexity "special characters" and temp-password alphabet (no hanzi, no space).
CREDENTIAL_SPECIAL_CHARACTERS = SOFTWARE_KEYBOARD_SYMBOLS
CREDENTIAL_ALLOWED_CHARACTERS = "".join(sorted(SOFTWARE_KEYBOARD_ASCII))
_TEMP_PASSWORD_CHARACTERS = CREDENTIAL_ALLOWED_CHARACTERS


def has_only_allowed_credential_characters(value: str) -> bool:
    """Return whether every character is allowed in a password (spaces OK)."""
    return has_only_allowed_password_characters(value)


def has_only_allowed_username_credential_characters(value: str) -> bool:
    """Return whether every character is allowed in a username (no spaces)."""
    return has_only_allowed_username_characters(value)


def temp_password_characters() -> str:
    """ASCII letters, digits, and keyboard symbols for generated passwords."""
    return _TEMP_PASSWORD_CHARACTERS
