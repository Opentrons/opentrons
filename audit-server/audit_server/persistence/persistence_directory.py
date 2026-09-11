"""Create or reset the audit-server's persistence directory."""

from pathlib import Path

from typing_extensions import Final

from server_utils.persistence.folder_migrator import MigrationOrchestrator
from server_utils.persistence.persistence_directory import (
    prepare_active_subdirectory as server_utils_prepare_active_subdirectory,
)
from server_utils.persistence.persistence_directory import (
    prepare_root as _prepare_root,
)

from ._migrations import up_to_v01
from .file_and_directory_names import LATEST_VERSION_DIRECTORY

_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-audit-server-"


def make_migration_orchestrator(prepared_root: Path) -> MigrationOrchestrator:
    """Return a ``MigrationOrchestrator`` configured for audit-server.

    Audit-server is currently at schema version 1 so no migrations are run.
    When future versions require schema changes, a migration orchestrator
    similar to robot-server's can be plugged in here.
    """
    return MigrationOrchestrator(
        root=prepared_root,
        migrations=[
            up_to_v01.MigrationUpTo1(subdirectory=LATEST_VERSION_DIRECTORY),
        ],
        temp_file_prefix="temp-",
    )


async def prepare_active_subdirectory(prepared_root: Path) -> Path:
    """Return the active persistence subdirectory after preparing it, if necessary."""
    orchestrator = make_migration_orchestrator(prepared_root)
    return await server_utils_prepare_active_subdirectory(orchestrator)


async def prepare_root(persistence_directory_root: Path | None) -> Path:
    """Prepare the audit-server persistence root directory."""
    return await _prepare_root(persistence_directory_root, _TEMP_PERSISTENCE_DIR_PREFIX)
