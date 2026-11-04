from auth_server.users.credential_characters import (
    CREDENTIAL_SPECIAL_CHARACTERS,
    has_only_allowed_credential_characters,
    temp_password_characters,
)
from auth_server.users.software_keyboard_characters import SOFTWARE_KEYBOARD_SYMBOLS


def test_special_characters_match_software_keyboard_symbols() -> None:
    assert CREDENTIAL_SPECIAL_CHARACTERS == SOFTWARE_KEYBOARD_SYMBOLS
    assert "`" not in CREDENTIAL_SPECIAL_CHARACTERS


def test_temp_password_characters_are_ascii_only() -> None:
    chars = temp_password_characters()
    assert all(c.isascii() for c in chars)
    assert " " not in chars
    assert all(c in chars for c in SOFTWARE_KEYBOARD_SYMBOLS)


def test_password_allowlist_accepts_spaces_and_hanzi() -> None:
    assert has_only_allowed_credential_characters("pass word")
    assert has_only_allowed_credential_characters("你hao!")
    assert not has_only_allowed_credential_characters("pass\tword")
    assert has_only_allowed_credential_characters("Ada_Lovelace-1!")
