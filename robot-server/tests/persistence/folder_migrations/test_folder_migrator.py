"""Tests for the `folder_migrator` module."""

from pathlib import Path
from typing import Set

import pytest

from robot_server.persistence.folder_migrations import folder_migrator


def test_noop_if_no_migrations_supplied(tmp_path: Path) -> None:
    """Migrating should no-op if no migrations are configured."""
    subject = folder_migrator.MigrationOrchestrator(
        root=tmp_path,
        migrations=[],
        temp_file_prefix="tmp",
    )

    (tmp_path / "a").write_text("original a contents")
    (tmp_path / "b_dir").mkdir()
    (tmp_path / "b_dir" / "b").write_text("original b contents")

    result = subject.migrate_to_latest()

    assert result == tmp_path
    assert _children(tmp_path) == {"a", "b_dir"}
    assert (tmp_path / "a").read_text() == "original a contents"
    assert (tmp_path / "b_dir" / "b").read_text() == "original b contents"


def test_noop_if_no_migrations_required(tmp_path: Path) -> None:
    """Migrating should no-op if it looks like we're already at the latest version."""

    class OlderMigration(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert False, "This should never run."

    class NewerMigration(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert False, "This should never run."

    subject = folder_migrator.MigrationOrchestrator(
        root=tmp_path,
        migrations=[
            OlderMigration(subdirectory="older_dir"),
            NewerMigration(subdirectory="newer_dir"),
        ],
        temp_file_prefix="tmp",
    )

    (tmp_path / "older_dir").mkdir()
    (tmp_path / "older_dir" / "older_file").write_text("original older_file contents")
    (tmp_path / "newer_dir").mkdir()
    (tmp_path / "newer_dir" / "newer_file").write_text("original newer_file contents")

    result = subject.migrate_to_latest()

    assert result == tmp_path / "newer_dir"
    assert _children(tmp_path) == {"older_dir", "newer_dir"}
    assert (
        tmp_path / "older_dir" / "older_file"
    ).read_text() == "original older_file contents"
    assert (
        tmp_path / "newer_dir" / "newer_file"
    ).read_text() == "original newer_file contents"


def test_migration_chain_from_scratch(tmp_path: Path) -> None:
    """It should successfully go through the migration chain starting from scratch.

    Going from initial -> A -> B -> C, the final directory state should only contain
    initial (because it was our starting data and we want to leave it alone)
    and C (because that's our target final state). A and B should be left out, because
    they were only intermediate.
    """

    class MigrationA(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "initial_file").exists()
            (dest_dir / "a_file").touch()

    class MigrationB(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "a_file").exists()
            (dest_dir / "b_file").touch()

    class MigrationC(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "b_file").exists()
            (dest_dir / "c_file").touch()

    subject = folder_migrator.MigrationOrchestrator(
        root=tmp_path,
        migrations=[
            MigrationA("a_dir"),
            MigrationB("b_dir"),
            MigrationC("c_dir"),
        ],
        temp_file_prefix="temp",
    )

    (tmp_path / "initial_file").touch()

    result = subject.migrate_to_latest()

    assert result == tmp_path / "c_dir"
    assert {child.name for child in tmp_path.iterdir()} == {"initial_file", "c_dir"}
    assert (tmp_path / "c_dir" / "c_file").exists()


def test_migration_chain_from_intermediate(tmp_path: Path) -> None:
    """It should successfully complete a migration chain starting from the middle.

    If the migrations are configured as initial -> A -> B -> C, and we see data already
    there for A, migrating should only perform B and C. The final directory state should
    contain initial and A (because that was our starting data and we want to leave
    it alone), and C (because that's our target final state). B should be left out,
    because it was only intermediate.
    """
    (tmp_path / "initial_file").touch()
    (tmp_path / "a_dir").mkdir()
    (tmp_path / "a_dir" / "a_file").touch()

    class MigrationA(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert False, "This should never run."

    class MigrationB(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "a_file").exists()
            (dest_dir / "b_file").touch()

    class MigrationC(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "b_file").exists()
            (dest_dir / "c_file").touch()

    subject = folder_migrator.MigrationOrchestrator(
        root=tmp_path,
        migrations=[
            MigrationA("a_dir"),
            MigrationB("b_dir"),
            MigrationC("c_dir"),
        ],
        temp_file_prefix="temp",
    )

    result = subject.migrate_to_latest()

    assert result == tmp_path / "c_dir"
    assert {child.name for child in tmp_path.iterdir()} == {
        "initial_file",
        "a_dir",
        "c_dir",
    }
    assert (tmp_path / "c_dir" / "c_file").exists()


def test_aborted_intermediate_migration(tmp_path: Path) -> None:
    """It should clean up gracefully from exceptions in intermediate migration steps.

    The directory should be left as it was before the migration started.
    """

    class MigrationA(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            pass  # no-op

    class MigrationB(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            pass  # no-op

    class MigrationC(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            raise RuntimeError("oy vey")

    class MigrationD(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert False, "This should never run."

    subject = folder_migrator.MigrationOrchestrator(
        root=tmp_path,
        migrations=[
            MigrationA("a_dir"),
            MigrationB("b_dir"),
            MigrationC("c_dir"),
            MigrationD("d_dir"),
        ],
        temp_file_prefix="temp",
    )

    (tmp_path / "a_dir").mkdir()
    initial_children = _children(tmp_path)

    with pytest.raises(RuntimeError, match="oy vey"):
        subject.migrate_to_latest()

    assert _children(tmp_path) == initial_children


def test_aborted_final_migration(tmp_path: Path) -> None:
    """It should clean up gracefully from exceptions in the final migration step.

    The directory should be left as it was before the migration started.
    """

    class MigrationA(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            pass  # no-op

    class MigrationB(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            pass  # no-op

    class MigrationC(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            raise RuntimeError("oy vey")

    subject = folder_migrator.MigrationOrchestrator(
        root=tmp_path,
        migrations=[
            MigrationA("a_dir"),
            MigrationB("b_dir"),
            MigrationC("c_dir"),
        ],
        temp_file_prefix="temp",
    )

    (tmp_path / "a_dir").mkdir()
    initial_children = _children(tmp_path)

    with pytest.raises(RuntimeError, match="oy vey"):
        subject.migrate_to_latest()

    assert _children(tmp_path) == initial_children


def test_clean_up_stray_temp_files(tmp_path: Path) -> None:
    """It should delete any file or directory that begins with the given prefix."""
    (tmp_path / "foobar_temp_file_a").touch()
    (tmp_path / "foobar_temp_dir_b").mkdir()
    (tmp_path / "foobar_temp_dir_b" / "file_b").touch()
    (tmp_path / "not_a_temp_file").touch()

    subject = folder_migrator.MigrationOrchestrator(
        root=tmp_path, migrations=[], temp_file_prefix="foobar"
    )
    subject.clean_up_stray_temp_files()

    assert _children(tmp_path) == {"not_a_temp_file"}


def _children(directory: Path) -> Set[str]:
    return {child.name for child in directory.iterdir()}
