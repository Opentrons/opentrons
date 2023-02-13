"""Interface for interacting with JWT's."""
import jwt
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass

_log = logging.getLogger(__name__)


@dataclass
class Registrant:
    """Uniquely identifies a registered agent.

    The tuple of (subject,agent,agent_id) provides a unique identification
    of a registered agent.
    """

    subject: str
    agent: str
    agent_id: str


def create_jwt(
    signing_key: str,
    duration: timedelta,
    registrant: Registrant,
    audience: str,
    now: datetime = datetime.now(tz=timezone.utc),
) -> str:
    """Generate a signed JWT with the specified parameters."""
    claims = {
        "iat": now,
        "exp": now + duration,
        "sub": registrant.subject,
        "ot_agent": registrant.agent,
        "ot_aid": registrant.agent_id,
        "aud": audience,
    }
    try:
        return jwt.encode(payload=claims, key=signing_key, algorithm="HS512")
    except Exception as e:
        _log.error(f"Error during JWT creation: {type(e)}:{e}")
        raise e


def jwt_is_valid(signing_key: str, token: str, audience: str) -> bool:
    """Check the validity of a JWT."""
    try:
        jwt.decode(jwt=token, key=signing_key, algorithms=["HS512"], audience=audience)
    except jwt.exceptions.InvalidTokenError as e:
        _log.info(f"Invalid JWT: {e}")
        return False
    return True
