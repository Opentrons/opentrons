import asyncio
from typing import Any, AsyncGenerator

import pytest
from decoy import Decoy, matchers

from otupdate.common.name_management import avahi, pretty_hostname
from otupdate.common.name_management.name_synchronizer import (
    NameSynchronizer,
    InvalidNameError,
)


@pytest.fixture(autouse=True)
def monkeypatch_pretty_hostname_functions(decoy: Decoy, monkeypatch: Any) -> None:
    """Replace the functions of the pretty_hostname module with mocks."""
    mock_get_pretty_hostname = decoy.mock(func=pretty_hostname.get_pretty_hostname)
    mock_persist_pretty_hostname = decoy.mock(
        func=pretty_hostname.persist_pretty_hostname
    )
    mock_pretty_hostname_is_valid = decoy.mock(
        func=pretty_hostname.pretty_hostname_is_valid
    )
    monkeypatch.setattr(
        pretty_hostname, "get_pretty_hostname", mock_get_pretty_hostname
    )
    monkeypatch.setattr(
        pretty_hostname, "persist_pretty_hostname", mock_persist_pretty_hostname
    )
    monkeypatch.setattr(
        pretty_hostname, "pretty_hostname_is_valid", mock_pretty_hostname_is_valid
    )


@pytest.fixture(autouse=True)
def monkeypatch_avahi_functions(decoy: Decoy, monkeypatch: Any) -> None:
    """Replace the functions of the avahi module with mocks."""
    mock_alternative_service_name = decoy.mock(func=avahi.alternative_service_name)
    mock_service_name_is_valid = decoy.mock(func=avahi.service_name_is_valid)
    monkeypatch.setattr(
        avahi, "alternative_service_name", mock_alternative_service_name
    )
    monkeypatch.setattr(avahi, "service_name_is_valid", mock_service_name_is_valid)


@pytest.fixture
def mock_avahi_client(decoy: Decoy) -> avahi.AvahiClient:
    """Return a mock in the shape of an avahi.AvahiClient."""
    return decoy.mock(cls=avahi.AvahiClient)


@pytest.fixture
async def started_up_subject(
    mock_avahi_client: avahi.AvahiClient,
    decoy: Decoy,
    loop: asyncio.AbstractEventLoop,  # Required by aiohttp for async fixtures.
) -> AsyncGenerator[NameSynchronizer, None]:
    """Return a subject NameSynchronizer that's set up with mock dependencies,
    and that's already started up and running.

    Tests that need to operate in the subject's startup phase itself
    should build the subject manually instead of using this fixture.
    """
    # NameSynchronizer.start() will call mock_avahi_client.listen_for_collisions()
    # and expect to be able to enter its result as a context manager.
    decoy.when(
        mock_avahi_client.listen_for_collisions(matchers.Anything())
    ).then_enter_with(None)

    async with NameSynchronizer.start(avahi_client=mock_avahi_client) as subject:
        yield subject


async def test_set_valid_name(
    started_up_subject: NameSynchronizer,
    mock_avahi_client: avahi.AvahiClient,
    decoy: Decoy,
) -> None:
    """It should set the new name as the Avahi service name and then as the pretty
    hostname.
    """
    decoy.when(avahi.service_name_is_valid("new name")).then_return(True)
    decoy.when(pretty_hostname.pretty_hostname_is_valid("new name")).then_return(True)

    await started_up_subject.set_name("new name")

    decoy.verify(
        await mock_avahi_client.start_advertising("new name"),
        await pretty_hostname.persist_pretty_hostname("new name"),
    )


@pytest.mark.parametrize(
    ("valid_for_avahi", "valid_for_pretty_hostname"),
    [(False, False), (False, True), (True, False)],
)
async def test_set_invalid_name(
    started_up_subject: NameSynchronizer,
    mock_avahi_client: avahi.AvahiClient,
    decoy: Decoy,
    valid_for_avahi: bool,
    valid_for_pretty_hostname: bool,
) -> None:
    """It should set neither the Avahi service name nor the pretty hostname."""
    decoy.when(avahi.service_name_is_valid("new name")).then_return(valid_for_avahi)
    decoy.when(pretty_hostname.pretty_hostname_is_valid("new name")).then_return(
        valid_for_pretty_hostname
    )

    with pytest.raises(InvalidNameError):
        await started_up_subject.set_name("new name")

    decoy.verify(
        await mock_avahi_client.start_advertising(matchers.Anything()),
        times=0,
    )
    decoy.verify(
        await pretty_hostname.persist_pretty_hostname(matchers.Anything()),
        times=0,
    )


async def test_set_does_not_persist_rejected_avahi_service_name(
    started_up_subject: NameSynchronizer,
    mock_avahi_client: avahi.AvahiClient,
    decoy: Decoy,
) -> None:
    """It should not persist anything that Avahi rejects as a service name.

    Mitigates this bug:
    https://github.com/Opentrons/opentrons/issues/9960
    """
    decoy.when(avahi.service_name_is_valid("danger!")).then_return(True)
    decoy.when(pretty_hostname.pretty_hostname_is_valid("danger!")).then_return(True)

    decoy.when(await mock_avahi_client.start_advertising("danger!")).then_raise(
        Exception("oh the humanity")
    )

    with pytest.raises(Exception, match="oh the humanity"):
        await started_up_subject.set_name("danger!")

    decoy.verify(
        await pretty_hostname.persist_pretty_hostname(matchers.Anything()), times=0
    )


async def test_get(
    started_up_subject: NameSynchronizer,
    decoy: Decoy,
) -> None:
    decoy.when(await pretty_hostname.get_pretty_hostname()).then_return(
        "the current name"
    )
    assert await started_up_subject.get_name() == "the current name"


async def test_advertises_initial_name(
    started_up_subject: NameSynchronizer,
    mock_avahi_client: avahi.AvahiClient,
    decoy: Decoy,
) -> None:
    """It should immediately start advertising the existing pretty hostname
    as the Avahi service name, when it's started up.
    """

    decoy.when(await pretty_hostname.get_pretty_hostname()).then_return("initial name")
    mock_collision_subscription_context_manager = decoy.mock()
    decoy.when(
        mock_avahi_client.listen_for_collisions(matchers.Anything())
    ).then_return(mock_collision_subscription_context_manager)

    async with NameSynchronizer.start(avahi_client=mock_avahi_client):
        decoy.verify(
            # It should only start advertising after subscribing to collisions.
            await mock_collision_subscription_context_manager.__aenter__(),
            await mock_avahi_client.start_advertising("initial name"),
        )


async def test_collision_handling(
    mock_avahi_client: avahi.AvahiClient,
    decoy: Decoy,
) -> None:
    """It should resolve naming collisions reported by the avahi.AvahiClient.

    When notified of a collision, it should:

    1. Get a new service name.
    2. Start advertising with it.
    3. Persist it as the pretty hostname.
    """
    decoy.when(await pretty_hostname.get_pretty_hostname()).then_return("initial name")
    decoy.when(avahi.alternative_service_name("initial name")).then_return(
        "alternative name"
    )
    decoy.when(avahi.service_name_is_valid("alternative name")).then_return(True)
    decoy.when(
        pretty_hostname.pretty_hostname_is_valid("alternative name")
    ).then_return(True)

    # Expect the subject to do:
    #
    #     with avahi_client.listen_for_collisions(some_callback_func):
    #         ...
    #
    # When it does, save the function that it provided as `some_callback_func`
    # into `collision_callback_captor.value`.
    mock_listen_context_manager = decoy.mock()
    collision_callback_captor = matchers.Captor()
    decoy.when(
        mock_avahi_client.listen_for_collisions(collision_callback_captor)
    ).then_return(mock_listen_context_manager)

    async with NameSynchronizer.start(avahi_client=mock_avahi_client):
        captured_collision_callback = collision_callback_captor.value
        # Prompt the subject to run its collision-handling logic.
        await captured_collision_callback()
        # Exit this context manager to wait for the subject to wrap up cleanly,
        # ensuring its collision handling has run to completion before we assert stuff.

    decoy.verify(
        await mock_listen_context_manager.__aenter__(),
        await mock_avahi_client.start_advertising("initial name"),
        # The subject should only persist the alternative name *after*
        # the Avahi client accepts it for advertisement,
        # just in case the alternative name turns out to be invalid in some way.
        # https://github.com/Opentrons/opentrons/issues/9960
        await mock_avahi_client.start_advertising("alternative name"),
        await pretty_hostname.persist_pretty_hostname("alternative name"),
    )
