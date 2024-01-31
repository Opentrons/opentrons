import asyncio
import logging
from pathlib import Path
from typing import Awaitable, Callable, Iterable, Optional
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

from ._database import create_schema_3_sql_engine
from ._persistence_directory import (
    PersistenceResetter,
    prepare_active_subdirectory,
    prepare_root,
)


_DATABASE_FILE: Final = "robot_server.db"


_log = logging.getLogger(__name__)


_root_persistence_directory_init_task_accessor = AppStateAccessor["asyncio.Task[Path]"](
    "persistence_root_directory_init_task"
)
_active_persistence_directory_init_task_accessor = AppStateAccessor[
    "asyncio.Task[Path]"
]("persistence_active_subdirectory_init_task")
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


def start_initializing_persistence(  # noqa: C901
    app_state: AppState,
    persistence_directory_root: Optional[Path],
    done_callbacks: Iterable[Callable[[AppState], Awaitable[None]]],
) -> None:
    """Initialize the persistence layer to get it ready for use by endpoint functions.

    This should be called exactly once, as part of server startup.
    It will return immediately while initialization continues in the background.
    """

    async def init_root_persistence_directory() -> Path:
        try:
            return await prepare_root(persistence_directory_root)
        except Exception:
            _log.exception(
                "Exception initializing persistence directory root in the background."
            )
            raise

    async def init_active_persistence_directory() -> Path:
        try:
            root_prep_task = _root_persistence_directory_init_task_accessor.get_from(
                app_state
            )
            assert root_prep_task is not None
            prepared_root = await root_prep_task

            active_subdirectory = await prepare_active_subdirectory(prepared_root)
            return active_subdirectory

        except Exception:
            _log.exception(
                "Exception initializing active persistence directory in the background."
            )
            raise

    async def init_sql_engine() -> SQLEngine:
        try:
            subdirectory_prep_task = (
                _active_persistence_directory_init_task_accessor.get_from(app_state)
            )
            assert subdirectory_prep_task is not None
            prepared_subdirectory = await subdirectory_prep_task

            sql_engine = await to_thread.run_sync(
                create_schema_3_sql_engine, prepared_subdirectory / _DATABASE_FILE
            )
            return sql_engine

        except Exception:
            _log.exception("Exception initializing SQL engine in the background.")
            raise

    assert (
        _root_persistence_directory_init_task_accessor.get_from(app_state) is None
        and _active_persistence_directory_init_task_accessor.get_from(app_state) is None
        and _sql_engine_init_task_accessor.get_from(app_state) is None
    ), "Cannot initialize more than once."

    # We keep initialization of the root persistence directory separate, and do not
    # combine it with initialization of the active subdirectory or the SQL engine.
    # This lets PersistenceResetter remain usable even if initializing the SQL engine
    # fails, which is important to let users recover from corrupt databases.

    root_directory_init_task = asyncio.create_task(init_root_persistence_directory())
    _root_persistence_directory_init_task_accessor.set_on(
        app_state=app_state, value=root_directory_init_task
    )

    active_subdirectory_init_task = asyncio.create_task(
        init_active_persistence_directory()
    )
    _active_persistence_directory_init_task_accessor.set_on(
        app_state=app_state, value=active_subdirectory_init_task
    )

    sql_engine_init_task = asyncio.create_task(init_sql_engine())
    _sql_engine_init_task_accessor.set_on(
        app_state=app_state, value=sql_engine_init_task
    )

    async def wait_until_done_then_trigger_callbacks() -> None:
        try:
            await sql_engine_init_task
        finally:
            for callback in done_callbacks:
                await callback(app_state)

    asyncio.create_task(wait_until_done_then_trigger_callbacks())


async def clean_up_persistence(app_state: AppState) -> None:
    """Clean up the persistence layer.

    This should be called exactly once at server shutdown.
    """
    sql_engine_init_task = _sql_engine_init_task_accessor.get_from(app_state=app_state)
    active_subdirectory_init_task = (
        _root_persistence_directory_init_task_accessor.get_from(app_state=app_state)
    )
    root_directory_init_task = _root_persistence_directory_init_task_accessor.get_from(
        app_state=app_state
    )
    if sql_engine_init_task is not None:
        sql_engine = await sql_engine_init_task
        sql_engine.dispose()
    if active_subdirectory_init_task is not None:
        await active_subdirectory_init_task
    if root_directory_init_task is not None:
        await root_directory_init_task


async def get_sql_engine(
    app_state: AppState = Depends(get_app_state),
) -> SQLEngine:
    """Return the server's singleton SQLAlchemy Engine for accessing the database.

    This is initialized in the background, starting when the server boots.
    Initialization can entail time-consuming migrations.
    If this is called before that initialization completes, this will raise an
    appropriate HTTP-facing error to indicate that the server is busy.
    """
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


async def get_active_persistence_directory(
    app_state: AppState = Depends(get_app_state),
) -> Path:
    """Return the path to the server's persistence directory.

    If you need to keep something in a file to persist it across reboots,
    you should put it in here.

    Specifically, this returns the subdirectory that's meant for this robot server
    version--the "active" subdirectory. Other subdirectories may exist for other
    versions.

    This directory is initialized in the background, starting when the server boots.
    This initialization can entail time-consuming migrations.
    If this is called before that initialization completes, this will raise an
    appropriate HTTP-facing error to indicate that the server is busy.
    """
    initialize_task = _root_persistence_directory_init_task_accessor.get_from(app_state)
    assert (
        initialize_task is not None
    ), "Forgot to start persistence directory initialization as part of server startup?"

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


async def _get_persistence_directory_root(
    app_state: AppState = Depends(get_app_state),
) -> Path:
    """Return the root persistence directory.

    It may be undergoing creation or a reset. This will only return after that's done.
    """
    init_task = _root_persistence_directory_init_task_accessor.get_from(app_state)
    assert (
        init_task is not None
    ), "Forgot to initialize persistence directory root as part of server startup?"
    return await init_task


async def get_persistence_resetter(
    # We want to reset everything, not only the *active* persistence directory.
    directory_to_reset: Path = Depends(_get_persistence_directory_root),
) -> PersistenceResetter:
    """Get a `PersistenceResetter` to reset the robot-server's stored data."""
    return PersistenceResetter(directory_to_reset)
