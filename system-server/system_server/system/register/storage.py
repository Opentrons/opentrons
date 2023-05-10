"""Functionality to interface with the registration table."""
import sqlalchemy
from typing import Optional, Dict, Tuple
from datetime import timedelta
import logging

from system_server.persistence import registration_table
from system_server.jwt import Registrant, create_jwt, jwt_is_valid
from system_server.constants import REGISTRATION_AUDIENCE, REGISTRATION_DURATION_DAYS

_log = logging.getLogger(__name__)


def _create_registration_row(registrant: Registrant, token: str) -> Dict[str, object]:
    """Helper to serialize into a sql row."""
    return {
        "agent": registrant.agent,
        "agent_id": registrant.agent_id,
        "subject": registrant.subject,
        "token": token,
    }


def _get_registration_token(
    sql_connection: sqlalchemy.engine.Connection, registrant: Registrant
) -> Optional[str]:
    """Get the JWT for a registrant, if it exists.

    This function searches the database to check if a token exists for
    the requested registrant. If it exists, return the encoded token without
    verifying anything.

    Args:
        sql_connection: An active transaction connection to the database

        registrant: Unique identification of the registration to look up

    Returns:
         None or an encoded JWT for this row
    """
    statement = sqlalchemy.select(registration_table).where(
        (registration_table.c.agent == registrant.agent)
        & (registration_table.c.agent_id == registrant.agent_id)
        & (registration_table.c.subject == registrant.subject)
    )

    # Database configuration means that we are assured to only get 1 or 0 hits.
    matching_row = sql_connection.execute(statement).one_or_none()

    return None if matching_row is None else matching_row.token


def _delete_registration_token(
    sql_connection: sqlalchemy.engine.Connection, registrant: Registrant
) -> None:
    """Clear out a registration token, if a match exists.

    Args:
        sql_connection: An active transaction connection to the database

        registrant: Unique identification of the registration to delete

    Returns:
        None
    """
    statement = sqlalchemy.delete(registration_table).where(
        (registration_table.c.agent == registrant.agent)
        & (registration_table.c.agent_id == registrant.agent_id)
        & (registration_table.c.subject == registrant.subject)
    )
    sql_connection.execute(statement)


def _add_registration_token(
    sql_connection: sqlalchemy.engine.Connection, registrant: Registrant, token: str
) -> None:
    """Add a registration entry to the database.

    Args:
        sql_connection: An active transaction connection to the database

        registrant: Unique identification of the registration to store

        token: The registration token to store

    Returns:
        None
    """
    statement = sqlalchemy.insert(registration_table).values(
        _create_registration_row(registrant, token)
    )
    sql_connection.execute(statement)


def get_or_create_registration_token(
    sql_engine: sqlalchemy.engine.Engine, registrant: Registrant, signing_key: str
) -> Tuple[str, bool]:
    """Get the token for a registrant, or create a new one if necessary.

    If a token is found in the database, this function performs validation on it. If
    the token is not valid, it is discarded and replaced with a fresh JWT for this
    registrant. If no token is found, a new one is created as well.

    NOTE that in the future, adding a new token will require user assent in some form.

    Args:
        sql_engine: Connection to the backing database

        registrant: Unique identification of the registration to store

        signing_key: A string key (generally a UUID) to encode & decode the JWT

    Returns:
        The JWT, and a boolean that is True if the JWT is newly created or False if
        it is a cached value.
    """
    with sql_engine.connect() as conn:
        token = _get_registration_token(conn, registrant)
        token_is_new = False

        if token is not None:
            if not jwt_is_valid(
                signing_key=signing_key, token=token, audience=REGISTRATION_AUDIENCE
            ):
                _delete_registration_token(conn, registrant)
                token = None

        if token is None:
            _log.debug(f"Creating new registration for {registrant}")
            token = create_jwt(
                signing_key=signing_key,
                duration=timedelta(days=REGISTRATION_DURATION_DAYS),
                registrant=registrant,
                audience=REGISTRATION_AUDIENCE,
            )
            _log.debug(f"Created new JWT: {token}")
            _add_registration_token(conn, registrant, token)
            token_is_new = True

    return (token, token_is_new)
