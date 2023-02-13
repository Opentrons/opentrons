from system_server.jwt import Registrant, create_jwt, jwt_is_valid
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


async def test_check_jwt_validity() -> None:
    """Test the function for checking JWT validity."""
    TEST_KEY = "this is a test key to test having a key"
    valid_token = jwt.encode(
        payload={"exp": datetime.now() + timedelta(days=100), "aud": "fake_audience"},
        key=TEST_KEY,
        algorithm="HS512",
    )

    assert jwt_is_valid(TEST_KEY, valid_token, "fake_audience")
    # Wrong audience
    assert not jwt_is_valid(TEST_KEY, valid_token, "different_audience")
    # Wrong key
    assert not jwt_is_valid(TEST_KEY + "more text", valid_token, "fake_audience")

    # Create an expired key
    invalid_token = jwt.encode(
        payload={"exp": datetime.now() - timedelta(days=100), "aud": "fake_audience"},
        key=TEST_KEY,
        algorithm="HS512",
    )

    assert not jwt_is_valid(TEST_KEY, invalid_token, "fake_audience")


async def test_checking_created_jwt() -> None:
    """Test both creating & checking the same JWT."""
    TEST_KEY = "the key for this test is this key"
    TEST_AUDIENCE = "peanut gallery"
    reg = Registrant(subject="abc", agent="def", agent_id="hij")

    token = create_jwt(TEST_KEY, timedelta(days=1), reg, TEST_AUDIENCE)
    assert jwt_is_valid(TEST_KEY, token, TEST_AUDIENCE)
