from dataclasses import dataclass, field
from typing import Union, Tuple, List

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

    group_id: int
    moves: List[SchedulableMoves]
    duration: float = field(init=False)
    expected_nodes: List[NodeId] = field(init=False)

    def __post_init__(self) -> Moves:
        self.duration = sum(m.duration for m in self.moves)
        self.expected_nodes = list(set(NodeId(m.node_id) for m in self.moves))

    def all_moves_completed(self) -> bool:
        reutrn self.moves
