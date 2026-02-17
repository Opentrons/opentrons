import pytest

from server_utils.auth.scopes import Scope

from auth_server.users.store import (
    TEST_USERS,
    AccountType,
    User,
    add,
    build_user,
    get,
    hash_password,
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
    new_user = User(
        username="dynamic_user",
        hashed_password=hash_password("dynamicpassword"),
        full_name="Dynamic User",
        account_type=AccountType.SERVICE,
        scopes=[],
    )
    add(new_user)
    found = get("dynamic_user")
    assert found is not None
    assert found.username == "dynamic_user"
    assert found.account_type == AccountType.SERVICE


def test_build_user_builds_user_with_hashed_password() -> None:
    """build_user should return a User with a hashed password."""
    user = build_user(
        username="new_user",
        password="securepassword123",
        full_name="New User",
        account_type="admin",
        scopes=[Scope.USERS_WRITE],
    )
    assert user.username == "new_user"
    assert user.full_name == "New User"
    assert user.account_type == AccountType.ADMIN
    assert user.scopes == [Scope.USERS_WRITE]
    assert user.hashed_password != "securepassword123"
    assert password_hash.verify("securepassword123", user.hashed_password)


def test_build_user_builds_user_with_correct_account_type() -> None:
    """build_user should convert the account_type string to AccountType."""
    user = build_user(
        username="svc",
        password="securepassword123",
        full_name="Service Account",
        account_type="service",
        scopes=[],
    )
    assert user.account_type == AccountType.SERVICE


def test_add_and_get_user() -> None:
    """add should append the user so get can find it."""
    count_before = len(TEST_USERS)
    user = build_user(
        username="add_test_user",
        password="securepassword123",
        full_name="Add Test",
        account_type="user",
        scopes=[],
    )
    add(user)
    assert get("add_test_user") is user
    assert len(TEST_USERS) == count_before + 1


def test_remove_makes_user_unfindable() -> None:
    """remove should delete the user so get returns None."""
    user = build_user(
        username="remove_test_user",
        password="securepassword123",
        full_name="Remove Test",
        account_type="user",
        scopes=[],
    )
    add(user)
    remove(user)
    assert get("remove_test_user") is None


def test_remove_nonexistent_raises() -> None:
    """remove should raise ValueError for a user not in the list."""
    user = build_user(
        username="ghost",
        password="securepassword123",
        full_name="Ghost",
        account_type="user",
        scopes=[],
    )
    with pytest.raises(ValueError):
        remove(user)


def test_update_username() -> None:
    """update should change the username and keep other fields."""
    user = build_user(
        username="orig_name",
        password="securepassword123",
        full_name="Original",
        account_type="user",
        scopes=[Scope.RUNS_READ],
    )
    add(user)
    updated = update(user, username="new_name")
    assert updated.username == "new_name"
    assert updated.full_name == "Original"
    assert updated.account_type == AccountType.USER
    assert updated.scopes == [Scope.RUNS_READ]
    assert get("new_name") is updated
    assert get("orig_name") is None


def test_update_password() -> None:
    """update should rehash the password when a new one is provided."""
    user = build_user(
        username="pwd_test",
        password="oldpassword123",
        full_name="Pwd Test",
        account_type="user",
        scopes=[],
    )
    add(user)
    updated = update(user, password="newpassword456")
    assert password_hash.verify("newpassword456", updated.hashed_password)
    assert not password_hash.verify("oldpassword123", updated.hashed_password)


def test_update_preserves_password_when_none() -> None:
    """update should keep the existing hashed_password when password is None."""
    user = build_user(
        username="keep_pwd",
        password="securepassword123",
        full_name="Keep Pwd",
        account_type="user",
        scopes=[],
    )
    add(user)
    updated = update(user, full_name="Updated Name")
    assert updated.hashed_password == user.hashed_password


def test_update_replaces_in_list() -> None:
    """update should replace the old user in TEST_USERS."""
    user = build_user(
        username="replace_test",
        password="securepassword123",
        full_name="Replace Test",
        account_type="user",
        scopes=[],
    )
    add(user)
    updated = update(user, full_name="Replaced")
    assert user not in TEST_USERS
    assert updated in TEST_USERS
