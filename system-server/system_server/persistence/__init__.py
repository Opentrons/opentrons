"""system_server.persistence: provides interface for persistent database storage."""
import logging
from pathlib import Path
from fastapi import Depends
from typing_extensions import Final
import sqlalchemy


from .database import create_sql_engine
from .tables import registration_table, migration_table
from .persistent_directory import create_persistent_directory

from system_server.app_state import AppState, AppStateAccessor, get_app_state
from system_server.settings import get_settings


_sql_engine_accessor = AppStateAccessor[sqlalchemy.engine.Engine]("sql_engine")
_persistence_directory_accessor = AppStateAccessor[Path]("persistence_directory")

_DATABASE_FILE: Final = "system_server.db"

_log = logging.getLogger(__name__)


async def get_persistence_directory(
    app_state: AppState = Depends(get_app_state),
) -> Path:
    """Return the root persistence directory, creating it if necessary."""
    persistence_dir = _persistence_directory_accessor.get_from(app_state)

    if persistence_dir is None:
        setting = get_settings().persistence_directory

        # There is no appropriate default to this setting, so raise an
        # exception and bail if it isn't specified.
        if setting is None:
            raise RuntimeError(
                "No persistence path was specified.\n"
                "Configure a persistence path with OT_SYSTEM_SERVER_persistence_directory"
            )
        persistence_dir = await create_persistent_directory(
            None if setting == "automatically_make_temporary" else Path(setting)
        )
        _persistence_directory_accessor.set_on(app_state, persistence_dir)

    return persistence_dir


async def get_sql_engine(
    app_state: AppState = Depends(get_app_state),
    persistence_directory: Path = Depends(get_persistence_directory),
) -> sqlalchemy.engine.Engine:
    """Return a singleton SQL engine referring to a ready-to-use database."""
    sql_engine = _sql_engine_accessor.get_from(app_state)

    if sql_engine is None:
        sql_engine = create_sql_engine(persistence_directory / _DATABASE_FILE)
        _sql_engine_accessor.set_on(app_state, sql_engine)

    return sql_engine
    # Rely on connections being cleaned up automatically when the process dies.
    # FastAPI doesn't give us a convenient way to properly tie
    # the lifetime of a dependency to the lifetime of the server app.
    # https://github.com/tiangolo/fastapi/issues/617


__all__ = [
    "get_persistence_directory",
    "get_sql_engine",
    "registration_table",
    "migration_table",
]
