import jwt
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass


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
    return jwt.encode(payload=claims, key=signing_key, algorithm="HS512")
