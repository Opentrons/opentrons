"""SQLite table schemas."""

import enum

import sqlalchemy
from sqlalchemy import Column, Integer

_metadata = sqlalchemy.MetaData()


registration_table = sqlalchemy.Table(
    "registration",
    _metadata,
    Column("id", Integer, primary_key=True, nullable=False),
    Column("subject", sqlalchemy.String, nullable=True),
    Column("agent", sqlalchemy.String, nullable=True),
    Column("agent_id", sqlalchemy.String, nullable=True),
    Column("token", sqlalchemy.String, nullable=True),
    Column("schema_version", Integer, nullable=False, default=0, server_default="0"),
    sqlalchemy.UniqueConstraint("subject", "agent", "agent_id"),
)

migration_table = sqlalchemy.Table(
    "migration",
    _metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column(
        "version",
        sqlalchemy.Integer,
        nullable=False,
    ),
)


class SettingKey(enum.Enum):
    """Keys for rows in the settings table."""

    LOG_LEVEL = "log_level"


settings_table = sqlalchemy.Table(
    "settings",
    _metadata,
    sqlalchemy.Column(
        "key",
        sqlalchemy.Enum(
            SettingKey,
            values_callable=lambda obj: [e.value for e in obj],
            validate_strings=True,
            create_constraint=False,
            native_enum=False,
            length=200,
        ),
        primary_key=True,
    ),
    sqlalchemy.Column("value", sqlalchemy.String, nullable=False),
)


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back all data stores.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    _metadata.create_all(sql_engine)
