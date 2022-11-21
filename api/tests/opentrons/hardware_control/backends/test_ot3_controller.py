import pytest
from typing import TYPE_CHECKING
from itertools import chain
from mock import AsyncMock, patch
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import (
    node_to_axis,
    axis_to_node,
)
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons.config.types import OT3Config
from opentrons.config.robot_configs import build_config_ot3
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    PipetteName as FirmwarePipetteName,
)
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons.hardware_control.types import (
    OT3Axis,
    OT3Mount,
    InvalidPipetteName,
    InvalidPipetteModel,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field


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

if TYPE_CHECKING:
    from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel


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


def move_group_run_side_effect(controller, axes_to_home):
    """Return homed position for axis that is present and was commanded to home."""
    gantry_homes = {
        axis_to_node(ax): (0.0, 0.0)
        for ax in OT3Axis.gantry_axes()
        if ax in axes_to_home and axis_to_node(ax) in controller._present_nodes
    }
    if gantry_homes:
        yield gantry_homes

    pipette_homes = {
        axis_to_node(ax): (0.0, 0.0)
        for ax in OT3Axis.pipette_axes()
        if ax in axes_to_home and axis_to_node(ax) in controller._present_nodes
    }
    yield pipette_homes


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_execute(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)
    # nothing has been homed
    assert len(controller._homed_nodes) == 0

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

    # all commanded axes have been homed
    assert controller._homed_nodes == set(axis_to_node(ax) for ax in axes)
    assert controller.check_ready_for_movement(axes)


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_prioritize_mount(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)
    # nothing has been homed
    assert not len(controller._homed_nodes)

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

    # all commanded axes have been homed
    assert controller._homed_nodes == set(axis_to_node(ax) for ax in axes)
    assert controller.check_ready_for_movement(axes)


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_build_runners(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_nodes
):
    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)
    assert not len(controller._homed_nodes)

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

    # all commanded axes have been homed
    assert controller._homed_nodes == set(axis_to_node(ax) for ax in axes)
    assert controller.check_ready_for_movement(axes)


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_only_present_nodes(
    controller: OT3Controller, mock_move_group_run, axes
):
    starting_position = {
        NodeId.head_l: 20,
        NodeId.head_r: 85,
        NodeId.gantry_x: 68,
        NodeId.gantry_y: 54,
        NodeId.pipette_left: 30,
        NodeId.pipette_right: 110,
    }
    homed_position = {}

    controller._present_nodes = set(
        (NodeId.gantry_x, NodeId.gantry_y, NodeId.head_l, NodeId.head_r)
    )
    controller._position = starting_position

    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)

    # nothing has been homed
    assert not len(controller._homed_nodes)

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
                    homed_position[node] = 0.0  # track homed position for node

    # check that the current position is updated
    expected_position = {**starting_position, **homed_position}
    for node, pos in controller._position.items():
        assert pos == expected_position[node]
    # check that the homed axis is tracked by _homed_nodes
    assert len(controller._homed_nodes) == len(homed_position.keys())
    assert controller._homed_nodes == homed_position.keys()


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


@pytest.mark.parametrize(
    "tool_summary,pipette_id,pipette_name,pipette_model,gripper_id,gripper_name",
    [
        (
            ToolSummary(
                left=PipetteInformation(
                    name=FirmwarePipetteName.p1000_single,
                    name_int=FirmwarePipetteName.p1000_single.value,
                    model="3.0",
                    serial="hello",
                ),
                right=None,
                gripper=GripperInformation(model="0", serial="fake_serial"),
            ),
            "hello",
            "p1000_single_gen3",
            "p1000_single_v3.0",
            "fake_serial",
            "gripper",
        ),
    ],
)
async def test_get_attached_instruments(
    controller: OT3Controller,
    mock_tool_detector: OneshotToolDetector,
    tool_summary: ToolSummary,
    pipette_id: str,
    pipette_name: "PipetteName",
    pipette_model: "PipetteModel",
    gripper_id: str,
    gripper_name: str,
):
    async def fake_probe(can_messenger, expected, timeout):
        return set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head, NodeId.gripper))

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        assert await controller.get_attached_instruments({}) == {}

    mock_tool_detector.return_value = tool_summary

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        detected = await controller.get_attached_instruments({})
    assert list(detected.keys()) == [OT3Mount.LEFT, OT3Mount.GRIPPER]
    assert detected[OT3Mount.LEFT]["id"] == pipette_id
    assert detected[OT3Mount.LEFT]["config"].name == pipette_name
    assert detected[OT3Mount.LEFT]["config"].model == pipette_model
    assert detected[OT3Mount.GRIPPER]["id"] == gripper_id
    assert detected[OT3Mount.GRIPPER]["config"].name == gripper_name


async def test_get_attached_instruments_handles_unknown_name(
    controller: OT3Controller, mock_tool_detector: OneshotToolDetector
) -> None:
    async def fake_probe(can_messenger, expected, timeout):
        return set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head, NodeId.gripper))

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        assert await controller.get_attached_instruments({}) == {}

    tool_summary = ToolSummary(
        left=PipetteInformation(
            name=FirmwarePipetteName.unknown, name_int=41, model=30, serial="hello"
        ),
        right=None,
        gripper=GripperInformation(model=0, serial="fake_serial"),
    )
    mock_tool_detector.return_value = tool_summary

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        with pytest.raises(InvalidPipetteName):
            await controller.get_attached_instruments({})


async def test_get_attached_instruments_handles_unknown_model(
    controller: OT3Controller, mock_tool_detector: OneshotToolDetector
) -> None:
    async def fake_probe(can_messenger, expected, timeout):
        return set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head, NodeId.gripper))

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        assert await controller.get_attached_instruments({}) == {}

    tool_summary = ToolSummary(
        left=PipetteInformation(
            name=FirmwarePipetteName.p1000_single, name_int=0, model=41, serial="hello"
        ),
        right=None,
        gripper=GripperInformation(model=0, serial="fake_serial"),
    )
    mock_tool_detector.return_value = tool_summary

    with patch("opentrons.hardware_control.backends.ot3controller.probe", fake_probe):
        with pytest.raises(InvalidPipetteModel):
            await controller.get_attached_instruments({})


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
        # only homing the gripper jaw
        assert list(move_group[0].keys()) == [NodeId.gripper_g]
        step = move_group[0][NodeId.gripper_g]
        assert step.stop_condition == MoveStopCondition.limit_switch
        assert step.move_type == MoveType.home


async def test_gripper_grip(controller: OT3Controller, mock_move_group_run):
    await controller.gripper_grip_jaw(duty_cycle=50)
    for call in mock_move_group_run.call_args_list:
        move_group_runner = call[0][0]
        for move_group in move_group_runner._move_groups:
            assert move_group  # don't pass in empty groups
            assert len(move_group) == 1
        # only gripping the gripper jaw
        assert list(move_group[0].keys()) == [NodeId.gripper_g]
        step = move_group[0][NodeId.gripper_g]
        assert step.stop_condition == MoveStopCondition.none
        assert step.move_type == MoveType.grip


async def test_gripper_jaw_width(controller: OT3Controller, mock_move_group_run):
    max_jaw_width = 134350
    await controller.gripper_hold_jaw(encoder_position_um=((max_jaw_width - 80000) / 2))
    for call in mock_move_group_run.call_args_list:
        move_group_runner = call[0][0]
        for move_group in move_group_runner._move_groups:
            assert move_group  # don't pass in empty groups
            assert len(move_group) == 1
        # only moving the gripper jaw
        assert list(move_group[0].keys()) == [NodeId.gripper_g]
        step = move_group[0][NodeId.gripper_g]
        assert step.stop_condition == MoveStopCondition.encoder_position
        assert step.move_type == MoveType.linear


async def test_get_limit_switches(controller: OT3Controller) -> None:
    assert controller._present_nodes == set()
    fake_present_nodes = {NodeId.gantry_x, NodeId.gantry_y}
    call_count = 0
    fake_response = {
        NodeId.gantry_x: UInt8Field(0),
        NodeId.gantry_y: UInt8Field(0),
    }
    passed_nodes = None

    async def fake_gls(can_messenger, nodes):
        nonlocal passed_nodes
        nonlocal call_count
        nonlocal fake_response
        passed_nodes = nodes
        call_count += 1
        return fake_response

    with patch(
        "opentrons.hardware_control.backends.ot3controller.get_limit_switches", fake_gls
    ), patch.object(controller, "_present_nodes", fake_present_nodes):
        res = await controller.get_limit_switches()
        assert call_count == 1
        assert passed_nodes == {NodeId.gantry_x, NodeId.gantry_y}
        assert OT3Axis.X in res
        assert OT3Axis.Y in res
