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
    AddBrushedLinearMoveRequest,
    TipActionRequest,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    GearMotorId,
    MoveAckId,
    MoveStopCondition,
)

SchedulableMoves = Union[AddLinearMoveRequest, HomeRequest, GripperGripRequest, GripperHomeRequest, AddBrushedLinearMoveRequest, TipActionRequest]
AcceptableMoveResponses = Union[MoveCompleted, TipActionResponse]
CompletionPacket = Tuple[ArbitrationId, AcceptableMoveResponses]
Completions = List[CompletionPacket]


HOME_CONDITIONS = (
    MoveStopCondition.limit_switch.value |
    MoveStopCondition.limit_switch_backoff.value |
    MoveStopCondition.encoder_position.value
)


@dataclass(order=True)
class MoveSchedule:
        
    message: SchedulableMoves
    node: NodeId
    seq_id: int = field(init=False)
    duration: float = field(init=False)

    def __post__init__(self):
        self.id = self.message.payload.message_index
        self.seq_id = self.message


@dataclass(order=True)
class GroupSchedule:

    group_id: int
    moves: Dict[UInt32Field, MoveSchedule]
    duration: float = field(init=False)
    all_nodes: Set[NodeId] = set()

    def __post__init__(self):
        for m in self.moves.values():
            self.duration += m.duration
            self.all_nodes.add(m.node)

