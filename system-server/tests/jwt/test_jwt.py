from system_server.jwt import Registrant, create_jwt
from uuid import uuid4
from datetime import datetime, timedelta, timezone

import jwt


async def test_create_good_jwt() -> None:
    """Tests creating a valid JWT."""
    reg = Registrant(subject="s u b j e c t !", agent="bond", agent_id="007")
    key = str(uuid4())
    now = datetime.now(tz=timezone.utc)
    # Nice long duration to ensure the token doesn't expire during our test.
    duration = timedelta(days=10, seconds=100)

    audience = "com.opentrons.fake.audience.for.test"

    token = create_jwt(
        signing_key=key,
        duration=duration,
        registrant=reg,
        audience=audience,
        now=now,
    )

    decoded = jwt.decode(jwt=token, key=key, algorithms=["HS512"], audience=audience)

    assert decoded["iat"] == int(now.timestamp())
    assert decoded["exp"] == int((now + duration).timestamp())
    assert decoded["sub"] == reg.subject
    assert decoded["ot_agent"] == reg.agent
    assert decoded["ot_aid"] == reg.agent_id
    assert decoded["aud"] == audience
