"""Migrate the persistence directory from schema 16 to 17.

Summary of changes from schema 16:

- Adds new permissions to directories/files copied that provides read and execute access to
new user `ot-protocol` for subprocess mode support of non-root user protocol execution.
- Previous permissions for these directories were 0o700, restricting read/write/execute permissions
to root, this was fine when there were no other users or groups but must be changes to allow
access to protocol related files.
"""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from ..file_and_directory_names import PROTOCOLS_DIRECTORY
from ..protocol_user_permissions import apply_protocol_user_permissions
from ._util import copy_contents


class Migration16to17(Migration):
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 16 to 17."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        _migrate_permissions(dest_dir=dest_dir)


def _migrate_permissions(dest_dir: Path) -> None:
    protocols_dir = dest_dir / PROTOCOLS_DIRECTORY

    # Ensure a protocols directory is present before setting permissions
    if protocols_dir.is_dir():
        apply_protocol_user_permissions(protocols_dir, recursive=True)
