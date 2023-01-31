"""SQLite table schemas."""
import sqlalchemy
from sqlalchemy import Column, VARCHAR, Integer, JSON

_metadata = sqlalchemy.MetaData()

"""
Column(
    
),
"""

registrations_table = sqlalchemy.Table(
    "registrations",
    _metadata,
    Column("registration_id", Integer, primary_key=True, nullable=False),
    Column("subject", VARCHAR(255)),
    Column("agent", VARCHAR(255)),
    Column("agent_id", VARCHAR(255)),
    Column("token", JSON),
    Column("schema_version", Integer, nullable=False, default=0),
    sqlalchemy.UniqueConstraint("subject", "agent", "agent_id"),
)


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back all data stores.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    _metadata.create_all(sql_engine)
