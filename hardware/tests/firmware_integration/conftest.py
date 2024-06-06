"""Common fixtures for integration tests."""
from __future__ import annotations
import pytest
from typing import AsyncGenerator, Iterator, AsyncIterator, List, Dict

from _pytest.fixtures import SubRequest

from opentrons_hardware.drivers.can_bus.settings import DriverSettings
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings import constants


@pytest.fixture
async def driver() -> AsyncGenerator[AbstractCanDriver, None]:
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
    async with CanMessenger(driver) as messenger:
        yield messenger


@pytest.fixture
def can_messenger_queue(
    request: SubRequest,
    can_messenger: CanMessenger,
) -> Iterator[WaitableCallback]:
    """Create WaitableCallback for the CAN Messenger."""
    # Get optional filtering function.
    mark = request.node.get_closest_marker("can_filter_func")
    if not mark:
        filter_func = None
    else:
        filter_func = mark.args[0]
    with WaitableCallback(messenger=can_messenger, filter=filter_func) as wc:
        yield wc


@pytest.fixture(
    scope="session",
    params=[
        constants.NodeId.head,
        constants.NodeId.pipette_left,
        constants.NodeId.gantry_x,
        constants.NodeId.gantry_y,
    ],
)
def subsystem_node_id(request: SubRequest) -> Iterator[constants.NodeId]:
    """Each subsystem's node id as a fixture."""
    yield request.param


_motor_nodes = [
    constants.NodeId.head_l,
    constants.NodeId.head_r,
    constants.NodeId.pipette_left,
    constants.NodeId.gantry_x,
    constants.NodeId.gantry_y,
]

# These unfortunately need to be manually kept up to date with the c++
# configurations
_motor_node_step_sizes = {
    # for lead screw pitch 12, microstepping 16
    constants.NodeId.head_l: 0.00375,
    constants.NodeId.head_r: 0.00375,
    # for pulley diameter 12, microstepping 32
    constants.NodeId.gantry_x: 0.006234098,
    # for pulley diameter 12.7254, microstepping 32
    constants.NodeId.gantry_y: 0.006246566,
    # for lead screw pitch 3.03, microstepping 32
    constants.NodeId.pipette_left: 0.000473437,
    constants.NodeId.pipette_right: 0.000473437,
}


@pytest.fixture(
    scope="session",
    params=_motor_nodes,
)
def motor_node_id(request: SubRequest) -> Iterator[constants.NodeId]:
    """Each motor's node id as a fixture."""
    yield request.param


@pytest.fixture(scope="session")
def all_motor_nodes() -> List[constants.NodeId]:
    """The full list of configured motor nodes."""
    return _motor_nodes


@pytest.fixture(scope="session")
def all_motor_node_step_sizes() -> Dict[constants.NodeId, float]:
    """Step sizes for all configured motor nodes."""
    return _motor_node_step_sizes
