import pytest
from decoy import Decoy, matchers

from server_utils.auth.scopes import Scope

from auth_server.persistence.tables import AccountType, User
from auth_server.users.store import UserStore
from auth_server.users.user_data_manager import (
    InvalidInputError,
    UserAlreadyExistsError,
    UserDataManager,
    UserNotFoundError,
    password_hash,
)


@pytest.fixture()
def mock_store(decoy: Decoy) -> UserStore:
    """Get a mock UserStore."""
    return decoy.mock(cls=UserStore)


@pytest.fixture()
def manager(mock_store: UserStore) -> UserDataManager:
    """Provide a UserDataManager backed by a mock store."""
    return UserDataManager(user_store=mock_store)


# ── create_user ─────────────────────────────────────────────────────


def test_create_user_success(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    expected_user = User(
        username="new_user",
        hashed_password="hashed",
        full_name="New User",
        account_type=AccountType.USER,
        scopes=[Scope.RUNS_READ],
    )
    decoy.when(mock_store.get("new_user")).then_return(None)
    decoy.when(
        mock_store.add(
            username="new_user",
            hashed_password=matchers.IsA(str),
            full_name="New User",
            account_type=AccountType.USER,
            scopes=[Scope.RUNS_READ],
        )
    ).then_return(expected_user)

    result = manager.create_user(
        username="new_user",
        password="validpass123",
        full_name="New User",
        account_type=AccountType.USER,
        scopes=[Scope.RUNS_READ],
    )
    assert result == expected_user


def test_create_user_hashes_password(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.get("hash_check")).then_return(None)
    decoy.when(
        mock_store.add(
            username="hash_check",
            hashed_password=matchers.IsA(str),
            full_name="X",
            account_type=AccountType.USER,
            scopes=[],
        )
    ).then_return(
        User(
            username="hash_check",
            hashed_password="anything",
            full_name="X",
            account_type=AccountType.USER,
            scopes=[],
        )
    )

    manager.create_user(
        username="hash_check",
        password="plaintextpw",
        full_name="X",
        account_type=AccountType.USER,
        scopes=[],
    )

    # The store should never receive the raw password.
    decoy.verify(
        mock_store.add(
            username="hash_check",
            hashed_password="plaintextpw",
            full_name="X",
            account_type=AccountType.USER,
            scopes=[],
        ),
        times=0,
    )


def test_create_user_duplicate_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.get("dup_user")).then_return(
        User(
            username="dup_user",
            hashed_password="h",
            full_name="Existing",
            account_type=AccountType.USER,
            scopes=[],
        )
    )
    with pytest.raises(UserAlreadyExistsError):
        manager.create_user(
            username="dup_user",
            password="validpass123",
            full_name="Second",
            account_type=AccountType.USER,
            scopes=[],
        )


def test_create_user_empty_username_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="userName"):
        manager.create_user(
            username="",
            password="validpass123",
            full_name="X",
            account_type=AccountType.USER,
            scopes=[],
        )


def test_create_user_empty_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="password"):
        manager.create_user(
            username="empty_pw",
            password="",
            full_name="X",
            account_type=AccountType.USER,
            scopes=[],
        )


def test_create_user_short_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="at least 8 characters"):
        manager.create_user(
            username="short_pw",
            password="1234567",
            full_name="X",
            account_type=AccountType.USER,
            scopes=[],
        )


def test_create_user_empty_full_name_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="fullName"):
        manager.create_user(
            username="no_name",
            password="validpass123",
            full_name="",
            account_type=AccountType.USER,
            scopes=[],
        )


# ── get_user ────────────────────────────────────────────────────────


def test_get_user_returns_existing(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    expected = User(
        username="admin",
        hashed_password="h",
        full_name="Admin",
        account_type=AccountType.ADMIN,
        scopes=[],
    )
    decoy.when(mock_store.get("admin")).then_return(expected)
    assert manager.get_user("admin") == expected


def test_get_user_not_found_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.get("ghost")).then_return(None)
    with pytest.raises(UserNotFoundError):
        manager.get_user("ghost")


# ── delete_user ─────────────────────────────────────────────────────


def test_delete_user_success(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    manager.delete_user("to_delete")
    decoy.verify(mock_store.remove("to_delete"))


def test_delete_user_not_found_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.remove("ghost")).then_raise(
        ValueError("User 'ghost' not found")
    )
    with pytest.raises(UserNotFoundError):
        manager.delete_user("ghost")


# ── update_user ─────────────────────────────────────────────────────


def test_update_user_username(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    expected = User(
        username="new_name",
        hashed_password="h",
        full_name="Name Test",
        account_type=AccountType.USER,
        scopes=[Scope.RUNS_READ],
    )
    decoy.when(
        mock_store.update(
            "old_name",
            new_username="new_name",
            hashed_password=None,
            full_name=None,
            account_type=None,
        )
    ).then_return(expected)

    result = manager.update_user("old_name", new_username="new_name")
    assert result.username == "new_name"


def test_update_user_password_is_hashed(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    expected = User(
        username="pw_user",
        hashed_password="new_hash",
        full_name="Pw Test",
        account_type=AccountType.USER,
        scopes=[],
    )
    decoy.when(
        mock_store.update(
            "pw_user",
            new_username=None,
            hashed_password=matchers.IsA(str),
            full_name=None,
            account_type=None,
        )
    ).then_return(expected)

    result = manager.update_user("pw_user", password="newpassword2")
    assert result == expected

    # Raw password should never reach the store.
    decoy.verify(
        mock_store.update(
            "pw_user",
            new_username=None,
            hashed_password="newpassword2",
            full_name=None,
            account_type=None,
        ),
        times=0,
    )


def test_update_user_not_found_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(
        mock_store.update(
            "ghost",
            new_username=None,
            hashed_password=None,
            full_name="Nope",
            account_type=None,
        )
    ).then_raise(ValueError("User 'ghost' not found"))

    with pytest.raises(UserNotFoundError):
        manager.update_user("ghost", full_name="Nope")


def test_update_user_empty_username_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="userName"):
        manager.update_user("test_admin", new_username="")


def test_update_user_short_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="at least 8 characters"):
        manager.update_user("test_admin", password="short")
