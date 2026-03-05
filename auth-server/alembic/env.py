from logging.config import fileConfig
from pathlib import Path
from typing import Any, Literal, Union

from alembic.autogenerate.api import AutogenContext
from sqlalchemy import engine_from_config, pool

from alembic import context

from auth_server.persistence.database import Base
from auth_server.persistence.file_and_directory_names import (
    DB_FILE,
    LATEST_VERSION_DIRECTORY,
)
from auth_server.persistence.tables import ScopeListType
from auth_server.persistence.tables import User as UserModel  # noqa: F401
from auth_server.server_settings import get_settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.
settings = get_settings()
if isinstance(settings.persistence_directory, Path):
    db_path = settings.persistence_directory / LATEST_VERSION_DIRECTORY / DB_FILE
else:
    raise RuntimeError(
        "Set OT_AUTH_SERVER_persistence_directory to a real path for Alembic migrations."
    )
db_url = f"sqlite:///{db_path}"

config.set_main_option("sqlalchemy.url", db_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def _render_item(
    type_: str, obj: Any, autogen_context: AutogenContext
) -> Union[str, Literal[False]]:
    if type_ == "type" and isinstance(obj, ScopeListType):
        autogen_context.imports.add(
            "from auth_server.persistence.tables import ScopeListType"
        )
        return "ScopeListType()"
    return False  # fall back to default rendering


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_item=_render_item,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
