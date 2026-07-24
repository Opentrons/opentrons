"""The names of files and directories in persistent storage.

A server launch-time setting specifies the root persistence directory.
Version subdirectories (e.g. "1", "2") isolate schema versions so that
future migrations can be added cleanly.
"""

from typing import Final

LATEST_VERSION_DIRECTORY: Final = "1_754f68036d12"

DB_FILE: Final = "auth_server.db"
