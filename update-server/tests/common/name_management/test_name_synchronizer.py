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


async def test_advertises_name(
    mock_get_pretty_hostname: Callable[[], str],
    monkeypatch_get_pretty_hostname: None,
    mock_persist_pretty_hostname: Callable[[str], str],
    monkeypatch_persist_pretty_hostname: None,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    decoy.when(mock_get_pretty_hostname()).then_return("initial name")
    decoy.when(
        mock_avahi_client.collision_callback(matchers.Anything())
    ).then_enter_with(
        # https://github.com/mcous/decoy/issues/135
        "<value unused>"
    )

    async with RealNameSynchronizer.build(avahi_client=mock_avahi_client) as subject:
        decoy.verify(await mock_avahi_client.start_advertising("initial name"))


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


async def test_set(
    mock_get_pretty_hostname: Callable[[], str],
    monkeypatch_get_pretty_hostname: None,
    mock_persist_pretty_hostname: Callable[[str], str],
    monkeypatch_persist_pretty_hostname: None,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    """It should set the new name as the Avahi service name and then as the pretty
    hostname.
    """
    decoy.when(mock_get_pretty_hostname()).then_return("initial name")
    decoy.when(
        mock_avahi_client.collision_callback(matchers.Anything())
    ).then_enter_with(
        # https://github.com/mcous/decoy/issues/135
        "<value unused>"
    )

    async with RealNameSynchronizer.build(avahi_client=mock_avahi_client) as subject:
        await subject.set_name("new name")

    decoy.verify(
        await mock_avahi_client.start_advertising("new name"),
        await mock_persist_pretty_hostname("new name"),
    )


async def test_set_does_not_persist_invalid_avahi_service_name(
    mock_get_pretty_hostname: Callable[[], str],
    monkeypatch_get_pretty_hostname: None,
    mock_persist_pretty_hostname: Callable[[str], str],
    monkeypatch_persist_pretty_hostname: None,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    """It should not persist any name that's not valid as an Avahi service name.

    Covers this bug:
    https://github.com/Opentrons/opentrons/issues/9960
    """

    decoy.when(mock_get_pretty_hostname()).then_return("initial name, no danger")
    decoy.when(
        mock_avahi_client.collision_callback(matchers.Anything())
    ).then_enter_with(
        # https://github.com/mcous/decoy/issues/135
        "<value unused>"
    )

    decoy.when(
        await mock_avahi_client.start_advertising("danger!")
    ).then_raise(Exception("oh the humanity"))

    async with RealNameSynchronizer.build(avahi_client=mock_avahi_client) as subject:
        with pytest.raises(Exception, match="oh the humanity"):
            await subject.set_name("danger!")

    decoy.verify(
        await mock_persist_pretty_hostname(matchers.Anything()),
        times=0
    )


async def test_get(
    mock_get_pretty_hostname: Callable[[], str],
    monkeypatch_get_pretty_hostname: None,
    mock_persist_pretty_hostname: Callable[[str], str],
    monkeypatch_persist_pretty_hostname: None,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    decoy.when(mock_get_pretty_hostname()).then_return("initial name, no danger")
    decoy.when(
        mock_avahi_client.collision_callback(matchers.Anything())
    ).then_enter_with(
        # https://github.com/mcous/decoy/issues/135
        "<value unused>"
    )

    decoy.when(mock_get_pretty_hostname()).then_return("the current name")

    async with RealNameSynchronizer.build(avahi_client=mock_avahi_client) as subject:
        assert subject.get_name() == "the current name"
