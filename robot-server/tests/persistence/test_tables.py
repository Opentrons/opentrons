"""Tests for SQL tables."""

import re
from pathlib import Path

import pytest
import sqlalchemy

from robot_server.persistence.database import sql_engine_ctx
from robot_server.persistence.file_and_directory_names import DB_FILE
from robot_server.persistence.manage_persistence_directory import (
    make_migration_orchestrator,
)
from robot_server.persistence.tables import (
    metadata as latest_metadata,
)
from robot_server.persistence.tables import (
    schema_02,
    schema_03,
    schema_04,
    schema_05,
    schema_06,
    schema_07,
    schema_08,
    schema_09,
    schema_10,
    schema_11,
    schema_13,
    schema_14,
    schema_15,
    schema_16,
    schema_18,
    schema_19,
    schema_20,
)

# The statements that we expect to emit when we create a fresh database.
#
# If this changes semantically in any way,
# the change must be paired with a SQL schema migration.
# Examples of semantic changes:
#
#   * Adding, removing, or renaming a table.
#   * Adding, removing, or renaming a column.
#   * Changing a column type.
#   * Adding, removing, or renaming a constraint or relation.
#
# Whitespace and formatting changes, on the other hand, are allowed.

EXPECTED_STATEMENTS_LATEST = EXPECTED_STATEMENTS_V20 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        result VARCHAR(24),
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        input_file_ids VARCHAR,
        output_file_ids VARCHAR,
        signed_by VARCHAR,
        log_period_id VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE command_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        description VARCHAR,
        source VARCHAR(13) NOT NULL,
        parent_id VARCHAR,
        params VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, parent_id) REFERENCES command_annotation (run_id, annotation_id) ON DELETE CASCADE,
        FOREIGN KEY(run_id) REFERENCES run (id),
        CONSTRAINT annotationsourcesqlenum CHECK (source IN ('userCommand', 'systemCommand'))
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_id_annotation_id ON command_annotation (run_id, annotation_id)
    """,
    """
    CREATE TABLE command_to_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, command_id) REFERENCES run_command (run_id, command_id),
        FOREIGN KEY(run_id, annotation_id) REFERENCES command_annotation (run_id, annotation_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_c2a_run_id_command_id_annotation_id ON command_to_annotation (run_id, command_id, annotation_id)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        path VARCHAR NOT NULL,
        stored BOOLEAN NOT NULL,
        generated BOOLEAN NOT NULL,
        mime_type VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE INDEX ix_data_files_generated ON data_files (generated)
    """,
    """
    CREATE INDEX ix_data_files_mime_type ON data_files (mime_type)
    """,
    """
    CREATE TABLE input_data_files (
        file_id VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(file_id) REFERENCES data_files (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE INDEX ix_input_data_files_file_id ON input_data_files (file_id)
    """,
    """
    CREATE INDEX ix_input_data_files_run_id ON input_data_files (run_id)
    """,
    """
    CREATE TABLE output_data_files (
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        prev_command_id VARCHAR NOT NULL,
        file_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_output_data_files_run_id ON output_data_files (run_id)
    """,
    """
    CREATE INDEX ix_output_data_files_file_id ON output_data_files (file_id)
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting_extended (
        "key" VARCHAR(200) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE camera_capture_image_settings (
        camera_id VARCHAR NOT NULL,
        resolution_x INTEGER,
        resolution_y INTEGER,
        zoom FLOAT,
        pan_x INTEGER,
        pan_y INTEGER,
        contrast FLOAT,
        brightness FLOAT,
        saturation FLOAT,
        PRIMARY KEY (camera_id)
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]

EXPECTED_STATEMENTS_V19 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        input_file_ids VARCHAR,
        output_file_ids VARCHAR,
        signed_by VARCHAR,
        log_period_id VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE command_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        description VARCHAR,
        source VARCHAR(13) NOT NULL,
        parent_id VARCHAR,
        params VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, parent_id) REFERENCES command_annotation (run_id, annotation_id) ON DELETE CASCADE,
        FOREIGN KEY(run_id) REFERENCES run (id),
        CONSTRAINT annotationsourcesqlenum CHECK (source IN ('userCommand', 'systemCommand'))
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_id_annotation_id ON command_annotation (run_id, annotation_id)
    """,
    """
    CREATE TABLE command_to_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, command_id) REFERENCES run_command (run_id, command_id),
        FOREIGN KEY(run_id, annotation_id) REFERENCES command_annotation (run_id, annotation_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_c2a_run_id_command_id_annotation_id ON command_to_annotation (run_id, command_id, annotation_id)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        path VARCHAR NOT NULL,
        stored BOOLEAN NOT NULL,
        generated BOOLEAN NOT NULL,
        mime_type VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE INDEX ix_data_files_generated ON data_files (generated)
    """,
    """
    CREATE INDEX ix_data_files_mime_type ON data_files (mime_type)
    """,
    """
    CREATE TABLE input_data_files (
        file_id VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(file_id) REFERENCES data_files (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE INDEX ix_input_data_files_file_id ON input_data_files (file_id)
    """,
    """
    CREATE INDEX ix_input_data_files_run_id ON input_data_files (run_id)
    """,
    """
    CREATE TABLE output_data_files (
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        prev_command_id VARCHAR NOT NULL,
        file_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_output_data_files_run_id ON output_data_files (run_id)
    """,
    """
    CREATE INDEX ix_output_data_files_file_id ON output_data_files (file_id)
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting_extended (
        "key" VARCHAR(200) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE camera_capture_image_settings (
        camera_id VARCHAR NOT NULL,
        resolution_x INTEGER,
        resolution_y INTEGER,
        zoom FLOAT,
        pan_x INTEGER,
        pan_y INTEGER,
        contrast FLOAT,
        brightness FLOAT,
        saturation FLOAT,
        PRIMARY KEY (camera_id)
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]

EXPECTED_STATEMENTS_V18 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        input_file_ids VARCHAR,
        output_file_ids VARCHAR,
        signed_by VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE command_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        description VARCHAR,
        source VARCHAR(13) NOT NULL,
        parent_id VARCHAR,
        params VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, parent_id) REFERENCES command_annotation (run_id, annotation_id) ON DELETE CASCADE,
        FOREIGN KEY(run_id) REFERENCES run (id),
        CONSTRAINT annotationsourcesqlenum CHECK (source IN ('userCommand', 'systemCommand'))
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_id_annotation_id ON command_annotation (run_id, annotation_id)
    """,
    """
    CREATE TABLE command_to_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, command_id) REFERENCES run_command (run_id, command_id),
        FOREIGN KEY(run_id, annotation_id) REFERENCES command_annotation (run_id, annotation_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_c2a_run_id_command_id_annotation_id ON command_to_annotation (run_id, command_id, annotation_id)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        path VARCHAR NOT NULL,
        stored BOOLEAN NOT NULL,
        generated BOOLEAN NOT NULL,
        mime_type VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE INDEX ix_data_files_generated ON data_files (generated)
    """,
    """
    CREATE INDEX ix_data_files_mime_type ON data_files (mime_type)
    """,
    """
    CREATE TABLE input_data_files (
        file_id VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(file_id) REFERENCES data_files (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE INDEX ix_input_data_files_file_id ON input_data_files (file_id)
    """,
    """
    CREATE INDEX ix_input_data_files_run_id ON input_data_files (run_id)
    """,
    """
    CREATE TABLE output_data_files (
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        prev_command_id VARCHAR NOT NULL,
        file_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_output_data_files_run_id ON output_data_files (run_id)
    """,
    """
    CREATE INDEX ix_output_data_files_file_id ON output_data_files (file_id)
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting_extended (
        "key" VARCHAR(200) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE camera_capture_image_settings (
        camera_id VARCHAR NOT NULL,
        resolution_x INTEGER,
        resolution_y INTEGER,
        zoom FLOAT,
        pan_x INTEGER,
        pan_y INTEGER,
        contrast FLOAT,
        brightness FLOAT,
        saturation FLOAT,
        PRIMARY KEY (camera_id)
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]

# schema 17 = schema 16 with file permissions
EXPECTED_STATEMENTS_V17 = EXPECTED_STATEMENTS_V16 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        input_file_ids VARCHAR,
        output_file_ids VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE command_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        description VARCHAR,
        source VARCHAR(13) NOT NULL,
        parent_id VARCHAR,
        params VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, parent_id) REFERENCES command_annotation (run_id, annotation_id) ON DELETE CASCADE,
        FOREIGN KEY(run_id) REFERENCES run (id),
        CONSTRAINT annotationsourcesqlenum CHECK (source IN ('userCommand', 'systemCommand'))
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_id_annotation_id ON command_annotation (run_id, annotation_id)
    """,
    """
    CREATE TABLE command_to_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, command_id) REFERENCES run_command (run_id, command_id),
        FOREIGN KEY(run_id, annotation_id) REFERENCES command_annotation (run_id, annotation_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_c2a_run_id_command_id_annotation_id ON command_to_annotation (run_id, command_id, annotation_id)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        path VARCHAR NOT NULL,
        stored BOOLEAN NOT NULL,
        generated BOOLEAN NOT NULL,
        mime_type VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE INDEX ix_data_files_generated ON data_files (generated)
    """,
    """
    CREATE INDEX ix_data_files_mime_type ON data_files (mime_type)
    """,
    """
    CREATE TABLE input_data_files (
        file_id VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(file_id) REFERENCES data_files (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE INDEX ix_input_data_files_file_id ON input_data_files (file_id)
    """,
    """
    CREATE INDEX ix_input_data_files_run_id ON input_data_files (run_id)
    """,
    """
    CREATE TABLE output_data_files (
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        prev_command_id VARCHAR NOT NULL,
        file_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_output_data_files_run_id ON output_data_files (run_id)
    """,
    """
    CREATE INDEX ix_output_data_files_file_id ON output_data_files (file_id)
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting_extended (
        "key" VARCHAR(200) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE camera_capture_image_settings (
        camera_id VARCHAR NOT NULL,
        resolution_x INTEGER,
        resolution_y INTEGER,
        zoom FLOAT,
        pan_x INTEGER,
        pan_y INTEGER,
        contrast FLOAT,
        brightness FLOAT,
        saturation FLOAT,
        PRIMARY KEY (camera_id)
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]

EXPECTED_STATEMENTS_V15 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        input_file_ids VARCHAR,
        output_file_ids VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE command_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        description VARCHAR,
        source VARCHAR(13) NOT NULL,
        parent_id VARCHAR,
        params VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, parent_id) REFERENCES command_annotation (run_id, annotation_id) ON DELETE CASCADE,
        FOREIGN KEY(run_id) REFERENCES run (id),
        CONSTRAINT annotationsourcesqlenum CHECK (source IN ('userCommand', 'systemCommand'))
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_id_annotation_id ON command_annotation (run_id, annotation_id)
    """,
    """
    CREATE TABLE command_to_annotation (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        annotation_id VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id, command_id) REFERENCES run_command (run_id, command_id),
        FOREIGN KEY(run_id, annotation_id) REFERENCES command_annotation (run_id, annotation_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_c2a_run_id_command_id_annotation_id ON command_to_annotation (run_id, command_id, annotation_id)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        path VARCHAR NOT NULL,
        stored BOOLEAN NOT NULL,
        generated BOOLEAN NOT NULL,
        mime_type VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE INDEX ix_data_files_generated ON data_files (generated)
    """,
    """
    CREATE INDEX ix_data_files_mime_type ON data_files (mime_type)
    """,
    """
    CREATE TABLE input_data_files (
        file_id VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(file_id) REFERENCES data_files (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE INDEX ix_input_data_files_file_id ON input_data_files (file_id)
    """,
    """
    CREATE INDEX ix_input_data_files_run_id ON input_data_files (run_id)
    """,
    """
    CREATE TABLE output_data_files (
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        prev_command_id VARCHAR NOT NULL,
        file_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_output_data_files_run_id ON output_data_files (run_id)
    """,
    """
    CREATE INDEX ix_output_data_files_file_id ON output_data_files (file_id)
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting_extended (
        "key" VARCHAR(28) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE camera_capture_image_settings (
        camera_id VARCHAR NOT NULL,
        resolution_x INTEGER,
        resolution_y INTEGER,
        zoom FLOAT,
        pan_x INTEGER,
        pan_y INTEGER,
        contrast FLOAT,
        brightness FLOAT,
        saturation FLOAT,
        PRIMARY KEY (camera_id)
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]

EXPECTED_STATEMENTS_V14 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        input_file_ids VARCHAR,
        output_file_ids VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        path VARCHAR NOT NULL,
        stored BOOLEAN NOT NULL,
        generated BOOLEAN NOT NULL,
        mime_type VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE INDEX ix_data_files_generated ON data_files (generated)
    """,
    """
    CREATE INDEX ix_data_files_mime_type ON data_files (mime_type)
    """,
    """
    CREATE TABLE input_data_files (
        file_id VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(file_id) REFERENCES data_files (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE INDEX ix_input_data_files_file_id ON input_data_files (file_id)
    """,
    """
    CREATE INDEX ix_input_data_files_run_id ON input_data_files (run_id)
    """,
    """
    CREATE TABLE output_data_files (
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        prev_command_id VARCHAR NOT NULL,
        file_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_output_data_files_run_id ON output_data_files (run_id)
    """,
    """
    CREATE INDEX ix_output_data_files_file_id ON output_data_files (file_id)
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting_extended (
        "key" VARCHAR(28) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE camera_capture_image_settings (
        camera_id VARCHAR NOT NULL,
        resolution_x INTEGER,
        resolution_y INTEGER,
        zoom FLOAT,
        pan_x INTEGER,
        pan_y INTEGER,
        contrast FLOAT,
        brightness FLOAT,
        saturation FLOAT,
        PRIMARY KEY (camera_id)
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]

EXPECTED_STATEMENTS_V13 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        input_file_ids VARCHAR,
        output_file_ids VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        path VARCHAR NOT NULL,
        stored BOOLEAN NOT NULL,
        generated BOOLEAN NOT NULL,
        mime_type VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE INDEX ix_data_files_generated ON data_files (generated)
    """,
    """
    CREATE INDEX ix_data_files_mime_type ON data_files (mime_type)
    """,
    """
    CREATE TABLE input_data_files (
        file_id VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(file_id) REFERENCES data_files (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE INDEX ix_input_data_files_file_id ON input_data_files (file_id)
    """,
    """
    CREATE INDEX ix_input_data_files_run_id ON input_data_files (run_id)
    """,
    """
    CREATE TABLE output_data_files (
        run_id VARCHAR NOT NULL,
        command_id VARCHAR NOT NULL,
        prev_command_id VARCHAR NOT NULL,
        file_id VARCHAR NOT NULL,
        PRIMARY KEY (file_id, run_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_output_data_files_run_id ON output_data_files (run_id)
    """,
    """
    CREATE INDEX ix_output_data_files_file_id ON output_data_files (file_id)
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting_extended (
        "key" VARCHAR(28) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]

EXPECTED_STATEMENTS_V11 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        source VARCHAR(9),
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting (
        "key" VARCHAR(21) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key"),
        CONSTRAINT booleansettingkey CHECK ("key" IN ('enable_error_recovery'))
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix__labware_offset_with_sequence__active__row_id ON labware_offset_with_sequence (active, row_id)
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]


EXPECTED_STATEMENTS_V10 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        source VARCHAR(9),
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting (
        "key" VARCHAR(21) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key"),
        CONSTRAINT booleansettingkey CHECK ("key" IN ('enable_error_recovery'))
    )
    """,
    """
    CREATE TABLE labware_offset_with_sequence (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_with_sequence_offset_id ON labware_offset_with_sequence (offset_id)
    """,
    """
    CREATE TABLE labware_offset_sequence_components (
       row_id INTEGER NOT NULL,
       offset_id INTEGER NOT NULL,
       sequence_ordinal INTEGER NOT NULL,
       component_kind VARCHAR NOT NULL,
       primary_component_value VARCHAR NOT NULL,
       component_value_json VARCHAR NOT NULL,
       PRIMARY KEY (row_id),
       FOREIGN KEY(offset_id) REFERENCES labware_offset_with_sequence (row_id)
    )
    """,
    """
    CREATE INDEX ix_labware_offset_sequence_components_offset_id ON labware_offset_sequence_components (offset_id)
    """,
]


EXPECTED_STATEMENTS_V9 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        source VARCHAR(9),
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting (
        "key" VARCHAR(21) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key"),
        CONSTRAINT booleansettingkey CHECK ("key" IN ('enable_error_recovery'))
    )
    """,
    """
    CREATE TABLE labware_offset (
        row_id INTEGER NOT NULL,
        offset_id VARCHAR NOT NULL,
        definition_uri VARCHAR NOT NULL,
        location_slot_name VARCHAR NOT NULL,
        location_module_model VARCHAR,
        location_definition_uri VARCHAR,
        vector_x FLOAT NOT NULL,
        vector_y FLOAT NOT NULL,
        vector_z FLOAT NOT NULL,
        active BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (row_id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_labware_offset_offset_id ON labware_offset (offset_id)
    """,
]


EXPECTED_STATEMENTS_V8 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        command_error VARCHAR,
        command_status VARCHAR(9),
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_status_index_in_run ON run_command (run_id, command_status, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        source VARCHAR(9),
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting (
        "key" VARCHAR(21) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key"),
        CONSTRAINT booleansettingkey CHECK ("key" IN ('enable_error_recovery'))
    )
    """,
]


EXPECTED_STATEMENTS_V7 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        command_intent VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        source VARCHAR(9),
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE TABLE boolean_setting (
        "key" VARCHAR(21) NOT NULL,
        value BOOLEAN NOT NULL,
        PRIMARY KEY ("key"),
        CONSTRAINT booleansettingkey CHECK ("key" IN ('enable_error_recovery'))
    )
    """,
]


EXPECTED_STATEMENTS_V6 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR(14) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT protocolkindsqlenum CHECK (protocol_kind IN ('standard', 'quick-transfer'))
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE analysis_primitive_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        parameter_type VARCHAR(5) NOT NULL,
        parameter_value VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        CONSTRAINT primitiveparamsqlenum CHECK (parameter_type IN ('int', 'float', 'bool', 'str'))
    )
    """,
    """
    CREATE TABLE analysis_csv_rtp_table (
        row_id INTEGER NOT NULL,
        analysis_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(analysis_id) REFERENCES analysis (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE INDEX ix_protocol_protocol_kind ON protocol (protocol_kind)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE run_csv_rtp_table (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        parameter_variable_name VARCHAR NOT NULL,
        file_id VARCHAR,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id),
        FOREIGN KEY(file_id) REFERENCES data_files (id)
    )
    """,
]


EXPECTED_STATEMENTS_V5 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        protocol_kind VARCHAR,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        run_time_parameter_values_and_defaults VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
    """
    CREATE TABLE data_files (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        file_hash VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
]


EXPECTED_STATEMENTS_V4 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        run_time_parameter_values_and_defaults VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        run_time_parameters VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
]


EXPECTED_STATEMENTS_V3 = [
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary VARCHAR,
        engine_status VARCHAR,
        _updated_at DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE TABLE run_command (
        row_id INTEGER NOT NULL,
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command VARCHAR NOT NULL,
        PRIMARY KEY (row_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_command_id ON run_command (run_id, command_id)
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
]


EXPECTED_STATEMENTS_V2 = [
    """
    CREATE TABLE migration (
        id INTEGER NOT NULL,
        created_at DATETIME NOT NULL,
        version INTEGER NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE protocol (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_key VARCHAR,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE analysis (
        id VARCHAR NOT NULL,
        protocol_id VARCHAR NOT NULL,
        analyzer_version VARCHAR NOT NULL,
        completed_analysis BLOB NOT NULL,
        completed_analysis_as_document VARCHAR,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE INDEX ix_analysis_protocol_id ON analysis (protocol_id)
    """,
    """
    CREATE TABLE run (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        protocol_id VARCHAR,
        state_summary BLOB,
        commands BLOB,
        engine_status VARCHAR,
        _updated_at DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(protocol_id) REFERENCES protocol (id)
    )
    """,
    """
    CREATE TABLE action (
        id VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        action_type VARCHAR NOT NULL,
        run_id VARCHAR NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
]


@pytest.mark.parametrize(
    ("metadata", "expected_statements"),
    [
        pytest.param(latest_metadata, EXPECTED_STATEMENTS_LATEST, id="latest"),
        pytest.param(schema_20.metadata, EXPECTED_STATEMENTS_V20, id="v20"),
        pytest.param(schema_19.metadata, EXPECTED_STATEMENTS_V19, id="v19"),
        pytest.param(schema_18.metadata, EXPECTED_STATEMENTS_V18, id="v18"),
        pytest.param(
            schema_16.metadata,
            EXPECTED_STATEMENTS_V17,
            id="v17",
        ),  # schema 17 = schema 16 with file permissions
        pytest.param(schema_16.metadata, EXPECTED_STATEMENTS_V16, id="v16"),
        pytest.param(schema_15.metadata, EXPECTED_STATEMENTS_V15, id="v15"),
        pytest.param(schema_14.metadata, EXPECTED_STATEMENTS_V14, id="v14"),
        pytest.param(schema_13.metadata, EXPECTED_STATEMENTS_V13, id="v13"),
        pytest.param(schema_11.metadata, EXPECTED_STATEMENTS_V11, id="v11"),
        pytest.param(schema_10.metadata, EXPECTED_STATEMENTS_V10, id="v10"),
        pytest.param(schema_09.metadata, EXPECTED_STATEMENTS_V9, id="v9"),
        pytest.param(schema_08.metadata, EXPECTED_STATEMENTS_V8, id="v8"),
        pytest.param(schema_07.metadata, EXPECTED_STATEMENTS_V7, id="v7"),
        pytest.param(schema_06.metadata, EXPECTED_STATEMENTS_V6, id="v6"),
        pytest.param(schema_05.metadata, EXPECTED_STATEMENTS_V5, id="v5"),
        pytest.param(schema_04.metadata, EXPECTED_STATEMENTS_V4, id="v4"),
        pytest.param(schema_03.metadata, EXPECTED_STATEMENTS_V3, id="v3"),
        pytest.param(schema_02.metadata, EXPECTED_STATEMENTS_V2, id="v2"),
    ],
)
def test_creating_from_metadata_emits_expected_statements(
    metadata: sqlalchemy.MetaData, expected_statements: list[str], tmp_path: Path
) -> None:
    """Test that each schema compiles down to the expected SQL statements.

    This is a snapshot test to help catch accidental changes to our SQL schema.
    For example, we might refactor the way we define the schema on the Python side,
    but we probably expect the way that it compiles down to SQL to stay stable.

    Based on:
    https://docs.sqlalchemy.org/en/14/faq/metadata_schema.html#faq-ddl-as-string
    """
    with (
        sql_engine_ctx(tmp_path / "test.db") as sql_engine,
        sql_engine.begin() as transaction,
    ):
        metadata.create_all(transaction)
        actual_statements = _get_schema(transaction)

    normalized_actual = [_normalize_statement(s) for s in actual_statements]
    normalized_expected = [_normalize_statement(s) for s in expected_statements]

    # Compare ignoring order. SQLAlchemy appears to emit CREATE INDEX statements in a
    # nondeterministic order that varies across runs. Although statement order
    # theoretically matters, it's unlikely to matter in practice for our purposes here.
    assert set(normalized_actual) == set(normalized_expected)


def test_migrated_db_matches_db_created_from_metadata(tmp_path: Path) -> None:
    """Test that the output of migration matches `metadata.create_all()`.

    In other words, constructing the database by going through our migration system
    should have the same final result as if we created the database directly from
    the latest schema version.

    This prevents migrations from sneaking in arbitrary changes and causing the actual
    database to not exactly match what our SQLAlchemy `metadata` object declares.
    """
    migration_orchestrator = make_migration_orchestrator(prepared_root=tmp_path)
    active_subdirectory = migration_orchestrator.migrate_to_latest()

    expected_statements = EXPECTED_STATEMENTS_LATEST

    with (
        sql_engine_ctx(active_subdirectory / DB_FILE) as sql_engine,
        sql_engine.begin() as transaction,
    ):
        actual_statements = _get_schema(transaction)

    normalized_actual = [_normalize_statement(s) for s in actual_statements]
    normalized_expected = [_normalize_statement(s) for s in expected_statements]

    # Compare ignoring order. SQLAlchemy appears to emit CREATE INDEX statements in a
    # nondeterministic order that varies across runs. Although statement order
    # theoretically matters, it's unlikely to matter in practice for our purposes here.
    assert set(normalized_actual) == set(normalized_expected)


def _get_schema(connection: sqlalchemy.engine.Connection) -> list[str]:
    """Return the schema of the given SQLite database.

    The schema is returned in the form of DDL statements
    (like `CREATE TABLE ...`, etc.).
    """
    return (
        connection.execute(
            sqlalchemy.text("SELECT sql FROM sqlite_schema WHERE sql IS NOT NULL")
        )
        .scalars()
        .all()
    )


def _normalize_statement(statement: str) -> str:
    """Fix up the internal formatting of a single SQL statement for easier comparison.

    For example, when we ask SQLite for its schema, it appears
    inconsistent in whether it uses spaces or line breaks to separate tokens.
    It may have to do with whether `ALTER TABLE` has been used on the table.
    """
    # Replace runs of any whitespace with a single literal space.
    statement = re.sub(r"\s+", " ", statement)
    # Remove whitespace at the beginning and end of the statement.
    statement = statement.strip()
    return statement
