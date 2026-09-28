"""Characters supported by the ODD software keyboard.

Keep in sync with `app/src/atoms/SoftwareKeyboard/softwareKeyboardCharacters.ts`.
If `fullKeyboardLayout` or `simple-keyboard-layouts` changes, rerun from `app/`:
  node src/atoms/SoftwareKeyboard/generateSoftwareKeyboardHanzi.mjs
and commit `software_keyboard_hanzi.py`.
"""

from __future__ import annotations

import string

from auth_server.users.software_keyboard_hanzi import SOFTWARE_KEYBOARD_HANZI

# Full Keyboard symbols (no backtick included in the OS keyboard).
SOFTWARE_KEYBOARD_SYMBOLS = r"""!"#$%&'()*+,-./:;<=>?@[\]^_{|}~"""
SOFTWARE_KEYBOARD_ASCII = frozenset(
    string.ascii_letters + string.digits + SOFTWARE_KEYBOARD_SYMBOLS
)
SOFTWARE_KEYBOARD_ASCII_AND_SPACE = SOFTWARE_KEYBOARD_ASCII | frozenset(" ")


def is_software_keyboard_supported_character(character: str) -> bool:
    """Return whether a single character can be typed on the ODD software keyboard."""
    return (
        character in SOFTWARE_KEYBOARD_ASCII_AND_SPACE
        or character in SOFTWARE_KEYBOARD_HANZI
    )


def has_only_software_keyboard_characters(value: str) -> bool:
    """Return whether every character is on the ODD software keyboard."""
    return all(
        is_software_keyboard_supported_character(character) for character in value
    )


def has_only_allowed_username_characters(value: str) -> bool:
    """Usernames use the keyboard allowlist minus space."""
    return " " not in value and has_only_software_keyboard_characters(value)


def has_only_allowed_password_characters(value: str) -> bool:
    """Passwords use the full keyboard allowlist."""
    return has_only_software_keyboard_characters(value)
