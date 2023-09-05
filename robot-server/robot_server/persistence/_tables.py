"""SQLite table schemas."""
import sqlalchemy

from . import legacy_pickle
from .pickle_protocol_version import PICKLE_PROTOCOL_VERSION
from ._utc_datetime import UTCDateTime

_metadata = sqlalchemy.MetaData()

migration_table = sqlalchemy.Table(
    "migration",
    _metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("created_at", UTCDateTime, nullable=False),
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
    sqlalchemy.Column(
        "created_at",
        UTCDateTime,
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
        # Stores a pickled dict. See CompletedAnalysisStore.
        # TODO(mm, 2023-08-30): Remove this. See https://opentrons.atlassian.net/browse/RSS-98.
        sqlalchemy.LargeBinary,
        nullable=False,
    ),
    sqlalchemy.Column(
        "completed_analysis_as_document",
        # Stores the same data as completed_analysis, but serialized as a JSON string.
        sqlalchemy.String,
        # This column should never be NULL in practice.
        # It needs to be nullable=True because of limitations in SQLite and our migration code.
        nullable=True,
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
    sqlalchemy.Column(
        "created_at",
        UTCDateTime,
        nullable=False,
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("protocol.id"),
        nullable=True,
    ),
    # column added in schema v1
    sqlalchemy.Column(
        "state_summary",
        sqlalchemy.PickleType(pickler=legacy_pickle, protocol=PICKLE_PROTOCOL_VERSION),
        nullable=True,
    ),
    # column added in schema v1
    sqlalchemy.Column(
        "commands",
        sqlalchemy.PickleType(pickler=legacy_pickle, protocol=PICKLE_PROTOCOL_VERSION),
        nullable=True,
    ),
    # column added in schema v1
    sqlalchemy.Column("engine_status", sqlalchemy.String, nullable=True),
    # column added in schema v1
    sqlalchemy.Column("_updated_at", UTCDateTime, nullable=True),
)

action_table = sqlalchemy.Table(
    "action",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column("created_at", UTCDateTime, nullable=False),
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
