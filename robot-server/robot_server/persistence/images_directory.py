"""Prepare the server's images directory."""

from pathlib import Path
from logging import getLogger
from tempfile import mkdtemp
from typing import Optional
from typing_extensions import Final

from anyio import Path as AsyncPath

_TEMP_IMAGES_DIR_PREFIX: Final = "opentrons-robot-server-images-"

_log = getLogger(__name__)


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
        await AsyncPath(images_directory).mkdir(parents=True, exist_ok=True)
        _log.info(f"Using directory {images_directory} for images.")
        return images_directory
