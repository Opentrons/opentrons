"""Create or reset the auth-server's persistence directory."""

from pathlib import Path

from anyio import Path as AsyncPath
from typing_extensions import Final

from server_utils.persistence_directory import (
    PersistenceResetter,
    prepare_root as _prepare_root,
)

from .file_and_directory_names import LATEST_VERSION_DIRECTORY

_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-auth-server-"

# Re-export so callers don't need to know about server_utils.
__all__ = ["PersistenceResetter", "prepare_root", "prepare_active_subdirectory"]


async def prepare_active_subdirectory(prepared_root: Path) -> Path:
    """Return the active persistence subdirectory, creating it if needed.

    Auth-server is currently at schema version 1 so no migrations are run.
    When future versions require schema changes, a migration orchestrator
    similar to robot-server's can be plugged in here.
    """
    subdirectory = prepared_root / LATEST_VERSION_DIRECTORY
    await AsyncPath(subdirectory).mkdir(parents=True, exist_ok=True)
    return subdirectory


async def prepare_root(persistence_directory_root: Path | None) -> Path:
    """Prepare the auth-server persistence root directory."""
    return await _prepare_root(persistence_directory_root, _TEMP_PERSISTENCE_DIR_PREFIX)
