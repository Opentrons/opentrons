"""Functionality to interface with the registration table."""
import sqlalchemy
from typing import Optional, Dict

from system_server.persistence import registration_table
from system_server.jwt import Registrant


def _create_registration_row(registrant: Registrant, token: str) -> Dict[str, object]:
    """Helper to serialize into a sql row."""
    return {
        "agent": registrant.agent,
        "agent_id": registrant.agent_id,
        "subject": registrant.subject,
        "token": token,
    }


async def get_registration_token(
    sql_engine: sqlalchemy.engine.Engine, registrant: Registrant
) -> Optional[str]:
    """Get the JWT for a registrant, if it exists.

    This function searches the database to check if a token exists for
    the requested agent. If it exists, return the encoded token without
    verifying anything.

    Args:
        sql_engine: Connection to the backing database

        registrant: Unique identification of the registration to look up

    Returns:
         None or an encoded JWT for this row
    """
    with sql_engine.begin() as conn:
        statement = sqlalchemy.select(registration_table).where(
            registration_table.c.agent == registrant.agent
            and registration_table.c.agent_id == registrant.agent_id
            and registration_table.c.subject == registrant.subject
        )

        # Database configuration means that we are assured to only get 1 or 0 hits.
        matching_row = conn.execute(statement).one_or_none()

        return None if matching_row is None else matching_row.token


async def delete_registration_token(
    sql_engine: sqlalchemy.engine.Engine, registrant: Registrant
) -> None:
    """Clear out a registration token, if a match exists."""
    with sql_engine.begin() as conn:
        statement = sqlalchemy.delete(registration_table).where(
            registration_table.c.agent == registrant.agent
            and registration_table.c.agent_id == registrant.agent_id
            and registration_table.c.subject == registrant.subject
        )
        conn.execute(statement)


async def add_registration_token(
    sql_engine: sqlalchemy.engine.Engine, registrant: Registrant, token: str
) -> None:
    """Add a registration entry to the database.

    Args:
        sql_engine: Connection to the backing database

        registrant: Unique identification of the registration to store

        token: The registration token to store

    Returns:
        None
    """
    with sql_engine.begin() as conn:
        statement = sqlalchemy.insert(registration_table).values(
            _create_registration_row(registrant, token)
        )
        conn.execute(statement)
