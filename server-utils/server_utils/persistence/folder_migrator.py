"""A versioning and migration system for data stored on the filesystem.

This helps you maintain a file tree like this:

    our_data/
        v1/
            foo.json
            bar.db
        v2/
            foo.json
            bar.db
        ...

Where each version has its own isolated subdirectory.
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Final, List, Union

_log = logging.getLogger(__name__)


class MigrationOrchestrator:
    """Sequences migrations and performs them in order."""

    def __init__(
        self,
        *,
        root: Path,
        migrations: List[Migration],
        temp_file_prefix: str,
    ) -> None:
        """Configure the `MigrationOrchestrator`.

        Args:
            root: Where to hold all the version subdirectories.
                For example, if you want a file tree like this:

                    foo/
                        v1/
                        v2/
                        ...

                Then `foo/` is the root.

            migrations: All known current and historical versions. This defines the
                set of known version subdirectories, and how to migrate between them.

            temp_file_prefix: A file name prefix for when the migration code needs to
                place temporary files or directories in the root. You must ensure that
                this doesn't overlap with any legitimate files.
        """
        self._root = root
        self._migrations = migrations
        if temp_file_prefix == "":
            raise ValueError("temp_file_prefix must be non-empty.")
        self._temp_file_prefix = temp_file_prefix

    def migrate_to_latest(self) -> Path:
        """Perform any required migrations to bring us up to the latest version.

        This inspects the filesystem to figure out what version we're on now,
        then runs all the necessary migrations, in sequence, to bring us to the latest
        version that was configured in `__init__()`.

        The migration is performed atomically.

        Interrupted migrations may leave behind stray temp files.
        Call `clean_up_stray_temp_files()` at some point to prune them.

        :returns: The path to the latest version subdirectory.
        """
        initial_sequence_index = self._get_current()
        if initial_sequence_index is None:
            sequence = self._migrations
            starting_dir = self._root
        else:
            sequence = self._migrations[initial_sequence_index + 1 :]
            starting_dir = (
                self._root / self._migrations[initial_sequence_index].subdirectory
            )

        _log.info(f"Migrations to perform: {[m.subdirectory for m in sequence]}")

        latest_dir_so_far = starting_dir
        for sequence_index, migration in enumerate(sequence):
            step_input_dir = latest_dir_so_far
            step_output_dir = Path(
                tempfile.mkdtemp(
                    dir=self._root,
                    # The _temp_file_prefix part is important so this can be deleted
                    # by clean_up_stray_temp_files(). The migration.subdirectory part
                    # is just to make debugging easier.
                    prefix=f"{self._temp_file_prefix}{migration.subdirectory}-",
                )
            )
            step_input_is_initial = sequence_index == 0
            step_output_is_final = sequence_index == len(sequence) - 1

            _log.info(f'Performing migration to "{migration.subdirectory}"...')
            migration.migrate(source_dir=step_input_dir, dest_dir=step_output_dir)

            latest_dir_so_far = step_output_dir

            # If we're migrating e.g. A -> B -> C -> D, we should treat B and C as
            # as throwaway intermediate steps, deleting them when we're done with them,
            # to keep peak filesystem usage low. We should never delete A.
            if not step_input_is_initial:
                shutil.rmtree(step_input_dir)

            if step_output_is_final:
                # Promote the temporary directory to be permanent.
                #
                # At this point, we have a directory full of files, but we haven't yet moved it into
                # place. This os.sync() is a barrier to make sure that the kernel+filesystem don't
                # reorder the "move into place" part before the "fill it with files" part, which
                # would break our atomicity if we lost power between the two.
                #
                # We do a nuclear-option os.sync() instead of messing with the finer-grained
                # os.fsync() because os.fsync() is difficult to get right.
                # https://stackoverflow.com/questions/37288453/calling-fsync2-after-close2
                os.sync()
                # Atomically move the filled directory into place.
                final_output_dir = self._root / migration.subdirectory
                os.replace(src=step_output_dir, dst=final_output_dir)
                latest_dir_so_far = final_output_dir

        _log.info("All migrations complete.")
        return latest_dir_so_far

    def clean_up_stray_temp_files(self) -> None:
        """Delete any abandoned files or directories from prior interrupted work."""
        to_clean = (
            entry
            for entry in self._root.iterdir()
            if entry.name.startswith(self._temp_file_prefix)
        )

        for item in to_clean:
            try:
                if item.is_dir():
                    # No need to be atomic about this, since it's just an abandoned
                    # temporary directory.
                    shutil.rmtree(item)
                else:
                    item.unlink()
            except Exception:
                # We don't expect any exceptions to happen, but just in case
                # there's a weird permissions error or something...
                _log.warning(f"Error deleting {item.resolve()}.", exc_info=True)

    def _get_current(self) -> Union[int, None]:
        """Get the most recent migration represented on the filesystem right now.

        Return the index of that migration.
        Return `None` if it's just the legacy uncontained files, or no files at all.
        """
        for index, migration in reversed(list(enumerate(self._migrations))):
            if (self._root / migration.subdirectory).exists():
                return index
        return None


class Migration(ABC):
    """Represents a single migration step (e.g. v1->v2, not v1->v2->v3).

    Subclass this and override `migrate()` to implement the step's actual migration
    logic.
    """

    def __init__(self, subdirectory: str) -> None:
        """Configure the migration step.

        :param subdirectory: The subdirectory name for this version. For example, if
            you want a file tree like this:

                our_data/
                    v1/
                    v2/
                    ...

            There would be one `Migration` where `subdirectory` is "v1", one where
            `subdirectory` is "v2", and so on.
        """
        _validate_bare_name(subdirectory)
        self.subdirectory: Final = subdirectory

    @abstractmethod
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Perform the migration.

        `source_dir` is the directory of the version before this one, the version that
        we're migrating from. Or, if this is the first migration in the sequence,
        it will be the `MigrationOrchestrator`'s root.

        `dest_dir` is where this method should output its new, migrated files.
        It will be a temporary directory; if everything goes well, it will be moved
        into place atomically.

        A typical implementation should:

        1. Open known files from `source_dir`.
        2. Transform their contents, as needed.
        3. Write the new transformed files to `dest_dir`.

        If something goes wrong, this method should signal it by raising an exception.
        The migration sequence will be aborted safely.
        """


def _validate_bare_name(name: str) -> None:
    """Ensure `name` is a bare file or directory name, without path components.

    For example, `foo` is OK, but `bar/foo` is not.

    This is a basic check against programmer mistakes and is not intended to guard
    against untrusted input.
    """
    if Path(name).name != name:
        raise ValueError(
            f"{name} is a nested path. Only bare file or directory names are allowed."
        )
