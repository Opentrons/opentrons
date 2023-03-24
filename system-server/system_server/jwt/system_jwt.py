"""Interface for interacting with JWT's."""
import jwt
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from typing import Optional

_log = logging.getLogger(__name__)

_JWT_ALGORITHM = "HS512"


@dataclass
class Registrant:
    """Uniquely identifies a registered agent.

    The tuple of (subject,agent,agent_id) provides a unique identification
    of a registered agent.
    """

    subject: str
    agent: str
    agent_id: str


def registrant_from_jwt(token: str, signing_key: str) -> Registrant:
    """Decode a registrant from a JWT."""
    decoded = jwt.decode(
        jwt=token,
        key=signing_key,
        algorithms=[_JWT_ALGORITHM],
        options={"verify_aud": False},
    )
    return Registrant(
        subject=decoded["sub"],
        agent=decoded["ot_agent"],
        agent_id=decoded["ot_aid"],
    )


def expiration_from_jwt(token: str, signing_key: str) -> datetime:
    """Decode the expiration time from a JWT."""
    decoded = jwt.decode(
        jwt=token,
        key=signing_key,
        algorithms=[_JWT_ALGORITHM],
        options={"verify_aud": False},
    )
    exp = decoded["exp"]
    return datetime.fromtimestamp(int(exp))


def create_jwt(
    signing_key: str,
    duration: timedelta,
    registrant: Registrant,
    audience: str,
    now: Optional[datetime] = None,
    id: Optional[str] = None,
) -> str:
    """Generate a signed JWT with the specified parameters.

    Args:
        signing_key: A string key to encode the JWT, which must be used to decode the key.

        duration: The amount of time to mark this JWT as valid for

        registrant: Unique identification of the registrant that this JWT is for

        audience: The audience (or resources) that this JWT provides access to

        now: The time to use as the `iat` (issued at) claim. If `None`, the current time is used.

        id: If provided, this should be a unique-ish ID for this token instance

    Returns:
        An encoded JWT
    """
    if now is None:
        now = datetime.now(tz=timezone.utc)
    claims = {
        "iat": now,
        "exp": now + duration,
        "sub": registrant.subject,
        "ot_agent": registrant.agent,
        "ot_aid": registrant.agent_id,
        "aud": audience,
    }
    if id is not None:
        claims["jti"] = id
    return jwt.encode(payload=claims, key=signing_key, algorithm=_JWT_ALGORITHM)


def jwt_is_valid(signing_key: str, token: str, audience: str) -> bool:
    """Check the validity of a JWT.

    Validity refers to a few components of a JWT:

    - The token must be signed with the expected `signing_key`

    - The token must not be expired

    - The token must have the expected audience claim

    If any of the above conditions are not met, the token is not valid for accessing
    the resource that maps to `audience`.

    Args:
        signing_key: The string key that was used to sign this token

        token: The token, as an encoded string

        audience: The intended audience of this token, which refers to the group
        of resources the token is intended to give access to

    Returns:
        True if the token is valid, False if it is not.
    """
    try:
        jwt.decode(
            jwt=token, key=signing_key, algorithms=[_JWT_ALGORITHM], audience=audience
        )
    except jwt.exceptions.InvalidTokenError as e:
        _log.info(f"Invalid JWT: {e}")
        return False
    return True
