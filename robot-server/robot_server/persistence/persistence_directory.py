"""Create or reset the server's persistence directory."""


from pathlib import Path
from logging import getLogger
from shutil import rmtree
from tempfile import mkdtemp
from typing import Optional
from typing_extensions import Final

from anyio import Path as AsyncPath, to_thread

from ._folder_migrator import MigrationOrchestrator
from ._migrations import up_to_3, v3_to_v4, v4_to_v5


_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-robot-server-"
_RESET_MARKER_FILE_NAME: Final = "_TO_BE_DELETED_ON_REBOOT"
_RESET_MARKER_FILE_CONTENTS: Final = """\
This file was placed here by robot-server.
It tells robot-server to clear this directory on the next boot,
after which it will delete this file.
"""


_log = getLogger(__name__)


class PersistenceResetter:
    """A FastAPI dependency to reset the server's persistence directory."""

    def __init__(self, directory_to_reset: Path) -> None:
        self._directory_to_reset = directory_to_reset

    async def mark_directory_reset(self) -> None:
        """Mark the directory to be deleted (reset) on the next boot.

        We defer deletions to the next boot instead of doing them immediately
        in order to avoid ongoing HTTP requests, runs, background protocol analysis
        tasks, etc. trying to do stuff in the persistence directory during and after
        the deletion.
        """
        file = AsyncPath(self._directory_to_reset / _RESET_MARKER_FILE_NAME)
        await file.write_text(encoding="utf-8", data=_RESET_MARKER_FILE_CONTENTS)


async def prepare_active_subdirectory(prepared_root: Path) -> Path:
    """Return the active persistence subdirectory after preparing it, if necessary."""
    migration_orchestrator = MigrationOrchestrator(
        root=prepared_root,
        migrations=[
            up_to_3.MigrationUpTo3(subdirectory="3"),
            v3_to_v4.Migration3to4(subdirectory="4"),
            v4_to_v5.Migration4to5(subdirectory="5"),
        ],
        temp_file_prefix="temp-",
    )

    await to_thread.run_sync(migration_orchestrator.clean_up_stray_temp_files)
    subdirectory = await to_thread.run_sync(migration_orchestrator.migrate_to_latest)

    return subdirectory


async def prepare_root(persistence_directory_root: Optional[Path]) -> Path:
    """Return `persistence_directory_root` after preparing it, if necessary.

    This will create the directory if it doesn't already exist,
    and clear its contents it if it was previously marked for reset.

    If `persistence_directory_root` is `None`, this will return a fresh temporary
    directory.
    """
    if persistence_directory_root is None:
        # It's bad for this blocking I/O to be in this async function,
        # but we don't have an async mkdtemp().
        new_temporary_directory = Path(mkdtemp(prefix=_TEMP_PERSISTENCE_DIR_PREFIX))
        _log.info(
            f"Using auto-created temporary directory {new_temporary_directory}"
            f" for persistence."
        )
        return new_temporary_directory

    else:
        if await _is_marked_for_reset(directory_to_reset=persistence_directory_root):
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
