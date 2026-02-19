import pytest

from server_utils.auth.scopes import Scope

from auth_server.persistence.database import Base, sql_engine_ctx
from auth_server.persistence.tables import AccountType
from auth_server.users.service import UserService, hash_password
from auth_server.users.store import UserStore

HASHED_PW = hash_password("securepassword123")


@pytest.fixture()
def user_store() -> UserStore:
    """Provide a UserStore backed by a fresh in-memory DB with seed users."""
    with sql_engine_ctx() as engine:
        Base.metadata.create_all(engine)
        store = UserStore(sql_engine=engine)
        service = UserService(user_store=store)
        service.seed_initial_users()
        yield store  # type: ignore[misc]


def test_get_returns_existing_user(user_store: UserStore) -> None:
    """get should return the User when the username exists."""
    user = user_store.get("test_admin")
    assert user is not None
    assert user.username == "test_admin"
    assert user.account_type == AccountType.ADMIN


def test_get_returns_none_for_nonexistent_user(user_store: UserStore) -> None:
    """get should return None when the username does not exist."""
    assert user_store.get("nonexistent_user") is None


def test_get_returns_dynamically_added_user(user_store: UserStore) -> None:
    """get should find a user that was added via add()."""
    added_user = user_store.add(
        username="dynamic_user",
        hashed_password=HASHED_PW,
        full_name="Dynamic User",
        account_type=AccountType.SERVICE,
        scopes=[],
    )
    assert added_user is not None
    assert added_user.username == "dynamic_user"
    assert added_user.account_type == AccountType.SERVICE


def test_add_and_get_user(user_store: UserStore) -> None:
    """add should persist the user so get can find it."""
    user_store.add(
        username="add_test_user",
        hashed_password=HASHED_PW,
        full_name="Add Test",
        account_type=AccountType.USER,
        scopes=[],
    )
    fetched = user_store.get("add_test_user")
    assert fetched is not None
    assert fetched.username == "add_test_user"


def test_remove_and_get_user(user_store: UserStore) -> None:
    """remove should delete the user so get returns None."""
    user_store.add(
        username="remove_test_user",
        hashed_password=HASHED_PW,
        full_name="Remove Test",
        account_type=AccountType.USER,
        scopes=[],
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
        scopes=[Scope.RUNS_READ],
    )
    updated = user_store.update("orig_name", new_username="new_name")
    assert updated.username == "new_name"
    assert updated.full_name == "Original"
    assert updated.account_type == AccountType.USER
    assert updated.scopes == [Scope.RUNS_READ]
    assert user_store.get("new_name") is not None
    assert user_store.get("orig_name") is None


def test_update_preserves_password_when_none(user_store: UserStore) -> None:
    """update should keep the existing hashed_password when hashed_password is None."""
    added_user = user_store.add(
        username="keep_pwd",
        hashed_password=HASHED_PW,
        full_name="Keep Pwd",
        account_type=AccountType.USER,
        scopes=[],
    )
    updated = user_store.update("keep_pwd", full_name="Updated Name")
    assert updated.hashed_password == added_user.hashed_password


def test_update_persists(user_store: UserStore) -> None:
    """update should persist the change so a fresh get reflects it."""
    user_store.add(
        username="persist_test",
        hashed_password=HASHED_PW,
        full_name="Before",
        account_type=AccountType.USER,
        scopes=[],
    )
    user_store.update("persist_test", full_name="After")
    fetched = user_store.get("persist_test")
    assert fetched is not None
    assert fetched.full_name == "After"
