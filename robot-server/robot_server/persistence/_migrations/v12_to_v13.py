"""Migrate the persistence directory from schema 12 to 13.

Summary of changes from schema 13:

This compatability change adds additional camera related fields to the BooleanSettingKey table. 
"""

from pathlib import Path

from ._util import copy_contents
from .._folder_migrator import Migration


class Migration12to13(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 12 to 13."""
        # todo add migration that inserts new elements to the boolean table
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)
