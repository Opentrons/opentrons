import asyncio
from contextlib import asynccontextmanager
from typing import Callable

import pytest
from decoy import Decoy, matchers

from otupdate.common.name_management import name_synchronizer
from otupdate.common.name_management.name_synchronizer import RealNameSynchronizer
from otupdate.common.name_management.avahi import AvahiClient
from otupdate.common.name_management.pretty_hostname import (
    get_pretty_hostname as real_get_pretty_hostname,
    persist_pretty_hostname as real_persist_pretty_hostname,
)


@pytest.fixture
def mock_get_pretty_hostname(decoy: Decoy):
    return decoy.mock(func=real_get_pretty_hostname)


@pytest.fixture
def monkeypatch_get_pretty_hostname(monkeypatch, mock_get_pretty_hostname):
    monkeypatch.setattr(
        name_synchronizer, "get_pretty_hostname", mock_get_pretty_hostname
    )


@pytest.fixture
def mock_persist_pretty_hostname(decoy: Decoy):
    return decoy.mock(func=real_persist_pretty_hostname)


@pytest.fixture
def monkeypatch_persist_pretty_hostname(monkeypatch, mock_persist_pretty_hostname):
    monkeypatch.setattr(
        name_synchronizer, "persist_pretty_hostname", mock_persist_pretty_hostname
    )


@pytest.fixture
def mock_avahi_client(decoy: Decoy) -> AvahiClient:
    return decoy.mock(cls=AvahiClient)


def test_build_and_startup() -> None:
    # It should start advertising with the current pretty hostname
    # as the Avahi service name.
    raise NotImplementedError()
    # decoy.verify(await mock_avahi_client.start_advertising("initial name"))


async def test_collision_handling(
    mock_get_pretty_hostname: Callable[[], str],
    monkeypatch_get_pretty_hostname: None,
    mock_persist_pretty_hostname: Callable[[str], str],
    monkeypatch_persist_pretty_hostname: None,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    """It should resolve naming collisions reported by the AvahiClient.

    When notified of a collision, it should:

    1. Get a new service name.
    2. Start advertising with it.
    3. Persist it as the pretty hostname.
    """
    decoy.when(mock_get_pretty_hostname()).then_return("initial name")
    decoy.when(
        await mock_avahi_client.alternative_service_name("initial name")
    ).then_return("alternative name")

    # Expect the subject to do:
    #
    #     with avahi_client.collsion_callback(some_callback_func):
    #         ...
    #
    # When it does, save the function that it provided as `some_callback_func`
    # into `collision_callback_captor.value`.
    collision_callback_captor = matchers.Captor()
    decoy.when(
        mock_avahi_client.collision_callback(collision_callback_captor)
    ).then_enter_with(
        # https://github.com/mcous/decoy/issues/135
        "<value unused>"
    )

    async with RealNameSynchronizer.build(avahi_client=mock_avahi_client):
        captured_collision_callback = collision_callback_captor.value
        # Prompt the subject to run its collision-handling logic.
        await captured_collision_callback()
        # Exit this context manager to wait for the subject to wrap up cleanly,
        # ensuring its collision handling has run to completion before we assert stuff.

    decoy.verify(
        # Asserting this exact order is one way to make sure the subject avoids
        # persisting invalid names that can't be advertised.
        # https://github.com/Opentrons/opentrons/issues/9960.
        await mock_avahi_client.start_advertising("alternative name"),
        await mock_persist_pretty_hostname("alternative name"),
    )


def test_set() -> None:
    # Test when given a name that Avahi doesn't like.
    raise NotImplementedError()


def test_get() -> None:
    raise NotImplementedError()
