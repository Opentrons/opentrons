"""FastAPI dependencies for the users domain."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from auth_server.persistence.fastapi_dependencies import get_sql_engine
from auth_server.settings.store import SettingsStore, get_settings_store
from auth_server.users.models import UserResponse
from auth_server.users.store import UserStore
from auth_server.users.user_data_manager import UserDataManager, UserNotFoundError

_user_store_accessor = AppStateAccessor[UserStore]("user_store")


async def get_user_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
) -> UserStore:
    """Get a singleton UserStore."""
    user_store = _user_store_accessor.get_from(app_state)

    if user_store is None:
        user_store = UserStore(sql_engine=sql_engine)
        _user_store_accessor.set_on(app_state, user_store)

    return user_store


async def get_user_data_manager(
    user_store: Annotated[UserStore, Depends(get_user_store)],
    settings_store: Annotated[SettingsStore, Depends(get_settings_store)],
) -> UserDataManager:
    """Get a UserDataManager backed by the singleton UserStore."""
    return UserDataManager(user_store=user_store, settings_store=settings_store)


async def get_user_by_username(
    username: str,
    user_data_manager: Annotated[UserDataManager, Depends(get_user_data_manager)],
) -> UserResponse:
    """Load the user named in the URL path, or raise HTTP 404."""
    try:
        return user_data_manager.get_user(username)
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
