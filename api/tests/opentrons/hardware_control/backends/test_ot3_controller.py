import pytest
from itertools import chain
from mock import AsyncMock, patch
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import (
    node_to_axis,
)
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons.config.types import OT3Config
from opentrons.config.robot_configs import build_config_ot3
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons.hardware_control.types import OT3Axis, OT3Mount

from opentrons_hardware.hardware_control.motion import (
    MoveType,
    MoveStopCondition,
)
from opentrons_hardware.hardware_control.tools.detector import OneshotToolDetector
from opentrons_hardware.hardware_control.tools.types import (
    ToolSummary,
    PipetteInformation,
    GripperInformation,
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
        mock_mgr_run.return_value = {}
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
            NodeId.gripper_z,
        )
    )
    try:
        yield controller
    finally:
        controller._present_nodes = old_pn


@pytest.fixture
def mock_tool_detector(controller: OT3Controller):
    with patch.object(
        controller._tool_detector, "detect", spec=controller._tool_detector.detect
    ) as md:

        md.return_value = ToolSummary(
            right=None,
            left=None,
            gripper=None,
        )

        yield md


home_test_params = [
    [OT3Axis.X],
    [OT3Axis.Y],
    [OT3Axis.Z_L],
    [OT3Axis.Z_R],
    [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_R],
    [OT3Axis.X, OT3Axis.Z_R, OT3Axis.P_R, OT3Axis.Y, OT3Axis.Z_L],
    [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.P_L, OT3Axis.P_R],
    [OT3Axis.P_R],
    [OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.Z_G],
    [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_G],
]


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_execute(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    commanded_homes = set(axes)
    await controller.home(axes)
    all_calls = list(chain([args[0][0] for args in mock_move_group_run.call_args_list]))
    for command in all_calls:
        for group in command._move_groups:
            for node, step in group[0].items():
                commanded_homes.remove(node_to_axis(node))
                assert step.acceleration_mm_sec_sq == 0
                assert step.move_type == MoveType.home
                assert step.stop_condition == MoveStopCondition.limit_switch
    assert not commanded_homes


@pytest.mark.parametrize("axes", home_test_params)
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
            assert node_to_axis(node) in OT3Axis.mount_axes()
        for node in run[1][0]:
            assert node in [NodeId.gantry_x, NodeId.gantry_y]
    else:
        assert len(run) == 1


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_build_runners(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    await controller.home(axes)
    has_pipette = len(set(OT3Axis.pipette_axes()) & set(axes)) > 0
    has_gantry = len(set(OT3Axis.gantry_axes()) & set(axes)) > 0

    if has_pipette and has_gantry:
        assert len(mock_move_group_run.call_args_list) == 2
        run_gantry = mock_move_group_run.call_args_list[0][0][0]._move_groups
        run_pipette = mock_move_group_run.call_args_list[1][0][0]._move_groups
        for group in run_gantry:
            for node in group[0]:
                assert node_to_axis(node) in OT3Axis.gantry_axes()
        for node in run_pipette[0][0]:
            assert node_to_axis(node) in OT3Axis.pipette_axes()

    if not has_pipette or not has_gantry:
        assert len(mock_move_group_run.call_args_list) == 1
        mock_move_group_run.assert_awaited_once()


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_only_present_nodes(
    controller: OT3Controller, mock_move_group_run, axes
):
    controller._present_nodes = set(
        (NodeId.gantry_x, NodeId.gantry_y, NodeId.head_l, NodeId.head_r)
    )
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
    for call in mock_move_group_run.call_args_list:
        # pull the bound-self argument that is the runner instance out of
        # the args list - we can do this because the mock here is the
        # function definition in the class body
        move_group_runner = call[0][0]
        for move_group in move_group_runner._move_groups:
            assert move_group  # don't pass in empty groups
            for move_group_step in move_group:
                assert move_group_step  # don't pass in empty moves
                for node, step in move_group_step.items():
                    assert node in controller._present_nodes
                    assert step  # don't pass in empty steps

    for node in controller._position:
        if node_to_axis(node) in (axes and controller._present_nodes):
            assert controller._position[node] == 0
        else:
            assert controller._position[node] == start_pos[node]


async def test_probing(
    controller: OT3Controller, mock_tool_detector: AsyncMock
) -> None:
    assert controller._present_nodes == set()

    call_count = 0
    fake_nodes = set(
        (NodeId.gantry_x, NodeId.head, NodeId.pipette_left, NodeId.gripper)
    )
    passed_expected = None

    async def fake_probe(can_messenger, expected, timeout):
        nonlocal passed_expected
        nonlocal call_count
        nonlocal fake_nodes
        passed_expected = expected
        call_count += 1
        return fake_nodes

    async def fake_gai(expected):
        return {
            OT3Mount.RIGHT: {"config": "whatever"},
            OT3Mount.GRIPPER: {"config": "whateverelse"},
        }

    with patch(
        "opentrons.hardware_control.backends.ot3controller.probe", fake_probe
    ), patch.object(controller, "get_attached_instruments", fake_gai):
        await controller.probe_network(timeout=0.1)
        assert call_count == 1
        assert passed_expected == set(
            (
                NodeId.gantry_x,
                NodeId.gantry_y,
                NodeId.head,
                NodeId.pipette_right,
                NodeId.gripper,
            )
        )
    assert controller._present_nodes == set(
        (
            NodeId.gantry_x,
            NodeId.head_l,
            NodeId.head_r,
            NodeId.pipette_left,
            NodeId.gripper_g,
            NodeId.gripper_z,
        )
    )


model_numbers = [0, 65535]


@pytest.mark.parametrize("model", model_numbers)
async def test_get_attached_instruments(
    model: int, controller: OT3Controller, mock_tool_detector: OneshotToolDetector
):
    async def fake_probe(can_messenger, expected, timeout):
        return set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head, NodeId.gripper))

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        assert await controller.get_attached_instruments({}) == {}

    mock_tool_detector.return_value = ToolSummary(
        left=PipetteInformation(
            name=PipetteName.p1000_single, model=model, serial="hello"
        ),
        right=None,
        gripper=GripperInformation(model=model, serial="fake_serial"),
    )

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        detected = await controller.get_attached_instruments({})
    assert list(detected.keys()) == [OT3Mount.LEFT, OT3Mount.GRIPPER]
    assert detected[OT3Mount.LEFT]["id"] == "hello"
    assert detected[OT3Mount.LEFT]["config"].name == "p1000_single_gen3"
    assert detected[OT3Mount.GRIPPER]["id"] == "fake_serial"
    assert detected[OT3Mount.GRIPPER]["config"].name == "gripper"


def test_nodeid_replace_head():
    assert OT3Controller._replace_head_node(set([NodeId.head, NodeId.gantry_x])) == set(
        [NodeId.head_l, NodeId.head_r, NodeId.gantry_x]
    )
    assert OT3Controller._replace_head_node(set([NodeId.gantry_x])) == set(
        [NodeId.gantry_x]
    )
    assert OT3Controller._replace_head_node(set([NodeId.head_l])) == set(
        [NodeId.head_l]
    )


def test_nodeid_replace_gripper():
    assert OT3Controller._replace_gripper_node(
        set([NodeId.gripper, NodeId.head])
    ) == set([NodeId.gripper_g, NodeId.gripper_z, NodeId.head])
    assert OT3Controller._replace_gripper_node(set([NodeId.head])) == set([NodeId.head])
    assert OT3Controller._replace_gripper_node(set([NodeId.gripper_g])) == set(
        [NodeId.gripper_g]
    )


def test_nodeid_filter_probed_core():
    assert OT3Controller._filter_probed_core_nodes(
        set([NodeId.gantry_x, NodeId.pipette_left]), set([NodeId.gantry_y])
    ) == set([NodeId.gantry_y, NodeId.pipette_left])


async def test_gripper_home_jaw(controller: OT3Controller, mock_move_group_run):
    await controller.gripper_home_jaw()
    for call in mock_move_group_run.call_args_list:
        move_group_runner = call[0][0]
        for move_group in move_group_runner._move_groups:
            assert move_group  # don't pass in empty groups
            assert len(move_group) == 1
        # onlly homing the gripper jaw
        assert list(move_group[0].keys()) == [NodeId.gripper_g]
        step = move_group[0][NodeId.gripper_g]
        assert step.stop_condition == MoveStopCondition.limit_switch
        assert step.move_type == MoveType.home


async def test_gripper_grip(controller: OT3Controller, mock_move_group_run):
    await controller.gripper_move_jaw(duty_cycle=50)
    for call in mock_move_group_run.call_args_list:
        move_group_runner = call[0][0]
        for move_group in move_group_runner._move_groups:
            assert move_group  # don't pass in empty groups
            assert len(move_group) == 1
        # onlly homing the gripper jaw
        assert list(move_group[0].keys()) == [NodeId.gripper_g]
        step = move_group[0][NodeId.gripper_g]
        assert step.stop_condition == MoveStopCondition.none
        assert step.move_type == MoveType.linear
