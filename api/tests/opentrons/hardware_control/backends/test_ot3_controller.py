import pytest
from mock import AsyncMock, patch
from opentrons.hardware_control.backends import OT3Controller
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons.config.types import OT3Config
from opentrons.config.robot_configs import build_config_ot3
from opentrons_ot3_firmware.constants import NodeId
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver


@pytest.fixture
def mock_config() -> OT3Config:
    return build_config_ot3({})


@pytest.fixture
def mock_messenger():
    with patch(
        "opentrons.hardware_control.backends.ot3controller.CanMessenger",
        AsyncMock,
        spec=CanMessenger,
    ):
        yield


@pytest.fixture
def mock_driver(mock_messenger) -> AbstractCanDriver:
    return AsyncMock(spec=AbstractCanDriver)


@pytest.fixture
def controller(mock_config: OT3Config, mock_driver: AbstractCanDriver) -> OT3Controller:
    return OT3Controller(mock_config, mock_driver)


async def test_probing(controller: OT3Controller) -> None:
    assert controller._present_nodes == set()
    call_count = 0
    fake_nodes = set((NodeId.gantry_x, NodeId.head))
    passed_expected = None

    async def fake_probe(can_messenger, expected, timeout):
        nonlocal passed_expected
        nonlocal call_count
        nonlocal fake_nodes
        passed_expected = expected
        call_count += 1
        return fake_nodes

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        await controller.probe_network(timeout=0.1)
        assert call_count == 1
        assert passed_expected == set(
            (
                NodeId.gantry_x,
                NodeId.gantry_y,
                NodeId.head,
                NodeId.pipette_left,
            )
        )
    assert controller._present_nodes == set(
        (NodeId.gantry_x, NodeId.head_l, NodeId.head_r)
    )
