from pathlib import Path
from logging import getLogger
from shutil import rmtree
from tempfile import mkdtemp
from typing import Optional
from typing_extensions import Final

from anyio import Path as AsyncPath, to_thread


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

    def __init__(self, persistence_directory: Path) -> None:
        self._persistence_directory = persistence_directory

    async def mark_directory_reset(self) -> None:
        """Mark the persistence directory to be deleted (reset) on the next boot.

        We defer deletions to the next boot instead of doing them immediately
        in order to avoid ongoing HTTP requests, runs, background protocol analysis
        tasks, etc. trying to do stuff in the persistence directory during and after
        the deletion.
        """
        file = AsyncPath(self._persistence_directory / _RESET_MARKER_FILE_NAME)
        await file.write_text(encoding="utf-8", data=_RESET_MARKER_FILE_CONTENTS)


async def prepare(persistence_directory: Optional[Path]) -> Path:
    """Create the persistence directory, if necessary, and prepare it for use.

    If the persistence directory was previously marked for a reset, this will reset it.

    Arguments:
        path: Where to create the root persistence directory. If `None`, a fresh
            temporary directory will be used.

    Returns:
        The path to the prepared root persistence directory.
    """
    if persistence_directory is None:
        # It's bad for this blocking I/O to be in this async function,
        # but we don't have an async mkdtemp().
        new_temporary_directory = Path(mkdtemp(prefix=_TEMP_PERSISTENCE_DIR_PREFIX))
        _log.info(
            f"Using auto-created temporary directory {new_temporary_directory}"
            f" for persistence."
        )
        return new_temporary_directory

    else:
        if await _is_marked_for_reset(persistence_directory=persistence_directory):
            _log.info("Persistence directory was marked for reset. Deleting it.")
            await to_thread.run_sync(rmtree, persistence_directory)

        await AsyncPath(persistence_directory).mkdir(parents=True, exist_ok=True)
        _log.info(f"Using directory {persistence_directory} for persistence.")
        return persistence_directory


async def _is_marked_for_reset(persistence_directory: Path) -> bool:
    """Return whether the persistence directory has been marked to be reset."""
    return await (AsyncPath(persistence_directory) / _RESET_MARKER_FILE_NAME).exists()
