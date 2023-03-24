import pytest
from typing import List

from system_server.connection import AuthorizationTracker
from system_server.jwt import Registrant
from datetime import datetime, timedelta


@pytest.fixture
def registrant_list() -> List[Registrant]:
    return [Registrant(f"sub{n}", f"agent{n}", f"agent_id{n}") for n in range(100)]


async def test_authorization_tracking_counting() -> None:
    subject = AuthorizationTracker()

    reg1 = Registrant("a", "b", "c")
    future_exp = datetime.now() + timedelta(days=10)
    assert subject.active_connections() == 0

    # Adding one auth
    subject.add_connection(reg1, future_exp)
    assert subject.active_connections() == 1

    # Adding an auth that is already expired
    reg2 = Registrant("aaa", "bbb", "ccc")
    past_exp = datetime.now() - timedelta(days=10)
    subject.add_connection(reg2, past_exp)
    assert subject.active_connections() == 1

    # Adding a second, non-expired auth
    subject.add_connection(reg2, future_exp)
    assert subject.active_connections() == 2

    # Adding an auth that already exists
    subject.add_connection(reg1, future_exp)
    assert subject.active_connections() == 2

    # Overwriting an auth that exists with an expired date
    subject.add_connection(reg1, past_exp)
    assert subject.active_connections() == 1


async def test_authorization_tracking_getter(registrant_list: List[Registrant]) -> None:
    subject = AuthorizationTracker()
    # Generate a list of registrants
    expiration = datetime.now() + timedelta(days=100)

    for r in registrant_list:
        subject.add_connection(r, expiration)

    assert subject.active_connections() == len(registrant_list)

    check = subject.get_connected()

    for r in registrant_list:
        assert check.count(r) == 1


async def test_authorization_tracking_overwrite(
    registrant_list: List[Registrant],
) -> None:
    subject = AuthorizationTracker()
    # Generate a list of registrants
    expiration_short = datetime.now() + timedelta(days=1)

    for r in registrant_list:
        subject.add_connection(r, expiration_short)

    expiration_long = datetime.now() + timedelta(days=10)
    for r in registrant_list:
        subject.add_connection(r, expiration_long)

    check = subject.get_connected()
    for r in registrant_list:
        assert check.count(r) == 1
