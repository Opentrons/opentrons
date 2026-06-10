"""Functions to use as FastAPI dependencies for the persistence layer."""

from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from server_utils.persistence.persistence_directory import PersistenceResetter

_sql_engine_accessor = AppStateAccessor[SQLEngine]("sql_engine")
_persistence_directory_root_accessor = AppStateAccessor[Path]("persistence_directory")


def set_sql_engine(app_state: AppState, sql_engine: SQLEngine) -> None:
    """Store the SQL engine on the app state for later retrieval.

    This should be called once at server startup.
    """
    _sql_engine_accessor.set_on(app_state, sql_engine)


async def get_sql_engine(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> SQLEngine:
    """Return the server's singleton SQLAlchemy Engine."""
    sql_engine = _sql_engine_accessor.get_from(app_state)
    assert sql_engine is not None, (
        "Forgot to initialize SQL engine as part of server startup?"
    )
    return sql_engine


def set_persistence_directory(app_state: AppState, directory: Path) -> None:
    """Store the root persistence directory on app state.

    This should be called once at server startup.
    """
    _persistence_directory_root_accessor.set_on(app_state, directory)


async def get_persistence_directory_root(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> Path:
    """Return the root persistence directory."""
    directory = _persistence_directory_root_accessor.get_from(app_state)
    assert directory is not None, (
        "Forgot to initialize persistence directory as part of server startup?"
    )
    return directory


async def get_persistence_resetter(
    directory_to_reset: Annotated[Path, Depends(get_persistence_directory_root)],
) -> PersistenceResetter:
    """Get a ``PersistenceResetter`` to reset the audit-server's stored data."""
    return PersistenceResetter(directory_to_reset)
