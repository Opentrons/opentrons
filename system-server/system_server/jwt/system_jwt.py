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


def create_jwt(
    signing_key: str,
    duration: timedelta,
    registrant: Registrant,
    audience: str,
    now: Optional[datetime] = None,
    id: Optional[str] = None,
) -> str:
    """Generate a signed JWT with the specified parameters."""
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
    try:
        return jwt.encode(payload=claims, key=signing_key, algorithm=_JWT_ALGORITHM)
    except Exception as e:
        _log.error(f"Error during JWT creation: {type(e)}:{e}")
        raise e


def jwt_is_valid(signing_key: str, token: str, audience: str) -> bool:
    """Check the validity of a JWT."""
    try:
        jwt.decode(
            jwt=token, key=signing_key, algorithms=[_JWT_ALGORITHM], audience=audience
        )
    except jwt.exceptions.InvalidTokenError as e:
        _log.info(f"Invalid JWT: {e}")
        return False
    return True
