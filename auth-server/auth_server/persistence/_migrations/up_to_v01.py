"""Initial schema migration – creates the auth-server database from scratch."""

from pathlib import Path

from alembic import command
from alembic.config import Config

from server_utils.persistence.folder_migrator import Migration

from auth_server.persistence.file_and_directory_names import DB_FILE

# Get the path to the auth-server directory and the alembic.ini file bc this is not the default location
_AUTH_SERVER_DIR = Path(__file__).resolve().parent.parent.parent
_ALEMBIC_INI_FILE = _AUTH_SERVER_DIR / "alembic.ini"


class MigrationUpTo1(Migration):
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        dest_db_file = dest_dir / DB_FILE
        alembic_cfg = Config(str(_ALEMBIC_INI_FILE))
        alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{dest_db_file}")
        command.upgrade(alembic_cfg, "754f68036d12")
