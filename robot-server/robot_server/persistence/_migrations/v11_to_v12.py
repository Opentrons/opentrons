"""Migrate the persistence directory from schema 11 to 12.

Summary of changes from schema 11:

This is a compatibility migration that makes no changes to the database schema or data.
It exists solely to create a version boundary between software that expects
`result.definition` in loadModule commands and software that doesn't include it.

This allows new software (schema 12+) to remove `result.definition` from loadModule
command results without breaking compatibility if users downgrade to older software
that expects this field to be present.
"""

from pathlib import Path

from ._util import copy_contents
from .._folder_migrator import Migration


class Migration11to12(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 11 to 12."""
        # This is a no-op migration that simply copies all contents unchanged.
        # It exists as a compatibility checkpoint between software versions.
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)
