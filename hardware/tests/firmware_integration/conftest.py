"""Common fixtures for integration tests."""
from __future__ import annotations
import pytest
import asyncio
from typing import AsyncGenerator, Iterator, AsyncIterator, Tuple

from _pytest.fixtures import FixtureRequest
from opentrons_ot3_firmware.messages import MessageDefinition

from opentrons_hardware.drivers.can_bus.settings import DriverSettings
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_ot3_firmware import constants, ArbitrationId


@pytest.fixture
async def driver(
    loop: asyncio.BaseEventLoop,
) -> AsyncGenerator[AbstractCanDriver, None]:
    """Create CanDriver connected to OT-3 Emulator."""
    settings = DriverSettings()
    driver = await build_driver(settings)
    yield driver
    driver.shutdown()


@pytest.fixture
async def can_messenger(
    driver: AbstractCanDriver,
) -> AsyncIterator[CanMessenger]:
    """Create Can messenger."""
    messenger = CanMessenger(driver)
    messenger.start()
    yield messenger
    await messenger.stop()


@pytest.fixture
def can_messenger_queue(
    can_messenger: CanMessenger,
) -> "asyncio.Queue[Tuple[MessageDefinition, ArbitrationId]]":
    """Create Can messenger."""
    queue: "asyncio.Queue[Tuple[MessageDefinition, ArbitrationId]]" = asyncio.Queue()
    can_messenger.add_listener(lambda m, arb: queue.put_nowait((m, arb)))
    return queue


@pytest.fixture(
    scope="session",
    params=[
        constants.NodeId.head,
        constants.NodeId.pipette_left,
        constants.NodeId.gantry_x,
        constants.NodeId.gantry_y,
    ],
)
def subsystem_node_id(request: FixtureRequest) -> Iterator[constants.NodeId]:
    """Each subsystem's node id as a fixture."""
    yield request.param  # type: ignore[attr-defined]


@pytest.fixture(
    scope="session",
    params=[
        constants.NodeId.head_l,
        constants.NodeId.head_r,
        constants.NodeId.pipette_left,
        constants.NodeId.gantry_x,
        constants.NodeId.gantry_y,
    ],
)
def motor_node_id(request: FixtureRequest) -> Iterator[constants.NodeId]:
    """Each motor's node id as a fixture."""
    yield request.param  # type: ignore[attr-defined]
