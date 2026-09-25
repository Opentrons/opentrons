import string

import pytest
from pydantic import ValidationError

from auth_server.users.models import (
    USERNAME_MAX_LENGTH,
    AccountType,
    UpdateSelf,
    UpdateUser,
    UserCreate,
)


def test_user_create_rejects_username_longer_than_max_length() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(
            username="a" * (USERNAME_MAX_LENGTH + 1),
            fullName="Too Long Username User",
            accountType=AccountType.USER,
        )

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_update_user_rejects_username_longer_than_max_length() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UpdateUser(username="a" * (USERNAME_MAX_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_update_self_rejects_username_longer_than_max_length() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UpdateSelf(username="a" * (USERNAME_MAX_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


@pytest.mark.parametrize("username", ["test user", " test", "test\tuser", "test\n"])
def test_user_create_rejects_username_with_whitespace(username: str) -> None:
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(
            username=username,
            fullName="Whitespace User",
            accountType=AccountType.USER,
        )

    assert exc_info.value.errors()[0]["type"] == "value_error"


def test_user_create_accepts_letters_digits_and_keyboard_symbols() -> None:
    username = "Aa1" + string.punctuation[:17]
    assert len(username) <= USERNAME_MAX_LENGTH
    UserCreate(
        username=username,
        fullName="Punctuation User",
        accountType=AccountType.USER,
    )


def test_user_create_accepts_candidate_hanzi_username() -> None:
    UserCreate(
        username="张伟",
        fullName="张 Wei",
        accountType=AccountType.USER,
    )


def test_user_create_rejects_username_backtick() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(
            username="user`name",
            fullName="Backtick User",
            accountType=AccountType.USER,
        )

    assert exc_info.value.errors()[0]["type"] == "value_error"


def test_update_user_rejects_username_with_spaces() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UpdateUser(username="test user")

    assert exc_info.value.errors()[0]["type"] == "value_error"


def test_update_self_rejects_username_with_spaces() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UpdateSelf(username="test user")

    assert exc_info.value.errors()[0]["type"] == "value_error"
