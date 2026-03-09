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

from abc import ABC, abstractmethod
import contextlib
import logging
import os
from pathlib import Path
import shutil
import tempfile
from typing import Final, Generator, List, Union


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
        self._temp_file_prefix = temp_file_prefix

    def migrate_to_latest(self) -> Path:
        """Perform any required migrations to bring us up to the latest version.

        This inspects the filesystem to figure out what version we're on now,
        then runs all the necessary migrations, in sequence, to bring us to the latest
        version that was configured in `__init__()`.

        The migration is performed atomically.

        :returns: The path to the latest version subdirectory.
        """
        current = self._get_current()
        if current is None:
            sequence = self._migrations
            previous_output = self._root
        else:
            sequence = self._migrations[current + 1 :]
            previous_output = self._root / self._migrations[current].subdirectory

        final_output = (
            self._root / sequence[-1].subdirectory
            if len(sequence) > 0
            else previous_output
        )

        _log.info(f"Migrations to perform: {[m.subdirectory for m in sequence]}")

        with contextlib.ExitStack() as exit_stack:
            for sequence_index, migration in enumerate(sequence):
                is_final_migration = sequence_index == len(sequence) - 1
                if is_final_migration:
                    # For the final migration, set things up so that if everything
                    # goes well, we'll commit its output to persistent storage.
                    output_dir = exit_stack.enter_context(
                        _atomic_dir(
                            destination=self._root / migration.subdirectory,
                            temp_prefix=self._temp_file_prefix,
                        )
                    )
                else:
                    # Unlike the final migration, for intermediate migrations,
                    # we use normal temporary directories in the default system
                    # location. This is inherently safer in case we crash and leave
                    # anything behind, and it's also possibly faster (tmpfs instead of
                    # flash storage).
                    #
                    # TODO: Consider freeing each directory when we're done with it.
                    # e.g. if we're migrating from v1 to v10, we can free the temporary
                    # directory for v2 as soon as we move past it; we don't need to wait
                    # for v10 to complete.
                    output_dir = Path(
                        exit_stack.enter_context(tempfile.TemporaryDirectory())
                    )

                _log.info(f'Performing migration to "{migration.subdirectory}"...')
                migration.migrate(source_dir=previous_output, dest_dir=output_dir)
                previous_output = output_dir

        _log.info("All migrations complete.")
        return final_output

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


@contextlib.contextmanager
def _atomic_dir(destination: Path, temp_prefix: str) -> Generator[Path, None, None]:
    """Atomically create a directory and its contained files.

    This returns a temporary directory. While the `with`-block is open, you can fill
    it with files. Then:

    * If the code inside the `with`-block succeeds, the directory is promoted to be
      non-temporary, by atomically moving it to be at `destination`.
    * Or, if the code inside the `with`-block raises an exception, the temporary
      directory is deleted.

    Crashes or shutdowns may leave the temporary directory behind, adjacent to
    `destination`. Choose a `temp_prefix` that's easily identifiable so you can
    clean it up in case this happens.
    """
    temp_dir = tempfile.mkdtemp(
        # Manually specify `dir` to keep the temporary directory on the same filesystem
        # as our target. Otherwise, the rename won't be atomic.
        dir=destination.parent,
        prefix=temp_prefix,
    )

    try:
        yield Path(temp_dir)
    except Exception:
        shutil.rmtree(temp_dir)
        raise
    else:
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
        os.replace(src=temp_dir, dst=destination)


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
