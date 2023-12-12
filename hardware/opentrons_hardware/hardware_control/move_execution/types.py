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

SchedulableMoves = Union[AddLinearMoveRequest, HomeRequest, GripperGripRequest, GripperHomeRequest, AddBrushedLinearMoveRequest, TipActionRequest]
AcceptableMoveResponses = Union[MoveCompleted, TipActionResponse]
CompletionPacket = Tuple[ArbitrationId, AcceptableMoveResponses]
Completions = List[CompletionPacket]


@dataclass(order=True)
class ScheduledMove:

    message_index: UInt32Field
    group_id: int
    seq_id: int
    node_id: int
    stop_condition: MoveStopCondition
    duration: float

    def __post_init__(self) -> None:
        self.acceptable_acks = MoveStopCondition.acceptable_ack(self.stop_condition)

    def accept_ack(self, ack: MoveAckId) -> bool:
        return True if ack in self.acceptable_acks else False



@dataclass(order=True)
class ScheduledTipActionMove(ScheduledMove):

    tip_action_motors: List[GearMotorId] = field(default_factory=list)

    def all_motors_repsonded(self) -> bool:
        return not self.tip_action_motors


@dataclass
class ScheduledGroupInfo:

    moves: Dict[int, SchedulableMoves]
    awaiting: List[int] = field(init=False)
    duration: float = field(init=False)        

    def moves_completed(self) -> bool:
        return not self.awaiting
