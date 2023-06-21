import mock
import pytest
from decoy import Decoy
from itertools import chain

from contextlib import nullcontext as does_not_raise
from typing import (
    Dict,
    List,
    Optional,
    Set,
    Tuple,
    Any,
    Iterator,
    AsyncIterator,
    ContextManager,
)

from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import (
    node_to_axis,
    axis_to_node,
    sensor_node_for_mount,
    subsystem_to_target,
    target_to_subsystem,
)
from opentrons.hardware_control.backends.subsystem_manager import SubsystemManager
from opentrons_hardware.drivers.can_bus.can_messenger import (
    MessageListenerCallback,
    MessageListenerCallbackFilter,
    CanMessenger,
)
from opentrons.config.types import OT3Config, GantryLoad, LiquidProbeSettings
from opentrons.config.robot_configs import build_config_ot3
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    PipetteName as FirmwarePipetteName,
    USBTarget,
)
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.binary_usb import SerialUsbDriver
from opentrons.hardware_control.types import (
    OT3Axis,
    OT3Mount,
    OT3AxisMap,
    MotorStatus,
    SubSystem,
    SubSystemState,
    UpdateStatus,
    UpdateState,
    TipStateType,
    FailedTipStateCheck,
)
from opentrons.hardware_control.errors import (
    FirmwareUpdateRequired,
    InvalidPipetteName,
    InvalidPipetteModel,
)

from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.hardware_control.motion import (
    MoveType,
    MoveStopCondition,
)
from opentrons_hardware.hardware_control.types import PCBARevision
from opentrons_hardware.hardware_control import current_settings
from opentrons_hardware.hardware_control.network import DeviceInfoCache
from opentrons_hardware.hardware_control.tools.types import (
    ToolSummary,
    PipetteInformation,
    GripperInformation,
)


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
def mock_messenger(can_message_notifier: MockCanMessageNotifier) -> mock.AsyncMock:
    """Mock can messenger."""
    messenger = mock.AsyncMock(spec=CanMessenger)
    messenger.add_listener.side_effect = can_message_notifier.add_listener
    return messenger


@pytest.fixture
def mock_can_driver(mock_messenger: mock.AsyncMock) -> AbstractCanDriver:
    return mock.AsyncMock(spec=AbstractCanDriver)


@pytest.fixture
def mock_usb_driver() -> SerialUsbDriver:
    return mock.AsyncMock(spec=SerialUsbDriver)


@pytest.fixture
def controller(
    mock_config: OT3Config, mock_can_driver: AbstractCanDriver
) -> Iterator[OT3Controller]:
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
def mock_send_stop_threshold() -> Iterator[mock.AsyncMock]:
    with mock.patch(
        "opentrons_hardware.sensors.sensor_driver.SensorDriver.send_stop_threshold",
        autospec=True,
    ) as mock_stop_threshold:
        yield mock_stop_threshold


@pytest.fixture
def mock_move_group_run() -> Iterator[mock.AsyncMock]:
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.MoveGroupRunner.run",
        autospec=True,
    ) as mock_mgr_run:
        mock_mgr_run.return_value = {}
        yield mock_mgr_run


def _device_info_entry(subsystem: SubSystem) -> Tuple[SubSystem, DeviceInfoCache]:
    return subsystem, DeviceInfoCache(
        target=subsystem_to_target(subsystem),
        version=2,
        flags=0,
        shortsha="abcdef",
        revision=PCBARevision(main="c2"),
        subidentifier=1,
        ok=True,
    )


def _subsystems_entry(info: DeviceInfoCache) -> Tuple[SubSystem, SubSystemState]:
    return target_to_subsystem(info.target), SubSystemState(
        ok=info.ok,
        current_fw_version=info.version,
        next_fw_version=2,
        current_fw_sha=info.shortsha,
        pcba_revision="A1",
        update_state=None,
        fw_update_needed=False,
    )


@pytest.fixture
def mock_present_devices(
    controller: OT3Controller, mock_subsystem_manager: SubsystemManager, decoy: Decoy
) -> None:
    decoy.when(mock_subsystem_manager.device_info).then_return(
        dict(
            _device_info_entry(subsys)
            for subsys in (
                SubSystem.pipette_left,
                SubSystem.gantry_x,
                SubSystem.gantry_y,
                SubSystem.head,
                SubSystem.pipette_right,
                SubSystem.gripper,
                SubSystem.rear_panel,
            )
        )
    )
    decoy.when(mock_subsystem_manager.targets).then_return(
        {
            NodeId.pipette_left,
            NodeId.pipette_right,
            NodeId.gripper,
            NodeId.gantry_x,
            NodeId.gantry_y,
            NodeId.head,
            USBTarget.rear_panel,
        }
    )


@pytest.fixture
def mock_subsystem_manager(
    controller: OT3Controller, decoy: Decoy
) -> Iterator[SubsystemManager]:
    with mock.patch.object(
        controller, "_subsystem_manager", decoy.mock(cls=SubsystemManager)
    ) as mock_subsystem:
        yield mock_subsystem


@pytest.fixture
def fw_update_info() -> Dict[NodeId, str]:
    return {
        NodeId.head: "/some/path/head.hex",
        NodeId.gantry_x: "/some/path/gantry.hex",
    }


@pytest.fixture
def fw_node_info() -> Dict[NodeId, DeviceInfoCache]:
    node_cache1 = DeviceInfoCache(
        NodeId.head, 1, "12345678", None, PCBARevision(None), subidentifier=0, ok=True
    )
    node_cache2 = DeviceInfoCache(
        NodeId.gantry_x,
        1,
        "12345678",
        None,
        PCBARevision(None),
        subidentifier=0,
        ok=True,
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


def move_group_run_side_effect(
    controller: OT3Controller, axes_to_home: List[OT3Axis]
) -> Iterator[Dict[NodeId, Tuple[float, float, bool, bool]]]:
    """Return homed position for axis that is present and was commanded to home."""
    motor_nodes = controller._motor_nodes()
    gantry_homes = {
        axis_to_node(ax): (0.0, 0.0, True, True)
        for ax in OT3Axis.gantry_axes()
        if ax in axes_to_home and axis_to_node(ax) in motor_nodes
    }
    if gantry_homes:
        yield gantry_homes

    pipette_homes = {
        axis_to_node(ax): (0.0, 0.0, True, True)
        for ax in OT3Axis.pipette_axes()
        if ax in axes_to_home and axis_to_node(ax) in motor_nodes
    }
    yield pipette_homes


@pytest.mark.parametrize("axes", home_test_params)
async def test_home_execute(
    controller: OT3Controller,
    mock_move_group_run: mock.AsyncMock,
    axes: List[OT3Axis],
    mock_present_devices: None,
) -> None:
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
    controller: OT3Controller,
    mock_move_group_run: mock.AsyncMock,
    axes: List[OT3Axis],
    mock_present_devices: None,
) -> None:
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
    controller: OT3Controller,
    mock_move_group_run: mock.AsyncMock,
    axes: List[OT3Axis],
    mock_present_devices: None,
) -> None:
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
    controller: OT3Controller,
    mock_move_group_run: mock.AsyncMock,
    axes: List[OT3Axis],
    mock_present_devices: None,
) -> None:
    starting_position = {
        NodeId.head_l: 20.0,
        NodeId.head_r: 85.0,
        NodeId.gantry_x: 68.0,
        NodeId.gantry_y: 54.0,
        NodeId.pipette_left: 30.0,
        NodeId.pipette_right: 110.0,
    }
    homed_position = {}

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
                    assert step  # don't pass in empty steps
                    homed_position[node] = 0.0  # track homed position for node

    # check that the current position is updated
    expected_position = {**starting_position, **homed_position}
    for node, pos in controller._position.items():
        assert pos == expected_position[node]
    # check that the homed axis is tracked by _homed_nodes
    assert controller._motor_status.keys() == homed_position.keys()


async def test_get_attached_instruments(
    controller: OT3Controller, mock_subsystem_manager: SubsystemManager, decoy: Decoy
) -> None:
    pipette_id = "P1KSV33hello"
    gripper_id = "GRPV00fake_serial"
    gripper_name = "Flex Gripper"
    decoy.when(mock_subsystem_manager.tools).then_return(
        ToolSummary(
            left=PipetteInformation(
                name=FirmwarePipetteName.p1000_single,
                name_int=FirmwarePipetteName.p1000_single.value,
                model="3.3",
                serial="hello",
            ),
            right=None,
            gripper=GripperInformation(model="0.0", serial="fake_serial"),
        )
    )

    detected = await controller.get_attached_instruments({})
    assert list(detected.keys()) == [OT3Mount.LEFT, OT3Mount.GRIPPER]
    assert detected[OT3Mount.LEFT]["id"] == pipette_id
    gripper_obj = detected[OT3Mount.GRIPPER]
    assert gripper_obj
    assert gripper_obj["id"] == gripper_id
    config = gripper_obj["config"]
    assert config
    assert config.display_name == gripper_name


async def test_get_attached_instruments_handles_unknown_name(
    controller: OT3Controller, mock_subsystem_manager: SubsystemManager, decoy: Decoy
) -> None:
    decoy.when(mock_subsystem_manager.tools).then_return(
        ToolSummary(
            left=PipetteInformation(
                name=FirmwarePipetteName.unknown,
                name_int=41,
                model="30",
                serial="hello",
            ),
            right=None,
            gripper=GripperInformation(
                model="0.0",
                serial="fake_serial",
            ),
        )
    )
    with pytest.raises(InvalidPipetteName):
        await controller.get_attached_instruments({})


async def test_get_attached_instruments_handles_unknown_model(
    controller: OT3Controller, mock_subsystem_manager: SubsystemManager, decoy: Decoy
) -> None:

    decoy.when(mock_subsystem_manager.tools).then_return(
        ToolSummary(
            left=PipetteInformation(
                name=FirmwarePipetteName.p1000_single,
                name_int=0,
                model="4.1",
                serial="hello",
            ),
            right=None,
            gripper=GripperInformation(model="0", serial="fake_serial"),
        )
    )
    with pytest.raises(InvalidPipetteModel):
        await controller.get_attached_instruments({})


async def test_gripper_home_jaw(
    controller: OT3Controller, mock_move_group_run: mock.AsyncMock
) -> None:
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


async def test_gripper_grip(
    controller: OT3Controller, mock_move_group_run: mock.AsyncMock
) -> None:
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


async def test_gripper_jaw_width(
    controller: OT3Controller, mock_move_group_run: mock.AsyncMock
) -> None:
    max_jaw_width = 134350
    await controller.gripper_hold_jaw(
        encoder_position_um=int((max_jaw_width - 80000) / 2)
    )
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


async def test_get_limit_switches(
    controller: OT3Controller,
    mock_subsystem_manager: SubsystemManager,
    decoy: Decoy,
) -> None:
    decoy.when(mock_subsystem_manager.device_info).then_return(
        dict(
            (
                _device_info_entry(SubSystem.gantry_x),
                _device_info_entry(SubSystem.gantry_y),
            )
        )
    )
    decoy.when(mock_subsystem_manager.targets).then_return(
        {NodeId.gantry_x, NodeId.gantry_y}
    )

    fake_response = {
        NodeId.gantry_x: UInt8Field(0),
        NodeId.gantry_y: UInt8Field(0),
    }

    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.get_limit_switches",
        autospec=True,
    ) as mock_hardware_get_limit_switches:
        mock_hardware_get_limit_switches.return_value = fake_response
        res = await controller.get_limit_switches()
        mock_hardware_get_limit_switches.assert_called_once_with(
            controller._messenger, {NodeId.gantry_x, NodeId.gantry_y}
        )
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
    motor_status: Dict[NodeId, MotorStatus],
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
    mock_move_group_run: mock.AsyncMock,
    mock_send_stop_threshold: mock.AsyncMock,
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


async def test_tip_action(
    controller: OT3Controller,
    mock_move_group_run: mock.AsyncMock,
) -> None:
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
    mock_messenger: CanMessenger, controller: OT3Controller, mock_present_devices: None
) -> None:
    async def fake_gmp(
        can_messenger: CanMessenger, nodes: Set[NodeId], timeout: float = 1.0
    ) -> Dict[NodeId, Tuple[float, float, bool, bool]]:
        return {node: (0.223, 0.323, False, True) for node in nodes}

    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.get_motor_position", fake_gmp
    ):
        nodes = set([NodeId.gantry_x, NodeId.gantry_y, NodeId.head_l, NodeId.head_r])
        await controller.update_motor_status()
        for node in nodes:
            assert controller._position.get(node) == 0.223
            assert controller._encoder_position.get(node) == 0.323
            assert controller._motor_status.get(node) == MotorStatus(False, True)


@pytest.mark.parametrize("axes", home_test_params)
async def test_update_motor_estimation(
    mock_messenger: CanMessenger,
    controller: OT3Controller,
    axes: List[OT3Axis],
    mock_present_devices: None,
) -> None:
    async def fake_umpe(
        can_messenger: CanMessenger, nodes: Set[NodeId], timeout: float = 1.0
    ) -> Dict[NodeId, Tuple[float, float, bool, bool]]:
        return {node: (0.223, 0.323, False, True) for node in nodes}

    with mock.patch(
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
    controller: OT3Controller,
    gantry_load: GantryLoad,
    expected_call: List[NodeId],
    mock_present_devices: None,
) -> None:
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ) as mocked_currents:
        await controller.update_to_default_current_settings(gantry_load)
        mocked_currents.assert_called_once_with(
            mocked_currents.call_args_list[0][0][0],
            mocked_currents.call_args_list[0][0][1],
            use_tip_motor_message_for=expected_call,
        )
        these_current_settings = controller._current_settings
        assert these_current_settings
        for k, v in these_current_settings.items():
            if k == OT3Axis.P_L and (
                gantry_load == GantryLoad.HIGH_THROUGHPUT
                and expected_call[0] == NodeId.pipette_left
            ):
                # q motor config
                v = these_current_settings[OT3Axis.Q]
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
    controller: OT3Controller,
    active_current: OT3AxisMap[float],
    gantry_load: GantryLoad,
    expected_call: List[Any],
    mock_present_devices: None,
) -> None:
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ):
        with mock.patch(
            "opentrons.hardware_control.backends.ot3controller.set_run_current",
            spec=current_settings.set_run_current,
        ) as mocked_currents:
            await controller.update_to_default_current_settings(gantry_load)
            await controller.set_active_current(active_current)
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
    controller: OT3Controller,
    hold_current: OT3AxisMap[float],
    gantry_load: GantryLoad,
    expected_call: List[Any],
    mock_present_devices: None,
) -> None:
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ):
        with mock.patch(
            "opentrons.hardware_control.backends.ot3controller.set_hold_current",
            spec=current_settings.set_hold_current,
        ) as mocked_currents:
            await controller.update_to_default_current_settings(gantry_load)
            await controller.set_hold_current(hold_current)
            mocked_currents.assert_called_once_with(
                mocked_currents.call_args_list[0][0][0],
                expected_call[0],
                use_tip_motor_message_for=expected_call[1],
            )


async def test_update_required_flag(
    mock_messenger: CanMessenger,
    controller: OT3Controller,
    mock_subsystem_manager: SubsystemManager,
    decoy: Decoy,
) -> None:
    """Test that FirmwareUpdateRequired is raised when update_required flag is set."""
    axes = [OT3Axis.X, OT3Axis.Y]
    decoy.when(mock_subsystem_manager.update_required).then_return(True)
    controller._initialized = True
    with pytest.raises(FirmwareUpdateRequired):
        await controller.home(axes, gantry_load=GantryLoad.LOW_THROUGHPUT)


async def test_update_required_bypass_firmware_update(
    controller: OT3Controller, mock_subsystem_manager: SubsystemManager, decoy: Decoy
) -> None:
    """Do not raise FirmwareUpdateRequired for update_firmware."""
    decoy.when(mock_subsystem_manager.update_required).then_return(True)

    async def _mock_update() -> AsyncIterator[UpdateStatus]:
        yield UpdateStatus(
            subsystem=SubSystem.gantry_x, state=UpdateState.done, progress=100
        )

    decoy.when(mock_subsystem_manager.update_firmware(set(), False)).then_return(
        _mock_update()
    )
    controller._initialized = True
    async for status_element in controller.update_firmware(set()):
        pass
    # raise FirmwareUpdateRequired if the _update_required flag is set
    controller._initialized = True
    with pytest.raises(FirmwareUpdateRequired):
        await controller.home([OT3Axis.X], gantry_load=GantryLoad.LOW_THROUGHPUT)


async def test_update_required_flag_false(
    controller: OT3Controller,
    mock_subsystem_manager: SubsystemManager,
    decoy: Decoy,
    mock_present_devices: None,
) -> None:
    """Do not raise FirmwareUpdateRequired if update_required is False."""

    decoy.when(mock_subsystem_manager.device_info).then_return(
        dict(
            (
                _device_info_entry(SubSystem.gantry_x),
                _device_info_entry(SubSystem.gantry_y),
            )
        )
    )
    decoy.when(mock_subsystem_manager.update_required).then_return(False)

    for node in controller._motor_nodes():
        controller._motor_status.update(
            {node: MotorStatus(motor_ok=False, encoder_ok=True)}
        )
    # update_required is false so dont raise FirmwareUpdateRequired
    controller._initialized = True
    controller._check_updates = True
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ):
        await controller.update_to_default_current_settings(GantryLoad.LOW_THROUGHPUT)

    async def fake_src(
        can_messenger: CanMessenger,
        current_settings: Dict[NodeId, float],
        use_tip_motor_message_for: List[NodeId],
    ) -> None:
        return None

    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_run_current",
        fake_src,
    ):
        await controller.set_active_current({OT3Axis.X: 2})


async def test_update_required_flag_initialized(
    controller: OT3Controller,
    mock_subsystem_manager: SubsystemManager,
    mock_present_devices: None,
    decoy: Decoy,
) -> None:
    """Do not raise FirmwareUpdateRequired if initialized is False."""
    decoy.when(mock_subsystem_manager.update_required).then_return(True)

    for node in controller._motor_nodes():
        controller._motor_status.update(
            {node: MotorStatus(motor_ok=False, encoder_ok=True)}
        )

    # update_required is true, but initialized is false so dont raise FirmwareUpdateRequired
    controller._initialized = False
    controller._check_updates = True
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ):
        await controller.update_to_default_current_settings(GantryLoad.LOW_THROUGHPUT)

    async def fake_src(
        can_messenger: CanMessenger,
        current_settings: Dict[NodeId, float],
        use_tip_motor_message_for: List[NodeId],
    ) -> None:
        return None

    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_run_current",
        fake_src,
    ):
        await controller.set_active_current({OT3Axis.X: 2})


async def test_update_required_flag_disabled(
    controller: OT3Controller,
    mock_present_devices: None,
    decoy: Decoy,
    mock_subsystem_manager: SubsystemManager,
) -> None:
    """Do not raise FirmwareUpdateRequired if check_updates is False."""
    decoy.when(mock_subsystem_manager.update_required).then_return(True)

    for node in controller._motor_nodes():
        controller._motor_status.update(
            {node: MotorStatus(motor_ok=False, encoder_ok=True)}
        )
    # update_required and initialized are true, but not check_updates, no exception
    controller._initialized = False
    controller._check_updates = False
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_currents",
        spec=current_settings.set_currents,
    ):
        await controller.update_to_default_current_settings(GantryLoad.LOW_THROUGHPUT)

    async def fake_src(
        can_messenger: CanMessenger,
        current_settings: Dict[NodeId, float],
        use_tip_motor_message_for: List[NodeId],
    ) -> None:
        return None

    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.set_run_current",
        fake_src,
    ):
        await controller.set_active_current({OT3Axis.X: 2})


async def test_monitor_pressure(
    controller: OT3Controller,
    mock_move_group_run: mock.AsyncMock,
    mock_present_devices: None,
) -> None:
    mount = OT3Mount.LEFT
    mock_move_group_run.side_effect = move_group_run_side_effect(
        controller, [OT3Axis.P_L]
    )
    async with controller.monitor_overpressure(mount):
        await controller.home([OT3Axis.P_L], GantryLoad.LOW_THROUGHPUT)
    mock_move_group_run.assert_called_once()


@pytest.mark.parametrize(
    "tip_state_type, mocked_ejector_response, expectation",
    [
        [TipStateType.PRESENT, 1, does_not_raise()],
        [TipStateType.ABSENT, 0, does_not_raise()],
        [TipStateType.PRESENT, 0, pytest.raises(FailedTipStateCheck)],
        [TipStateType.ABSENT, 1, pytest.raises(FailedTipStateCheck)],
    ],
)
async def test_get_tip_present(
    controller: OT3Controller,
    tip_state_type: TipStateType,
    mocked_ejector_response: int,
    expectation: ContextManager[None],
) -> None:
    mount = OT3Mount.LEFT
    with mock.patch(
        "opentrons.hardware_control.backends.ot3controller.get_tip_ejector_state",
        return_value=mocked_ejector_response,
    ):
        with expectation:
            await controller.get_tip_present(mount, tip_state_type)
