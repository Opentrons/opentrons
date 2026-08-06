"""Create or reset the server's persistence directory."""

from pathlib import Path

from typing_extensions import Final

from server_utils.persistence.folder_migrator import MigrationOrchestrator
from server_utils.persistence.persistence_directory import (
    prepare_active_subdirectory as server_utils_prepare_active_subdirectory,
)
from server_utils.persistence.persistence_directory import (
    prepare_root as server_utils_prepare_root,
)

from ._migrations import (
    up_to_v03,
    v03_to_v04,
    v04_to_v05,
    v05_to_v06,
    v06_to_v07,
    v07_to_v08,
    v08_to_v09,
    v09_to_v10,
    v10_to_v11,
    v11_to_v12,
    v12_to_v13,
    v13_to_v14,
    v14_to_v15,
    v15_to_v16,
    v16_to_v17,
    v17_to_v18,
    v18_to_v19,
)
from .file_and_directory_names import LATEST_VERSION_DIRECTORY

_TEMP_PERSISTENCE_DIR_PREFIX: Final = "opentrons-robot-server-"

__all__ = [
    "make_migration_orchestrator",
    "prepare_active_subdirectory",
    "prepare_root",
]


def make_migration_orchestrator(prepared_root: Path) -> MigrationOrchestrator:
    """Return a `MigrationOrchestrator` configured for robot-server production use.

    Production code should not use this directly. Use `prepare_active_subdirectory()` instead.
    This is currently exposed only for tests.
    """
    return MigrationOrchestrator(
        root=prepared_root,
        migrations=[
            up_to_v03.MigrationUpTo3(subdirectory="3"),
            v03_to_v04.Migration3to4(subdirectory="4"),
            v04_to_v05.Migration4to5(subdirectory="5"),
            v05_to_v06.Migration5to6(subdirectory="6"),
            # Subdirectory "7" was previously used on our edge branch for an in-dev
            # schema that was never released to the public. It may be present on
            # internal robots.
            v06_to_v07.Migration6to7(subdirectory="7.1"),
            v07_to_v08.Migration7to8(subdirectory="8"),
            # Subdirectories "9" and "10" were used during robot software v8.4.0
            # development and were not released to the public. They may be present on
            # internal robots.
            v08_to_v09.Migration8to9(subdirectory="9"),
            v09_to_v10.Migration9to10(subdirectory="10"),
            v10_to_v11.Migration10to11(subdirectory="11"),
            v11_to_v12.Migration11to12(subdirectory="12"),
            v12_to_v13.Migration12to13(subdirectory="13"),
            v13_to_v14.Migration13to14(subdirectory="14"),
            v14_to_v15.Migration14to15(subdirectory="15"),
            v15_to_v16.Migration15to16(subdirectory="16"),
            v16_to_v17.Migration16to17(subdirectory="17"),
            v17_to_v18.Migration17to18(subdirectory="18"),
            v18_to_v19.Migration18to19(subdirectory=LATEST_VERSION_DIRECTORY),
        ],
        temp_file_prefix="temp-",
    )


async def prepare_active_subdirectory(prepared_root: Path) -> Path:
    """Return the active persistence subdirectory after preparing it, if necessary."""
    orchestrator = make_migration_orchestrator(prepared_root)
    return await server_utils_prepare_active_subdirectory(orchestrator)


async def prepare_root(persistence_directory_root: Path | None) -> Path:
    """Prepare the robot-server persistence root directory."""
    return await server_utils_prepare_root(
        persistence_directory_root, _TEMP_PERSISTENCE_DIR_PREFIX
    )
