import re
import string

from auth_server.users.credential_characters import (
    CREDENTIAL_ALLOWED_CHARACTERS,
    CREDENTIAL_ALLOWED_PATTERN,
    CREDENTIAL_SPECIAL_CHARACTERS,
    has_only_allowed_credential_characters,
)


def test_special_characters_match_python_punctuation() -> None:
    assert CREDENTIAL_SPECIAL_CHARACTERS == string.punctuation


def test_allowed_characters_are_letters_digits_and_punctuation() -> None:
    assert CREDENTIAL_ALLOWED_CHARACTERS == (
        string.ascii_letters + string.digits + string.punctuation
    )


def test_pattern_accepts_every_allowed_character() -> None:
    pattern = re.compile(CREDENTIAL_ALLOWED_PATTERN)
    for character in CREDENTIAL_ALLOWED_CHARACTERS:
        assert pattern.fullmatch(character)


def test_rejects_spaces_and_other_whitespace() -> None:
    assert not has_only_allowed_credential_characters("pass word")
    assert not has_only_allowed_credential_characters("pass\tword")


def test_accepts_typical_username_or_password() -> None:
    assert has_only_allowed_credential_characters("Ada_Lovelace-1!")
