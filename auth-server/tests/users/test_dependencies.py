import pytest
from decoy import Decoy
from fastapi import HTTPException

from auth_server.users.dependencies import get_user_by_username
from auth_server.users.models import AccountType, ResetPasswordReason, UserResponse
from auth_server.users.user_data_manager import UserDataManager, UserNotFoundError


@pytest.mark.asyncio
async def test_get_user_by_username_returns_user(decoy: Decoy) -> None:
    manager = decoy.mock(cls=UserDataManager)
    expected = UserResponse(
        username="alice",
        fullName="Alice",
        accountType=AccountType.USER,
        locked=False,
        resetPassword=False,
        resetPasswordReason=None,
    )
    decoy.when(manager.get_user("alice")).then_return(expected)

    result = await get_user_by_username("alice", manager)

    assert result == expected


@pytest.mark.asyncio
async def test_get_user_by_username_raises_404_when_missing(decoy: Decoy) -> None:
    manager = decoy.mock(cls=UserDataManager)
    decoy.when(manager.get_user("missing")).then_raise(
        UserNotFoundError("User 'missing' not found")
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_user_by_username("missing", manager)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "User not found"
