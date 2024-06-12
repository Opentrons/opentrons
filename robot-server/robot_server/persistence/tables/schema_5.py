"""v5 of our SQLite schema."""

import sqlalchemy

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
    sqlalchemy.Column("protocol_kind", sqlalchemy.String, nullable=True),
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
        # Stores a JSON string. See CompletedAnalysisStore.
        sqlalchemy.String,
        nullable=False,
    ),
    # column added in schema v4
    sqlalchemy.Column(
        "run_time_parameter_values_and_defaults",
        sqlalchemy.String,
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
        sqlalchemy.String,
        nullable=True,
    ),
    # column added in schema v1
    sqlalchemy.Column("engine_status", sqlalchemy.String, nullable=True),
    # column added in schema v1
    sqlalchemy.Column("_updated_at", UTCDateTime, nullable=True),
    # column added in schema v4
    sqlalchemy.Column(
        "run_time_parameters",
        # Stores a JSON string. See RunStore.
        sqlalchemy.String,
        nullable=True,
    ),
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
    sqlalchemy.Column("row_id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "run_id", sqlalchemy.String, sqlalchemy.ForeignKey("run.id"), nullable=False
    ),
    sqlalchemy.Column("index_in_run", sqlalchemy.Integer, nullable=False),
    sqlalchemy.Column("command_id", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("command", sqlalchemy.String, nullable=False),
    sqlalchemy.Index(
        "ix_run_run_id_command_id",  # An arbitrary name for the index.
        "run_id",
        "command_id",
        unique=True,
    ),
    sqlalchemy.Index(
        "ix_run_run_id_index_in_run",  # An arbitrary name for the index.
        "run_id",
        "index_in_run",
        unique=True,
    ),
)
