"""SQLite table schemas."""
import sqlalchemy

_metadata = sqlalchemy.MetaData()

# table added in ver
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

protocol_table = sqlalchemy.Table(
    "protocol",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    # NOTE: This column stores naive (timezone-less) datetimes.
    # Timezones are stripped from inserted values, due to SQLite limitations.
    # To ensure proper functionality, all inserted datetimes must be UTC.
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column("protocol_key", sqlalchemy.String, nullable=True),
)

analysis_table = sqlalchemy.Table(
    "analysis",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("protocol.id"),
        index=True,
        nullable=False,
    ),
    sqlalchemy.Column(
        "analyzer_version",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "completed_analysis",
        sqlalchemy.LargeBinary,
        nullable=False,
    ),
)


run_table = sqlalchemy.Table(
    "run",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    # NOTE: See above note about naive datetimes
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("protocol.id"),
        nullable=True,
    ),
    # column added in schema v1
    sqlalchemy.Column("state_summary", sqlalchemy.PickleType, nullable=True),
    # column added in schema v1
    sqlalchemy.Column("commands", sqlalchemy.PickleType, nullable=True),
    # column added in schema v1
    sqlalchemy.Column("engine_status", sqlalchemy.String, nullable=True),
    # column added in schema v1
    sqlalchemy.Column(
        "_updated_at",
        sqlalchemy.DateTime,
        nullable=True,
    ),
)

action_table = sqlalchemy.Table(
    "action",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    # NOTE: See above note about naive datetimes
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, nullable=False),
    sqlalchemy.Column("action_type", sqlalchemy.String, nullable=False),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("run.id"),
        nullable=False,
    ),
)


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back all data stores.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    _metadata.create_all(sql_engine)
