from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import contextmanager
import contextlib
import logging
import os
from pathlib import Path
import tempfile
from typing import Generator, List, Union


_log = logging.getLogger(__name__)


class MigrationOrchestrator:
    def __init__(
        self,
        *,
        root: Path,
        legacy_uncontained_items: List[str],
        migrations: List[Migration],
        temp_file_prefix: str,
    ) -> None:
        """Sequence migrations and perform them in order."""
        for legacy_uncontained_item in legacy_uncontained_items:
            _validate_bare_name(legacy_uncontained_item)
        if len(migrations) < 1:
            raise ValueError("At least one migration is required.")
        self._root = root
        self._legacy_uncontained_items = legacy_uncontained_items
        self._migrations = migrations
        self._temp_file_prefix = temp_file_prefix

    def migrate_to_latest(self) -> Path:
        current = self._get_current()
        if current is None:
            sequence = self._migrations
            previous_output = self._root
        else:
            sequence = self._migrations[current + 1 :]
            previous_output = self._root / self._migrations[current]._subdirectory

        _log.info(f"Migrations to perform: {[m._debug_name for m in sequence]}")

        with contextlib.ExitStack() as exit_stack:
            for sequence_index, migration in enumerate(sequence):
                is_final_migration = sequence_index == len(sequence) - 1
                if is_final_migration:
                    # For the final migration, set things up so that if everything
                    # goes well, we'll commit its output to persistent storage.
                    output_dir = exit_stack.enter_context(
                        _atomic_dir(
                            root=self._root,
                            name=migration._subdirectory,
                            temp_prefix=self._temp_file_prefix,
                        )
                    )
                else:
                    # For intermediate migrations, use normal system temporary
                    # directories, and never commit them to persistent storage.
                    # This is inherently safer in case we crash and leave anything
                    # behind, and it's also possibly faster (tmpfs instead of flash
                    # storage).
                    #
                    # TODO: Consider freeing each directory when we're done with it.
                    # e.g. if we're migrating from v1 to v10, we can free the temporary
                    # directory for v2 as soon as we move past it; we don't need to wait
                    # for v10 to complete.
                    output_dir = Path(
                        exit_stack.enter_context(tempfile.TemporaryDirectory())
                    )

                _log.info(f'Performing migration "{migration._debug_name}"...')
                migration.migrate(source_dir=previous_output, dest_dir=output_dir)
                previous_output = output_dir

        _log.info(f"All migrations complete.")
        return previous_output

    def delete_old_versions(self, num_old_versions_to_keep: int) -> None:
        """
        Warning:
            Only call this *after* `migrate_to_latest()` completes. Otherwise you might
            delete the data you want to migrate from. :)
        """
        # Always keep the latest version.
        num_versions_to_keep = num_old_versions_to_keep + 1
        num_to_delete = (
            len(self._migrations)
            + 1  # +1 to represent self._legacy_uncontained_files.
            - num_versions_to_keep
        )
        directories_to_delete = [
            m._subdirectory for m in self._migrations[:num_to_delete]
        ]
        delete_legacy_files = num_to_delete > len(directories_to_delete)

        if delete_legacy_files:
            for legacy_file in self._legacy_uncontained_items:
                _log.info(f"Deleting legacy file {legacy_file}.")
                _atomic_delete_if_present(
                    to_delete=self._root / legacy_file,
                    temp_prefix=self._temp_file_prefix,
                )

        for directory_to_delete in directories_to_delete:
            _log.info(f"Deleting old directory {directory_to_delete}.")
            _atomic_delete_if_present(
                to_delete=self._root / directory_to_delete,
                temp_prefix=self._temp_file_prefix,
            )

        # TODO: Find anything older than latest - num_old_versions_to_keep
        # (including legacy files) and delete it.
        raise NotImplementedError

    def clean_up_stray_temp_files(self) -> None:
        # TODO: Find anything starting with self.temp_file_prefix and delete it.
        raise NotImplementedError

    def _get_current(self) -> Union[int, None]:
        """Get the most recent migration represented on the filesystem right now.

        Return the index of that migration.
        Return `None` if it's just the legacy uncontained files, or no files at all.
        """
        for index, migration in reversed(list(enumerate(self._migrations))):
            if (self._root / migration._subdirectory).exists():
                return index
        return None


class Migration(ABC):
    def __init__(self, debug_name: str, subdirectory: str) -> None:
        """Represents a single migration, e.g. from v1 to v2.

        Subclass this and override `migrate()` to implement your actual migration logic.

        :param debug_name: A developer-readable name for this migration,
            to use in log messages.
        :param subdirectory: Where, under the `MigrationOrchestrator`'s root
            directory, this migration should output. e.g. if you have
            `foo/bar/storage/v1` and `foo/bar/storage/v2`, the instance of this
            class that creates `foo/bar/storage/v2` should have `v2` for this argument.
        """
        _validate_bare_name(subdirectory)

        self._debug_name = debug_name
        self._subdirectory = subdirectory

    @abstractmethod
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Perform the migration.

        `source_dir` is the directory that was output by the previous migration.
        If this is the first migration in the sequence, it will be the
        `MigrationOrchestrator`'s root, which may contain its
        `legacy_uncontained_items`.

        `dest_dir` is where this method should output. It will be a temporary directory;
        if everything goes well, it will be moved into place atomically.

        A typical implementation should:

        1. Open known files from `source_dir`.
        2. Optionally transform their contents.
        3. Write the new transformed files to `dest_dir`.

        If something goes wrong, this method should signal it by raising an exception.
        The migration sequence will be aborted safely.
        """


def _atomic_delete_if_present(*, to_delete: Path, temp_prefix: str) -> None:
    deleted = False

    with tempfile.TemporaryDirectory(
        # Manually specify `dir` to keep the temporary directory on the same filesystem
        # as our target. Otherwise, the move wouldn't be atomic. e.g. if `dir` were
        # automatically chosen to be /tmp, on tmpfs, our move would just be a full
        # recursive copy followed by a full recursive delete.
        dir=to_delete.parent,
        prefix=temp_prefix,
    ) as temp_dir:
        try:
            to_delete.rename(Path(temp_dir) / to_delete.name)
            deleted = True
        except OSError:
            pass  # File was probably not present.

        # At this point, we've moved the target, but we haven't yet deleted it
        # (or its contents, if it's a directory).
        # This os.sync() is a barrier to make sure that the kernel+filesystem don't
        # reorder the "delete it and its contents" part before the "move" part, which
        # would break our atomicity if we lost power between the two.
        #
        # We do a nuclear-option os.sync() instead of messing with the finer-grained
        # os.fsync() because os.fsync() is difficult to get right.
        # https://stackoverflow.com/questions/37288453/calling-fsync2-after-close2
        os.sync()

    # Exiting the `with`-block will have deleted the temporary directory,
    # and our target with it.
    if deleted:
        _log.info(f"Deleted {to_delete}.")


@contextmanager
def _atomic_dir(
    *, root: Path, name: str, temp_prefix: str
) -> Generator[Path, None, None]:
    """Return a temporary directory.

    If the code inside the `with`-block succeeds, atomically move the temporary
    directory to `root`/`name`, promoting it to be non-temporary.
    """
    directory = tempfile.mkdtemp(
        # Manually specify `dir` to keep the temporary directory on the same filesystem
        # as our target. Otherwise, the rename won't be atomic. e.g. if `dir` were
        # automatically chosen to be /tmp, on tmpfs, our "rename" would just be a full
        # recursive copy followed by a full recursive delete.
        dir=root,
        prefix=temp_prefix,
    )

    yield Path(directory)

    # If we got here without an exception being raised from the `yield`, it means the
    # code inside the `with`-block succeeded.

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
    os.replace(src=directory, dst=root / name)


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
