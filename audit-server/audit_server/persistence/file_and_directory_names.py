"""The names of files and directories in persistent storage.

A server launch-time setting specifies the root persistence directory.
Version subdirectories (e.g. "1", "2") isolate schema versions so that
future migrations can be added cleanly.
"""

from typing import Final

# The folder-migrator subdirectory that holds the current schema.
#
# By convention, when an Alembic migration is introduced for this version,
# rename this to include the head revision (e.g. ``"1_<revision_hash>"``)
# so it's obvious which schema state lives inside.
LATEST_VERSION_DIRECTORY: Final = "1"

DB_FILE: Final = "audit_server.db"
