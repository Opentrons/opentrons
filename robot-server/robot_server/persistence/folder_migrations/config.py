from pathlib import Path
from typing import List
from .folder_migrator import Migration, MigrationOrchestrator


# TODO.
#
# Our first migration in this system will involve copying and transforming the SQLite
# database to remove problematic pickle columns.
migrations: List[Migration] = []

opentrons_migrator = MigrationOrchestrator(
    root=Path("/var/lib/opentrons_robot_server"),  # TODO: Grab from environment on server startup.,
    legacy_uncontained_items=[
        # The order of paths here is significant, because it's the order in which
        # we'll delete things.
        "robot_server.db",  # TODO: Deduplicate.
        # This is a bit dodgy. According to https://www.sqlite.org/howtocorrupt.html#_deleting_a_hot_journal,
        # bad things happen if these -journal and -wal sidecar files are mispaired from their main DB file.
        # The best we can do is hope that they all get deleted quickly enough that this is atomic in practice.
        "robot_server.db-journal",
        "robot_server.db-wal",
        "protocols",  # TODO: Deduplicate.
        "deck_configuration.json",  # TODO: Deduplicate.
    ],
    migrations=migrations,
    temp_file_prefix="temp",
)


