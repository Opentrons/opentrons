import pytest
from mock import AsyncMock, patch
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import (
    node_to_axis,
)
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
        # all contained in (mock_move_group_run.call_args_list[0][0][0]._move_groups)
        [OT3Axis.X, OT3Axis.Z_R, OT3Axis.P_R, OT3Axis.Y, OT3Axis.Z_L],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.P_L, OT3Axis.P_R],
        [OT3Axis.P_R],
    ],
)
async def test_home_execute(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    await controller.home(axes)
    for group in mock_move_group_run.call_args_list:
        for step in group[0][0]._move_groups[0][0].values():
            assert step.acceleration_mm_sec_sq == 0
            assert step.move_type == MoveType.home
            assert step.stop_condition == MoveStopCondition.limit_switch

    # make sure position gets set to 0 for appropriate axes


@pytest.mark.parametrize(
    "axes",
    [
        [OT3Axis.X],
        [OT3Axis.Y],
        [OT3Axis.Z_L],
        [OT3Axis.Z_R],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_R],
        # all contained in (mock_move_group_run.call_args_list[0][0][0]._move_groups)
        [OT3Axis.X, OT3Axis.Z_R, OT3Axis.P_R, OT3Axis.Y, OT3Axis.Z_L],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.P_L, OT3Axis.P_R],
        [OT3Axis.P_R],
    ],
)
async def test_home_prioritize_mount(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    await controller.home(axes)
    has_xy = len({OT3Axis.X, OT3Axis.Y} & set(axes)) > 0
    has_mount = len(set(OT3Axis.mount_axes()) & set(axes)) > 0
    run = mock_move_group_run.call_args_list[0][0][0]._move_groups
    if has_xy and has_mount:
        assert len(run) > 1
        for node in run[0][0]:
            # breakpoint()
            assert node_to_axis(node) in OT3Axis.mount_axes()
        for node in run[1][0]:
            assert node in [NodeId.gantry_x, NodeId.gantry_y]
    else:
        assert len(run) == 1


@pytest.mark.parametrize(
    "axes",
    [
        [OT3Axis.X],
        [OT3Axis.Y],
        [OT3Axis.Z_L],
        [OT3Axis.Z_R],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_R],
        # all contained in (mock_move_group_run.call_args_list[0][0][0]._move_groups)
        [OT3Axis.X, OT3Axis.Z_R, OT3Axis.P_R, OT3Axis.Y, OT3Axis.Z_L],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.P_L, OT3Axis.P_R],
        [OT3Axis.P_R],
    ],
)
async def test_home_build_runners(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    await controller.home(axes)
    has_pipette = len(set(OT3Axis.pipette_axes()) & set(axes)) > 0
    has_gantry = len(set(OT3Axis.gantry_axes()) & set(axes)) > 0

    if has_pipette and has_gantry:
        assert len(mock_move_group_run.call_args_list) == 2
        # check that there two runners, both get called ??
        run_gantry = mock_move_group_run.call_args_list[0][0][0]._move_groups
        run_pipette = mock_move_group_run.call_args_list[1][0][0]._move_groups
        for group in run_gantry:
            for node in group[0]:
                # breakpoint()
                assert node_to_axis(node) in OT3Axis.gantry_axes()
        for node in run_pipette[0][0]:
            # breakpoint()
            assert node_to_axis(node) in OT3Axis.pipette_axes()

    if not has_pipette or not has_gantry:
        assert len(mock_move_group_run.call_args_list) == 1
        mock_move_group_run.assert_awaited_once()


@pytest.mark.parametrize(
    "axes",
    [
        [OT3Axis.X],
        [OT3Axis.Y],
        [OT3Axis.Z_L],
        [OT3Axis.Z_R],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_R],
        # all contained in (mock_move_group_run.call_args_list[0][0][0]._move_groups)
        [OT3Axis.X, OT3Axis.Z_R, OT3Axis.P_R, OT3Axis.Y, OT3Axis.Z_L],
        [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.P_L, OT3Axis.P_R],
        [OT3Axis.P_R],
    ],
)
async def test_home_only_present_nodes(
    controller: OT3Controller, mock_move_group_run, axes
):
    controller._present_nodes = set((NodeId.gantry_x, NodeId.gantry_y))
    controller._position = {
        NodeId.head_l: 20,
        NodeId.head_r: 85,
        NodeId.gantry_x: 68,
        NodeId.gantry_y: 54,
        NodeId.pipette_left: 30,
        NodeId.pipette_right: 110,
    }
    start_pos = controller._position

    await controller.home(axes)
    for group in mock_move_group_run.call_args_list:
        for node in group[0][0]._move_groups[0][0]:
            assert node in controller._present_nodes

    for node in controller._position:
        if node_to_axis(node) in (axes and controller._present_nodes):
            assert controller._position[node] == 0
        else:
            assert controller._position[node] == start_pos[node]


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
                NodeId.pipette_right,
            )
        )
    assert controller._present_nodes == set(
        (NodeId.gantry_x, NodeId.head_l, NodeId.head_r)
    )
