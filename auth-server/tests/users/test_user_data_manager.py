import datetime
import string

import pytest
from decoy import Decoy, matchers

from auth_server.persistence.orm_models import User
from auth_server.settings.models import SettingsResponseData
from auth_server.settings.store import SettingsStore
from auth_server.users.models import (
    AccountType,
    ResetPasswordReason,
    TemporaryPasswordResponse,
    UserResponse,
)
from auth_server.users.store import _UNSET, UserStore
from auth_server.users.user_data_manager import (
    InvalidInputError,
    PasswordMissingSpecialCharactersError,
    PasswordPreviouslyUsedError,
    PasswordTooShortError,
    UserAlreadyExistsError,
    UserDataManager,
    UserNotFoundError,
    _generate_temporary_password,
    _password_complexity_requirements,
    get_reset_password_reason,
    must_reset_password,
    password_hash,
)

_NOW = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)


@pytest.fixture()
def mock_store(decoy: Decoy) -> UserStore:
    """Get a mock UserStore."""
    return decoy.mock(cls=UserStore)


@pytest.fixture()
def mock_settings(decoy: Decoy) -> SettingsStore:
    """Get a mock SettingsStore."""
    mock = decoy.mock(cls=SettingsStore)
    decoy.when(mock.get_settings()).then_return(SettingsResponseData())
    return mock


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
    reset_password_reason: ResetPasswordReason | None = None,
    deactivated: bool = False,
    password_set_at: datetime.datetime = _NOW,
) -> User:
    """Helper to build an ORM User for mock return values."""
    return User(
        username=username,
        hashed_password=hashed_password,
        full_name=full_name,
        account_type=account_type,
        reset_password_reason=(
            reset_password_reason.value if reset_password_reason is not None else None
        ),
        deactivated=deactivated,
        password_set_at=password_set_at,
    )


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
            now=matchers.IsA(datetime.datetime),
            reset_password_reason=None,
        )
    ).then_return(expected)

    result = manager.create_user(
        username="new_user",
        password="validpass123",
        full_name="New User",
        account_type=AccountType.USER,
        now=_NOW,
    )
    assert result == TemporaryPasswordResponse(
        username="new_user",
        fullName="New User",
        accountType=AccountType.USER,
        locked=False,
        resetPassword=False,
        resetPasswordReason=ResetPasswordReason.NONE,
        temporaryPassword=None,
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
        mock_store.add(
            "hash_check",
            matchers.IsA(str),
            "X",
            AccountType.USER,
            now=matchers.IsA(datetime.datetime),
            reset_password_reason=None,
        )
    ).then_return(created)
    result = manager.create_user(
        username="hash_check",
        password="plaintextpw",
        full_name="X",
        account_type=AccountType.USER,
        now=_NOW,
    )
    assert result == TemporaryPasswordResponse(
        username="hash_check",
        fullName="X",
        accountType=AccountType.USER,
        locked=False,
        resetPassword=False,
        resetPasswordReason=ResetPasswordReason.NONE,
        temporaryPassword=None,
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
            now=matchers.IsA(datetime.datetime),
        )


def test_create_user_empty_username_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="username"):
        manager.create_user(
            username="",
            password="validpass123",
            full_name="X",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
        )


def test_create_user_empty_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="password"):
        manager.create_user(
            username="empty_pw",
            password="",
            full_name="X",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
        )


def test_create_user_without_password_sets_reset_password(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    decoy.when(mock_store.get("temp_pw_user")).then_return(None)
    expected = _make_orm_user(
        username="temp_pw_user",
        full_name="Temp PW User",
        account_type=AccountType.USER,
        reset_password_reason=ResetPasswordReason.FIRST_TIME_LOGIN,
    )
    decoy.when(
        mock_store.add(
            username="temp_pw_user",
            hashed_password=matchers.IsA(str),
            full_name="Temp PW User",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
            reset_password_reason=ResetPasswordReason.FIRST_TIME_LOGIN,
        )
    ).then_return(expected)

    result = manager.create_user(
        username="temp_pw_user",
        password=None,
        full_name="Temp PW User",
        account_type=AccountType.USER,
        now=_NOW,
    )
    assert result.username == "temp_pw_user"
    assert result.fullName == "Temp PW User"
    assert result.accountType == AccountType.USER
    assert result.locked is False
    assert result.resetPassword is True
    assert result.resetPasswordReason is ResetPasswordReason.FIRST_TIME_LOGIN
    assert result.temporaryPassword is not None
    assert len(result.temporaryPassword) == 8
    assert all(
        c in string.ascii_letters + string.digits for c in result.temporaryPassword
    )


def test_create_user_short_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(PasswordTooShortError) as exc_info:
        manager.create_user(
            username="short_pw",
            password="1234567",
            full_name="X",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
        )
    assert exc_info.value.actual_length == 7
    assert exc_info.value.required_length == 8


def test_create_user_enforces_password_length(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    minimum_length = 12
    decoy.when(mock_settings.get_settings()).then_return(
        SettingsResponseData(
            passwordComplexityMinimumLength=minimum_length,
            passwordComplexitySpecialCharacters=False,
        )
    )
    decoy.when(
        mock_store.add(
            username="test_user",
            hashed_password=matchers.IsA(str),
            full_name="Test User",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
            reset_password_reason=None,
        )
    ).then_return(_make_orm_user(username="test_user"))
    with pytest.raises(PasswordTooShortError) as exc_info:
        manager.create_user(
            password="☃" * (minimum_length - 1),
            username="test_user",
            full_name="Test User",
            account_type=AccountType.USER,
            now=_NOW,
        )
    assert exc_info.value.actual_length == minimum_length - 1
    assert exc_info.value.required_length == minimum_length
    manager.create_user(  # Should not raise.
        password="☃" * minimum_length,
        username="test_user",
        full_name="Test User",
        account_type=AccountType.USER,
        now=_NOW,
    )


def test_create_user_enforces_password_special_characters(
    decoy: Decoy,
    mock_settings: SettingsStore,
    mock_store: UserStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(
        SettingsResponseData(
            passwordComplexityMinimumLength=3, passwordComplexitySpecialCharacters=True
        )
    )
    decoy.when(
        mock_store.add(
            username="test_user",
            hashed_password=matchers.IsA(str),
            full_name="Test User",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
            reset_password_reason=None,
        )
    ).then_return(_make_orm_user(username="test_user"))
    with pytest.raises(PasswordMissingSpecialCharactersError):
        manager.create_user(
            password="aaa",
            username="test_user",
            full_name="Test User",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
        )
    manager.create_user(  # Should not raise.
        password="aa!",
        username="test_user",
        full_name="Test User",
        account_type=AccountType.USER,
        now=_NOW,
    )


def test_create_user_empty_full_name_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="fullName"):
        manager.create_user(
            username="no_name",
            password="validpass123",
            full_name="",
            account_type=AccountType.USER,
            now=matchers.IsA(datetime.datetime),
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
        username="admin",
        fullName="Full Name",
        accountType=AccountType.ADMIN,
        locked=False,
        resetPassword=False,
        resetPasswordReason=ResetPasswordReason.NONE,
    )


def test_list_users_returns_all_users(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    decoy.when(mock_store.get_all()).then_return(
        [
            _make_orm_user(username="alice", full_name="Alice"),
            _make_orm_user(
                username="bob", full_name="Bob", account_type=AccountType.ADMIN
            ),
        ]
    )

    result = manager.get_users_list()

    assert result == [
        UserResponse(
            username="alice",
            fullName="Alice",
            accountType=AccountType.USER,
            locked=False,
            resetPassword=False,
            resetPasswordReason=ResetPasswordReason.NONE,
        ),
        UserResponse(
            username="bob",
            fullName="Bob",
            accountType=AccountType.ADMIN,
            locked=False,
            resetPassword=False,
            resetPasswordReason=ResetPasswordReason.NONE,
        ),
    ]


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
        username="alice",
        fullName="Alice",
        accountType=AccountType.USER,
        locked=True,
        resetPassword=False,
        resetPasswordReason=ResetPasswordReason.NONE,
    )


def test_get_user_locked_when_deactivated(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    decoy.when(mock_store.get_failed_login_count("alice")).then_return(0)
    decoy.when(mock_store.get("alice")).then_return(
        _make_orm_user(username="alice", full_name="Alice", deactivated=True)
    )
    manager = UserDataManager(user_store=mock_store, settings_store=mock_settings)
    result = manager.get_user("alice")
    assert result.locked is True


def test_get_user_not_found_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.get("ghost")).then_return(None)
    with pytest.raises(UserNotFoundError):
        manager.get_user("ghost")


def test_get_user_reset_password_true_when_password_expired(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(
        SettingsResponseData(passwordResetTime=3600)
    )
    expired_at = datetime.datetime.now(tz=datetime.UTC) - datetime.timedelta(hours=2)
    decoy.when(mock_store.get("expired_user")).then_return(
        _make_orm_user(username="expired_user", password_set_at=expired_at)
    )

    result = manager.get_user("expired_user")

    assert result.resetPassword is True
    assert result.resetPasswordReason is ResetPasswordReason.PASSWORD_EXPIRED


def test_get_user_reset_password_true_when_admin_flag_set(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    decoy.when(mock_store.get("flagged_user")).then_return(
        _make_orm_user(
            username="flagged_user",
            reset_password_reason=ResetPasswordReason.ADMIN_FORCED,
        )
    )

    result = manager.get_user("flagged_user")

    assert result.resetPassword is True
    assert result.resetPasswordReason is ResetPasswordReason.ADMIN_FORCED


@pytest.mark.parametrize(
    ("password_reset_time_sec", "password_age", "stored_reason", "expected"),
    [
        (3600, datetime.timedelta(minutes=30), None, False),
        (3600, datetime.timedelta(hours=2), None, True),
        (None, datetime.timedelta(hours=2), None, False),
        (None, datetime.timedelta(minutes=30), ResetPasswordReason.ADMIN_FORCED, True),
    ],
)
def test_must_reset_password(
    password_reset_time_sec: float | None,
    password_age: datetime.timedelta,
    stored_reason: ResetPasswordReason | None,
    expected: bool,
) -> None:
    now = datetime.datetime.now(tz=datetime.UTC)
    user = _make_orm_user(
        password_set_at=now - password_age,
        reset_password_reason=stored_reason,
    )

    assert must_reset_password(user, now, password_reset_time_sec) is expected


@pytest.mark.parametrize(
    (
        "password_reset_time_sec",
        "password_age",
        "stored_reason",
        "expected",
    ),
    [
        (3600, datetime.timedelta(minutes=30), None, ResetPasswordReason.NONE),
        (3600, datetime.timedelta(hours=2), None, ResetPasswordReason.PASSWORD_EXPIRED),
        (None, datetime.timedelta(hours=2), None, ResetPasswordReason.NONE),
        (
            None,
            datetime.timedelta(minutes=30),
            ResetPasswordReason.ADMIN_FORCED,
            ResetPasswordReason.ADMIN_FORCED,
        ),
        (
            3600,
            datetime.timedelta(hours=2),
            ResetPasswordReason.ADMIN_FORCED,
            ResetPasswordReason.ADMIN_FORCED,
        ),
    ],
)
def test_get_reset_password_reason(
    password_reset_time_sec: float | None,
    password_age: datetime.timedelta,
    stored_reason: ResetPasswordReason | None,
    expected: ResetPasswordReason,
) -> None:
    now = datetime.datetime.now(tz=datetime.UTC)
    user = _make_orm_user(
        password_set_at=now - password_age,
        reset_password_reason=stored_reason,
    )

    assert get_reset_password_reason(user, now, password_reset_time_sec) is expected


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
            reset_password_reason=_UNSET,
            deactivated=None,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(expected)

    result = manager.update_user("old_name", now=_NOW, new_username="new_name")
    assert result == UserResponse(
        username="new_name",
        fullName="Name Test",
        accountType=AccountType.USER,
        locked=False,
        resetPassword=False,
        resetPasswordReason=ResetPasswordReason.NONE,
    )


def test_update_user_deactivates_user(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    expected = _make_orm_user(username="alice", full_name="Alice", deactivated=True)
    decoy.when(
        mock_store.update(
            "alice",
            new_username=None,
            hashed_password=None,
            full_name=None,
            account_type=None,
            reset_password_reason=_UNSET,
            deactivated=True,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(expected)

    result = manager.update_user("alice", now=_NOW, new_locked=True)

    assert result.locked is True


def test_update_user_reactivates_user(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    expected = _make_orm_user(username="alice", full_name="Alice", deactivated=False)
    decoy.when(
        mock_store.update(
            "alice",
            new_username=None,
            hashed_password=None,
            full_name=None,
            account_type=None,
            reset_password_reason=_UNSET,
            deactivated=False,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(expected)

    result = manager.update_user("alice", now=_NOW, new_locked=False)

    decoy.verify(mock_store.clear_failed_logins("alice"), times=1)
    assert result.locked is False


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
        mock_store.update(
            "pw_user",
            None,
            matchers.IsA(str),
            None,
            None,
            None,
            None,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(updated)
    manager.update_user("pw_user", now=_NOW, new_password="newpassword2")
    decoy.verify(
        mock_store.update(
            "pw_user",
            None,
            matchers.IsA(str),
            None,
            None,
            None,
            None,
            now=matchers.IsA(datetime.datetime),
        )
    )


def test_update_user_password_clears_reset_password_flag(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    """Setting a new password clears resetPassword."""
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    updated = _make_orm_user(
        username="pw_user", reset_password_reason=ResetPasswordReason.ADMIN_FORCED
    )
    decoy.when(
        mock_store.update(
            "pw_user",
            None,
            matchers.IsA(str),
            None,
            None,
            None,
            None,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(updated)

    manager.update_user(
        "pw_user",
        now=_NOW,
        new_password="newpassword2",
    )

    decoy.verify(
        mock_store.update(
            "pw_user",
            None,
            matchers.IsA(str),
            None,
            None,
            None,
            None,
            now=matchers.IsA(datetime.datetime),
        )
    )


def test_update_user_rename_to_existing_username_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(mock_store.get("alice")).then_return(_make_orm_user(username="alice"))
    with pytest.raises(UserAlreadyExistsError):
        manager.update_user("bob", now=_NOW, new_username="alice")


def test_update_user_not_found_raises(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    decoy.when(
        mock_store.update(
            "ghost",
            None,
            None,
            "Nope",
            None,
            _UNSET,
            None,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_raise(ValueError("User 'ghost' not found"))
    with pytest.raises(UserNotFoundError):
        manager.update_user("ghost", now=_NOW, new_full_name="Nope")


def test_reset_user_password(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    updated = _make_orm_user(
        username="reset_me", reset_password_reason=ResetPasswordReason.ADMIN_FORCED
    )
    decoy.when(
        mock_store.update(
            "reset_me",
            hashed_password=matchers.IsA(str),
            reset_password_reason=ResetPasswordReason.ADMIN_FORCED,
            deactivated=False,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(updated)

    result = manager.reset_user_password("reset_me", now=_NOW)

    assert result.username == "reset_me"
    assert result.resetPassword is True
    assert result.resetPasswordReason is ResetPasswordReason.ADMIN_FORCED
    assert len(result.temporaryPassword or "") == 8
    assert all(
        c in string.ascii_letters + string.digits
        for c in result.temporaryPassword or ""
    )
    decoy.verify(
        mock_store.clear_failed_logins("reset_me"),
        times=1,
    )
    decoy.verify(
        mock_store.update(
            "reset_me",
            hashed_password=matchers.IsA(str),
            reset_password_reason=ResetPasswordReason.ADMIN_FORCED,
            deactivated=False,
            now=matchers.IsA(datetime.datetime),
        )
    )


def test_reset_user_password_clears_failed_logins(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(
        SettingsResponseData(maxNumberOfLoginAttempts=3)
    )
    decoy.when(mock_store.get_failed_login_count("reset_me")).then_return(0)
    updated = _make_orm_user(
        username="reset_me", reset_password_reason=ResetPasswordReason.ADMIN_FORCED
    )
    decoy.when(
        mock_store.update(
            "reset_me",
            hashed_password=matchers.IsA(str),
            reset_password_reason=ResetPasswordReason.ADMIN_FORCED,
            deactivated=False,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(updated)

    result = manager.reset_user_password("reset_me", now=_NOW)

    assert result.locked is False
    decoy.verify(mock_store.clear_failed_logins("reset_me"), times=1)


def test_reset_user_password_uses_password_complexity_settings(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(
        SettingsResponseData(
            passwordComplexityMinimumLength=12,
            passwordComplexitySpecialCharacters=True,
        )
    )
    updated = _make_orm_user(
        username="reset_me", reset_password_reason=ResetPasswordReason.ADMIN_FORCED
    )
    decoy.when(
        mock_store.update(
            "reset_me",
            hashed_password=matchers.IsA(str),
            reset_password_reason=ResetPasswordReason.ADMIN_FORCED,
            deactivated=False,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_return(updated)

    result = manager.reset_user_password("reset_me", now=_NOW)

    assert len(result.temporaryPassword or "") == 12
    assert any(c in string.punctuation for c in result.temporaryPassword or "")


def test_reset_user_password_not_found_raises(
    decoy: Decoy,
    mock_store: UserStore,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(SettingsResponseData())
    decoy.when(
        mock_store.update(
            "ghost",
            hashed_password=matchers.IsA(str),
            reset_password_reason=ResetPasswordReason.ADMIN_FORCED,
            deactivated=False,
            now=matchers.IsA(datetime.datetime),
        )
    ).then_raise(ValueError("User 'ghost' not found"))
    with pytest.raises(UserNotFoundError):
        manager.reset_user_password("ghost", now=_NOW)


@pytest.mark.parametrize(
    ("settings", "expected_min_length", "expected_require_special"),
    [
        (SettingsResponseData(), 8, False),
        (
            SettingsResponseData(
                passwordComplexityMinimumLength=10,
                passwordComplexitySpecialCharacters=False,
            ),
            10,
            False,
        ),
        (
            SettingsResponseData(
                passwordComplexityMinimumLength=10,
                passwordComplexitySpecialCharacters=True,
            ),
            10,
            True,
        ),
    ],
)
def test_temporary_password_requirements(
    settings: SettingsResponseData,
    expected_min_length: int,
    expected_require_special: bool,
) -> None:
    min_length, require_special = _password_complexity_requirements(settings)
    assert min_length == expected_min_length
    assert require_special is expected_require_special


def test_generate_temporary_password_meets_complexity_rules() -> None:
    password = _generate_temporary_password(12, require_special_characters=True)
    assert len(password) == 12
    assert any(c in string.punctuation for c in password)


def test_update_user_empty_username_raises(manager: UserDataManager) -> None:
    with pytest.raises(InvalidInputError, match="username"):
        manager.update_user("testadmin", new_username="", now=_NOW)


def test_update_user_short_password_raises(manager: UserDataManager) -> None:
    with pytest.raises(PasswordTooShortError) as exc_info:
        manager.update_user("testadmin", new_password="short", now=_NOW)
    assert exc_info.value.actual_length == 5
    assert exc_info.value.required_length == 8


def test_update_user_password_missing_special_character(
    decoy: Decoy,
    mock_settings: SettingsStore,
    manager: UserDataManager,
) -> None:
    decoy.when(mock_settings.get_settings()).then_return(
        SettingsResponseData(passwordComplexitySpecialCharacters=True)
    )
    with pytest.raises(PasswordMissingSpecialCharactersError):
        manager.update_user(
            "testadmin",
            new_password="validpass123",
            now=_NOW,
        )


def test_update_user_rejects_current_password(
    decoy: Decoy, mock_store: UserStore, manager: UserDataManager
) -> None:
    current_password = "currentpassword123"
    decoy.when(mock_store.get("alice")).then_return(
        _make_orm_user(
            username="alice",
            hashed_password=password_hash.hash(current_password),
        )
    )
    with pytest.raises(PasswordPreviouslyUsedError):
        manager.update_user(
            "alice",
            new_password=current_password,
            now=_NOW,
        )
