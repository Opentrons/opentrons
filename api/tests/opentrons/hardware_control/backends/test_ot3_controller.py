import pytest
from mock import AsyncMock, patch
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import axis_to_node
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons.config.types import OT3Config
from opentrons.config.robot_configs import build_config_ot3
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons.hardware_control.types import OT3Axis
from opentrons_hardware.hardware_control.motion import (
    MoveType,
    MoveStopCondition,
)


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


@pytest.fixture
def mock_move_group_run():
    with patch(
        "opentrons.hardware_control.backends.ot3controller.MoveGroupRunner.run",
        autospec=True,
    ) as mock_mgr_run:

        yield mock_mgr_run


@pytest.fixture
def mock_present_nodes(controller: OT3Controller):
    old_pn = controller._present_nodes
    controller._present_nodes = set(
        (
            NodeId.pipette_left,
            NodeId.gantry_x,
            NodeId.gantry_y,
            NodeId.head_l,
            NodeId.head_r,
            NodeId.pipette_right,
        )
    )
    try:
        yield controller
    finally:
        controller._present_nodes = old_pn


@pytest.mark.parametrize(
    "axes",
    [
        [OT3Axis.X],
        [OT3Axis.Y],
        [OT3Axis.Z_L],
        [OT3Axis.Z_R],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_R],
    ],
)
async def test_home(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    await controller.home(axes)
    if (
        axis_to_node(axes[0])
        in (mock_move_group_run.call_args_list[0][0][0]._move_groups)[0][0]
    ):
        home_move = (mock_move_group_run.call_args_list[0][0][0]._move_groups)[0][0][
            axis_to_node(axes[0])
        ]
    else:
        home_move = (mock_move_group_run.call_args_list[0][0][0]._move_groups)[1][0][
            axis_to_node(axes[0])
        ]

    assert home_move.acceleration_mm_sec_sq == 0
    assert home_move.move_type == MoveType.home
    assert home_move.stop_condition == MoveStopCondition.limit_switch
    mock_move_group_run.assert_called_once()


async def test_home_only_present_nodes(controller: OT3Controller, mock_move_group_run):
    controller._present_nodes = set((NodeId.gantry_x, NodeId.gantry_y))
    await controller.home([OT3Axis.X, OT3Axis.Z_L])
    home_move = (mock_move_group_run.call_args_list[0][0][0]._move_groups)[1][0]
    assert list(home_move.keys()) == [NodeId.gantry_x]


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
