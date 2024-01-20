from pathlib import Path
from typing import List
from .folder_migrator import Migration, MigrationOrchestrator


# TODO.
#
# Our first migration in this system will involve copying and transforming the SQLite
# database to remove problematic pickle columns.
migrations: List[Migration] = []

opentrons_migrator = MigrationOrchestrator(
    root=Path(
        "/var/lib/opentrons_robot_server"
    ),  # TODO: Grab from environment on server startup.,
    migrations=migrations,
    temp_file_prefix="temp",
)
