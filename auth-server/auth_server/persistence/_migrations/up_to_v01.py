"""Initial schema migration – creates the auth-server database from scratch."""

from pathlib import Path

from server_utils.persistence.folder_migrator import Migration

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.persistence.file_and_directory_names import DB_FILE

from alembic.config import Config
from alembic import command

from auth_server.persistence.file_and_directory_names import DB_FILE


class MigrationUpTo1(Migration):
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        dest_db_file = dest_dir / DB_FILE
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{dest_db_file}")
        command.upgrade(alembic_cfg, "head")
