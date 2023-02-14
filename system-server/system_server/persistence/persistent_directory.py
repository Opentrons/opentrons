"""Provides support to create a persistent directory, if it doesn't exist."""

import logging
from tempfile import mkdtemp
from pathlib import Path
from anyio import Path as AsyncPath
from typing import Optional
from typing_extensions import Final

_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-system-server-"

_log = logging.getLogger(__name__)


async def create_persistent_directory(path: Optional[Path]) -> Path:
    """Create a persistent directory.

    If the directory in `path` doesn't exist, this function will generate
    it. Otherwise it will just return the path as-is.

    If `path` is `none`, this function will generate a new temporary
    directory and return it.
    """
    if path is None:
        # Create a new temp directory.
        # It's bad for this blocking I/O to be in this async function,
        # but we don't have an async mkdtemp().
        path = Path(mkdtemp(prefix=_TEMP_PERSISTENCE_DIR_PREFIX))
        _log.info(f"Using auto-created temporary directory {path}" f" for persistence.")
    else:
        await AsyncPath(path).mkdir(parents=True, exist_ok=True)
        _log.info(f"Using directory {path} for persistence.")

    return path
