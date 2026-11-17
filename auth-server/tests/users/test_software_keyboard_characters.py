from auth_server.users.software_keyboard_characters import (
    SOFTWARE_KEYBOARD_SYMBOLS,
    has_only_allowed_password_characters,
    has_only_allowed_username_characters,
    is_software_keyboard_supported_character,
)


def test_rejects_backtick_and_non_keyboard_latin() -> None:
    assert "`" not in SOFTWARE_KEYBOARD_SYMBOLS
    assert not is_software_keyboard_supported_character("`")
    assert not is_software_keyboard_supported_character("é")
    assert not is_software_keyboard_supported_character("\n")
    assert not is_software_keyboard_supported_character("\t")


def test_accepts_keyboard_symbol_and_candidate_hanzi() -> None:
    assert is_software_keyboard_supported_character("!")
    assert is_software_keyboard_supported_character("你")
    assert not is_software_keyboard_supported_character("\u3400")


def test_username_rejects_space_password_allows_space() -> None:
    assert has_only_allowed_username_characters("Ada_Lovelace-1")
    assert not has_only_allowed_username_characters("Ada Lovelace")
    assert has_only_allowed_username_characters("张伟")
    assert has_only_allowed_password_characters("pass word")
    assert has_only_allowed_password_characters("张 Wei")
    assert not has_only_allowed_password_characters("José")
