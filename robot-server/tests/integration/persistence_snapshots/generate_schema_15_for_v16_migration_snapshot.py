"""Build `schema_15_minimal_for_v16_migration/15/robot_server.db` for integration tests.

Run from the `robot-server` directory:

    uv run python tests/integration/persistence_snapshots/generate_schema_15_for_v16_migration_snapshot.py

This migrates an empty persistence root through schema 15 (excluding the 15 to 16 step),
then inserts distinct rows into `boolean_setting_extended` so the v15 to v16 migration
and string value handling can be exercised.
"""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

import sqlalchemy

from server_utils.persistence.folder_migrator import MigrationOrchestrator

from robot_server.persistence.database import sql_engine_ctx
from robot_server.persistence.file_and_directory_names import DB_FILE
from robot_server.persistence.manage_persistence_directory import (
    make_migration_orchestrator,
)
from robot_server.persistence.tables.schema_15 import (
    BooleanSettingKey,
    boolean_setting_table,
)

_SNAPSHOT_NAME = "schema_15_minimal_for_v16_migration"


def main() -> None:
    dest_parent = Path(__file__).resolve().parent / _SNAPSHOT_NAME
    dest_15 = dest_parent / "15"

    tmp = Path(tempfile.mkdtemp(prefix="gen-schema15-"))
    try:
        full_orch = make_migration_orchestrator(tmp)
        orch_through_15 = MigrationOrchestrator(
            root=tmp,
            migrations=list(full_orch._migrations[:-1]),
            temp_file_prefix="temp-",
        )
        path_15 = orch_through_15.migrate_to_latest()
        assert path_15.name == "15", path_15

        db_path = path_15 / DB_FILE
        with sql_engine_ctx(db_path) as engine:
            with engine.begin() as conn:
                conn.execute(sqlalchemy.delete(boolean_setting_table))
                conn.execute(
                    sqlalchemy.insert(boolean_setting_table),
                    [
                        {
                            "key": BooleanSettingKey.ENABLE_ERROR_RECOVERY,
                            "value": False,
                        },
                        {
                            "key": BooleanSettingKey.ENABLE_CAMERA,
                            "value": True,
                        },
                        {
                            "key": BooleanSettingKey.ENABLE_LIVE_STREAM,
                            "value": False,
                        },
                        {
                            "key": BooleanSettingKey.ENABLE_ERROR_RECOVERY_CAMERA,
                            "value": True,
                        },
                    ],
                )

        if dest_15.exists():
            shutil.rmtree(dest_15)
        shutil.copytree(path_15, dest_15)
        print(f"Wrote {dest_15}")  # noqa: T201
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
