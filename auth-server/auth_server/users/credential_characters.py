"""Allowed characters for CRS usernames and passwords.

Keep in sync with `app/src/resources/auth/credentialCharacters.ts`.
"""

from __future__ import annotations

import re
import string

# Letters, digits, and punctuation. Whitespace is excluded.
CREDENTIAL_SPECIAL_CHARACTERS = string.punctuation
CREDENTIAL_ALLOWED_CHARACTERS = (
    string.ascii_letters + string.digits + CREDENTIAL_SPECIAL_CHARACTERS
)
CREDENTIAL_ALLOWED_PATTERN = r"^[" + re.escape(CREDENTIAL_ALLOWED_CHARACTERS) + r"]+$"


def has_only_allowed_credential_characters(value: str) -> bool:
    """Return whether every character is in the username/password allowlist."""
    return all(character in CREDENTIAL_ALLOWED_CHARACTERS for character in value)
