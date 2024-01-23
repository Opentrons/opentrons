"""Tests for SQL tables."""


from typing import List, cast

import pytest
import sqlalchemy

from robot_server.persistence._tables import (
    metadata as latest_metadata,
    schema_3,
    schema_2,
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
EXPECTED_STATEMENTS_LATEST = [
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
        run_id VARCHAR NOT NULL,
        index_in_run INTEGER NOT NULL,
        command_id VARCHAR NOT NULL,
        command BLOB NOT NULL,
        PRIMARY KEY (run_id, command_id),
        FOREIGN KEY(run_id) REFERENCES run (id)
    )
    """,
    """
    CREATE UNIQUE INDEX ix_run_run_id_index_in_run ON run_command (run_id, index_in_run)
    """,
]


EXPECTED_STATEMENTS_V3 = EXPECTED_STATEMENTS_LATEST


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


def _normalize_statement(statement: str) -> str:
    """Fix up the formatting of a SQL statement for easier comparison."""
    lines = statement.splitlines()

    # Remove whitespace at the beginning and end of each line.
    lines = [line.strip() for line in lines]

    # Filter out blank lines.
    lines = [line for line in lines if line != ""]

    return "\n".join(lines)


@pytest.mark.parametrize(
    ("metadata", "expected_statements"),
    [
        (latest_metadata, EXPECTED_STATEMENTS_LATEST),
        (schema_3.metadata, EXPECTED_STATEMENTS_V3),
        (schema_2.metadata, EXPECTED_STATEMENTS_V2),
    ],
)
def test_creating_tables_emits_expected_statements(
    metadata: sqlalchemy.MetaData, expected_statements: List[str]
) -> None:
    """Test that fresh databases are created with with the expected statements.

    This is a snapshot test to help catch accidental changes to our SQL schema.

    Based on:
    https://docs.sqlalchemy.org/en/14/faq/metadata_schema.html#faq-ddl-as-string
    """
    actual_statements: List[str] = []

    def record_statement(
        sql: sqlalchemy.schema.DDLElement, *multiparams: object, **params: object
    ) -> None:
        compiled_statement = str(sql.compile(dialect=engine.dialect))
        actual_statements.append(compiled_statement)

    engine = sqlalchemy.create_mock_engine("sqlite://", record_statement)
    metadata.create_all(cast(sqlalchemy.engine.Engine, engine))

    normalized_actual = [_normalize_statement(s) for s in actual_statements]
    normalized_expected = [_normalize_statement(s) for s in expected_statements]

    assert normalized_actual == normalized_expected
