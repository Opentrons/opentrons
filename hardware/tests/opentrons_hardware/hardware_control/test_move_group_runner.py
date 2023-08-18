"""Tests for the move scheduler."""
import pytest
from typing import List, Any, Tuple
from numpy import float64, float32, int32
from mock import AsyncMock, call, MagicMock, patch
from opentrons_shared_data.errors.exceptions import (
    MoveConditionNotMetError,
    EnumeratedError,
    MotionFailedError,
)
from opentrons_hardware.firmware_bindings import ArbitrationId, ArbitrationIdParts

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    ErrorCode,
    ErrorSeverity,
    PipetteTipActionType,
    MoveAckId,
)
from opentrons_hardware.drivers.can_bus.can_messenger import (
    MessageListenerCallback,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    AddLinearMoveRequest,
    HomeRequest,
    MoveCompleted,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    EmptyPayload,
    AddLinearMoveRequestPayload,
    MoveCompletedPayload,
    TipActionResponsePayload,
    ExecuteMoveGroupRequestPayload,
    HomeRequestPayload,
    ErrorMessagePayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    MotorPositionFlagsField,
    MoveStopConditionField,
    ErrorSeverityField,
    ErrorCodeField,
    GearMotorIdField,
    PipetteTipActionTypeField,
)
from opentrons_hardware.hardware_control.constants import (
    interrupts_per_sec,
)
from opentrons_hardware.hardware_control.motion import (
    MoveGroups,
    MoveGroupSingleAxisStep,
    MoveGroupSingleGripperStep,
    MoveGroupTipActionStep,
    MoveType,
    MoveStopCondition,
)
from opentrons_hardware.hardware_control.move_group_runner import (
    MoveGroupRunner,
    MoveScheduler,
    _CompletionPacket,
)

from opentrons_hardware.hardware_control.types import NodeMap
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as md,
    MessageDefinition,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    Int32Field,
    UInt32Field,
)


def calc_duration(step: MoveGroupSingleAxisStep) -> int:
    """Calculate duration."""
    return int(step.duration_sec * interrupts_per_sec)


def calc_velocity(step: MoveGroupSingleAxisStep) -> int:
    """Calculate velocity."""
    return int(step.velocity_mm_sec / interrupts_per_sec * (2**31))


def calc_acceleration(step: MoveGroupSingleAxisStep) -> int:
    """Calculate acceleration."""
    return int(
        step.acceleration_mm_sec_sq
        * 1000
        / interrupts_per_sec
        / interrupts_per_sec
        * (2**31)
    )


@pytest.fixture
def mock_can_messenger() -> AsyncMock:
    """Mock communication."""
    return AsyncMock()


@pytest.fixture
def move_group_single() -> MoveGroups:
    """Move group with one move."""
    return [
        [
            {
                NodeId.head: MoveGroupSingleAxisStep(
                    distance_mm=float64(246),
                    velocity_mm_sec=float64(2),
                    duration_sec=float64(1),
                )
            }
        ]
    ]


@pytest.fixture
def move_group_tip_action_single() -> MoveGroups:
    """Move group with one move."""
    return [
        [
            {
                NodeId.pipette_left: MoveGroupTipActionStep(
                    velocity_mm_sec=float64(2),
                    duration_sec=float64(1),
                    action=PipetteTipActionType.home,
                    stop_condition=MoveStopCondition.none,
                    acceleration_mm_sec_sq=float64(0),
                )
            }
        ]
    ]


@pytest.fixture
def move_group_tip_action_multiple() -> MoveGroups:
    """Move group with multiple moves."""
    return [
        [
            {
                NodeId.pipette_left: MoveGroupTipActionStep(
                    velocity_mm_sec=float64(2),
                    duration_sec=float64(1),
                    action=PipetteTipActionType.clamp,
                    stop_condition=MoveStopCondition.none,
                    acceleration_mm_sec_sq=float64(1),
                )
            },
            {
                NodeId.pipette_left: MoveGroupTipActionStep(
                    velocity_mm_sec=float64(2),
                    duration_sec=float64(1),
                    action=PipetteTipActionType.clamp,
                    stop_condition=MoveStopCondition.none,
                    acceleration_mm_sec_sq=float64(1),
                )
            },
            {
                NodeId.pipette_left: MoveGroupTipActionStep(
                    velocity_mm_sec=float64(2),
                    duration_sec=float64(1),
                    action=PipetteTipActionType.clamp,
                    stop_condition=MoveStopCondition.none,
                    acceleration_mm_sec_sq=float64(1),
                )
            },
        ]
    ]


@pytest.fixture
def move_group_gripper_multiple() -> MoveGroups:
    """Collection of gripper moves."""
    return [
        # Group 0 home
        [
            {
                NodeId.gripper_g: MoveGroupSingleGripperStep(
                    duration_sec=float64(1),
                    pwm_duty_cycle=float32(50),
                    encoder_position_um=int32(0),
                    stop_condition=MoveStopCondition.limit_switch,
                    move_type=MoveType.home,
                ),
            }
        ],
        # group 1 grip
        [
            {
                NodeId.gripper_g: MoveGroupSingleGripperStep(
                    duration_sec=float64(1),
                    pwm_duty_cycle=float32(50),
                    encoder_position_um=int32(0),
                    stop_condition=MoveStopCondition.gripper_force,
                    move_type=MoveType.grip,
                ),
            }
        ],
        # group 3 linear
        [
            {
                NodeId.gripper_g: MoveGroupSingleGripperStep(
                    duration_sec=float64(1),
                    pwm_duty_cycle=float32(50),
                    encoder_position_um=int32(80000),
                    stop_condition=MoveStopCondition.encoder_position,
                    move_type=MoveType.linear,
                ),
            }
        ],
    ]


@pytest.fixture
def move_group_home_single() -> MoveGroups:
    """Home Request."""
    return [
        # Group 0
        [
            {
                NodeId.head: MoveGroupSingleAxisStep(
                    distance_mm=float64(0),
                    velocity_mm_sec=float64(235),
                    duration_sec=float64(2142),
                    acceleration_mm_sec_sq=float64(1000),
                    stop_condition=MoveStopCondition.limit_switch,
                    move_type=MoveType.home,
                ),
            }
        ]
    ]


@pytest.fixture
def move_group_multiple() -> MoveGroups:
    """Move group with multiple moves."""
    return [
        # Group 0
        [
            {
                NodeId.head: MoveGroupSingleAxisStep(
                    distance_mm=float64(229),
                    velocity_mm_sec=float64(235),
                    duration_sec=float64(2142),
                    acceleration_mm_sec_sq=float64(1000),
                ),
            }
        ],
        # Group 1
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=float64(522),
                    velocity_mm_sec=float64(22),
                    duration_sec=float64(1),
                    acceleration_mm_sec_sq=float64(1000),
                ),
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=float64(25),
                    velocity_mm_sec=float64(23),
                    duration_sec=float64(0),
                    acceleration_mm_sec_sq=float64(1000),
                ),
            }
        ],
        # Group 2
        [
            {
                NodeId.pipette_left: MoveGroupSingleAxisStep(
                    distance_mm=float64(12),
                    velocity_mm_sec=float64(-23),
                    duration_sec=float64(1234),
                    acceleration_mm_sec_sq=float64(1000),
                ),
            },
            {
                NodeId.pipette_left: MoveGroupSingleAxisStep(
                    distance_mm=float64(12),
                    velocity_mm_sec=float64(23),
                    duration_sec=float64(1234),
                    acceleration_mm_sec_sq=float64(1000),
                ),
            },
        ],
    ]


async def test_no_groups_do_nothing(mock_can_messenger: AsyncMock) -> None:
    """It should not send any commands if there are no moves."""
    subject = MoveGroupRunner(move_groups=[])
    position = await subject.run(mock_can_messenger)
    mock_can_messenger.send.assert_not_called()
    assert position == {}


async def test_single_group_clear(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send a clear group command before setup."""
    subject = MoveGroupRunner(move_groups=move_group_single)
    await subject._clear_groups(can_messenger=mock_can_messenger)
    mock_can_messenger.ensure_send.assert_has_calls(
        [
            call(
                node_id=NodeId.broadcast,
                message=md.ClearAllMoveGroupsRequest(),
                expected_nodes=[NodeId.head],
            )
        ],
    )


async def test_multi_group_clear(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """It should send a clear group command before setup."""
    subject = MoveGroupRunner(move_groups=move_group_multiple)
    await subject.prep(can_messenger=mock_can_messenger)
    expected = subject.all_nodes()
    # Test that the expected nodes are correct
    for group in move_group_multiple:
        for step in group:
            for node in step.keys():
                assert node in expected

    mock_can_messenger.ensure_send.assert_has_calls(
        [
            call(
                node_id=NodeId.broadcast,
                message=md.ClearAllMoveGroupsRequest(),
                expected_nodes=list(expected),
            )
        ],
    )


async def test_home(
    mock_can_messenger: AsyncMock, move_group_home_single: MoveGroups
) -> None:
    """Test Home Request Functionality."""
    subject = MoveGroupRunner(move_groups=move_group_home_single)
    await subject.prep(can_messenger=mock_can_messenger)
    step = move_group_home_single[0][0].get(NodeId.head)
    assert isinstance(step, MoveGroupSingleAxisStep)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.head,
        message=HomeRequest(
            payload=HomeRequestPayload(
                group_id=UInt8Field(0),
                seq_id=UInt8Field(0),
                velocity_mm=Int32Field(calc_velocity(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )


async def test_single_send_setup_commands(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send all the move group set up commands."""
    subject = MoveGroupRunner(move_groups=move_group_single)
    await subject.prep(can_messenger=mock_can_messenger)
    step = move_group_single[0][0].get(NodeId.head)
    assert isinstance(step, MoveGroupSingleAxisStep)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.head,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(0),
                seq_id=UInt8Field(0),
                request_stop_condition=MoveStopConditionField(0),
                velocity_mm=Int32Field(calc_velocity(step)),
                acceleration_um=Int32Field(calc_acceleration(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )


@pytest.mark.parametrize(
    "stop_condition",
    [
        MoveStopCondition.none,
        MoveStopCondition.sync_line,
        MoveStopCondition.stall,
        MoveStopCondition.limit_switch,
    ],
)
async def test_send_ignore_stalls_requests(
    mock_can_messenger: AsyncMock,
    stop_condition: MoveStopCondition,
) -> None:
    """Moves sent should have ignore_stalls as part of the stop condition."""
    move_group: MoveGroups = [
        [
            {
                NodeId.head: MoveGroupSingleAxisStep(
                    distance_mm=float64(246),
                    velocity_mm_sec=float64(2),
                    duration_sec=float64(1),
                    stop_condition=stop_condition,
                )
            }
        ]
    ]
    subject = MoveGroupRunner(move_groups=move_group, ignore_stalls=True)
    await subject.prep(can_messenger=mock_can_messenger)
    step = move_group[0][0].get(NodeId.head)
    assert isinstance(step, MoveGroupSingleAxisStep)
    request_stop_condition = MoveStopConditionField(
        stop_condition.value + MoveStopCondition.ignore_stalls.value
    )
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.head,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(0),
                seq_id=UInt8Field(0),
                request_stop_condition=request_stop_condition,
                velocity_mm=Int32Field(calc_velocity(step)),
                acceleration_um=Int32Field(calc_acceleration(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )


async def test_multi_send_setup_commands(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """It should send all the move group set up commands."""
    subject = MoveGroupRunner(move_groups=move_group_multiple)
    await subject.prep(can_messenger=mock_can_messenger)

    # Group 0
    step = move_group_multiple[0][0].get(NodeId.head)
    assert isinstance(step, MoveGroupSingleAxisStep)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.head,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(0),
                seq_id=UInt8Field(0),
                request_stop_condition=MoveStopConditionField(0),
                velocity_mm=Int32Field(calc_velocity(step)),
                acceleration_um=Int32Field(calc_acceleration(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )

    # Group 1
    step = move_group_multiple[1][0].get(NodeId.gantry_x)
    assert isinstance(step, MoveGroupSingleAxisStep)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.gantry_x,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(1),
                seq_id=UInt8Field(0),
                request_stop_condition=MoveStopConditionField(0),
                velocity_mm=Int32Field(calc_velocity(step)),
                acceleration_um=Int32Field(calc_acceleration(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )

    step = move_group_multiple[1][0].get(NodeId.gantry_y)
    assert isinstance(step, MoveGroupSingleAxisStep)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.gantry_y,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(1),
                seq_id=UInt8Field(0),
                request_stop_condition=MoveStopConditionField(0),
                velocity_mm=Int32Field(calc_velocity(step)),
                acceleration_um=Int32Field(calc_acceleration(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )

    # Group 2
    step = move_group_multiple[2][0].get(NodeId.pipette_left)
    assert isinstance(step, MoveGroupSingleAxisStep)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.pipette_left,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(2),
                seq_id=UInt8Field(0),
                request_stop_condition=MoveStopConditionField(0),
                velocity_mm=Int32Field(calc_velocity(step)),
                acceleration_um=Int32Field(calc_acceleration(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )

    step = move_group_multiple[2][1].get(NodeId.pipette_left)
    assert isinstance(step, MoveGroupSingleAxisStep)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.pipette_left,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(2),
                seq_id=UInt8Field(1),
                request_stop_condition=MoveStopConditionField(0),
                velocity_mm=Int32Field(calc_velocity(step)),
                acceleration_um=Int32Field(calc_acceleration(step)),
                duration=UInt32Field(calc_duration(step)),
            )
        ),
    )


async def test_move() -> None:
    """It should register to listen for messages."""
    subject = MoveGroupRunner(move_groups=[])
    mock_can_messenger = MagicMock()
    await subject._move(mock_can_messenger, 0)
    mock_can_messenger.add_listener.assert_called_once()
    mock_can_messenger.remove_listener.assert_called_once()


class MockSendMoveCompleter:
    """Side effect mock of CanMessenger.send that immediately completes moves."""

    def __init__(
        self,
        move_groups: MoveGroups,
        listener: MessageListenerCallback,
        start_at_index: int = 0,
        ack_id: int = 1,
        ignore_seq_ids: List[int] = [],
    ) -> None:
        """Constructor."""
        self._move_groups = move_groups
        self._listener = listener
        self._start_at_index = start_at_index
        self._ack_id = ack_id
        self._ignore_seq_ids = ignore_seq_ids

    @property
    def groups(self) -> MoveGroups:
        """Retrieve the groups, for instance from a child class."""
        return self._move_groups

    async def mock_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
    ) -> None:
        """Mock send function."""
        if isinstance(message, md.ExecuteMoveGroupRequest):
            # Iterate through each move in each sequence and send a move
            # completed for it.
            payload = EmptyPayload()
            payload.message_index = message.payload.message_index
            arbitration_id = ArbitrationId(
                parts=ArbitrationIdParts(originating_node_id=node_id)
            )
            self._listener(md.Acknowledgement(payload=payload), arbitration_id)
            for seq_id, moves in enumerate(
                self._move_groups[message.payload.group_id.value - self._start_at_index]
            ):
                if seq_id in self._ignore_seq_ids:
                    continue
                for node, move in moves.items():
                    if isinstance(move, MoveGroupSingleAxisStep):
                        payload = MoveCompletedPayload(
                            group_id=message.payload.group_id,
                            seq_id=UInt8Field(seq_id),
                            current_position_um=UInt32Field(
                                int(move.distance_mm * 1000)
                            ),
                            encoder_position_um=Int32Field(
                                int(move.distance_mm * 4000)
                            ),
                            position_flags=MotorPositionFlagsField(0),
                            ack_id=UInt8Field(self._ack_id),
                        )
                        arbitration_id = ArbitrationId(
                            parts=ArbitrationIdParts(originating_node_id=node)
                        )
                        self._listener(
                            md.MoveCompleted(payload=payload), arbitration_id
                        )
                    elif isinstance(move, MoveGroupTipActionStep):
                        payload_1 = TipActionResponsePayload(
                            group_id=message.payload.group_id,
                            seq_id=UInt8Field(seq_id),
                            current_position_um=UInt32Field(
                                int(move.velocity_mm_sec * move.duration_sec * 1000)
                            ),
                            encoder_position_um=Int32Field(
                                int(move.velocity_mm_sec * 0)
                            ),
                            position_flags=MotorPositionFlagsField(0),
                            ack_id=UInt8Field(self._ack_id),
                            action=PipetteTipActionTypeField(move.action.value),
                            success=UInt8Field(1),
                            gear_motor_id=GearMotorIdField(1),
                        )
                        arbitration_id = ArbitrationId(
                            parts=ArbitrationIdParts(originating_node_id=node)
                        )
                        self._listener(
                            md.TipActionResponse(payload=payload_1), arbitration_id
                        )

                        payload_2 = TipActionResponsePayload(
                            group_id=message.payload.group_id,
                            seq_id=UInt8Field(seq_id),
                            current_position_um=UInt32Field(
                                int(move.velocity_mm_sec * move.duration_sec * 1000)
                            ),
                            encoder_position_um=Int32Field(
                                int(move.velocity_mm_sec * 0)
                            ),
                            position_flags=MotorPositionFlagsField(0),
                            ack_id=UInt8Field(self._ack_id),
                            action=PipetteTipActionTypeField(move.action.value),
                            success=UInt8Field(1),
                            gear_motor_id=GearMotorIdField(0),
                        )

                        self._listener(
                            md.TipActionResponse(payload=payload_2), arbitration_id
                        )

    async def mock_send_failure(
        self,
        node_id: NodeId,
        message: MessageDefinition,
    ) -> None:
        """Mock send function with incorrect number of responses."""
        if isinstance(message, md.ExecuteMoveGroupRequest):
            # Iterate through each move in each sequence and send a move
            # completed for it.
            payload = EmptyPayload()
            payload.message_index = message.payload.message_index
            arbitration_id = ArbitrationId(
                parts=ArbitrationIdParts(originating_node_id=node_id)
            )
            self._listener(md.Acknowledgement(payload=payload), arbitration_id)
            for seq_id, moves in enumerate(
                self._move_groups[message.payload.group_id.value - self._start_at_index]
            ):
                for node, move in moves.items():
                    if isinstance(move, MoveGroupTipActionStep):
                        payload_1 = TipActionResponsePayload(
                            group_id=message.payload.group_id,
                            seq_id=UInt8Field(seq_id),
                            current_position_um=UInt32Field(
                                int(move.velocity_mm_sec * move.duration_sec * 1000)
                            ),
                            encoder_position_um=Int32Field(
                                int(move.velocity_mm_sec * 0)
                            ),
                            position_flags=MotorPositionFlagsField(0),
                            ack_id=UInt8Field(self._ack_id),
                            action=PipetteTipActionTypeField(move.action.value),
                            success=UInt8Field(1),
                            gear_motor_id=GearMotorIdField(1),
                        )
                        arbitration_id = ArbitrationId(
                            parts=ArbitrationIdParts(originating_node_id=node)
                        )
                        self._listener(
                            md.TipActionResponse(payload=payload_1), arbitration_id
                        )

    async def mock_ensure_send_failure(
        self,
        node_id: NodeId,
        message: MessageDefinition,
        timeout: float = 3,
        expected_nodes: List[NodeId] = [],
    ) -> ErrorCode:
        """Mock ensure_send function."""
        await self.mock_send_failure(node_id, message)
        return ErrorCode.timeout

    async def mock_ensure_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
        timeout: float = 3,
        expected_nodes: List[NodeId] = [],
    ) -> ErrorCode:
        """Mock ensure_send function."""
        await self.mock_send(node_id, message)
        return ErrorCode.ok


class MockGripperSendMoveCompleter:
    """Side effect mock of CanMessenger.send that immediately completes moves."""

    def __init__(
        self,
        move_groups: MoveGroups,
        listener: MessageListenerCallback,
        start_at_index: int = 0,
    ) -> None:
        """Constructor."""
        self._move_groups = move_groups
        self._listener = listener
        self._start_at_index = start_at_index

    @property
    def groups(self) -> MoveGroups:
        """Retrieve the groups, for instance from a child class."""
        return self._move_groups

    async def mock_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
    ) -> None:
        """Mock send function."""
        if isinstance(message, md.ExecuteMoveGroupRequest):
            # Iterate through each move in each sequence and send a move
            # completed for it.
            payload = EmptyPayload()
            payload.message_index = message.payload.message_index
            arbitration_id = ArbitrationId(
                parts=ArbitrationIdParts(originating_node_id=node_id)
            )
            self._listener(md.Acknowledgement(payload=payload), arbitration_id)
            for seq_id, moves in enumerate(
                self._move_groups[message.payload.group_id.value - self._start_at_index]
            ):
                for node, move in moves.items():
                    ack_id = UInt8Field(1)
                    assert isinstance(move, MoveGroupSingleGripperStep)
                    if move.stop_condition == MoveStopCondition.limit_switch:
                        ack_id = UInt8Field(2)
                    payload = MoveCompletedPayload(
                        group_id=message.payload.group_id,
                        seq_id=UInt8Field(seq_id),
                        current_position_um=UInt32Field(int(0)),
                        encoder_position_um=Int32Field(int(0)),
                        position_flags=MotorPositionFlagsField(0),
                        ack_id=ack_id,
                    )
                    arbitration_id = ArbitrationId(
                        parts=ArbitrationIdParts(originating_node_id=node)
                    )
                    self._listener(md.MoveCompleted(payload=payload), arbitration_id)

    async def mock_ensure_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
        timeout: float = 3,
        expected_nodes: List[NodeId] = [],
    ) -> ErrorCode:
        """Mock ensure_send function."""
        await self.mock_send(node_id, message)
        return ErrorCode.ok


async def test_single_move(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send a start group command."""
    subject = MoveScheduler(move_groups=move_group_single)
    mock_sender = MockSendMoveCompleter(move_group_single, subject)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    position = await subject.run(can_messenger=mock_can_messenger)
    expected_nodes = []
    for mgs in move_group_single[0]:
        expected_nodes.extend([k for k in mgs.keys()])
    mock_can_messenger.ensure_send.assert_has_calls(
        calls=[
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(0),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=expected_nodes,
            )
        ]
    )
    assert len(position) == 1
    assert position[0][1].payload.current_position_um.value == 246000


async def test_home_timeout(
    mock_can_messenger: AsyncMock, move_group_home_single: MoveGroups
) -> None:
    """It should send a start group command."""
    subject = MoveScheduler(move_groups=move_group_home_single)
    mock_sender = MockSendMoveCompleter(move_group_home_single, subject, ack_id=3)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    with pytest.raises(MoveConditionNotMetError):
        await subject.run(can_messenger=mock_can_messenger)


@pytest.mark.parametrize(
    "move_group_tip_action",
    [
        "move_group_tip_action_single",
        "move_group_tip_action_multiple",
    ],
)
async def test_tip_action_move_runner_receives_two_responses(
    mock_can_messenger: AsyncMock, move_group_tip_action: MoveGroups, request: Any
) -> None:
    """The magic call function should receive two responses for a tip action."""
    with patch.object(MoveScheduler, "_handle_move_completed") as mock_move_complete:
        move_group_tip_action = request.getfixturevalue(move_group_tip_action)
        subject = MoveScheduler(move_groups=move_group_tip_action)
        mock_sender = MockSendMoveCompleter(move_group_tip_action, subject)
        mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
        mock_can_messenger.send.side_effect = mock_sender.mock_send
        await subject.run(can_messenger=mock_can_messenger)
        for i in range(len(move_group_tip_action[0])):
            assert isinstance(
                mock_move_complete.call_args_list[i][0][0], md.TipActionResponse
            )
            assert mock_move_complete.call_args_list[i][0][
                0
            ].payload.gear_motor_id == GearMotorIdField(0)


@pytest.mark.parametrize(
    "move_group_tip_action",
    [
        "move_group_tip_action_single",
        "move_group_tip_action_multiple",
    ],
)
async def test_tip_action_move_runner_position_updated(
    mock_can_messenger: AsyncMock, move_group_tip_action: MoveGroups, request: Any
) -> None:
    """Two responses from a tip action move are properly handled."""
    move_group_tip_action = request.getfixturevalue(move_group_tip_action)
    subject = MoveScheduler(move_groups=move_group_tip_action)
    mock_sender = MockSendMoveCompleter(move_group_tip_action, subject)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    completion_message = await subject.run(can_messenger=mock_can_messenger)
    assert len(completion_message) == len(move_group_tip_action[0])
    for i in range(len(completion_message)):
        assert completion_message[i][1].payload.current_position_um.value == 2000


@pytest.mark.parametrize(
    "move_group_tip_action",
    [
        "move_group_tip_action_single",
        "move_group_tip_action_multiple",
    ],
)
async def test_tip_action_move_runner_fail_receives_one_response(
    mock_can_messenger: AsyncMock,
    move_group_tip_action: MoveGroups,
    caplog: Any,
    request: Any,
) -> None:
    """Tip action move should fail if one or less responses received."""
    move_group_tip_action = request.getfixturevalue(move_group_tip_action)
    subject = MoveScheduler(move_groups=move_group_tip_action)
    mock_sender = MockSendMoveCompleter(move_group_tip_action, subject)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send_failure
    mock_can_messenger.send.side_effect = mock_sender.mock_send_failure

    with pytest.raises(MotionFailedError):
        await subject.run(can_messenger=mock_can_messenger)


async def test_multi_group_move(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """It should start next group once the prior has completed."""
    subject = MoveScheduler(move_groups=move_group_multiple)
    mock_sender = MockSendMoveCompleter(move_group_multiple, subject)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    position = await subject.run(can_messenger=mock_can_messenger)
    expected_nodes_list: List[List[NodeId]] = []

    # we have to do this weird list->set->list conversion to get the same
    # order as the one move_group_runner uses since sets hash things
    # in a way that doesn't preserve order
    for movegroup in move_group_multiple:
        expected_nodes = set()
        for seq_id, mgs in enumerate(movegroup):
            expected_nodes.update(set((k.value, seq_id) for k in mgs.keys()))
        expected_nodes_list.append([NodeId(n) for n, s in expected_nodes])

    # remove duplicates from the expected nodes lists
    for i, enl in enumerate(expected_nodes_list):
        res = []
        for n in enl:
            if n not in res:
                res.append(n)
        expected_nodes_list[i] = res

    mock_can_messenger.ensure_send.assert_has_calls(
        calls=[
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(0),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=expected_nodes_list[0],
            ),
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(1),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=expected_nodes_list[1],
            ),
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(2),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=expected_nodes_list[2],
            ),
        ]
    )
    assert len(position) == 5
    assert position[0][1].payload.current_position_um.value == 229000
    assert position[1][1].payload.current_position_um.value == 522000
    assert position[2][1].payload.current_position_um.value == 25000
    assert position[3][1].payload.current_position_um.value == 12000
    assert position[4][1].payload.current_position_um.value == 12000


async def test_multi_gripper_group_move(
    mock_can_messenger: AsyncMock, move_group_gripper_multiple: MoveGroups
) -> None:
    """It should start next group once the prior has completed."""
    subject = MoveScheduler(move_groups=move_group_gripper_multiple)
    mock_sender = MockGripperSendMoveCompleter(move_group_gripper_multiple, subject)
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    position = await subject.run(can_messenger=mock_can_messenger)

    mock_can_messenger.ensure_send.assert_has_calls(
        calls=[
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(0),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=[NodeId.gripper_g],
            ),
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(1),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=[NodeId.gripper_g],
            ),
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(2),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=[NodeId.gripper_g],
            ),
        ]
    )
    assert len(position) == 3


def _build_arb(from_node: NodeId) -> ArbitrationId:
    return ArbitrationId(ArbitrationIdParts(originating_node_id=from_node))


@pytest.mark.parametrize(
    "completions,position_map",
    [
        (
            # one axis, completions reversed compared to execution order
            [
                (
                    _build_arb(NodeId.gantry_x),
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            ack_id=UInt8Field(0),
                            group_id=UInt8Field(2),
                            seq_id=UInt8Field(2),
                            current_position_um=UInt32Field(10000),
                            encoder_position_um=Int32Field(10000 * 4),
                            position_flags=MotorPositionFlagsField(0),
                        )
                    ),
                ),
                (
                    _build_arb(NodeId.gantry_x),
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            ack_id=UInt8Field(0),
                            group_id=UInt8Field(2),
                            seq_id=UInt8Field(1),
                            current_position_um=UInt32Field(20000),
                            encoder_position_um=Int32Field(10000 * 4),
                            position_flags=MotorPositionFlagsField(0),
                        )
                    ),
                ),
                (
                    _build_arb(NodeId.gantry_x),
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            ack_id=UInt8Field(0),
                            group_id=UInt8Field(1),
                            seq_id=UInt8Field(2),
                            current_position_um=UInt32Field(30000),
                            encoder_position_um=Int32Field(10000 * 4),
                            position_flags=MotorPositionFlagsField(0),
                        )
                    ),
                ),
            ],
            {NodeId.gantry_x: (10, 40, False, False)},
        ),
        (
            # multiple axes with different numbers of completions
            [
                (
                    _build_arb(NodeId.gantry_x),
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            ack_id=UInt8Field(0),
                            group_id=UInt8Field(2),
                            seq_id=UInt8Field(2),
                            current_position_um=UInt32Field(10000),
                            encoder_position_um=Int32Field(10000 * 4),
                            position_flags=MotorPositionFlagsField(0),
                        )
                    ),
                ),
                (
                    _build_arb(NodeId.gantry_x),
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            ack_id=UInt8Field(0),
                            group_id=UInt8Field(2),
                            seq_id=UInt8Field(1),
                            current_position_um=UInt32Field(20000),
                            encoder_position_um=Int32Field(10000 * 4),
                            position_flags=MotorPositionFlagsField(0),
                        )
                    ),
                ),
                (
                    _build_arb(NodeId.gantry_y),
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            ack_id=UInt8Field(0),
                            group_id=UInt8Field(1),
                            seq_id=UInt8Field(2),
                            current_position_um=UInt32Field(30000),
                            encoder_position_um=Int32Field(10000 * 4),
                            position_flags=MotorPositionFlagsField(0),
                        )
                    ),
                ),
            ],
            {
                NodeId.gantry_x: (10, 40, False, False),
                NodeId.gantry_y: (30, 40, False, False),
            },
        ),
        (
            [
                (
                    _build_arb(NodeId.pipette_left),
                    md.TipActionResponse(
                        payload=TipActionResponsePayload(
                            ack_id=UInt8Field(0),
                            group_id=UInt8Field(2),
                            seq_id=UInt8Field(2),
                            current_position_um=UInt32Field(10000),
                            encoder_position_um=Int32Field(0),
                            position_flags=MotorPositionFlagsField(0),
                            action=PipetteTipActionTypeField(0),
                            success=UInt8Field(1),
                            gear_motor_id=GearMotorIdField(1),
                        )
                    ),
                ),
            ],
            {NodeId.pipette_left: (10, 0, False, False)},
        ),
        (
            # empty base case
            [],
            {},
        ),
    ],
)
def test_accumulate_move_completions(
    completions: List[_CompletionPacket],
    position_map: NodeMap[Tuple[float, float, bool, bool]],
) -> None:
    """Build correct move results."""
    assert MoveGroupRunner._accumulate_move_completions(completions) == position_map


@pytest.mark.parametrize("empty_group", [[], [[]], [[{}]]])
async def test_empty_groups(
    mock_can_messenger: AsyncMock, empty_group: List[Any]
) -> None:
    """Test that various kinds of empty groups result in no calls."""
    mg = MoveGroupRunner(empty_group)
    await mg.run(mock_can_messenger)
    mock_can_messenger.send.assert_not_called()


class MockSendMoveCompleterWithUnknown(MockSendMoveCompleter):
    """Completes moves, injecting an unknown group ID."""

    async def mock_send(self, node_id: NodeId, message: MessageDefinition) -> None:
        """Overrides the send method of the messenger."""
        if isinstance(message, md.ExecuteMoveGroupRequest):
            payload = EmptyPayload()
            payload.message_index = message.payload.message_index
            arbitration_id = ArbitrationId(
                parts=ArbitrationIdParts(originating_node_id=node_id)
            )
            self._listener(md.Acknowledgement(payload=payload), arbitration_id)
            groups = super().groups
            bad_id = len(groups)
            payload = MoveCompletedPayload(
                group_id=UInt8Field(bad_id),
                seq_id=UInt8Field(0),
                current_position_um=UInt32Field(0),
                encoder_position_um=Int32Field(0),
                position_flags=MotorPositionFlagsField(0),
                ack_id=UInt8Field(1),
            )
            sender = next(iter(groups[0][0].keys()))
            arbitration_id = ArbitrationId(
                parts=ArbitrationIdParts(originating_node_id=sender)
            )
            self._listener(md.MoveCompleted(payload=payload), arbitration_id)
        await super().mock_send(node_id, message)


async def test_handles_unknown_group_ids(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """Acks with unknown group ids should not cause crashes."""
    subject = MoveScheduler(move_group_single)
    mock_sender = MockSendMoveCompleterWithUnknown(move_group_single, subject)
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    # this should not throw
    await subject.run(can_messenger=mock_can_messenger)


async def test_groups_from_nonzero_index(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """Callers can specify a non-zero starting group."""
    subject = MoveScheduler(move_group_single, 1)
    mock_sender = MockSendMoveCompleter(move_group_single, subject, 1)
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    expected_nodes = []
    for mgs in move_group_single[0]:
        expected_nodes.extend([k for k in mgs.keys()])
    # this should not throw
    await subject.run(can_messenger=mock_can_messenger)
    mock_can_messenger.ensure_send.assert_has_calls(
        calls=[
            call(
                node_id=NodeId.broadcast,
                message=md.ExecuteMoveGroupRequest(
                    payload=ExecuteMoveGroupRequestPayload(
                        group_id=UInt8Field(1),
                        cancel_trigger=UInt8Field(0),
                        start_trigger=UInt8Field(0),
                    )
                ),
                expected_nodes=expected_nodes,
            )
        ]
    )


class MockSendMoveErrorCompleter:
    """Side effect mock of CanMessenger.send that immediately sends an error."""

    def __init__(
        self,
        move_groups: MoveGroups,
        listener: MessageListenerCallback,
        start_at_index: int = 0,
    ) -> None:
        """Constructor."""
        self._move_groups = move_groups
        self._listener = listener
        self._start_at_index = start_at_index
        self.call_count = 0

    @property
    def groups(self) -> MoveGroups:
        """Retrieve the groups, for instance from a child class."""
        return self._move_groups

    async def mock_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
    ) -> None:
        """Mock send function."""
        if isinstance(message, md.ExecuteMoveGroupRequest):
            # Iterate through each move in each sequence and send a move
            # completed for it.
            payload = EmptyPayload()
            payload.message_index = message.payload.message_index
            arbitration_id = ArbitrationId(
                parts=ArbitrationIdParts(originating_node_id=node_id)
            )
            self._listener(md.Acknowledgement(payload=payload), arbitration_id)
            for seq_id, moves in enumerate(
                self._move_groups[message.payload.group_id.value - self._start_at_index]
            ):
                for node, move in moves.items():
                    assert isinstance(move, MoveGroupSingleAxisStep)
                    payload = ErrorMessagePayload(
                        severity=ErrorSeverityField(ErrorSeverity.unrecoverable),
                        error_code=ErrorCodeField(ErrorCode.collision_detected),
                    )
                    payload.message_index = message.payload.message_index
                    arbitration_id = ArbitrationId(
                        parts=ArbitrationIdParts(originating_node_id=node)
                    )
                    self.call_count += 1
                    self._listener(md.ErrorMessage(payload=payload), arbitration_id)

    async def mock_ensure_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
        timeout: float = 3,
        expected_nodes: List[NodeId] = [],
    ) -> ErrorCode:
        """Mock ensure_send function."""
        await self.mock_send(node_id, message)
        return ErrorCode.ok


async def test_single_move_error(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send a start group command."""
    subject = MoveScheduler(move_groups=move_group_single)
    mock_sender = MockSendMoveErrorCompleter(move_group_single, subject)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    with pytest.raises(EnumeratedError):
        await subject.run(can_messenger=mock_can_messenger)
    assert mock_sender.call_count == 1


@pytest.fixture
def move_group_multiple_axes() -> MoveGroups:
    """Move group with two moves."""
    return [
        # Group 0
        [
            {
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=float64(25),
                    velocity_mm_sec=float64(23),
                    duration_sec=float64(1),
                    acceleration_mm_sec_sq=float64(1000),
                ),
            },
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=float64(25),
                    velocity_mm_sec=float64(23),
                    duration_sec=float64(1),
                    acceleration_mm_sec_sq=float64(1000),
                ),
            },
        ]
    ]


async def test_multiple_move_error(
    mock_can_messenger: AsyncMock, move_group_multiple_axes: MoveGroups
) -> None:
    """It should receive all of the errors."""
    subject = MoveScheduler(move_groups=move_group_multiple_axes)
    mock_sender = MockSendMoveErrorCompleter(move_group_multiple_axes, subject)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    with pytest.raises(EnumeratedError):
        await subject.run(can_messenger=mock_can_messenger)
    assert mock_sender.call_count == 2


@pytest.fixture
def move_group_with_stall() -> MoveGroups:
    """Move group with a stop-on-stall."""
    return [
        # Group 0
        [
            {
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=float64(229),
                    velocity_mm_sec=float64(235),
                    duration_sec=float64(2142),
                    acceleration_mm_sec_sq=float64(1000),
                    stop_condition=MoveStopCondition.stall,
                ),
            },
            {
                NodeId.head_l: MoveGroupSingleAxisStep(
                    distance_mm=float64(229),
                    velocity_mm_sec=float64(235),
                    duration_sec=float64(2142),
                    acceleration_mm_sec_sq=float64(1000),
                    stop_condition=MoveStopCondition.stall,
                ),
            },
        ],
    ]


async def test_moves_removed_on_stall_detected(
    mock_can_messenger: AsyncMock, move_group_with_stall: MoveGroups
) -> None:
    """Check that remaining moves for a node are removed when it stops on stall."""
    subject = MoveScheduler(move_groups=move_group_with_stall)
    mock_sender = MockSendMoveCompleter(
        move_group_with_stall,
        subject,
        ack_id=MoveAckId.stopped_by_condition,
        ignore_seq_ids=[1],
    )
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    await subject.run(can_messenger=mock_can_messenger)
