"""Migrate the persistence directory from schema 3 to 4.

Summary of changes from schema 3:

- Deck Configuration now Supports the addition of Modules as Fixtures
- Fixture items within the configuration have an optional Serial Number field
- NOTE: Database has not changed, maintains form from v3 of SQLite schema
- NOTE: Schema 3 is forward compatible with schema 4, so migration is a simple directory copy action

"""

from pathlib import Path
import shutil
from .._folder_migrator import Migration


class Migration3To4(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 3 to 4."""
        for item in source_dir.iterdir():
            if item.is_dir():
                shutil.copytree(src=item, dst=dest_dir)
            else:
                shutil.copy(src=item, dst=dest_dir)
