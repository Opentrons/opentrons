"""v3 of our SQLite schema."""

import sqlalchemy

from robot_server.persistence import legacy_pickle
from robot_server.persistence.pickle_protocol_version import PICKLE_PROTOCOL_VERSION
from robot_server.persistence._utc_datetime import UTCDateTime

metadata = sqlalchemy.MetaData()

protocol_table = sqlalchemy.Table(
    "protocol",
    metadata,
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
    metadata,
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
    metadata,
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
    sqlalchemy.Column("engine_status", sqlalchemy.String, nullable=True),
    # column added in schema v1
    sqlalchemy.Column("_updated_at", UTCDateTime, nullable=True),
)

action_table = sqlalchemy.Table(
    "action",
    metadata,
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

run_command_table = sqlalchemy.Table(
    "run_command",
    metadata,
    sqlalchemy.Column(
        "run_id", sqlalchemy.String, sqlalchemy.ForeignKey("run.id"), nullable=False
    ),
    sqlalchemy.Column("index_in_run", sqlalchemy.Integer, nullable=False),
    sqlalchemy.Column("command_id", sqlalchemy.String, nullable=False),
    sqlalchemy.Column(
        "command",
        # TODO(mm, 2024-01-25): This should be JSON instead of a pickle. See:
        # https://opentrons.atlassian.net/browse/RSS-98.
        sqlalchemy.PickleType(pickler=legacy_pickle, protocol=PICKLE_PROTOCOL_VERSION),
        nullable=False,
    ),
    sqlalchemy.PrimaryKeyConstraint("run_id", "command_id"),
    sqlalchemy.Index(
        "ix_run_run_id_index_in_run",  # An arbitrary name for the index.
        "run_id",
        "index_in_run",
        unique=True,
    ),
)
