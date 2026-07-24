"""Create or reset a server's persistence directory.

Shared utilities used by robot-server, auth-server, and audit-server.
Each server has its own thin wrapper module that supplies server-specific
configuration (migration list, temp-dir prefix, etc.) and delegates here.
"""

from logging import getLogger
from pathlib import Path
from shutil import rmtree
from tempfile import mkdtemp
from typing import Optional

from anyio import Path as AsyncPath
from anyio import to_thread
from typing_extensions import Final

from .folder_migrator import MigrationOrchestrator

_RESET_MARKER_FILE_NAME: Final = "_TO_BE_DELETED_ON_REBOOT"
_RESET_MARKER_FILE_CONTENTS: Final = """\
This file was placed here by an Opentrons server.
It tells the server to clear this directory on the next boot,
after which it will delete this file.
"""

# Scratch space for request-scoped work (e.g. zip download staging).
PERSISTENCE_TEMP_SUBDIRECTORY: Final = "temp"

_log = getLogger(__name__)


def get_persistence_temp_directory(persistence_root: Path) -> Path:
    """Return the path to ``persistence_root/temp``."""
    return persistence_root / PERSISTENCE_TEMP_SUBDIRECTORY


def ensure_persistence_temp_directory(persistence_root: Path) -> Path:
    """Create and return ``persistence_root/temp`` for request-scoped scratch."""
    temp_directory = get_persistence_temp_directory(persistence_root)
    temp_directory.mkdir(parents=True, exist_ok=True)
    return temp_directory


def cleanup_persistence_temp_directory(persistence_root: Path) -> None:
    """Delete ``persistence_root/temp`` if it exists."""
    temp_directory = get_persistence_temp_directory(persistence_root)
    if not temp_directory.exists():
        return

    try:
        rmtree(temp_directory)
    except Exception:
        _log.warning(f"Error deleting {temp_directory.resolve()}.", exc_info=True)


class PersistenceResetter:
    """A FastAPI dependency to reset the server's persistence directory.

    We defer deletions to the next boot instead of doing them immediately
    in order to avoid ongoing HTTP requests, runs, background protocol analysis
    tasks, etc. trying to do stuff in the persistence directory during and after
    the deletion.
    """

    def __init__(self, directory_to_reset: Path) -> None:
        self._directory_to_reset = directory_to_reset

    async def mark_directory_reset(self) -> None:
        """Mark the directory to be deleted (reset) on the next boot."""
        file = AsyncPath(self._directory_to_reset / _RESET_MARKER_FILE_NAME)
        await file.write_text(encoding="utf-8", data=_RESET_MARKER_FILE_CONTENTS)


async def prepare_active_subdirectory(
    migration_orchestrator: MigrationOrchestrator,
) -> Path:
    """Return the active persistence subdirectory after preparing it, if necessary.

    The caller is expected to build a ``MigrationOrchestrator`` with
    server-specific migrations and pass it in.
    """
    await to_thread.run_sync(migration_orchestrator.clean_up_stray_temp_files)
    subdirectory = await to_thread.run_sync(migration_orchestrator.migrate_to_latest)

    return subdirectory


async def prepare_root(
    persistence_directory_root: Optional[Path], temp_dir_prefix: str
) -> Path:
    """Return ``persistence_directory_root`` after preparing it, if necessary.

    This will create the directory if it doesn't already exist,
    and clear its contents if it was previously marked for reset.

    If ``persistence_directory_root`` is ``None``, this will return a fresh
    temporary directory whose name starts with *temp_dir_prefix*.
    """
    if persistence_directory_root is None:
        # It's bad for this blocking I/O to be in this async function,
        # but we don't have an async mkdtemp().
        new_temporary_directory = Path(mkdtemp(prefix=temp_dir_prefix))
        _log.info(
            f"Using auto-created temporary directory {new_temporary_directory}"
            f" for persistence."
        )
        return new_temporary_directory

    else:
        if await _is_marked_for_reset(
            directory_to_reset=persistence_directory_root,
        ):
            _log.info(
                f"{persistence_directory_root} was marked for reset. Deleting it."
            )
            # FIXME(mm, 2024-01-23): This can leave the persistence directory
            # in a half-deleted state if it deletes the marker file, and then some
            # of the other files, and then the device is power-cycled before it can
            # finish.
            await to_thread.run_sync(rmtree, persistence_directory_root)

        await AsyncPath(persistence_directory_root).mkdir(parents=True, exist_ok=True)
        _log.info(f"Using directory {persistence_directory_root} for persistence.")
        return persistence_directory_root


async def _is_marked_for_reset(directory_to_reset: Path) -> bool:
    """Return whether the persistence directory has been marked to be reset."""
    return await (AsyncPath(directory_to_reset) / _RESET_MARKER_FILE_NAME).exists()
