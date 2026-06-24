from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

from server_utils import sql_utils

from audit_server.persistence import orm_models as _orm_models  # noqa: F401
from audit_server.persistence.file_and_directory_names import (
    DB_FILE,
    LATEST_VERSION_DIRECTORY,
)
from audit_server.persistence.orm_models import Base
from audit_server.server_settings import get_settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# When locally running Alembic's CLI, this log config needs to be uncommented to get output.
# But, when running the dev server or production server, this needs to stay commented
# to avoid clobbering the server's logging config.
#
# We might need to change how the server calls Alembic. https://stackoverflow.com/a/54402853/497934
#
# if config.config_file_name is not None:
#     fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.
settings = get_settings()
db_url = config.get_main_option("sqlalchemy.url")
if db_url is None or db_url == "driver://user:pass@localhost/dbname":
    if isinstance(settings.persistence_directory, Path):
        db_path = settings.persistence_directory / LATEST_VERSION_DIRECTORY / DB_FILE
        if not db_path.parent.is_dir():
            db_path.parent.mkdir(parents=True)
    else:
        raise RuntimeError(
            "Set OT_AUDIT_SERVER_persistence_directory to a real path for Alembic migrations."
        )
    config.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")


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
        context.run_migrations()  # fall back to default rendering


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
            render_as_batch=True,
        )

        sql_utils.enable_foreign_key_constraints(connectable)
        sql_utils.fix_transactions(connectable)
        sql_utils.enable_write_ahead_logging(connectable)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
