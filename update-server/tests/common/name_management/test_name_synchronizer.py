import asyncio
from typing import Any, AsyncGenerator, Awaitable, Callable

import pytest
from decoy import Decoy, matchers

from otupdate.common.name_management import name_synchronizer
from otupdate.common.name_management.name_synchronizer import NameSynchronizer
from otupdate.common.name_management.avahi import (
    AvahiClient,
    alternative_service_name as real_alternative_service_name,
)
from otupdate.common.name_management.pretty_hostname import (
    get_pretty_hostname as real_get_pretty_hostname,
    persist_pretty_hostname as real_persist_pretty_hostname,
)

TEST_MACHINE_TYPE = "test machine"

# TODO(mm, 2022-07-19): Mock out these functions differently so we don't have to
# write out their signatures.
_GET_PRETTY_HOSTNAME_SIGNATURE = Callable[[], Awaitable[str]]
_PERSIST_PRETTY_HOSTNAME_SIGNATURE = Callable[[str], Awaitable[str]]
_ALTERNATIVE_SERVICE_NAME_SIGNATURE = Callable[[str], str]


@pytest.fixture
def mock_get_pretty_hostname(decoy: Decoy) -> _GET_PRETTY_HOSTNAME_SIGNATURE:
    """Return a mock in the shape of the get_pretty_hostname() function."""
    return decoy.mock(func=real_get_pretty_hostname)


@pytest.fixture
def monkeypatch_get_pretty_hostname(
    monkeypatch: Any, mock_get_pretty_hostname: _GET_PRETTY_HOSTNAME_SIGNATURE
) -> None:
    """Replace the real get_pretty_hostname() with our mock."""
    monkeypatch.setattr(
        name_synchronizer, "get_pretty_hostname", mock_get_pretty_hostname
    )


@pytest.fixture
def mock_persist_pretty_hostname(decoy: Decoy) -> _PERSIST_PRETTY_HOSTNAME_SIGNATURE:
    """Return a mock in the shape of the persist_pretty_hostname() function."""
    return decoy.mock(func=real_persist_pretty_hostname)


@pytest.fixture
def monkeypatch_persist_pretty_hostname(
    monkeypatch: Any, mock_persist_pretty_hostname: _PERSIST_PRETTY_HOSTNAME_SIGNATURE
) -> None:
    """Replace the real persist_pretty_hostname with our mock."""
    monkeypatch.setattr(
        name_synchronizer, "persist_pretty_hostname", mock_persist_pretty_hostname
    )


@pytest.fixture
def mock_alternative_service_name(decoy: Decoy) -> _ALTERNATIVE_SERVICE_NAME_SIGNATURE:
    """Return a mock in the shape of the alternative_service_name() function."""
    return decoy.mock(func=real_alternative_service_name)


@pytest.fixture
def monkeypatch_alternative_service_name(
    monkeypatch: Any, mock_alternative_service_name: _ALTERNATIVE_SERVICE_NAME_SIGNATURE
) -> None:
    """Replace the real alternative_service_name() with our mock."""
    monkeypatch.setattr(
        name_synchronizer, "alternative_service_name", mock_alternative_service_name
    )


@pytest.fixture
def mock_avahi_client(decoy: Decoy) -> AvahiClient:
    """Return a mock in the shape of an AvahiClient."""
    return decoy.mock(cls=AvahiClient)


@pytest.fixture
async def started_up_subject(
    monkeypatch_get_pretty_hostname: None,
    monkeypatch_persist_pretty_hostname: None,
    mock_avahi_client: AvahiClient,
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

    async with NameSynchronizer.start(
        avahi_client=mock_avahi_client, machine_type=TEST_MACHINE_TYPE
    ) as subject:
        yield subject


async def test_set(
    started_up_subject: NameSynchronizer,
    mock_persist_pretty_hostname: _PERSIST_PRETTY_HOSTNAME_SIGNATURE,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    """It should set the new name as the Avahi service name and then as the pretty
    hostname.
    """
    await started_up_subject.set_name("new name")

    decoy.verify(
        await mock_avahi_client.start_advertising("new name", TEST_MACHINE_TYPE),
        await mock_persist_pretty_hostname("new name"),
    )


async def test_set_does_not_persist_invalid_avahi_service_name(
    started_up_subject: NameSynchronizer,
    mock_persist_pretty_hostname: _PERSIST_PRETTY_HOSTNAME_SIGNATURE,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    """It should not persist any name that's not valid as an Avahi service name.

    Covers this bug:
    https://github.com/Opentrons/opentrons/issues/9960
    """
    decoy.when(
        await mock_avahi_client.start_advertising("danger!", TEST_MACHINE_TYPE)
    ).then_raise(Exception("oh the humanity"))

    with pytest.raises(Exception, match="oh the humanity"):
        await started_up_subject.set_name("danger!")

    decoy.verify(await mock_persist_pretty_hostname(matchers.Anything()), times=0)


async def test_get(
    started_up_subject: NameSynchronizer,
    mock_get_pretty_hostname: _GET_PRETTY_HOSTNAME_SIGNATURE,
    decoy: Decoy,
) -> None:
    decoy.when(await mock_get_pretty_hostname()).then_return("the current name")
    assert await started_up_subject.get_name() == "the current name"


async def test_advertises_initial_name(
    started_up_subject: NameSynchronizer,
    mock_get_pretty_hostname: _GET_PRETTY_HOSTNAME_SIGNATURE,
    monkeypatch_get_pretty_hostname: None,
    mock_persist_pretty_hostname: _PERSIST_PRETTY_HOSTNAME_SIGNATURE,
    monkeypatch_persist_pretty_hostname: None,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    """It should immediately start advertising the existing pretty hostname
    as the Avahi service name, when it's started up.
    """

    decoy.when(await mock_get_pretty_hostname()).then_return("initial name")
    mock_collision_subscription_context_manager = decoy.mock(
        name="mock_collision_subscription_context_manager"
    )
    decoy.when(
        mock_avahi_client.listen_for_collisions(matchers.Anything())
    ).then_return(mock_collision_subscription_context_manager)

    async with NameSynchronizer.start(
        avahi_client=mock_avahi_client, machine_type=TEST_MACHINE_TYPE
    ):
        decoy.verify(
            # It should only start advertising after subscribing to collisions.
            await mock_collision_subscription_context_manager.__aenter__(),
            await mock_avahi_client.start_advertising(
                "initial name", TEST_MACHINE_TYPE
            ),
        )


async def test_collision_handling(
    mock_get_pretty_hostname: _GET_PRETTY_HOSTNAME_SIGNATURE,
    monkeypatch_get_pretty_hostname: None,
    mock_persist_pretty_hostname: _PERSIST_PRETTY_HOSTNAME_SIGNATURE,
    monkeypatch_persist_pretty_hostname: None,
    mock_alternative_service_name: _ALTERNATIVE_SERVICE_NAME_SIGNATURE,
    monkeypatch_alternative_service_name: None,
    mock_avahi_client: AvahiClient,
    decoy: Decoy,
) -> None:
    """It should resolve naming collisions reported by the AvahiClient.

    When notified of a collision, it should:

    1. Get a new service name.
    2. Start advertising with it.
    3. Persist it as the pretty hostname.
    """
    decoy.when(await mock_get_pretty_hostname()).then_return("initial name")
    decoy.when(mock_alternative_service_name("initial name")).then_return(
        "alternative name"
    )

    # Expect the subject to do:
    #
    #     with avahi_client.listen_for_collisions(some_callback_func):
    #         ...
    #
    # When it does, save the function that it provided as `some_callback_func`
    # into `collision_callback_captor.value`.
    mock_listen_context_manager = decoy.mock(name="mock_listen_context_manager")
    collision_callback_captor = matchers.Captor()
    decoy.when(
        mock_avahi_client.listen_for_collisions(collision_callback_captor)
    ).then_return(mock_listen_context_manager)

    async with NameSynchronizer.start(
        avahi_client=mock_avahi_client, machine_type=TEST_MACHINE_TYPE
    ):
        captured_collision_callback = collision_callback_captor.value
        # Prompt the subject to run its collision-handling logic.
        await captured_collision_callback()
        # Exit this context manager to wait for the subject to wrap up cleanly,
        # ensuring its collision handling has run to completion before we assert stuff.

    decoy.verify(
        await mock_listen_context_manager.__aenter__(),
        await mock_avahi_client.start_advertising("initial name", TEST_MACHINE_TYPE),
        # The subject should only persist the alternative name *after*
        # the Avahi client accepts it for advertisement,
        # just in case the alternative name turns out to be invalid in some way.
        # https://github.com/Opentrons/opentrons/issues/9960
        await mock_avahi_client.start_advertising(
            "alternative name", TEST_MACHINE_TYPE
        ),
        await mock_persist_pretty_hostname("alternative name"),
    )
