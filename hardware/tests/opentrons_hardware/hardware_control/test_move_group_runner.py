"""Tests for the move scheduler."""
import pytest
from mock import AsyncMock, call, MagicMock

from opentrons_hardware.drivers.can_bus import NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import MessageListener
from opentrons_hardware.drivers.can_bus.messages.message_definitions import (
    AddLinearMoveRequest,
)
from opentrons_hardware.drivers.can_bus.messages.payloads import (
    MoveGroupRequestPayload,
    AddLinearMoveRequestPayload,
    MoveCompletedPayload,
    ExecuteMoveGroupRequestPayload,
)
from opentrons_hardware.hardware_control.constants import interrupts_per_sec
from opentrons_hardware.hardware_control.motion import (
    MoveGroups,
    MoveGroupSingleAxisStep,
)
from opentrons_hardware.hardware_control.move_group_runner import (
    MoveGroupRunner,
    MoveScheduler,
)
from opentrons_hardware.drivers.can_bus.messages import (
    message_definitions as md,
    MessageDefinition,
)
from opentrons_hardware.utils import UInt8Field, Int32Field, UInt32Field


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
                    distance_mm=0, velocity_mm_sec=2, duration_sec=123
                )
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
                    distance_mm=0, velocity_mm_sec=235, duration_sec=2142
                ),
            }
        ],
        # Group 1
        [
            {
                NodeId.gantry_x: MoveGroupSingleAxisStep(
                    distance_mm=0, velocity_mm_sec=22, duration_sec=1
                ),
                NodeId.gantry_y: MoveGroupSingleAxisStep(
                    distance_mm=0, velocity_mm_sec=23, duration_sec=0
                ),
            }
        ],
        # Group 2
        [
            {
                NodeId.pipette: MoveGroupSingleAxisStep(
                    distance_mm=12, velocity_mm_sec=-23, duration_sec=1234
                ),
            },
            {
                NodeId.pipette: MoveGroupSingleAxisStep(
                    distance_mm=12, velocity_mm_sec=23, duration_sec=1234
                ),
            },
        ],
    ]


async def test_single_group_clear(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send a clear group command before setup."""
    subject = MoveGroupRunner(move_groups=move_group_single)
    await subject._clear_groups(can_messenger=mock_can_messenger)
    mock_can_messenger.send.assert_called_with(
        node_id=NodeId.broadcast,
        message=md.ClearMoveGroupRequest(
            payload=MoveGroupRequestPayload(group_id=UInt8Field(0))
        ),
    )


async def test_multi_group_clear(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """It should send a clear group command before setup."""
    subject = MoveGroupRunner(move_groups=move_group_multiple)
    await subject._clear_groups(can_messenger=mock_can_messenger)
    for i in range(len(move_group_multiple)):
        mock_can_messenger.send.assert_any_call(
            node_id=NodeId.broadcast,
            message=md.ClearMoveGroupRequest(
                payload=MoveGroupRequestPayload(group_id=UInt8Field(i))
            ),
        )


async def test_single_send_setup_commands(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send all the move group set up commands."""
    subject = MoveGroupRunner(move_groups=move_group_single)
    await subject._send_groups(can_messenger=mock_can_messenger)
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.head,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(0),
                seq_id=UInt8Field(0),
                velocity=Int32Field(
                    int(
                        move_group_single[0][0][NodeId.head].velocity_mm_sec
                        * interrupts_per_sec
                    )
                ),
                acceleration=Int32Field(0),
                duration=UInt32Field(
                    int(
                        move_group_single[0][0][NodeId.head].duration_sec
                        * interrupts_per_sec
                    )
                ),
            )
        ),
    )


async def test_multi_send_setup_commands(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """It should send all the move group set up commands."""
    subject = MoveGroupRunner(move_groups=move_group_multiple)
    await subject._send_groups(can_messenger=mock_can_messenger)

    # Group 0
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.head,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(0),
                seq_id=UInt8Field(0),
                velocity=Int32Field(
                    int(
                        move_group_multiple[0][0][NodeId.head].velocity_mm_sec
                        * interrupts_per_sec
                    )
                ),
                acceleration=Int32Field(0),
                duration=UInt32Field(
                    int(
                        move_group_multiple[0][0][NodeId.head].duration_sec
                        * interrupts_per_sec
                    )
                ),
            )
        ),
    )

    # Group 1
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.gantry_x,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(1),
                seq_id=UInt8Field(0),
                velocity=Int32Field(
                    int(
                        move_group_multiple[1][0][NodeId.gantry_x].velocity_mm_sec
                        * interrupts_per_sec
                    )
                ),
                acceleration=Int32Field(0),
                duration=UInt32Field(
                    int(
                        move_group_multiple[1][0][NodeId.gantry_x].duration_sec
                        * interrupts_per_sec
                    )
                ),
            )
        ),
    )

    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.gantry_y,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(1),
                seq_id=UInt8Field(0),
                velocity=Int32Field(
                    int(
                        move_group_multiple[1][0][NodeId.gantry_y].velocity_mm_sec
                        * interrupts_per_sec
                    )
                ),
                acceleration=Int32Field(0),
                duration=UInt32Field(
                    int(
                        move_group_multiple[1][0][NodeId.gantry_y].duration_sec
                        * interrupts_per_sec
                    )
                ),
            )
        ),
    )

    # Group 2
    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.pipette,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(2),
                seq_id=UInt8Field(0),
                velocity=Int32Field(
                    int(
                        move_group_multiple[2][0][NodeId.pipette].velocity_mm_sec
                        * interrupts_per_sec
                    )
                ),
                acceleration=Int32Field(0),
                duration=UInt32Field(
                    int(
                        move_group_multiple[2][0][NodeId.pipette].duration_sec
                        * interrupts_per_sec
                    )
                ),
            )
        ),
    )

    mock_can_messenger.send.assert_any_call(
        node_id=NodeId.pipette,
        message=AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(2),
                seq_id=UInt8Field(1),
                velocity=Int32Field(
                    int(
                        move_group_multiple[2][1][NodeId.pipette].velocity_mm_sec
                        * interrupts_per_sec
                    )
                ),
                acceleration=Int32Field(0),
                duration=UInt32Field(
                    int(
                        move_group_multiple[2][1][NodeId.pipette].duration_sec
                        * interrupts_per_sec
                    )
                ),
            )
        ),
    )


async def test_move() -> None:
    """It should register to listen for messages."""
    subject = MoveGroupRunner(move_groups=[])
    mock_can_messenger = MagicMock()
    await subject._move(mock_can_messenger)
    mock_can_messenger.add_listener.assert_called_once()
    mock_can_messenger.remove_listener.assert_called_once()


class MockSendMoveCompleter:
    """Side effect mock of CanMessenger.send that immediately completes moves."""

    def __init__(self, move_groups: MoveGroups, listener: MessageListener) -> None:
        """Constructor."""
        self._move_groups = move_groups
        self._listener = listener

    async def mock_send(
        self,
        node_id: NodeId,
        message: MessageDefinition,
    ) -> None:
        """Mock send function."""
        if isinstance(message, md.ExecuteMoveGroupRequest):
            # Iterate through each move in each sequence and send a move
            # completed for it.
            for seq_id, moves in enumerate(
                self._move_groups[message.payload.group_id.value]
            ):
                for node in moves.keys():
                    payload = MoveCompletedPayload(
                        group_id=message.payload.group_id,
                        seq_id=UInt8Field(seq_id),
                        current_position=UInt32Field(0),
                        node_id=UInt8Field(node.value),
                        ack_id=UInt8Field(0),
                    )
                    self._listener.on_message(md.MoveCompleted(payload=payload))


async def test_single_move(
    mock_can_messenger: AsyncMock, move_group_single: MoveGroups
) -> None:
    """It should send a start group command."""
    subject = MoveScheduler(move_groups=move_group_single)
    mock_sender = MockSendMoveCompleter(move_group_single, subject)
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    await subject.run(can_messenger=mock_can_messenger)

    mock_can_messenger.send.assert_has_calls(
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
            )
        ]
    )


async def test_multi_group_move(
    mock_can_messenger: AsyncMock, move_group_multiple: MoveGroups
) -> None:
    """It should start next group once the prior has completed."""
    subject = MoveScheduler(move_groups=move_group_multiple)
    mock_sender = MockSendMoveCompleter(move_group_multiple, subject)
    mock_can_messenger.send.side_effect = mock_sender.mock_send
    await subject.run(can_messenger=mock_can_messenger)

    mock_can_messenger.send.assert_has_calls(
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
            ),
        ]
    )
