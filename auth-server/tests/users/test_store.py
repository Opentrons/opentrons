import pytest

from server_utils.auth.scopes import Scope

from auth_server.users.store import (
    TEST_USERS,
    AccountType,
    User,
    add,
    get,
    password_hash,
    remove,
    update,
)


def test_get_returns_existing_user() -> None:
    """get should return the User when the username exists."""
    user = get("test_admin")
    assert user is not None
    assert user.username == "test_admin"
    assert user.account_type == AccountType.ADMIN


def test_get_returns_none_for_nonexistent_user() -> None:
    """get should return None when the username does not exist."""
    assert get("nonexistent_user") is None


def test_get_returns_dynamically_added_user() -> None:
    """get should find a user that was added via add()."""
    added_user = add(
        username="dynamic_user",
        password="dynamicpassword",
        full_name="Dynamic User",
        account_type=AccountType.SERVICE,
        scopes=[],
    )
    assert added_user is not None
    assert added_user.username == "dynamic_user"
    assert added_user.account_type == AccountType.SERVICE


def test_add_and_get_user() -> None:
    """add should append the user so get can find it."""
    count_before = len(TEST_USERS)
    added_user = add(
        username="add_test_user",
        password="securepassword123",
        full_name="Add Test",
        account_type=AccountType.USER,
        scopes=[],
    )
    assert get("add_test_user") is added_user
    assert len(TEST_USERS) == count_before + 1


def test_remove_and_get_user() -> None:
    """remove should delete the user so get returns None."""
    added_user = add(
        username="remove_test_user",
        password="securepassword123",
        full_name="Remove Test",
        account_type=AccountType.USER,
        scopes=[],
    )
    remove(added_user)
    assert get("remove_test_user") is None


def test_remove_nonexistent_raises() -> None:
    """remove should raise ValueError for a user not in the list."""
    user = User(
        username="ghost",
        hashed_password=password_hash.hash("securepassword123"),
        full_name="Ghost",
        account_type=AccountType.USER,
        scopes=[],
    )
    with pytest.raises(ValueError):
        remove(user)


def test_update_username() -> None:
    """update should change the username and keep other fields."""
    added_user = add(
        username="orig_name",
        password="securepassword123",
        full_name="Original",
        account_type="user",
        scopes=[Scope.RUNS_WRITE],
    )
    updated = update(added_user, username="new_name")
    assert updated.username == "new_name"
    assert updated.full_name == "Original"
    assert updated.account_type == AccountType.USER
    assert updated.scopes == [Scope.RUNS_WRITE]
    assert get("new_name") is updated
    assert get("orig_name") is None


def test_update_password() -> None:
    """update should rehash the password when a new one is provided."""
    added_user = add(
        username="pwd_test",
        password="oldpassword123",
        full_name="Pwd Test",
        account_type="user",
        scopes=[],
    )
    updated = update(added_user, password="newpassword456")
    assert password_hash.verify("newpassword456", updated.hashed_password)
    assert not password_hash.verify("oldpassword123", updated.hashed_password)


def test_update_preserves_password_when_none() -> None:
    """update should keep the existing hashed_password when password is None."""
    added_user = add(
        username="keep_pwd",
        password=password_hash.hash("securepassword123"),
        full_name="Keep Pwd",
        account_type=AccountType.USER,
        scopes=[],
    )
    updated = update(added_user, full_name="Updated Name")
    assert updated.hashed_password == added_user.hashed_password


def test_update_replaces_in_list() -> None:
    """update should replace the old user in TEST_USERS."""
    added_user = add(
        username="replace_test",
        password=password_hash.hash("securepassword123"),
        full_name="Replace Test",
        account_type=AccountType.USER,
        scopes=[],
    )
    updated = update(
        user=added_user,
        username="replace_test",
        password="securepassword123",
        full_name="Replace Test",
        account_type=AccountType.USER,
    )
    assert added_user not in TEST_USERS
    assert updated in TEST_USERS
