"""Prepare the server's images directory."""

from logging import getLogger
from pathlib import Path
from tempfile import mkdtemp
from typing import Optional

from anyio import Path as AsyncPath
from anyio import to_thread
from typing_extensions import Final

from server_utils.persistence.persistence_directory import clear_directory_contents

_log = getLogger(__name__)


_TEMP_IMAGES_DIR_PREFIX: Final = "opentrons-robot-server-images-"
_RESET_MARKER_FILE_NAME: Final = "_TO_BE_DELETED_ON_REBOOT"
_RESET_MARKER_FILE_CONTENTS: Final = """\
This file was placed here by robot-server.
It tells robot-server to clear this directory on the next boot,
after which it will delete this file.
"""


# TODO(jh, 10-16-25): Much of this logic overlaps with the persistence directory lifecycle logic. Can we unify?
class ImagesResetter:
    """A FastAPI dependency to reset the server's image directory."""

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


async def prepare_images_directory(images_directory: Optional[Path]) -> Path:
    """Return `images_directory` after preparing it, if necessary.

    This will create the directory if it doesn't already exist.

    If `images_directory` is `None`, this will return a fresh temporary
    directory.
    """
    if images_directory is None:
        # It's bad for this blocking I/O to be in this async function,
        # but we don't have an async mkdtemp().
        new_temporary_directory = Path(mkdtemp(prefix=_TEMP_IMAGES_DIR_PREFIX))
        _log.info(
            f"Using auto-created temporary directory {new_temporary_directory}"
            f" for images."
        )
        return new_temporary_directory
    else:
        if await _is_marked_for_reset(directory_to_reset=images_directory):
            _log.info(
                f"{images_directory} was marked for reset. Clearing its contents."
            )
            # FIXME(jh, 2025-10-16): Like the persistence dir, this can leave the
            # images dir in a half-cleared state if it deletes the marker file,
            # and then some of the other files, and then the device is power-cycled
            # before it can finish.
            await to_thread.run_sync(clear_directory_contents, images_directory)

        await AsyncPath(images_directory).mkdir(parents=True, exist_ok=True)
        _log.info(f"Using directory {images_directory} for images.")
        return images_directory


async def _is_marked_for_reset(directory_to_reset: Path) -> bool:
    """Return whether the images directory has been marked to be reset."""
    return await (AsyncPath(directory_to_reset) / _RESET_MARKER_FILE_NAME).exists()
