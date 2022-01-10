"""Common fixtures for integration tests."""
import pytest
import asyncio
from typing import AsyncGenerator, Iterator

from _pytest.fixtures import FixtureRequest

from opentrons_hardware.drivers.can_bus.settings import DriverSettings
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_ot3_firmware import constants


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
def can_messenger(
    driver: AbstractCanDriver,
) -> CanMessenger:
    """Create Can messenger."""
    return CanMessenger(driver)


@pytest.fixture(
    scope="session",
    params=[
        constants.NodeId.head,
        constants.NodeId.pipette,
        constants.NodeId.gantry_x,
        constants.NodeId.gantry_y,
    ],
)
def subsystem_node_id(request: FixtureRequest) -> Iterator[constants.NodeId]:
    """Each subsystem's node id as a fixture"""
    yield request.param  # type: ignore[attr-defined]
