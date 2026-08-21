import datetime
from pathlib import Path
from typing import Generator

import pytest

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.users.models import AccountType
from auth_server.users.store import UserStore
from auth_server.users.user_data_manager import (
    password_hash,
)

HASHED_PW = password_hash.hash("securepassword123")
_NOW = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)


@pytest.fixture()
def user_store(tmp_path: Path) -> Generator[UserStore, None, None]:
    """Provide a UserStore backed by a fresh SQLite DB with seed users."""
    db_path = tmp_path / "test_auth.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        store = UserStore(sql_engine=engine)
        yield store


def test_get_returns_none_for_nonexistent_user(user_store: UserStore) -> None:
    """get should return None when the username does not exist."""
    assert user_store.get("nonexistent_user") is None


def test_add_and_get_user(user_store: UserStore) -> None:
    """add should persist the user so get can find it."""
    user_store.add(
        username="add_test_user",
        hashed_password=HASHED_PW,
        full_name="Add Test",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    fetched = user_store.get("add_test_user")
    assert fetched is not None
    assert fetched.username == "add_test_user"
    assert fetched.hashed_password == HASHED_PW
    assert fetched.full_name == "Add Test"
    assert fetched.account_type == AccountType.USER
    assert fetched.reset_password is False
    assert fetched.deactivated is False


def test_update_deactivated(user_store: UserStore) -> None:
    user_store.add(
        username="deactivate_test_user",
        hashed_password=HASHED_PW,
        full_name="Deactivate Test",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    updated = user_store.update("deactivate_test_user", deactivated=True, now=_NOW)
    assert updated.deactivated is True


def test_list_all_returns_users_ordered_by_username(user_store: UserStore) -> None:
    user_store.add(
        username="zebra",
        hashed_password=HASHED_PW,
        full_name="Zebra",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    user_store.add(
        username="alpha",
        hashed_password=HASHED_PW,
        full_name="Alpha",
        account_type=AccountType.ADMIN,
        now=_NOW,
        reset_password=False,
    )

    usernames = [user.username for user in user_store.get_all()]

    assert usernames == ["alpha", "zebra"]


def test_add_user_with_reset_password_flag(user_store: UserStore) -> None:
    user_store.add(
        username="reset_on_create_user",
        hashed_password=HASHED_PW,
        full_name="Reset On Create",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=True,
    )
    fetched = user_store.get("reset_on_create_user")
    assert fetched is not None
    assert fetched.reset_password is True


def test_remove_and_get_user(user_store: UserStore) -> None:
    """remove should delete the user so get returns None."""
    user_store.add(
        username="remove_test_user",
        hashed_password=HASHED_PW,
        full_name="Remove Test",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    user_store.remove("remove_test_user")
    assert user_store.get("remove_test_user") is None


def test_remove_nonexistent_raises(user_store: UserStore) -> None:
    """remove should raise ValueError for a user not in the database."""
    with pytest.raises(ValueError):
        user_store.remove("ghost")


def test_update_username(user_store: UserStore) -> None:
    """update should change the username and keep other fields."""
    user_store.add(
        username="orig_name",
        hashed_password=HASHED_PW,
        full_name="Original",
        account_type="user",
        now=_NOW,
        reset_password=False,
    )
    updated = user_store.update("orig_name", new_username="new_name", now=_NOW)
    assert updated.username == "new_name"
    assert updated.full_name == "Original"
    assert updated.account_type == AccountType.USER
    assert user_store.get("new_name") is not None
    assert user_store.get("orig_name") is None


def test_update_preserves_password_when_none(user_store: UserStore) -> None:
    """update should keep the existing hashed_password when hashed_password is None."""
    added_user = user_store.add(
        username="keep_pwd",
        hashed_password=HASHED_PW,
        full_name="Keep Pwd",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    updated = user_store.update("keep_pwd", full_name="Updated Name", now=_NOW)
    assert updated.hashed_password == added_user.hashed_password


def test_update_password_sets_password_set_at(user_store: UserStore) -> None:
    """update should refresh password_set_at when hashed_password changes."""
    user_store.add(
        username="username",
        hashed_password=HASHED_PW,
        full_name="Full Name",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    new_hash = password_hash.hash("anotherpassword456")
    later = datetime.datetime(2026, 6, 1, tzinfo=datetime.UTC)
    assert later != _NOW
    updated = user_store.update(
        "username",
        hashed_password=new_hash,
        now=later,
    )
    assert updated.password_set_at == later

    fetched = user_store.get("username")
    assert fetched is not None
    assert fetched.password_set_at == later


def test_update_persists(user_store: UserStore) -> None:
    """update should persist the change so a fresh get reflects it."""
    user_store.add(
        username="persist_test",
        hashed_password=HASHED_PW,
        full_name="Before",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    user_store.update("persist_test", full_name="After", reset_password=True, now=_NOW)
    fetched = user_store.get("persist_test")
    assert fetched is not None
    assert fetched.full_name == "After"
    assert fetched.reset_password

    user_store.update("persist_test", reset_password=False, now=_NOW)
    fetched = user_store.get("persist_test")
    assert fetched is not None
    assert not fetched.reset_password


def test_failed_login_counter(user_store: UserStore) -> None:
    # All methods should raise ValueError if the given username isn't found.
    with pytest.raises(ValueError):
        user_store.get_failed_login_count("nonexistent_user")
    with pytest.raises(ValueError):
        user_store.clear_failed_logins("nonexistent_user")
    with pytest.raises(ValueError):
        user_store.record_failed_login("nonexistent_user", datetime.datetime.now())

    # After user creation, counts should default to 0.
    user_store.add(
        username="user_a",
        hashed_password=HASHED_PW,
        full_name="User A",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    user_store.add(
        username="user_b",
        hashed_password=HASHED_PW,
        full_name="User B",
        account_type=AccountType.USER,
        now=_NOW,
        reset_password=False,
    )
    assert user_store.get_failed_login_count("user_a") == 0
    assert user_store.get_failed_login_count("user_b") == 0

    # record_failed_login() should increment the count.
    assert (
        user_store.record_failed_login("user_a", datetime.datetime.now(tz=datetime.UTC))
        == 1
    )
    assert (
        user_store.record_failed_login("user_a", datetime.datetime.now(tz=datetime.UTC))
        == 2
    )
    assert (
        user_store.record_failed_login("user_b", datetime.datetime.now(tz=datetime.UTC))
        == 1
    )
    assert user_store.get_failed_login_count("user_a") == 2
    assert user_store.get_failed_login_count("user_b") == 1

    # record_failed_login() should reject invalid timezones.
    with pytest.raises(Exception):
        user_store.record_failed_login("user_a", datetime.datetime.now())

    # clear_failed_logins() should reset the count back to 0, for only the affected user.
    user_store.clear_failed_logins("user_a")
    assert user_store.get_failed_login_count("user_a") == 0
    assert user_store.get_failed_login_count("user_b") == 1

    # A user should be allowed to be deleted even if it has failed logins.
    # The failed logins should be deleted automatically along with the user.
    user_store.record_failed_login("user_a", datetime.datetime.now(tz=datetime.UTC))
    user_store.remove("user_a")
    assert user_store.get("user_a") is None
