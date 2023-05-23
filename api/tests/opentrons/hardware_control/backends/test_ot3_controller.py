import asyncio
from unittest.mock import mock_open
import mock
import pytest
from typing import AsyncIterator, Dict, List, Optional, Set, Tuple, Any
from itertools import chain
from mock import AsyncMock, patch
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import (
    node_to_axis,
    axis_to_node,
    sensor_node_for_mount,
    sub_system_to_node_id,
)
from opentrons_hardware.drivers.can_bus.can_messenger import (
    MessageListenerCallback,
    MessageListenerCallbackFilter,
)
from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons.config.types import OT3Config, GantryLoad, LiquidProbeSettings
from opentrons.config.robot_configs import build_config_ot3
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    USBTarget,
    PipetteName as FirmwarePipetteName,
)
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.binary_usb import SerialUsbDriver
from opentrons.hardware_control.types import (
    OT3Axis,
    OT3Mount,
    OT3AxisMap,
    MotorStatus,
    OT3SubSystem,
)
from opentrons.hardware_control.errors import (
    FirmwareUpdateRequired,
    InvalidPipetteName,
    InvalidPipetteModel,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_update.types import FirmwareUpdateStatus, StatusElement
from opentrons_hardware.firmware_update.utils import FirmwareUpdateType, UpdateInfo
from opentrons_hardware.hardware_control.motion import (
    MoveType,
    MoveStopCondition,
)
from opentrons_hardware.hardware_control import current_settings
from opentrons_hardware.hardware_control.network import DeviceInfoCache
from opentrons_hardware.hardware_control.tools.detector import OneshotToolDetector
from opentrons_hardware.hardware_control.tools.types import (
    ToolSummary,
    PipetteInformation,
    GripperInformation,
)
from opentrons_hardware.hardware_control.types import PCBARevision


@pytest.fixture
def mock_config() -> OT3Config:
    return build_config_ot3({})


class MockCanMessageNotifier:
    """A CanMessage notifier."""

    def __init__(self) -> None:
        """Constructor."""
        self._listeners: List[
            Tuple[MessageListenerCallback, Optional[MessageListenerCallbackFilter]]
        ] = []

    def add_listener(
        self,
        listener: MessageListenerCallback,
        filter: Optional[MessageListenerCallbackFilter] = None,
    ) -> None:
        """Add listener."""
        self._listeners.append((listener, filter))

    def notify(self, message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        """Notify."""
        for listener, filter in self._listeners:
            if filter and not filter(arbitration_id):
                continue
            listener(message, arbitration_id)


@pytest.fixture
def can_message_notifier() -> MockCanMessageNotifier:
    """A fixture that notifies mock_messenger listeners of a new message."""
    return MockCanMessageNotifier()


@pytest.fixture
def mock_messenger(can_message_notifier: MockCanMessageNotifier) -> AsyncMock:
    """Mock can messenger."""
    mock = AsyncMock(spec=CanMessenger)
    mock.add_listener.side_effect = can_message_notifier.add_listener
    return mock


@pytest.fixture
def mock_can_driver(mock_messenger: AsyncMock) -> AbstractCanDriver:
    return AsyncMock(spec=AbstractCanDriver)


@pytest.fixture
def mock_usb_driver() -> SerialUsbDriver:
    return AsyncMock(spec=SerialUsbDriver)


@pytest.fixture
def controller(
    mock_config: OT3Config, mock_can_driver: AbstractCanDriver
) -> OT3Controller:
    with mock.patch("opentrons.hardware_control.backends.ot3controller.OT3GPIO"):
        yield OT3Controller(mock_config, mock_can_driver)


@pytest.fixture
def fake_liquid_settings() -> LiquidProbeSettings:
    return LiquidProbeSettings(
        starting_mount_height=100,
        max_z_distance=15,
        min_z_distance=5,
        mount_speed=40,
        plunger_speed=10,
        sensor_threshold_pascals=15,
        expected_liquid_height=109,
        log_pressure=False,
        aspirate_while_sensing=False,
        auto_zero_sensor=False,
        num_baseline_reads=8,
        data_file="fake_data_file",
    )


@pytest.fixture
def mock_send_stop_threshold() -> None:
    with patch(
        "opentrons_hardware.sensors.sensor_driver.SensorDriver.send_stop_threshold",
        autospec=True,
    ) as mock_stop_threshold:
        yield mock_stop_threshold


@pytest.fixture
def mock_move_group_run():
    with patch(
        "opentrons.hardware_control.backends.ot3controller.MoveGroupRunner.run",
        autospec=True,
    ) as mock_mgr_run:
        mock_mgr_run.return_value = {}
        yield mock_mgr_run


@pytest.fixture
def mock_present_devices(controller: OT3Controller) -> OT3Controller:
    old_pd = controller._present_devices
    controller._present_devices = set(
        (
            NodeId.pipette_left,
            NodeId.gantry_x,
            NodeId.gantry_y,
            NodeId.head,
            NodeId.pipette_right,
            NodeId.gripper,
            USBTarget.rear_panel,
        )
    )
    try:
        yield controller
    finally:
        controller._present_devices = old_pd


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


@pytest.fixture
def fw_update_info() -> Dict[NodeId, str]:
    return {
        NodeId.head: "/some/path/head.hex",
        NodeId.gantry_x: "/some/path/gantry.hex",
    }


@pytest.fixture
def fw_node_info() -> Dict[NodeId, DeviceInfoCache]:
    node_cache1 = DeviceInfoCache(
        NodeId.head, 1, "12345678", None, PCBARevision(None), subidentifier=0
    )
    node_cache2 = DeviceInfoCache(
        NodeId.gantry_x, 1, "12345678", None, PCBARevision(None), subidentifier=0
    )
    return {NodeId.head: node_cache1, NodeId.gantry_x: node_cache2}


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
        axis_to_node(ax): (0.0, 0.0, True, True)
        for ax in OT3Axis.gantry_axes()
        if ax in axes_to_home and axis_to_node(ax) in controller._present_devices
    }
    if gantry_homes:
        yield gantry_homes

    pipette_homes = {
        axis_to_node(ax): (0.0, 0.0, True, True)
        for ax in OT3Axis.pipette_axes()
        if ax in axes_to_home and axis_to_node(ax) in controller._present_devices
    }
    yield pipette_homes


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_execute(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_devices
):
    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)
    # nothing has been homed
    assert not controller._motor_status

    commanded_homes = set(axes)
    await controller.home(axes, GantryLoad.LOW_THROUGHPUT)
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
    assert all(controller._motor_status[axis_to_node(ax)].motor_ok for ax in axes)
    assert controller.check_motor_status(axes)


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_prioritize_mount(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_devices
):
    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)
    # nothing has been homed
    assert not controller._motor_status

    await controller.home(axes, GantryLoad.LOW_THROUGHPUT)
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
    assert all(controller._motor_status[axis_to_node(ax)].motor_ok for ax in axes)
    assert controller.check_motor_status(axes)


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_build_runners(
    controller: OT3Controller, mock_move_group_run, axes, mock_present_devices
):
    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)
    assert not controller._motor_status

    await controller.home(axes, GantryLoad.LOW_THROUGHPUT)
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
    assert all(controller._motor_status[axis_to_node(ax)].motor_ok for ax in axes)
    assert controller.check_motor_status(axes)


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_only_present_devices(
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

    controller._present_devices = set(
        (NodeId.gantry_x, NodeId.gantry_y, NodeId.head_l, NodeId.head_r)
    )
    controller._position = starting_position

    mock_move_group_run.side_effect = move_group_run_side_effect(controller, axes)

    # nothing has been homed
    assert not controller._motor_status
    await controller.home(axes, GantryLoad.LOW_THROUGHPUT)

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
                    assert node in controller._present_devices
                    assert step  # don't pass in empty steps
                    homed_position[node] = 0.0  # track homed position for node

    # check that the current position is updated
    expected_position = {**starting_position, **homed_position}
    for node, pos in controller._position.items():
        assert pos == expected_position[node]
    # check that the homed axis is tracked by _homed_nodes
    assert controller._motor_status.keys() == homed_position.keys()


async def test_probing(
    controller: OT3Controller, mock_tool_detector: AsyncMock
) -> None:
    assert controller._present_devices == set()

    call_count = 0
    fake_nodes = set(
        (NodeId.gantry_x, NodeId.head, NodeId.pipette_left, NodeId.gripper)
    )
    passed_expected = None

    async def fake_probe(expected, timeout):
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

    with patch.object(controller._network_info, "probe", fake_probe), patch.object(
        controller, "get_attached_instruments", fake_gai
    ):
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
    assert controller._present_devices == set(
        (
            NodeId.gantry_x,
            NodeId.head,
            NodeId.pipette_left,
            NodeId.gripper,
        )
    )


@pytest.mark.parametrize(
    "tool_summary,pipette_id,gripper_id,gripper_name",
    [
        (
            ToolSummary(
                left=PipetteInformation(
                    name=FirmwarePipetteName.p1000_single,
                    name_int=FirmwarePipetteName.p1000_single.value,
                    model="3.3",
                    serial="hello",
                ),
                right=None,
                gripper=GripperInformation(model="0.0", serial="fake_serial"),
            ),
            "P1KSV33hello",
            "GRPV00fake_serial",
            "Flex Gripper",
        ),
    ],
)
async def test_get_attached_instruments(
    controller: OT3Controller,
    mock_tool_detector: OneshotToolDetector,
    tool_summary: ToolSummary,
    pipette_id: str,
    gripper_id: str,
    gripper_name: str,
):
    async def fake_probe(expected, timeout):
        return set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head, NodeId.gripper))

    with patch.object(controller._network_info, "probe", fake_probe):
        assert await controller.get_attached_instruments({}) == {}

    mock_tool_detector.return_value = tool_summary

    with patch.object(controller._network_info, "probe", fake_probe):
        detected = await controller.get_attached_instruments({})
    assert list(detected.keys()) == [OT3Mount.LEFT, OT3Mount.GRIPPER]
    assert detected[OT3Mount.LEFT]["id"] == pipette_id
    assert detected[OT3Mount.GRIPPER]["id"] == gripper_id
    assert detected[OT3Mount.GRIPPER]["config"].display_name == gripper_name


async def test_get_attached_instruments_handles_unknown_name(
    controller: OT3Controller, mock_tool_detector: OneshotToolDetector
) -> None:
    async def fake_probe(expected, timeout):
        return set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head, NodeId.gripper))

    with patch.object(controller._network_info, "probe", fake_probe):
        assert await controller.get_attached_instruments({}) == {}

    tool_summary = ToolSummary(
        left=PipetteInformation(
            name=FirmwarePipetteName.unknown, name_int=41, model=30, serial="hello"
        ),
        right=None,
        gripper=GripperInformation(model=0.0, serial="fake_serial"),
    )
    mock_tool_detector.return_value = tool_summary

    with patch.object(controller._network_info, "probe", fake_probe):
        with pytest.raises(InvalidPipetteName):
            await controller.get_attached_instruments({})


async def test_get_attached_instruments_handles_unknown_model(
    controller: OT3Controller, mock_tool_detector: OneshotToolDetector
) -> None:
    async def fake_probe(expected, timeout):
        return set((NodeId.gantry_x, NodeId.gantry_y, NodeId.head, NodeId.gripper))

    with patch.object(controller._network_info, "probe", fake_probe):
        assert await controller.get_attached_instruments({}) == {}

    tool_summary = ToolSummary(
        left=PipetteInformation(
            name=FirmwarePipetteName.p1000_single,
            name_int=0,
            model="4.1",
            serial="hello",
        ),
        right=None,
        gripper=GripperInformation(model=0.0, serial="fake_serial"),
    )
    mock_tool_detector.return_value = tool_summary

    with patch.object(controller._network_info, "probe", fake_probe):
        with pytest.raises(InvalidPipetteModel):
            await controller.get_attached_instruments({})


async def test_gripper_home_jaw(controller: OT3Controller, mock_move_group_run):
    await controller.gripper_home_jaw(25)
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
    assert controller._present_devices == set()
    fake_present_devices = {NodeId.gantry_x, NodeId.gantry_y}
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
    ), patch.object(controller, "_present_devices", fake_present_devices):
        res = await controller.get_limit_switches()
        assert call_count == 1
        assert passed_nodes == {NodeId.gantry_x, NodeId.gantry_y}
        assert OT3Axis.X in res
        assert OT3Axis.Y in res


@pytest.mark.parametrize(
    "motor_status,ready",
    [
        ({}, False),
        ({NodeId.gripper_g: MotorStatus(True, True)}, False),
        (
            {
                NodeId.gantry_x: MotorStatus(True, True),
                NodeId.gantry_y: MotorStatus(True, True),
                NodeId.head_l: MotorStatus(False, True),
            },
            False,
        ),
        (
            {
                NodeId.gantry_x: MotorStatus(True, True),
                NodeId.gantry_y: MotorStatus(True, True),
                NodeId.head_l: MotorStatus(True, True),
            },
            True,
        ),
    ],
)
async def test_ready_for_movement(
    controller: OT3Controller,
    motor_status: MotorStatus,
    ready: bool,
) -> None:
    controller._motor_status = motor_status

    axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L]
    assert controller.check_motor_status(axes) == ready


@pytest.mark.parametrize("mount", [OT3Mount.LEFT, OT3Mount.RIGHT])
async def test_liquid_probe(
    mount: OT3Mount,
    controller: OT3Controller,
    fake_liquid_settings: LiquidProbeSettings,
    mock_move_group_run,
    mock_send_stop_threshold,
) -> None:
    await controller.liquid_probe(
        mount=mount,
        max_z_distance=fake_liquid_settings.max_z_distance,
        mount_speed=fake_liquid_settings.mount_speed,
        plunger_speed=fake_liquid_settings.plunger_speed,
        threshold_pascals=fake_liquid_settings.sensor_threshold_pascals,
        log_pressure=fake_liquid_settings.log_pressure,
    )
    move_groups = (mock_move_group_run.call_args_list[0][0][0]._move_groups)[0][0]
    head_node = axis_to_node(OT3Axis.by_mount(mount))
    tool_node = sensor_node_for_mount(mount)
    assert move_groups[head_node].stop_condition == MoveStopCondition.sync_line
    assert len(move_groups) == 2
    assert move_groups[head_node], move_groups[tool_node]


async def test_tip_action(controller: OT3Controller, mock_move_group_run) -> None:
    await controller.tip_action([OT3Axis.P_L], 33, -5.5, tip_action="clamp")
    for call in mock_move_group_run.call_args_list:
        move_group_runner = call[0][0]
        for move_group in move_group_runner._move_groups:
            assert move_group  # don't pass in empty groups
            assert len(move_group) == 1
        # we should be sending this command to the pipette axes to process.
        assert list(move_group[0].keys()) == [NodeId.pipette_left]
        step = move_group[0][NodeId.pipette_left]
        assert step.stop_condition == MoveStopCondition.none

    mock_move_group_run.reset_mock()

    await controller.tip_action([OT3Axis.P_L], 33, -5.5, tip_action="home")
    for call in mock_move_group_run.call_args_list:
        move_group_runner = call[0][0]
        for move_group in move_group_runner._move_groups:
            assert move_group  # don't pass in empty groups
            assert len(move_group) == 1
        # we should be sending this command to the pipette axes to process.
        assert list(move_group[0].keys()) == [NodeId.pipette_left]
        step = move_group[0][NodeId.pipette_left]
        assert step.stop_condition == MoveStopCondition.limit_switch


async def test_update_motor_status(
    mock_messenger: CanMessenger, controller: OT3Controller
) -> None:
    async def fake_gmp(
        can_messenger: CanMessenger, nodes: Set[NodeId], timeout: float = 1.0
    ):
        return {node: (0.223, 0.323, False, True) for node in nodes}

    with patch(
        "opentrons.hardware_control.backends.ot3controller.get_motor_position", fake_gmp
    ):
        nodes = set([NodeId.gantry_x, NodeId.gantry_y, NodeId.head])
        controller._present_devices = nodes
        await controller.update_motor_status()
        for node in nodes:
            assert controller._position.get(node) == 0.223
            assert controller._encoder_position.get(node) == 0.323
            assert controller._motor_status.get(node) == MotorStatus(False, True)


@pytest.mark.parametrize("axes", home_test_params)
async def test_update_motor_estimation(
    mock_messenger: CanMessenger, controller: OT3Controller, axes: Set[NodeId]
) -> None:
    async def fake_umpe(
        can_messenger: CanMessenger, nodes: Set[NodeId], timeout: float = 1.0
    ):
        return {node: (0.223, 0.323, False, True) for node in nodes}

    with patch(
        "opentrons.hardware_control.backends.ot3controller.update_motor_position_estimation",
        fake_umpe,
    ):
        nodes = [axis_to_node(a) for a in axes]
        for node in nodes:
            controller._motor_status.update(
                {node: MotorStatus(motor_ok=False, encoder_ok=True)}
            )
        await controller.update_motor_estimation(axes)
        for node in nodes:
            assert controller._position.get(node) == 0.223
            assert controller._encoder_position.get(node) == 0.323
            assert controller._motor_status.get(node) == MotorStatus(False, True)


@pytest.mark.parametrize(
    argnames=["gantry_load", "expected_call"],
    argvalues=[
        [GantryLoad.HIGH_THROUGHPUT, [NodeId.pipette_left]],  # this uses the Q motor
        [GantryLoad.LOW_THROUGHPUT, []],
    ],
)
async def test_set_default_currents(
    mock_present_devices: OT3Controller, gantry_load: GantryLoad, expected_call: bool
):
    mock_present_devices._present_devices.add(NodeId.gripper)
    with patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ) as mocked_currents:
        await mock_present_devices.update_to_default_current_settings(gantry_load)
        mocked_currents.assert_called_once_with(
            mocked_currents.call_args_list[0][0][0],
            mocked_currents.call_args_list[0][0][1],
            use_tip_motor_message_for=expected_call,
        )
        for k, v in mock_present_devices._current_settings.items():
            if k == OT3Axis.P_L and (
                gantry_load == GantryLoad.HIGH_THROUGHPUT
                and expected_call[0] == NodeId.pipette_left
            ):
                # q motor config
                v = mock_present_devices._current_settings[OT3Axis.Q]
                assert (
                    mocked_currents.call_args_list[0][0][1][axis_to_node(k)]
                    == v.as_tuple()
                )
            else:
                assert (
                    mocked_currents.call_args_list[0][0][1][axis_to_node(k)]
                    == v.as_tuple()
                )


@pytest.mark.parametrize(
    argnames=["active_current", "gantry_load", "expected_call"],
    argvalues=[
        [
            {OT3Axis.X: 1.0, OT3Axis.Y: 2.0},
            GantryLoad.LOW_THROUGHPUT,
            [{NodeId.gantry_x: 1.0, NodeId.gantry_y: 2.0}, []],
        ],
        [
            {OT3Axis.Q: 1.5},
            GantryLoad.HIGH_THROUGHPUT,
            [{NodeId.pipette_left: 1.5}, [NodeId.pipette_left]],
        ],
    ],
)
async def test_set_run_current(
    mock_present_devices: OT3Controller,
    active_current: OT3AxisMap[float],
    gantry_load: GantryLoad,
    expected_call: List[Any],
):
    with patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ):
        with patch(
            "opentrons.hardware_control.backends.ot3controller.set_run_current",
            spec=current_settings.set_run_current,
        ) as mocked_currents:
            await mock_present_devices.update_to_default_current_settings(gantry_load)
            await mock_present_devices.set_active_current(active_current)
            mocked_currents.assert_called_once_with(
                mocked_currents.call_args_list[0][0][0],
                expected_call[0],
                use_tip_motor_message_for=expected_call[1],
            )


@pytest.mark.parametrize(
    argnames=["hold_current", "gantry_load", "expected_call"],
    argvalues=[
        [
            {OT3Axis.P_L: 0.5, OT3Axis.Y: 0.8},
            GantryLoad.LOW_THROUGHPUT,
            [{NodeId.pipette_left: 0.5, NodeId.gantry_y: 0.8}, []],
        ],
        [
            {OT3Axis.Q: 0.8},
            GantryLoad.HIGH_THROUGHPUT,
            [{NodeId.pipette_left: 0.8}, [NodeId.pipette_left]],
        ],
    ],
)
async def test_set_hold_current(
    mock_present_devices: OT3Controller,
    hold_current: OT3AxisMap[float],
    gantry_load: GantryLoad,
    expected_call: List[Any],
):
    with patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ):
        with patch(
            "opentrons.hardware_control.backends.ot3controller.set_hold_current",
            spec=current_settings.set_hold_current,
        ) as mocked_currents:
            await mock_present_devices.update_to_default_current_settings(gantry_load)
            await mock_present_devices.set_hold_current(hold_current)
            mocked_currents.assert_called_once_with(
                mocked_currents.call_args_list[0][0][0],
                expected_call[0],
                use_tip_motor_message_for=expected_call[1],
            )


async def test_update_required_flag(
    mock_messenger: CanMessenger, controller: OT3Controller
) -> None:
    """Test that FirmwareUpdateRequired is raised when update_required flag is set."""
    axes = [OT3Axis.X, OT3Axis.Y]
    controller._present_devices = {NodeId.gantry_x, NodeId.gantry_y}

    with patch("builtins.open", mock_open()):
        # raise FirmwareUpdateRequired if the _update_required flag is set
        controller._update_required = True
        controller._initialized = True
        controller._check_updates = True
        with pytest.raises(FirmwareUpdateRequired):
            await controller.home(axes, GantryLoad.LOW_THROUGHPUT)


async def test_update_required_bypass_firmware_update(controller: OT3Controller):
    """Do not raise FirmwareUpdateRequired for update_firmware."""
    controller._update_required = True
    controller._initialized = True
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.firmware_update.utils.load_firmware_manifest"
    ):
        async for status_element in controller.update_firmware({}):
            pass


async def test_update_required_flag_false(controller: OT3Controller):
    """Do not raise FirmwareUpdateRequired if update_required is False."""
    controller._present_devices = {NodeId.gantry_x, NodeId.gantry_y}
    for node in controller._present_devices:
        controller._motor_status.update(
            {node: MotorStatus(motor_ok=False, encoder_ok=True)}
        )

    # update_required is false so dont raise FirmwareUpdateRequired
    controller._update_required = False
    controller._initialized = True
    controller._check_updates = True
    await controller.update_to_default_current_settings(GantryLoad.LOW_THROUGHPUT)

    async def fake_src(
        can_messenger: CanMessenger,
        current_settings: Dict[NodeId, float],
        use_tip_motor_message_for: List[NodeId],
    ) -> None:
        return None

    with patch(
        "opentrons.hardware_control.backends.ot3controller.set_run_current",
        fake_src,
    ):
        await controller.set_active_current({OT3Axis.X: 2})


async def test_update_required_flag_initialized(controller: OT3Controller):
    """Do not raise FirmwareUpdateRequired if initialized is False."""
    controller._present_devices = {NodeId.gantry_x, NodeId.gantry_y}
    for node in controller._present_devices:
        controller._motor_status.update(
            {node: MotorStatus(motor_ok=False, encoder_ok=True)}
        )

    # update_required is true, but initialized is false so dont raise FirmwareUpdateRequired
    controller._update_required = True
    controller._initialized = False
    controller._check_updates = True
    await controller.update_to_default_current_settings(GantryLoad.LOW_THROUGHPUT)

    async def fake_src(
        can_messenger: CanMessenger,
        current_settings: Dict[NodeId, float],
        use_tip_motor_message_for: List[NodeId],
    ) -> None:
        return None

    with patch(
        "opentrons.hardware_control.backends.ot3controller.set_run_current",
        fake_src,
    ):
        await controller.set_active_current({OT3Axis.X: 2})


async def test_update_required_flag_disabled(controller: OT3Controller):
    """Do not raise FirmwareUpdateRequired if check_updates is False."""
    controller._present_devices = {NodeId.gantry_x, NodeId.gantry_y}
    for node in controller._present_devices:
        controller._motor_status.update(
            {node: MotorStatus(motor_ok=False, encoder_ok=True)}
        )
    # update_required and initialized are true, but not check_updates, no exception
    controller._update_required = True
    controller._initialized = False
    controller._check_updates = False
    await controller.update_to_default_current_settings(GantryLoad.LOW_THROUGHPUT)

    async def fake_src(
        can_messenger: CanMessenger,
        current_settings: Dict[NodeId, float],
        use_tip_motor_message_for: List[NodeId],
    ) -> None:
        return None

    with patch(
        "opentrons.hardware_control.backends.ot3controller.set_run_current",
        fake_src,
    ):
        await controller.set_active_current({OT3Axis.X: 2})


async def test_update_firmware_update_required(
    controller: OT3Controller, fw_update_info: Dict[NodeId, str], fw_node_info
) -> None:
    """Test that updates are started when shortsha's dont match."""

    # no updates have been started, but lets set this to true so we can assert later on
    controller.update_required = True
    controller.initialized = True
    controller._network_info._device_info_cache = fw_node_info
    check_fw_update_return = {
        NodeId.head: (1, "/some/path/head.hex"),
        NodeId.gantry_x: (1, "/some/path/gantry.hex"),
    }
    with mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value=check_fw_update_return),
    ), mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe:
        async for status_element in controller.update_firmware({}):
            pass
        run_updates.assert_called_with(
            can_messenger=controller._messenger,
            usb_messenger=controller._usb_messenger,
            update_details=fw_update_info,
            retry_count=mock.ANY,
            timeout_seconds=mock.ANY,
            erase=True,
        )

        assert not controller.update_required
        probe.assert_called_once()


async def test_update_firmware_up_to_date(
    controller: OT3Controller,
    fw_update_info: Dict[NodeId, str],
) -> None:
    """Test that updates are not started if they are not required."""
    with mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate.run_updates"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe, mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value={}),
    ):
        async for status_element in controller.update_firmware({}):
            pass
        assert not controller.update_required
        run_updates.assert_not_called()
        probe.assert_not_called()


async def test_update_firmware_specified_nodes(
    controller: OT3Controller,
    fw_node_info: Dict[NodeId, DeviceInfoCache],
    fw_update_info: Dict[NodeId, str],
) -> None:
    """Test that updates are started if nodes are NOT out-of-date when nodes are specified."""
    for node_cache in fw_node_info.values():
        node_cache.shortsha = "978abcde"

    check_fw_update_return = {
        NodeId.head: (1, "/some/path/head.hex"),
        NodeId.gantry_x: (1, "/some/path/gantry.hex"),
    }
    controller._network_info._device_info_cache = fw_node_info

    with mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value=check_fw_update_return),
    ) as check_updates, mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe:
        async for status_element in controller.update_firmware(
            {}, targets={NodeId.head, NodeId.gantry_x}
        ):
            pass
        check_updates.assert_called_with(
            fw_node_info, {}, targets={NodeId.head, NodeId.gantry_x}, force=False
        )
        run_updates.assert_called_with(
            can_messenger=controller._messenger,
            usb_messenger=controller._usb_messenger,
            update_details=fw_update_info,
            retry_count=mock.ANY,
            timeout_seconds=mock.ANY,
            erase=True,
        )

        assert not controller.update_required
        probe.assert_called_once()


async def test_update_firmware_invalid_specified_node(
    controller: OT3Controller,
    fw_node_info: Dict[NodeId, DeviceInfoCache],
    fw_update_info: Dict[FirmwareUpdateType, UpdateInfo],
) -> None:
    """Test that only nodes in device_info_cache are updated when nodes are specified."""
    check_fw_update_return = {
        NodeId.head: (1, "/some/path/head.hex"),
        NodeId.gantry_x: (1, "/some/path/gantry.hex"),
    }
    controller._network_info._device_info_cache = fw_node_info
    with mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value=check_fw_update_return),
    ), mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate"
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe:
        async for status_element in controller.update_firmware(
            {}, targets={NodeId.head}
        ):
            pass
        run_updates.assert_called_with(
            can_messenger=controller._messenger,
            usb_messenger=controller._usb_messenger,
            update_details=fw_update_info,
            retry_count=mock.ANY,
            timeout_seconds=mock.ANY,
            erase=True,
        )

        assert not controller.update_required
        probe.assert_called_once()


async def test_update_firmware_progress(
    controller: OT3Controller,
    fw_node_info: Dict[NodeId, DeviceInfoCache],
    fw_update_info: Dict[FirmwareUpdateType, UpdateInfo],
) -> None:
    """Test that the progress is reported for nodes updating."""
    controller._network_info._device_info_cache = fw_node_info

    async def _fake_update_progress(
        fw_node_info: Dict[NodeId, DeviceInfoCache]
    ) -> AsyncIterator[Tuple[NodeId, StatusElement]]:
        for node_id in fw_node_info:
            await asyncio.sleep(0)
            progress_bar = [0, 0.2, 0.6, 0.8, 0.9, 1]
            for progress in progress_bar:
                if progress == 0:
                    status = FirmwareUpdateStatus.queued
                elif progress == 1:
                    status = FirmwareUpdateStatus.done
                else:
                    status = FirmwareUpdateStatus.updating
                yield (node_id, (status, progress))

    with mock.patch(
        "opentrons_hardware.firmware_update.check_firmware_updates",
        mock.Mock(return_value=fw_update_info),
    ), mock.patch(
        "opentrons_hardware.firmware_update.RunUpdate.run_updates",
        mock.Mock(return_value=_fake_update_progress(fw_node_info)),
    ) as run_updates, mock.patch.object(
        controller._network_info, "probe"
    ) as probe:
        async for update_status in controller.update_firmware({}):
            for update in update_status:
                node_id = sub_system_to_node_id(update.subsystem)
                assert node_id in fw_node_info
        run_updates.assert_called_once()

        assert not controller.update_required
        assert controller._update_tracker is None
        probe.assert_called_once()


@pytest.mark.parametrize("versions", [(1, 2, 3), (1, 1, 1), (1, 2, 2)])
def test_fw_versions(controller: OT3Controller, versions: Tuple[int, int, int]) -> None:
    info = {
        NodeId.head: DeviceInfoCache(
            NodeId.head,
            versions[0],
            "12345678",
            None,
            PCBARevision(None),
            subidentifier=0,
        ),
        NodeId.gantry_y: DeviceInfoCache(
            NodeId.gantry_y,
            versions[1],
            "12345678",
            None,
            PCBARevision(None),
            subidentifier=0,
        ),
        NodeId.pipette_right_bootloader: DeviceInfoCache(
            NodeId.pipette_right_bootloader,
            versions[2],
            "12345678",
            None,
            PCBARevision(None),
            subidentifier=2,
        ),
    }

    controller._network_info._device_info_cache = info
    assert controller.fw_version == {
        OT3SubSystem.head: versions[0],
        OT3SubSystem.gantry_y: versions[1],
        OT3SubSystem.pipette_right: versions[2],
    }
