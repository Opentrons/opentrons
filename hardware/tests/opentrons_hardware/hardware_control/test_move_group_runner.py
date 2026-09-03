"""Tests for the move scheduler."""

import asyncio
import logging
from typing import Any, Dict, List, Tuple

import pytest
from mock import AsyncMock, MagicMock, call, patch
from numpy import float32, float64, int32
from opentrons_shared_data.errors.exceptions import (
    EnumeratedError,
    EStopActivatedError,
    MotionFailedError,
    MoveConditionNotMetError,
)

from opentrons_hardware.drivers.can_bus.can_messenger import (
    MessageListenerCallback,
)
from opentrons_hardware.firmware_bindings import ArbitrationId, ArbitrationIdParts
from opentrons_hardware.firmware_bindings.constants import (
    ErrorCode,
    ErrorSeverity,
    GearMotorId,
    MotorDriverErrorCode,
    MoveAckId,
    NodeId,
    PipetteTipActionType,
)
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
)
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as md,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    ErrorCodeField,
    ErrorSeverityField,
    GearMotorIdField,
    MotorPositionFlagsField,
    MoveStopConditionField,
    PipetteTipActionTypeField,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    AddLinearMoveRequest,
    HomeRequest,
    MoveCompleted,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    AddLinearMoveRequestPayload,
    EmptyPayload,
    ErrorMessagePayload,
    ExecuteMoveGroupRequestPayload,
    HomeRequestPayload,
    MoveCompletedPayload,
    ReadMotorDriverErrorStatusResponsePayload,
    TipActionResponsePayload,
)
from opentrons_hardware.firmware_bindings.utils import (
    Int32Field,
    UInt8Field,
    UInt32Field,
)
from opentrons_hardware.hardware_control.constants import (
    interrupts_per_sec,
)
from opentrons_hardware.hardware_control.motion import (
    MoveGroups,
    MoveGroupSingleAxisStep,
    MoveGroupSingleGripperStep,
    MoveGroupTipActionStep,
    MoveStopCondition,
    MoveType,
)
from opentrons_hardware.hardware_control.move_group_runner import (
    MoveGroupRunner,
    MoveScheduler,
    _CompletionPacket,
)
from opentrons_hardware.hardware_control.types import (
    MotorPositionStatus,
    MoveCompleteAck,
    NodeMap,
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
                    stay_engaged=True,
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
                    stay_engaged=False,
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
                            ack_id=UInt8Field(1),
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
                            ack_id=UInt8Field(1),
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
                            ack_id=UInt8Field(1),
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
                NodeId.gantry_x: MotorPositionStatus(
                    10, 40, False, False, MoveCompleteAck(1)
                )
            },
        ),
        (
            # multiple axes with different numbers of completions
            [
                (
                    _build_arb(NodeId.gantry_x),
                    MoveCompleted(
                        payload=MoveCompletedPayload(
                            ack_id=UInt8Field(1),
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
                            ack_id=UInt8Field(1),
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
                            ack_id=UInt8Field(1),
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
                NodeId.gantry_x: MotorPositionStatus(
                    10, 40, False, False, MoveCompleteAck(1)
                ),
                NodeId.gantry_y: MotorPositionStatus(
                    30, 40, False, False, MoveCompleteAck(1)
                ),
            },
        ),
        (
            [
                (
                    _build_arb(NodeId.pipette_left),
                    md.TipActionResponse(
                        payload=TipActionResponsePayload(
                            ack_id=UInt8Field(1),
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
            {
                NodeId.pipette_left: MotorPositionStatus(
                    10, 0, False, False, MoveCompleteAck(1)
                )
            },
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
    position_map: NodeMap[MotorPositionStatus],
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
        estop_errors_to_send: int = 0,
    ) -> None:
        """Constructor."""
        self._move_groups = move_groups
        self._listener = listener
        self._start_at_index = start_at_index
        self._estop_errors_to_send = estop_errors_to_send
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
                    code = ErrorCode.collision_detected
                    if self._estop_errors_to_send > 0:
                        self._estop_errors_to_send -= 1
                        code = ErrorCode.estop_detected
                    payload = ErrorMessagePayload(
                        severity=ErrorSeverityField(ErrorSeverity.unrecoverable),
                        error_code=ErrorCodeField(code),
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


async def test_multiple_move_error_estop_filtering(
    mock_can_messenger: AsyncMock, move_group_multiple_axes: MoveGroups
) -> None:
    """It should receive all of the errors but only report the Estop one."""
    subject = MoveScheduler(move_groups=move_group_multiple_axes)
    mock_sender = MockSendMoveErrorCompleter(
        move_group_multiple_axes, subject, estop_errors_to_send=1
    )
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    with pytest.raises(EStopActivatedError):
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


class MockSendMoveDriverErrorCompleter:
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
                    code = MotorDriverErrorCode.over_temperature
                    payload = ReadMotorDriverErrorStatusResponsePayload(
                        reg_addr=UInt8Field(111),
                        data=UInt32Field(code),
                    )
                    payload.message_index = message.payload.message_index
                    arbitration_id = ArbitrationId(
                        parts=ArbitrationIdParts(originating_node_id=node)
                    )
                    self.call_count += 1
                    self._listener(
                        md.ReadMotorDriverErrorStatusResponse(payload=payload),
                        arbitration_id,
                    )

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


async def test_single_move_driver_error(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send a start group command."""
    subject = MoveScheduler(move_groups=move_group_single)
    mock_sender = MockSendMoveDriverErrorCompleter(move_group_single, subject)
    mock_can_messenger.ensure_send.side_effect = mock_sender.mock_ensure_send
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    with pytest.raises(MotionFailedError):
        await subject.run(can_messenger=mock_can_messenger)
    assert mock_sender.call_count == 1


def _completion(
    node: NodeId,
    group_id: int,
    seq_id: int,
    message_index: int,
    position_um: int = 0,
    ack_id: int = 1,
) -> Tuple[md.MoveCompleted, ArbitrationId]:
    """Build a MoveCompleted that carries a chosen message index.

    BaseMessage.__post_init__ only assigns an index when the payload does not already
    have one, so stamping the payload before building the message preserves the choice.
    """
    payload = MoveCompletedPayload(
        group_id=UInt8Field(group_id),
        seq_id=UInt8Field(seq_id),
        current_position_um=UInt32Field(position_um),
        encoder_position_um=Int32Field(position_um),
        position_flags=MotorPositionFlagsField(0),
        ack_id=UInt8Field(ack_id),
    )
    payload.message_index = UInt32Field(message_index)
    return md.MoveCompleted(payload=payload), _build_arb(node)


def _tip_response(
    node: NodeId,
    group_id: int,
    seq_id: int,
    message_index: int,
    gear_motor_id: int,
) -> Tuple[md.TipActionResponse, ArbitrationId]:
    """Build a TipActionResponse that carries a chosen message index."""
    payload = TipActionResponsePayload(
        group_id=UInt8Field(group_id),
        seq_id=UInt8Field(seq_id),
        current_position_um=UInt32Field(0),
        encoder_position_um=Int32Field(0),
        position_flags=MotorPositionFlagsField(0),
        ack_id=UInt8Field(1),
        action=PipetteTipActionTypeField(0),
        success=UInt8Field(1),
        gear_motor_id=GearMotorIdField(gear_motor_id),
    )
    payload.message_index = UInt32Field(message_index)
    return md.TipActionResponse(payload=payload), _build_arb(node)


@pytest.fixture
def move_group_three_seq_one_node() -> MoveGroups:
    """One group of three sequences on a single Z node."""
    return [
        [
            {
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=float64(33.246),
                    velocity_mm_sec=float64(50),
                    duration_sec=float64(1),
                )
            },
            {
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=float64(48.396),
                    velocity_mm_sec=float64(50),
                    duration_sec=float64(1),
                )
            },
            {
                NodeId.head_r: MoveGroupSingleAxisStep(
                    distance_mm=float64(33.249),
                    velocity_mm_sec=float64(50),
                    duration_sec=float64(1),
                )
            },
        ]
    ]


def test_stale_foreign_completion_does_not_satisfy_live_move(
    move_group_three_seq_one_node: MoveGroups,
) -> None:
    """A completion for a move this group did not send must be ignored.

    This reproduces a field failure. Duplicate CAN frames belonging to an earlier move
    group were matched against the group that was executing, because every move reuses
    the same (node id, seq id) pairs. That satisfied the pending set early and let a
    stale position win the position vote, so the API cached a Z position of 0 while the
    axis was really 114.891 mm down, then computed the next move from there.
    """
    subject = MoveScheduler(
        move_group_three_seq_one_node,
        0,
        expected_completions={
            1001: (NodeId.head_r.value, 0, 0),
            1002: (NodeId.head_r.value, 0, 1),
            1003: (NodeId.head_r.value, 0, 2),
        },
    )

    # A frame for a live (node, seq) but carrying an index this group never sent.
    subject(*_completion(NodeId.head_r, 0, 2, message_index=277193, position_um=0))

    assert subject._moves[0] == {
        (NodeId.head_r.value, 0),
        (NodeId.head_r.value, 1),
        (NodeId.head_r.value, 2),
    }, "the stale completion must not satisfy a pending move"
    assert subject._completion_queue.empty(), "its position must not become a candidate"
    assert not subject._event.is_set(), "the group must not be declared complete"
    assert subject._dropped_foreign_completions == 1

    # The real completions still work, and the position that survives is the real one.
    subject(*_completion(NodeId.head_r, 0, 0, 1001, position_um=33246))
    subject(*_completion(NodeId.head_r, 0, 1, 1002, position_um=81642))
    subject(*_completion(NodeId.head_r, 0, 2, 1003, position_um=114891))

    assert subject._event.is_set()
    completions = []
    while not subject._completion_queue.empty():
        completions.append(subject._completion_queue.get_nowait())
    assert len(completions) == 3
    positions = MoveGroupRunner._accumulate_move_completions(completions)
    assert positions[NodeId.head_r].motor_position == pytest.approx(114.891)


def test_duplicate_completion_is_dropped(
    move_group_three_seq_one_node: MoveGroups,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """A completion delivered more than once must only be counted once."""
    subject = MoveScheduler(
        move_group_three_seq_one_node,
        0,
        expected_completions={
            1001: (NodeId.head_r.value, 0, 0),
            1002: (NodeId.head_r.value, 0, 1),
            1003: (NodeId.head_r.value, 0, 2),
        },
    )
    with caplog.at_level(logging.WARNING):
        subject(*_completion(NodeId.head_r, 0, 0, 1001, position_um=33246))
        subject(*_completion(NodeId.head_r, 0, 0, 1001, position_um=33246))

    assert subject._completion_queue.qsize() == 1
    assert subject._moves[0] == {(NodeId.head_r.value, 1), (NodeId.head_r.value, 2)}
    assert subject._dropped_duplicate_completions == 1
    assert subject._dropped_foreign_completions == 0
    assert "duplicate delivery" in caplog.text


def test_schedulers_only_consume_their_own_completions(
    move_group_three_seq_one_node: MoveGroups,
) -> None:
    """Concurrent runners share a bus and must not consume each other's completions.

    ot3controller.move() and home() both run two MoveGroupRunners through
    asyncio.gather, each with start_at_index 0, and every scheduler is a listener on
    the same messenger. Message index membership is what separates them.
    """
    first = MoveScheduler(
        move_group_three_seq_one_node,
        0,
        expected_completions={2001: (NodeId.head_r.value, 0, 0)},
    )
    second = MoveScheduler(
        move_group_three_seq_one_node,
        0,
        expected_completions={3001: (NodeId.head_r.value, 0, 0)},
    )
    for message in (
        _completion(NodeId.head_r, 0, 0, 2001, position_um=1000),
        _completion(NodeId.head_r, 0, 0, 3001, position_um=2000),
    ):
        first(*message)
        second(*message)

    assert first._completion_queue.qsize() == 1
    assert second._completion_queue.qsize() == 1
    assert first._dropped_foreign_completions == 1
    assert second._dropped_foreign_completions == 1
    assert first._completion_queue.get_nowait()[1].payload.message_index.value == 2001
    assert second._completion_queue.get_nowait()[1].payload.message_index.value == 3001


def test_tip_action_two_responses_share_one_message_index(
    move_group_tip_action_single: MoveGroups,
) -> None:
    """Both gear motor responses to one tip action request must be accepted.

    A single TipActionRequest is answered twice, once per gear motor, and both
    responses echo that one request's message index. Deduplicating on the index alone
    would drop the second response and hang tip handling, so the key includes the gear
    motor id.
    """
    subject = MoveScheduler(
        move_group_tip_action_single,
        0,
        expected_completions={1001: (NodeId.pipette_left.value, 0, 0)},
    )
    subject(*_tip_response(NodeId.pipette_left, 0, 0, 1001, gear_motor_id=1))
    assert subject._expected_tip_action_motors[0][0] == [GearMotorId.left]
    assert not subject._event.is_set()

    subject(*_tip_response(NodeId.pipette_left, 0, 0, 1001, gear_motor_id=0))
    assert subject._expected_tip_action_motors[0][0] == []
    assert subject._event.is_set()
    assert subject._completion_queue.qsize() == 1
    assert subject._dropped_duplicate_completions == 0

    # A third copy is a duplicate delivery and must be dropped, not raise.
    subject(*_tip_response(NodeId.pipette_left, 0, 0, 1001, gear_motor_id=0))
    assert subject._dropped_duplicate_completions == 1
    assert subject._completion_queue.qsize() == 1


def test_tip_action_response_for_unexpected_gear_motor_is_ignored(
    move_group_single: MoveGroups,
) -> None:
    """A tip action response for a move this scheduler does not own must not raise.

    A concurrently running gear axis runner's responses arrive at every scheduler. This
    used to raise ValueError out of a CAN listener callback, and
    CanMessenger._read_task only catches BinarySerializableException, so the frame was
    never dispatched to any listener registered after this one.
    """
    subject = MoveScheduler(move_group_single)
    before = set(subject._moves[0])

    subject(*_tip_response(NodeId.pipette_left, 0, 0, 1001, gear_motor_id=0))

    assert subject._moves[0] == before
    assert subject._completion_queue.empty()
    assert not subject._event.is_set()


def test_completion_for_out_of_range_group_is_ignored(
    move_group_single: MoveGroups,
) -> None:
    """A group id below start_at_index must not address the last group.

    group_id - start_at_index goes negative for a foreign frame, and a negative index
    would quietly select this scheduler's last group instead of raising IndexError.
    """
    subject = MoveScheduler(move_group_single, 1)
    before = set(subject._moves[0])

    subject(*_tip_response(NodeId.pipette_left, 0, 0, 1001, gear_motor_id=0))

    assert subject._moves[0] == before
    assert subject._completion_queue.empty()


async def test_send_groups_records_message_indices(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """Prep must record the message index of every request it sends."""
    subject = MoveGroupRunner(move_groups=move_group_multiple)
    await subject.prep(mock_can_messenger)

    sent = [c.kwargs["message"] for c in mock_can_messenger.send.call_args_list]
    assert subject._expected_completions is not None
    assert set(subject._expected_completions) == {
        m.payload.message_index.value for m in sent
    }
    assert len(subject._expected_completions) == len(sent) == 5
    assert (NodeId.gantry_y.value, 1, 0) in subject._expected_completions.values()


async def test_send_groups_records_nonzero_start_index(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """Recorded group ids must be the ones that go on the wire."""
    subject = MoveGroupRunner(move_groups=move_group_multiple, start_at_index=2)
    await subject.prep(mock_can_messenger)

    assert subject._expected_completions is not None
    assert {group for _, group, _ in subject._expected_completions.values()} == {
        2,
        3,
        4,
    }


async def test_reprep_replaces_expected_message_indices(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """Prepping a runner again must not keep the previous prep's expectations.

    Runners are reused in a loop, so carrying indices over would let one iteration
    accept the previous iteration's completions.
    """
    subject = MoveGroupRunner(move_groups=move_group_multiple)
    await subject.prep(mock_can_messenger)
    assert subject._expected_completions is not None
    first = set(subject._expected_completions)

    await subject.prep(mock_can_messenger)
    assert subject._expected_completions is not None
    second = set(subject._expected_completions)

    assert len(second) == len(first)
    assert first.isdisjoint(second)


async def test_move_forwards_expected_completions(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """The scheduler must be given the runner's recorded expectations."""
    subject = MoveGroupRunner(move_groups=move_group_single)
    with patch(
        "opentrons_hardware.hardware_control.move_group_runner.MoveScheduler"
    ) as scheduler_cls:
        scheduler_cls.return_value.run = AsyncMock(return_value=[])
        await subject.prep(mock_can_messenger)
        await subject.execute(mock_can_messenger)
    assert (
        scheduler_cls.call_args.kwargs["expected_completions"]
        is subject._expected_completions
    )


async def test_move_without_prep_does_not_validate() -> None:
    """A scheduler built without a preceding prep must accept every completion.

    None and an empty mapping are not the same: None disables validation, while an
    empty mapping would reject every completion and hang.
    """
    subject = MoveGroupRunner(move_groups=[])
    assert subject._expected_completions is None
    with patch(
        "opentrons_hardware.hardware_control.move_group_runner.MoveScheduler"
    ) as scheduler_cls:
        scheduler_cls.return_value.run = AsyncMock(return_value=[])
        await subject._move(MagicMock(), 0)
    assert scheduler_cls.call_args.kwargs["expected_completions"] is None


async def test_dropped_completion_counts_reach_the_timeout_error(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """A move that times out must report how many completions were refused.

    If the premise that firmware echoes a request's message index were ever wrong for
    some kind of move, this is what turns the resulting timeout into a diagnosis.
    """
    expected: Dict[int, Tuple[int, int, int]] = {1001: (NodeId.head.value, 0, 0)}
    subject = MoveScheduler(move_group_single, 0, expected_completions=expected)
    subject(*_completion(NodeId.head, 0, 0, message_index=999))

    with patch(
        "opentrons_hardware.hardware_control.move_group_runner.asyncio.wait_for",
        AsyncMock(side_effect=asyncio.TimeoutError),
    ):
        with pytest.raises(MotionFailedError) as exc_info:
            await subject.run(can_messenger=mock_can_messenger)

    assert exc_info.value.detail["dropped-completions"] == (
        "1 for moves this group did not send, 0 duplicate deliveries"
    )
