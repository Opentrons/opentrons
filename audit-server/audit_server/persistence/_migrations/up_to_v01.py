"""Initial schema migration – creates the audit-server database from scratch.

Once the first Alembic revision exists in ``audit_server/alembic/versions/``,
``command.upgrade(alembic_cfg, "head")`` below will create the database and
bring it up to the latest revision. Until then this migration just creates an
empty database file and Alembic's bookkeeping ``alembic_version`` table.
"""

from pathlib import Path

from alembic import command
from alembic.config import Config

from server_utils.persistence.folder_migrator import Migration

from audit_server.persistence.file_and_directory_names import DB_FILE

# Get the path to the audit-server directory and the alembic.ini file bc this is not the default location
_AUDIT_SERVER_DIR = Path(__file__).resolve().parent.parent.parent
_ALEMBIC_INI_FILE = _AUDIT_SERVER_DIR / "alembic.ini"


class MigrationUpTo1(Migration):
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        dest_db_file = dest_dir / DB_FILE
        alembic_cfg = Config(str(_ALEMBIC_INI_FILE))
        alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{dest_db_file}")
        command.upgrade(alembic_cfg, "head")
