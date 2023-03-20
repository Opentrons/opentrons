"""This module keeps track of current authorization."""
from datetime import timedelta
import uuid
import jwt

from system_server.system.authorize.authorization import authorize_token
from system_server.jwt import create_jwt, Registrant, jwt_is_valid
from system_server.constants import AUTHORIZATION_AUDIENCE, REGISTRATION_AUDIENCE


async def test_authorize_token() -> None:
    TEST_KEY = str(uuid.uuid4())
    registrant = Registrant(subject="s", agent="abcdefghijklmnop", agent_id="123456789")

    # First create a registration
    reg = create_jwt(
        signing_key=TEST_KEY,
        duration=timedelta(days=1),
        registrant=registrant,
        audience=REGISTRATION_AUDIENCE,
    )

    auth = authorize_token(reg, TEST_KEY)

    assert jwt_is_valid(TEST_KEY, auth, AUTHORIZATION_AUDIENCE)

    # Decode and make sure there's an ID, and the registrant matches
    decoded = jwt.decode(
        auth, TEST_KEY, algorithms=["HS512"], audience=AUTHORIZATION_AUDIENCE
    )

    assert decoded["sub"] == registrant.subject
    assert decoded["ot_agent"] == registrant.agent
    assert decoded["ot_aid"] == registrant.agent_id
