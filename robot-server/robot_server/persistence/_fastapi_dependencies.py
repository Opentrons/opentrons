import asyncio
import logging
from pathlib import Path
from typing import Optional
from typing_extensions import Literal

from sqlalchemy.engine import Engine as SQLEngine
from anyio import to_thread
from fastapi import Depends, status
from typing_extensions import Final

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from robot_server.errors import ErrorDetails

from ._database import create_sql_engine
from ._persistence_directory import (
    PersistenceResetter,
    prepare as prepare_persistence_directory,
)


_DATABASE_FILE: Final = "robot_server.db"


_log = logging.getLogger(__name__)


_directory_init_task_accessor = AppStateAccessor["asyncio.Task[Path]"](
    "persistence_directory_init_task"
)
_sql_engine_init_task_accessor = AppStateAccessor["asyncio.Task[SQLEngine]"](
    "persistence_sql_engine_init_task"
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
    """Initialize the persistence layer to get it ready for use by endpoint functions.

    This should be called exactly once, as part of server startup.
    It will return immediately while initialization continues in the background.
    """

    async def init_directory_and_log() -> Path:
        try:
            return await prepare_persistence_directory(
                persistence_directory=persistence_directory
            )
        except Exception:
            _log.exception(
                "Exception initializing persistence directory in the background."
            )
            raise

    async def init_sql_engine_and_log() -> SQLEngine:
        try:
            directory_prep_task = _directory_init_task_accessor.get_from(
                app_state=app_state
            )
            assert directory_prep_task is not None
            prepared_persistence_directory = await directory_prep_task

            sql_engine = await to_thread.run_sync(
                create_sql_engine, prepared_persistence_directory / _DATABASE_FILE
            )
            return sql_engine

        except Exception:
            _log.exception("Exception initializing SQL engine in the background.")
            raise

    assert (
        _directory_init_task_accessor.get_from(app_state=app_state) is None
        and _sql_engine_init_task_accessor.get_from(app_state=app_state) is None
    ), "Cannot initialize more than once."

    # We keep initialization of the persistence directory separate, and do not combine
    # it with initialization of the SQL engine. This lets PersistenceResetter remain
    # usable even if initializing the SQL engine fails, which is important to let users
    # recover from corrupt databases.
    directory_init_task = asyncio.create_task(init_directory_and_log())
    _directory_init_task_accessor.set_on(app_state=app_state, value=directory_init_task)

    sql_engine_init_task = asyncio.create_task(init_sql_engine_and_log())
    _sql_engine_init_task_accessor.set_on(
        app_state=app_state, value=sql_engine_init_task
    )


async def clean_up_persistence(app_state: AppState) -> None:
    """Clean up the persistence layer.

    This should be called exactly once at server shutdown.
    """
    sql_engine_init_task = _sql_engine_init_task_accessor.get_from(app_state=app_state)
    directory_init_task = _directory_init_task_accessor.get_from(app_state=app_state)
    if sql_engine_init_task is not None:
        sql_engine = await sql_engine_init_task
        sql_engine.dispose()
    if directory_init_task is not None:
        await directory_init_task


async def get_sql_engine(
    app_state: AppState = Depends(get_app_state),
) -> SQLEngine:
    """Return the server's singleton SQLAlchemy Engine for accessing the database."""
    initialize_task = _sql_engine_init_task_accessor.get_from(app_state)
    assert (
        initialize_task is not None
    ), "Forgot to start SQL engine initialization as part of server startup?"

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


async def get_persistence_directory(
    app_state: AppState = Depends(get_app_state),
) -> Path:
    """Return the path to the server's persistence directory."""
    initialize_task = _directory_init_task_accessor.get_from(app_state)
    assert (
        initialize_task is not None
    ), "Forgot to start persistence directory initialization as part of server startup?"

    # Unlike get_sql_engine(), we don't expect the background initialization task
    # to take long. Patiently wait until it completes instead of immediately returning
    # 503 "service unavailable".
    return await initialize_task


async def get_persistence_resetter(
    persistence_directory: Path = Depends(get_persistence_directory),
) -> PersistenceResetter:
    """Get a `PersistenceResetter` to reset the robot-server's stored data."""
    return PersistenceResetter(persistence_directory)
