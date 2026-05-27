"""Tests for temporary password generation."""

import string

from server_utils.password_generation import generate_temporary_password


def test_generate_temporary_password_without_special_characters() -> None:
    password = generate_temporary_password(8, require_special_characters=False)
    assert len(password) == 8
    assert all(c in string.ascii_letters + string.digits for c in password)


def test_generate_temporary_password_with_special_characters() -> None:
    password = generate_temporary_password(12, require_special_characters=True)
    assert len(password) == 12
    assert any(c in string.punctuation for c in password)
