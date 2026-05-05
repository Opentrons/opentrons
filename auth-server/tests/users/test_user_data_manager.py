import pytest
from decoy import Decoy, matchers

from auth_server.persistence.orm_models import User
from auth_server.settings.models import SettingsResponseData
from auth_server.settings.store import SettingsStore
from auth_server.users.models import ACCOUNT_TYPE_TO_SCOPES, AccountType, UserResponse
from auth_server.users.store import UserStore
from auth_server.users.user_data_manager import (
    InvalidInputError,
    UserAlreadyExistsError,
    UserDataManager,
    UserNotFoundError,
)


@pytest.fixture()
def mock_store(decoy: Decoy) -> UserStore:
    """Get a mock UserStore."""
    return decoy.mock(cls=UserStore)


@pytest.fixture()
def mock_settings(decoy: Decoy) -> SettingsStore:
    """Get a mock SettingsStore."""
    return decoy.mock(cls=SettingsStore)


@pytest.fixture()
def manager(
    decoy: Decoy, mock_store: UserStore, mock_settings: SettingsStore
) -> UserDataManager:
    """Provide a UserDataManager backed by a mock store."""
    decoy.when(mock_store.get_failed_login_count(matchers.Anything())).then_return(0)
    return UserDataManager(user_store=mock_store, settings_store=mock_settings)


def _make_orm_user(
    username: str = "user",
    hashed_password: str = "h",
    full_name: str = "Full Name",
    account_type: AccountType = AccountType.USER,
    reset_password: bool = False,
) -> User:
    """Helper to build an ORM User for mock return values."""
    return User(
        username=username,
        hashed_password=hashed_password,
        full_name=full_name,
        account_type=account_type,
        reset_password=reset_password,
    )


# ── seed_initial_users ──────────────────────────────────────────────


def test_seed_calls_store_seed(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    manager.seed_initial_users()
    decoy.verify(mock_store.seed(matchers.IsA(list)))


# ── create_user ─────────────────────────────────────────────────────


def test_create_user_success(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    expected = _make_orm_user(
        username="new_user",
        full_name="New User",
        account_type=AccountType.USER,
    )
    decoy.when(mock_store.get("new_user")).then_return(None)
    decoy.when(
        mock_store.add(
            username="new_user",
            hashed_password=matchers.IsA(str),
            full_name="New User",
            account_type=AccountType.USER,
        )
    ).then_return(expected)

    result = manager.create_user(
        username="new_user",
        password="validpass123",
        full_name="New User",
        account_type=AccountType.USER,
    )
    assert result == UserResponse(
        userName="new_user",
        fullName="New User",
        accountType=AccountType.USER,
        scopes=sorted(
            scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType.USER]
        ),
        locked=False,
        resetPassword=False,
    )


def test_create_user_hashes_password(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    decoy.when(mock_store.get("hash_check")).then_return(None)

    created = _make_orm_user(username="hash_check", full_name="X")
    decoy.when(
        mock_store.add("hash_check", matchers.IsA(str), "X", AccountType.USER)
    ).then_return(created)
    result = manager.create_user(
        username="hash_check",
        password="plaintextpw",
        full_name="X",
        account_type=AccountType.USER,
    )
    assert result == UserResponse(
        userName="hash_check",
        fullName="X",
        accountType=AccountType.USER,
        scopes=sorted(
            scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType.USER]
        ),
        locked=False,
        resetPassword=False,
    )


def test_create_user_duplicate_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.get("dup_user")).then_return(
        _make_orm_user(username="dup_user")
    )
    with pytest.raises(UserAlreadyExistsError):
        manager.create_user(
            username="dup_user",
            password="validpass123",
            full_name="Second",
            account_type=AccountType.USER,
        )


def test_create_user_empty_username_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="userName"):
        manager.create_user(
            username="",
            password="validpass123",
            full_name="X",
            account_type=AccountType.USER,
        )


def test_create_user_empty_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="password"):
        manager.create_user(
            username="empty_pw",
            password="",
            full_name="X",
            account_type=AccountType.USER,
        )


def test_create_user_short_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="at least 8 characters"):
        manager.create_user(
            username="short_pw",
            password="1234567",
            full_name="X",
            account_type=AccountType.USER,
        )


def test_create_user_empty_full_name_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="fullName"):
        manager.create_user(
            username="no_name",
            password="validpass123",
            full_name="",
            account_type=AccountType.USER,
        )


# ── get_user ────────────────────────────────────────────────────────


def test_get_user_returns_existing(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    expected = _make_orm_user(username="admin", account_type=AccountType.ADMIN)
    decoy.when(mock_store.get("admin")).then_return(expected)
    result = manager.get_user("admin")
    assert result == UserResponse(
        userName="admin",
        fullName="Full Name",
        accountType=AccountType.ADMIN,
        scopes=sorted(
            scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType.ADMIN]
        ),
        locked=False,
        resetPassword=False,
    )


def test_get_user_locked_when_failed_logins_reach_limit(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
) -> None:
    """``locked`` is True when failed login count meets ``maxNumberOfLoginAttempts``."""
    decoy.when(mock_settings.get_settings()).then_return(
        SettingsResponseData(maxNumberOfLoginAttempts=3)
    )
    decoy.when(mock_store.get_failed_login_count("alice")).then_return(3)
    decoy.when(mock_store.get("alice")).then_return(
        _make_orm_user(username="alice", full_name="Alice")
    )
    manager = UserDataManager(user_store=mock_store, settings_store=mock_settings)
    result = manager.get_user("alice")
    assert result == UserResponse(
        userName="alice",
        fullName="Alice",
        accountType=AccountType.USER,
        scopes=sorted(
            scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType.USER]
        ),
        locked=True,
        resetPassword=False,
    )


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
    decoy.when(mock_store.remove("ghost")).then_raise(  # type: ignore[func-returns-value]
        ValueError("User 'ghost' not found")
    )
    with pytest.raises(UserNotFoundError):
        manager.delete_user("ghost")


# ── update_user ─────────────────────────────────────────────────────


def test_update_user_username(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    expected = _make_orm_user(
        username="new_name",
        full_name="Name Test",
    )
    decoy.when(
        mock_store.update(
            "old_name",
            new_username="new_name",
            hashed_password=None,
            full_name=None,
            account_type=None,
            reset_password=False,
        )
    ).then_return(expected)

    result = manager.update_user(
        "old_name", new_username="new_name", reset_password=False
    )
    assert result == UserResponse(
        userName="new_name",
        fullName="Name Test",
        accountType=AccountType.USER,
        scopes=sorted(
            scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType.USER]
        ),
        locked=False,
        resetPassword=False,
    )


def test_update_user_password_is_hashed(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    """Test that the password is hashed when updating a user."""

    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    updated = _make_orm_user(username="pw_user", full_name="X")
    decoy.when(
        mock_store.update("pw_user", None, matchers.IsA(str), None, None, True)
    ).then_return(updated)
    manager.update_user("pw_user", new_password="newpassword2", reset_password=True)
    decoy.verify(
        mock_store.update("pw_user", None, matchers.IsA(str), None, None, True)
    )


def test_update_user_rename_to_existing_username_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.get("alice")).then_return(_make_orm_user(username="alice"))
    with pytest.raises(UserAlreadyExistsError):
        manager.update_user("bob", new_username="alice", reset_password=False)


def test_update_user_not_found_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.update("ghost", None, None, "Nope", None, False)).then_raise(
        ValueError("User 'ghost' not found")
    )
    with pytest.raises(UserNotFoundError):
        manager.update_user("ghost", new_full_name="Nope", reset_password=False)


def test_update_user_empty_username_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="userName"):
        manager.update_user("test_admin", new_username="")


def test_update_user_short_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="at least 8 characters"):
        manager.update_user("test_admin", new_password="short")
