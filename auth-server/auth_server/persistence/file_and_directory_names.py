"""The names of files and directories in persistent storage.

A server launch-time setting specifies the root persistence directory.
Version subdirectories (e.g. "1", "2") isolate schema versions so that
future migrations can be added cleanly.
"""

from typing import Final

# Subdirectory created by up_to_v01.
V01_VERSION_DIRECTORY: Final = "1_b8c4e2f1a903"

# Subdirectory created by v01_to_v02.
LATEST_VERSION_DIRECTORY: Final = "1_c3a91d4e2b70"

DB_FILE: Final = "auth_server.db"
