"""Data access initialization and management."""
import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path
from tempfile import mkdtemp
from typing import Optional
from typing_extensions import Literal
import shutil

import sqlalchemy
from anyio import Path as AsyncPath, to_thread
from fastapi import Depends, status
from typing_extensions import Final

from robot_server.app_state import AppState, AppStateAccessor, get_app_state
from robot_server.errors import ErrorDetails

from ._database import create_sql_engine, sqlite_rowid
from ._tables import (
    migration_table,
    protocol_table,
    analysis_table,
    run_table,
    action_table,
)


_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-robot-server-"
_DATABASE_FILE: Final = "robot_server.db"
_RESET_MARKER_FILE = "_TO_BE_DELETED_ON_REBOOT"


_log = logging.getLogger(__name__)


@dataclass
class _InitializedPersistence:
    persistence_directory: Path
    sql_engine: sqlalchemy.engine.Engine


_init_task_accessor = AppStateAccessor["asyncio.Task[_InitializedPersistence]"](
    "persistence_init_task"
)


class DatabaseNotYetInitialized(ErrorDetails):
    """An error when accessing the database before it's initialized."""

    id: Literal["DatabaseNotYetInitialized"] = "DatabaseNotYetInitialized"
    title: str = "Database Not Yet Initialized"
    detail: str = "The server's database has not finished initializing."


class DatabaseFailedToInitialize(ErrorDetails):
    """An error when accessing the database if it failed to initialize."""

    id: Literal["DatabaseFailedToInitialize"] = "DatabaseFailedToInitialize"
    title: str = "Database Failed to Initialize"


def start_initializing_persistence(
    app_state: AppState, persistence_directory: Optional[Path]
) -> None:
    """This should be called exactly once as part of server startup."""

    async def background_init() -> _InitializedPersistence:
        try:
            return await _initialize_persistence(
                persistence_directory=persistence_directory
            )
        except Exception:
            # If something went wrong, log it here, in case the robot is powered off
            # ungracefully before our cleanup code has a chance to run and receive
            # the exception.
            _log.exception("Exception during persistence background initialization.")
            raise

    assert _init_task_accessor.get_from(app_state=app_state) is None
    background_init_task = asyncio.create_task(background_init())
    _init_task_accessor.set_on(app_state=app_state, value=background_init_task)


async def clean_up_persistence(app_state: AppState) -> None:
    init_task = _init_task_accessor.get_from(app_state=app_state)
    if init_task is not None:
        initialized_persistence = await init_task
        initialized_persistence.sql_engine.dispose()


# TODO(mm, 2022-10-18): Deduplicate this background initialization infrastructure
# with similar code used for initializing the hardware API.
async def _get_persistence(
    app_state: AppState = Depends(get_app_state),
) -> _InitializedPersistence:
    initialize_task = _init_task_accessor.get_from(app_state)

    assert (
        initialize_task is not None
    ), "Forgot to start initialization during server startup?"

    try:
        return initialize_task.result()

    except asyncio.InvalidStateError as exception:
        raise DatabaseNotYetInitialized().as_error(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        ) from exception

    except asyncio.CancelledError as exception:
        raise DatabaseFailedToInitialize(
            detail="Database initialization cancelled."
        ).as_error(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR) from exception

    except Exception as exception:
        raise DatabaseFailedToInitialize(detail=str(exception)).as_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) from exception


async def get_sql_engine(
    initialized_persistence: _InitializedPersistence = Depends(_get_persistence),
) -> sqlalchemy.engine.Engine:
    return initialized_persistence.sql_engine


async def get_persistence_directory(
    initialized_persistence: _InitializedPersistence = Depends(_get_persistence),
) -> Path:
    return initialized_persistence.persistence_directory


class PersistenceResetter:
    """Dependency class to handle robot server reset options."""

    def __init__(self, persistence_directory: Path) -> None:
        self._persistence_directory = persistence_directory

    async def mark_directory_reset(self) -> None:
        """Mark the persistence directory to be deleted (reset) on the next boot.

        We defer deletions to the next boot instead of doing them immediately
        to avoid potential problems with ongoing HTTP requests, runs,
        background protocol analysis tasks, etc. trying to do stuff in here
        during and after the deletion.
        """
        file = AsyncPath(self._persistence_directory / _RESET_MARKER_FILE)
        await file.write_text(
            encoding="utf-8",
            data=(
                "This file was placed here by robot-server.\n"
                "It tells robot-server to clear this directory on the next boot.\n"
            ),
        )


# TODO: It's inappropriate for this to depend on a prepared persistence directory,
# because if sql_engine initialization fails, this will have no way of running
# and the user will not be able to reset things.
# Make it depend on just the path.
def get_persistence_resetter(
    persistence_directory: Path = Depends(get_persistence_directory),
) -> PersistenceResetter:
    """Get a `PersistenceResetter` to reset the robot-server's stored data."""
    return PersistenceResetter(persistence_directory)


async def _initialize_persistence(
    persistence_directory: Optional[Path],
) -> _InitializedPersistence:
    prepared_persistence_directory = await _prepare_persistence_directory(
        path=persistence_directory
    )
    sql_engine = await to_thread.run_sync(
        create_sql_engine, prepared_persistence_directory / _DATABASE_FILE
    )
    return _InitializedPersistence(
        persistence_directory=prepared_persistence_directory,
        sql_engine=sql_engine,
    )


async def _prepare_persistence_directory(path: Optional[Path]) -> Path:
    """Create and prepare the root persistence directory, if necessary.

    Arguments:
        path: Where to create the root persistence directory. If `None`, a fresh
            temporary directory will be used.

    Returns:
        The path to the prepared root persistence directory.
    """
    if path is None:
        # It's bad for this blocking I/O to be in this async function,
        # but we don't have an async mkdtemp().
        new_temporary_directory = Path(mkdtemp(prefix=_TEMP_PERSISTENCE_DIR_PREFIX))
        _log.info(
            f"Using auto-created temporary directory {new_temporary_directory}"
            f" for persistence."
        )
        return new_temporary_directory

    else:
        if await AsyncPath(path / _RESET_MARKER_FILE).exists():
            _log.info("Persistence directory was marked for reset. Deleting it.")
            await to_thread.run_sync(shutil.rmtree, path)

        await AsyncPath(path).mkdir(parents=True, exist_ok=True)
        _log.info(f"Using directory {path} for persistence.")
        return path


__all__ = [
    "get_persistence_directory",
    "get_sql_engine",
    "create_sql_engine",
    "PersistenceResetter",
    "get_persistence_resetter",
    # database tables
    "migration_table",
    "protocol_table",
    "analysis_table",
    "run_table",
    "action_table",
    # database utilities and helpers
    "sqlite_rowid",
]
