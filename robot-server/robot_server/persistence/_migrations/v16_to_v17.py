"""Migrate the persistence directory from schema 16 to 17.

Summary of changes from schema 16:

- Adds new permissions to directories/files copied that provides read and execute access to
new user `ot-protocol` for subprocess mode support of non-root user protocol execution.
"""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from ..file_and_directory_names import PROTOCOLS_DIRECTORY
from ._util import copy_contents, set_permissions

PROTOCOL_FILE_PERMISSIONS = "0o644"
PROTOCOL_DIR_PERMISSIONS = "0o755"


class Migration16to17(Migration):
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 16 to 17."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        _migrate_permissions(dest_dir=dest_dir)


def _migrate_permissions(dest_dir: Path) -> None:
    protocols_dir = dest_dir / PROTOCOLS_DIRECTORY
    protocol_dirs_with_python_files: set[Path] = set()

    # Identify protocol files within migrated directory and set the file permissions
    if protocols_dir.is_dir():
        for protocol_dir in protocols_dir.iterdir():
            if protocol_dir.is_dir():
                for protocol_file in protocol_dir.glob("*.py"):
                    if protocol_file.is_file():
                        protocol_dirs_with_python_files.add(protocol_dir)
                        set_permissions(protocol_file, PROTOCOL_FILE_PERMISSIONS)

    # Set directory permissions for directories containing protocols
    if protocol_dirs_with_python_files:
        set_permissions(dest_dir, PROTOCOL_DIR_PERMISSIONS)
        set_permissions(protocols_dir, PROTOCOL_DIR_PERMISSIONS)

        for protocol_dir in protocol_dirs_with_python_files:
            set_permissions(protocol_dir, PROTOCOL_DIR_PERMISSIONS)
