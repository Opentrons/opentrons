"""This module keeps track of current authorization."""

import logging
import uuid
from datetime import timedelta

from system_server.constants import AUTHORIZATION_AUDIENCE
from system_server.jwt import create_jwt, registrant_from_jwt

_log = logging.getLogger(__name__)

AUTHORIZATION_DURATION = timedelta(hours=2)


def authorize_token(
    registration_token: str,
    signing_key: str,
) -> str:
    """Accepts a registration JWT and generates an authorization JWT.

    This function assumes that the token has already been validated by a header authenticator.
    """
    _log.debug(f"Creating authorization token from registration {registration_token}")
    registrant = registrant_from_jwt(token=registration_token, signing_key=signing_key)
    token_id = str(uuid.uuid4())
    return create_jwt(
        signing_key=signing_key,
        duration=AUTHORIZATION_DURATION,
        registrant=registrant,
        audience=AUTHORIZATION_AUDIENCE,
        id=token_id,
    )
