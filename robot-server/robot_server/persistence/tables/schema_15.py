"""v15 of our SQLite schema."""

import enum

import sqlalchemy

from server_utils.sql_utils import UTCDateTime

metadata = sqlalchemy.MetaData()


class PrimitiveParamSQLEnum(enum.Enum):
    """Enum type to store primitive param type."""

    INT = "int"
    FLOAT = "float"
    BOOL = "bool"
    STR = "str"


class ProtocolKindSQLEnum(enum.Enum):
    """What kind a stored protocol is."""

    STANDARD = "standard"
    QUICK_TRANSFER = "quick-transfer"


class CommandStatusSQLEnum(enum.Enum):
    """Command status sql enum."""

    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


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
    sqlalchemy.Column(
        "protocol_kind",
        sqlalchemy.Enum(
            ProtocolKindSQLEnum,
            values_callable=lambda obj: [e.value for e in obj],
            validate_strings=True,
            create_constraint=True,
        ),
        index=True,
        nullable=False,
    ),
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
)


analysis_primitive_type_rtp_table = sqlalchemy.Table(
    "analysis_primitive_rtp_table",
    metadata,
    sqlalchemy.Column(
        "row_id",
        sqlalchemy.Integer,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "analysis_id",
        sqlalchemy.ForeignKey("analysis.id"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "parameter_variable_name",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "parameter_type",
        sqlalchemy.Enum(
            PrimitiveParamSQLEnum,
            values_callable=lambda obj: [e.value for e in obj],
            create_constraint=True,
            # todo(mm, 2024-09-24): Can we add validate_strings=True here?
        ),
        nullable=False,
    ),
    sqlalchemy.Column(
        "parameter_value",
        sqlalchemy.String,
        nullable=False,
    ),
)


analysis_csv_rtp_table = sqlalchemy.Table(
    "analysis_csv_rtp_table",
    metadata,
    sqlalchemy.Column(
        "row_id",
        sqlalchemy.Integer,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "analysis_id",
        sqlalchemy.ForeignKey("analysis.id"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "parameter_variable_name",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "file_id",
        sqlalchemy.ForeignKey("data_files.id"),
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
    sqlalchemy.Column(
        "state_summary",
        sqlalchemy.String,
        nullable=True,
    ),
    sqlalchemy.Column("engine_status", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("_updated_at", UTCDateTime, nullable=True),
    sqlalchemy.Column(
        "run_time_parameters",
        # Stores a JSON string. See RunStore.
        sqlalchemy.String,
        nullable=True,
    ),
    sqlalchemy.Column(
        "input_file_ids",
        # Stores a JSON array of input_ids from input_data_files table
        sqlalchemy.String,
        nullable=True,
    ),
    sqlalchemy.Column(
        "output_file_ids",
        # Stores a JSON array of output_ids from output_data_files table
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
    # command_index in commands enumeration
    sqlalchemy.Column("index_in_run", sqlalchemy.Integer, nullable=False),
    sqlalchemy.Column("command_id", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("command", sqlalchemy.String, nullable=False),
    sqlalchemy.Column(
        "command_intent",
        sqlalchemy.String,
        # nullable=True to match the underlying SQL, which is nullable because of a bug
        # in the migration that introduced this column. This is not intended to ever be
        # null in practice.
        nullable=True,
    ),
    sqlalchemy.Column("command_error", sqlalchemy.String, nullable=True),
    sqlalchemy.Column(
        "command_status",
        sqlalchemy.Enum(
            CommandStatusSQLEnum,
            values_callable=lambda obj: [e.value for e in obj],
            validate_strings=True,
            # nullable=True because it was easier for the migration to add the column
            # this way. This is not intended to ever be null in practice.
            nullable=True,
            # todo(mm, 2024-11-20): We want create_constraint=True here. Something
            # about the way we compare SQL in test_tables.py is making that difficult--
            # even when we correctly add the constraint in the migration, the SQL
            # doesn't compare equal to what create_constraint=True here would emit.
            create_constraint=False,
        ),
    ),
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
    sqlalchemy.Index(
        "ix_run_run_id_command_status_index_in_run",  # An arbitrary name for the index.
        "run_id",
        "command_status",
        "index_in_run",
        unique=True,
    ),
)


class AnnotationSourceSQLEnum(enum.Enum):
    """Source of an annotation."""

    USER_COMMAND = "userCommand"
    SYSTEM_COMMAND = "systemCommand"


command_annotation_table = sqlalchemy.Table(
    "command_annotation",
    metadata,
    sqlalchemy.Column("row_id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("run.id"),
        nullable=False,
    ),
    sqlalchemy.Column("annotation_id", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("name", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("description", sqlalchemy.String, nullable=True),
    sqlalchemy.Column(
        "source",
        sqlalchemy.Enum(
            AnnotationSourceSQLEnum,
            values_callable=lambda obj: [e.value for e in obj],
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
    ),
    sqlalchemy.Column(
        "parent_id",
        sqlalchemy.String,
        nullable=True,
    ),
    # Stores a JSON string
    sqlalchemy.Column("params", sqlalchemy.String, nullable=True),
    sqlalchemy.ForeignKeyConstraint(
        ["run_id", "parent_id"],
        ["command_annotation.run_id", "command_annotation.annotation_id"],
        ondelete="CASCADE",  # As of the addition of this table, we do not anticipate deleting a parent annotation without deleting its children. So we are enabling cascading deletes.
    ),
    sqlalchemy.Index(
        "ix_run_id_annotation_id",
        "run_id",
        "annotation_id",
        unique=True,
    ),
)


command_to_annotation_table = sqlalchemy.Table(
    "command_to_annotation",
    metadata,
    sqlalchemy.Column("row_id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "command_id",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "annotation_id",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.ForeignKeyConstraint(
        ["run_id", "command_id"], ["run_command.run_id", "run_command.command_id"]
    ),
    sqlalchemy.ForeignKeyConstraint(
        ["run_id", "annotation_id"],
        ["command_annotation.run_id", "command_annotation.annotation_id"],
    ),
    sqlalchemy.Index(
        "ix_c2a_run_id_command_id_annotation_id",  # c2a stands for command_to_annotation
        "run_id",
        "command_id",
        "annotation_id",
        unique=True,
    ),
)

# stores the metadata describing the physical file
data_files_table = sqlalchemy.Table(
    "data_files",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "name",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "path",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "stored",
        sqlalchemy.Boolean,
        nullable=False,
        default=True,
    ),
    sqlalchemy.Column(
        "generated",
        sqlalchemy.Boolean,
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "mime_type",
        sqlalchemy.String,
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "file_hash",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "created_at",
        UTCDateTime,
        nullable=False,
    ),
)

# table for data files serving as input to a run
input_data_files_table = sqlalchemy.Table(
    "input_data_files",
    metadata,
    sqlalchemy.Column(
        "file_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("data_files.id"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("run.id"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.PrimaryKeyConstraint("file_id", "run_id"),
)


# data files generated as output during a run
output_data_files_table = sqlalchemy.Table(
    "output_data_files",
    metadata,
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("run.id"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "command_id",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "prev_command_id",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "file_id",
        sqlalchemy.String,
        sqlalchemy.ForeignKey("data_files.id"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.PrimaryKeyConstraint("file_id", "run_id"),
)


run_csv_rtp_table = sqlalchemy.Table(
    "run_csv_rtp_table",
    metadata,
    sqlalchemy.Column(
        "row_id",
        sqlalchemy.Integer,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "run_id",
        sqlalchemy.ForeignKey("run.id"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "parameter_variable_name",
        sqlalchemy.String,
        nullable=False,
    ),
    sqlalchemy.Column(
        "file_id",
        sqlalchemy.ForeignKey("data_files.id"),
        nullable=True,
    ),
)


class BooleanSettingKey(enum.Enum):
    """Keys for boolean settings."""

    ENABLE_ERROR_RECOVERY = "enable_error_recovery"
    ENABLE_CAMERA = "enable_camera"
    ENABLE_LIVE_STREAM = "enable_live_stream"
    ENABLE_ERROR_RECOVERY_CAMERA = "enable_error_recovery_camera"


boolean_setting_table = sqlalchemy.Table(
    "boolean_setting_extended",
    metadata,
    sqlalchemy.Column(
        "key",
        sqlalchemy.Enum(
            BooleanSettingKey,
            values_callable=lambda obj: [e.value for e in obj],
            validate_strings=True,
            create_constraint=False,
        ),
        primary_key=True,
    ),
    sqlalchemy.Column(
        "value",
        sqlalchemy.Boolean,
        nullable=False,
    ),
)

camera_capture_image_settings_table = sqlalchemy.Table(
    "camera_capture_image_settings",
    metadata,
    sqlalchemy.Column("camera_id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("resolution_x", sqlalchemy.Integer, nullable=True),
    sqlalchemy.Column("resolution_y", sqlalchemy.Integer, nullable=True),
    sqlalchemy.Column("zoom", sqlalchemy.Float, nullable=True),
    sqlalchemy.Column("pan_x", sqlalchemy.Integer, nullable=True),
    sqlalchemy.Column("pan_y", sqlalchemy.Integer, nullable=True),
    sqlalchemy.Column("contrast", sqlalchemy.Float, nullable=True),
    sqlalchemy.Column("brightness", sqlalchemy.Float, nullable=True),
    sqlalchemy.Column("saturation", sqlalchemy.Float, nullable=True),
)


labware_offset_table = sqlalchemy.Table(
    "labware_offset_with_sequence",
    metadata,
    # Numeric row ID for ordering:
    sqlalchemy.Column("row_id", sqlalchemy.Integer, primary_key=True),
    # String UUID for exposing over HTTP:
    sqlalchemy.Column(
        "offset_id", sqlalchemy.String, nullable=False, unique=True, index=True
    ),
    # The URI identifying the labware definition that this offset applies to.
    sqlalchemy.Column("definition_uri", sqlalchemy.String, nullable=False),
    # The offset itself:
    sqlalchemy.Column("vector_x", sqlalchemy.Float, nullable=False),
    sqlalchemy.Column("vector_y", sqlalchemy.Float, nullable=False),
    sqlalchemy.Column("vector_z", sqlalchemy.Float, nullable=False),
    # Whether this record is "active", i.e. whether it should be considered as a
    # candidate to apply to runs and affect actual robot motion:
    sqlalchemy.Column("active", sqlalchemy.Boolean, nullable=False),
    # When this record was created:
    sqlalchemy.Column("created_at", UTCDateTime, nullable=False),
    sqlalchemy.Index(
        "ix__labware_offset_with_sequence__active__row_id",  # An arbitrary name for the index.
        "active",
        "row_id",
        unique=True,
    ),
)

labware_offset_location_sequence_components_table = sqlalchemy.Table(
    "labware_offset_sequence_components",
    metadata,
    # ID for this row, which largely won't be used
    sqlalchemy.Column("row_id", sqlalchemy.Integer, primary_key=True),
    # Which offset this belongs to
    sqlalchemy.Column(
        "offset_id",
        sqlalchemy.ForeignKey(
            "labware_offset_with_sequence.row_id",
        ),
        nullable=False,
        index=True,
    ),
    # Its position within the sequence
    sqlalchemy.Column("sequence_ordinal", sqlalchemy.Integer, nullable=False),
    # An identifier for the component; in practice this will be an enum entry (of the kind values
    # of the LabwareOffsetSequenceComponent models) but by keeping that out of the schema we don't
    # have to change the schema if we add something new there
    sqlalchemy.Column("component_kind", sqlalchemy.String, nullable=False),
    # The value of the component, which will differ in kind by what component it is, and would be
    # annoying to further schematize without yet more normalization. If we ever add a sequence component
    # that has more than one value in it (think twice before doing this), pick a primary value that you'll
    # be searching by and put that here.
    sqlalchemy.Column("primary_component_value", sqlalchemy.String, nullable=False),
    # If the value of the component has more than one thing in it, dump it to json and put it here.
    sqlalchemy.Column("component_value_json", sqlalchemy.String, nullable=False),
)
