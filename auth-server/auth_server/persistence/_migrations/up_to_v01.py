"""Initial schema migration – creates the auth-server database from scratch."""

from pathlib import Path

from server_utils.folder_migrator import Migration

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.persistence.file_and_directory_names import DB_FILE


class MigrationUpTo1(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Create a fresh database with the v1 schema."""
        dest_db_file = dest_dir / DB_FILE
        with sql_engine_ctx(dest_db_file) as engine:
            create_schema(engine)
