from dataclasses import dataclass, field
from typing import Union, Tuple, List, Dict

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
    MoveStopCondition,
    MoveAckId,
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
    group_id: int
    seq_id: int
    node_id: int
    stop_condition: MoveStopCondition
    duration: float

    def accept_ack(self, ack: MoveAckId) -> bool:
        """Whether or not the ACK is acceptable for the move's stop condition."""
        if self.stop_condition in STRICT_CONDITIONS:
            return ack == MoveAckId.stopped_by_condition
        
        return ack in [
            MoveAckId.complete_without_condition,
            MoveAckId.stopped_by_condition
        ]



@dataclass(order=True)
class ScheduledTipActionMove(ScheduledMove):

    tip_action_motors: List[GearMotorId] = field(default_factory=list)

    def all_motors_repsonded(self) -> bool:
        return not self.tip_action_motors


@dataclass
class ScheduledGroup:

    moves: Dict[int, ScheduledMove]
    awaiting: List[UInt32Field] = field(init=False)
    duration: float = field(init=False)

    def __post_init__(self) -> None:
        self.awaiting = list(m.message_index for m in self.moves.values())
        self.duration = sum(m.duration for m in self.moves.values())

    def moves_completed(self) -> bool:
        return not self.awaiting
