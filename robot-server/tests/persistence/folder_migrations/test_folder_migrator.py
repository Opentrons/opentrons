from pathlib import Path

from robot_server.persistence.folder_migrations import folder_migrator


# TODO: More exhaustive tests here.
# - Migrations from scratch
# - Migrations starting from legacy files
# - Migrations starting from an older migration
# - No-op when no migration needed
# - Tolerates extra files
# - Deletes oldest n directories and legacy files (tolerating them not existing)
# - Temp file cleanup
# - Generally does not leave temp files hanging around in root directory


def test_migration_chain(tmp_path: Path) -> None:
    (tmp_path / "legacy_file").touch()

    class MigrationA(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "legacy_file").exists()
            (dest_dir / "a_file").touch()

    class MigrationB(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "a_file").exists()
            (dest_dir / "b_file").touch()

    class MigrationC(folder_migrator.Migration):
        def migrate(self, source_dir: Path, dest_dir: Path) -> None:
            assert (source_dir / "b_file").exists()
            (dest_dir / "c_file").touch()

    orchestrator = folder_migrator.MigrationOrchestrator(
        root=tmp_path,
        legacy_uncontained_items=["legacy_file"],
        migrations=[
            MigrationA("A", "a_dir"),
            MigrationB("B", "b_dir"),
            MigrationC("C", "c_dir"),
        ],
        temp_file_prefix="temp",
    )

    orchestrator.migrate_to_latest()

    assert {child.name for child in tmp_path.iterdir()} == {"legacy_file", "c_dir"}
    assert (tmp_path / "c_dir" / "c_file").exists()

