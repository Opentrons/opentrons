"""Cryptographically secure temporary password generation."""

import secrets
import string

_ALPHANUMERIC = string.ascii_letters + string.digits
_SPECIAL_CHARACTERS = string.punctuation


def generate_temporary_password(
    min_length: int,
    *,
    require_special_characters: bool,
) -> str:
    """Generate a random password that satisfies the given complexity rules."""
    if not require_special_characters:
        return "".join(secrets.choice(_ALPHANUMERIC) for _ in range(min_length))

    special = secrets.choice(_SPECIAL_CHARACTERS)
    alphanumeric = "".join(
        secrets.choice(_ALPHANUMERIC) for _ in range(min_length - 1)
    )
    position = secrets.randbelow(min_length)
    return alphanumeric[:position] + special + alphanumeric[position:]
