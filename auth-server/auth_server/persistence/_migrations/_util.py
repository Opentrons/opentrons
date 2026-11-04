"""Shared helpers for auth-server folder migrations."""

import shutil
from pathlib import Path

from alembic import command
from alembic.config import Config

_AUTH_SERVER_DIR = Path(__file__).resolve().parent.parent.parent
_ALEMBIC_INI_FILE = _AUTH_SERVER_DIR / "alembic.ini"


def copy_contents(source_dir: Path, dest_dir: Path) -> None:
    """Copy the contents of one directory to another (assumed to be empty)."""
    for item in source_dir.iterdir():
        if item.is_dir():
            shutil.copytree(src=item, dst=dest_dir / item.name)
        else:
            shutil.copy(src=item, dst=dest_dir / item.name)


def alembic_upgrade(db_file: Path, revision: str) -> None:
    """Run alembic upgrade on db_file up to revision."""
    alembic_cfg = Config(str(_ALEMBIC_INI_FILE))
    alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_file}")
    command.upgrade(alembic_cfg, revision)
