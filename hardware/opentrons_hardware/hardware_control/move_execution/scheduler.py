"""Move Scheduler."""
import asyncio
from collections import defaultdict
import logging
from typing import List, Set, Tuple, Iterator, Union, Optional
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

from ..types import NodeDict, MotorPositionStatus
from .dispatcher import MoveExecutor
from .utils import move_message_from_step


log = logging.getLogger(__name__)


class MoveScheduler:
    """MoveScheduler converts each move group step into a CAN move message"""

    def __init__(
        self,
        move_groups: MoveGroups,
        start_index: int = 0,
        ignore_stalls: bool = False,
    ) -> None:
        self._move_groups = move_groups
        self._start_index = start_index
        self._ignore_stalls = ignore_stalls
        self._all_nodes = self._get_all_nodes(move_groups)
        self._scheduled_groups = []
        self._ready_for_executor = False

    def has_moves(self) -> bool:
        for move_group in self._move_groups:
            for move in move_group:
                for node, step in move.items():
                    return True
        return False

    @staticmethod
    def _get_all_nodes(move_groups: MoveGroups) -> Set[NodeId]:
        """Get all of the nodes in the move group runner's move gruops."""
        node_set: Set[NodeId] = set()
        for group in move_groups:
            for sequence in group:
                for node in sequence.keys():
                    node_set.add(node)
        return node_set

    @property
    def ready_for_executor(self) -> bool:
        return self._ready_for_executor
    
    async def run(self, can_messenger: CanMessenger) -> None:
        """First clear existing moves sent to devices, then send new move groups."""
        if self.has_moves():
            await self._clear_groups(can_messenger)
            await self._schedule_moves(can_messenger)

    async def _clear_groups(self, can_messenger: CanMessenger) -> None:
        """Send commands to clear all previously scheduled message groups.

        Args:
            can_messenger: a can messenger
        """
        error = await can_messenger.ensure_send(
            node_id=NodeId.broadcast,
            message=ClearAllMoveGroupsRequest(payload=EmptyPayload()),
            expected_nodes=list(self._all_nodes),
        )
        if error != ErrorCode.ok:
            log.warning("Clear move group failed")
        
    async def _schedule_moves(self, can_messenger: CanMessenger) -> None:
        for group_id, group in enumerate(self._move_groups, self._start_index):
            await self._schedule_move_group(group, group_id, can_messenger)

    async def _schedule_move_group(
        self,
        group: MoveGroup,
        group_id: int,
        can_messenger: CanMessenger
    ) -> None:
        for seq_id, sequence in enumerate(group):
            for node, step in sequence.items():
                move_message = move_message_from_step(step, group_id, seq_id)
                await can_messenger.send(
                    node_id=node,
                    message=move_message,
                )
                self._add_to_schedule(move_message)
            
            

    def _add_to_schedule(step: SingleMoveStep, message_id: UInt32Field):
        
