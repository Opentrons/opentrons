"""Move Scheduler."""
import asyncio
from dataclasses import dataclass, field
from collections import defaultdict
import logging
from typing import List, Set, Dict, Tuple, Iterator, Union, Optional, Generator
import numpy as np
import time

from opentrons_shared_data.errors.exceptions import (
    GeneralError,
    MoveConditionNotMetError,
    EnumeratedError,
    EStopActivatedError,
    MotionFailedError,
    PythonException,
)

from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    ErrorCode,
    ErrorSeverity,
    GearMotorId,
    MoveAckId,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ClearAllMoveGroupsRequest,
    AddLinearMoveRequest,
    MoveCompleted,
    ExecuteMoveGroupRequest,
    HomeRequest,
    GripperGripRequest,
    GripperHomeRequest,
    AddBrushedLinearMoveRequest,
    TipActionRequest,
    TipActionResponse,
    ErrorMessage,
    StopRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    AddLinearMoveRequestPayload,
    ExecuteMoveGroupRequestPayload,
    HomeRequestPayload,
    GripperMoveRequestPayload,
    TipActionRequestPayload,
    EmptyPayload,
)

from opentrons_hardware.hardware_control.motion import (
    MoveGroup,
    MoveGroups,
    MoveGroupSingleAxisStep,
    MoveGroupSingleGripperStep,
    MoveGroupTipActionStep,
    MoveType,
    SingleMoveStep,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    PipetteTipActionTypeField,
    MoveStopConditionField,
)
from opentrons_hardware.hardware_control.motion import MoveStopCondition
from opentrons_hardware.hardware_control.motor_position_status import (
    extract_motor_status_info,
)

from ..types import GroupSchedule, MoveSchedule
from .dispatcher import MoveExecutor
from .utils import move_message_from_step


log = logging.getLogger(__name__)

class Scheduler:
    """Scheduler converts each move group step into a CAN move message"""

    move_groups: MoveGroups
    start_index: int
    ignore_stalls: bool

    def __post__init__(self):
        self.all_nodes = self._get_all_nodes(self.move_groups)

    @staticmethod
    def _get_all_nodes(move_groups: MoveGroups) -> Set[NodeId]:
        """Get all of the nodes in the move group runner's move gruops."""
        node_set: Set[NodeId] = set()
        for group in move_groups:
            for sequence in group:
                for node in sequence.keys():
                    node_set.add(node)
        return node_set
    
    def generate_schedule(self) -> Generator[GroupSchedule]:
        for group_id, group in enumerate(self.move_groups, self.start_index):
            moves: Dict[UInt32Field, MoveSchedule] = []
            for seq_id, step_sequence in enumerate(group):
                for node, step in step_sequence.values():
                    message = move_message_from_step(step)
                    index = message.payload.message_index
                    moves[index] = MoveSchedule(message, node)
            yield GroupSchedule(group_id=group_id, moves=moves)
                    
