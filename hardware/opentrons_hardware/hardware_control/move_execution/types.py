from dataclasses import dataclass, field
from typing import Union, Tuple, List, Dict, Set

from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    AddLinearMoveRequest,
    HomeRequest,
    GripperGripRequest,
    GripperHomeRequest,
    MoveCompleted,
    TipActionResponse,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.firmware_bindings.constants import (
    GearMotorId,
    MoveAckId,
    MoveStopCondition,
)

SchedulableMoves = Union[AddLinearMoveRequest, HomeRequest, GripperGripRequest, GripperHomeRequest, AddBrushedLinearMoveRequest, TipActionRequest]
AcceptableMoveResponses = Union[MoveCompleted, TipActionResponse]
CompletionPacket = Tuple[ArbitrationId, AcceptableMoveResponses]
Completions = List[CompletionPacket]


STRICT_CONDITIONS = [
    MoveStopCondition.limit_switch,
    MoveStopCondition.encoder_position,
    MoveStopCondition.limit_switch_backoff,
]

@dataclass(order=True)
class ScheduledMove:

    message_index: UInt32Field
    seq_id: int
    node_id: int
    stop_condition: MoveStopCondition
    duration: float
    special_id: GearMotorId | None = None

    def accept_ack(self, ack: MoveAckId) -> bool:
        """Whether or not the ACK is acceptable for the move's stop condition."""
        if self.stop_condition in STRICT_CONDITIONS:
            return ack == MoveAckId.stopped_by_condition
        
        return ack in [
            MoveAckId.complete_without_condition,
            MoveAckId.stopped_by_condition
        ]


@dataclass
class ScheduledGroup:
                                                                                                    
    total_duration: float = 0.0
    moves: Dict[int, List[ScheduledMove]] = field(init=False)
    pending: Set[UInt32Field] = []

    def add(self, group_id: int, move: ScheduledMove) -> None:
        self.moves[group_id].append(move)
        self.pending.add(move.message_index)
        self.total_duration += move.duration

    def moves_completed(self) -> bool:
        return self.total_duration > 0.0 and not len(self.pending)

    def handel_complete(self, message_index: UInt32Field):
        self.pending.remove(message_index)
