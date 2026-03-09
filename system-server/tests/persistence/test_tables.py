"""Tests for SQL registration table."""

from typing import List, cast
import sqlalchemy
from system_server.persistence.tables import add_tables_to_db

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
EXPECTED_STATEMENTS = [
    """
    CREATE TABLE registration (
        id INTEGER NOT NULL,
        subject VARCHAR,
        agent VARCHAR,
        agent_id VARCHAR,
        token VARCHAR,
        schema_version INTEGER DEFAULT \'0\' NOT NULL,
        PRIMARY KEY (id),
        UNIQUE (subject, agent, agent_id)
    )
    """,
    """
    CREATE TABLE migration (
        id INTEGER NOT NULL,
        created_at DATETIME NOT NULL,
        version INTEGER NOT NULL,
        PRIMARY KEY (id)
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


def test_creating_tables_emits_expected_statements() -> None:
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
    add_tables_to_db(cast(sqlalchemy.engine.Engine, engine))

    normalized_actual = [_normalize_statement(s) for s in actual_statements]
    normalized_expected = [_normalize_statement(s) for s in EXPECTED_STATEMENTS]

    assert normalized_actual == normalized_expected
