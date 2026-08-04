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
