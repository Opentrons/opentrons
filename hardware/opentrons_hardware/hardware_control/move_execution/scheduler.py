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
from opentrons_hardware.hardware_control.constants import (
    interrupts_per_sec,
    tip_interrupts_per_sec,
    brushed_motor_interrupts_per_sec,
)
from opentrons_hardware.errors import raise_from_error_message
from opentrons_hardware.hardware_control.motion import (
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

class MoveScheduler:

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
        self._scheduled = []
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
        
    async def _schedule_groups(self, can_messenger: CanMessenger) -> None:
        for group_id, group in enumerate(self._move_groups, self._start_index):
            for step_id, steps in enumerate(group):

            group_info = await self._schedule_move_group(group, group_id, can_messenger)
            self._scheduled.append(group_info)

    async def schedule(self, can_messenger: CanMessenger) -> None:
        """First clear existing moves sent to devices, then send new move groups."""
        if self.has_moves():
            self._clear_groups(can_messenger)
            self._schedule_groups(can_messenger)
            self._ready_for_executor = True

    async def _schedule_move_group(
        self,
        group: MoveGroup,
        group_id: int,
        can_messenger: CanMessenger
    ) -> ScheduledGroupInfo:
        
        

    def _get_message_type(
        self, step: SingleMoveStep, group: int, seq: int
    ) -> MessageDefinition:
        """Return the correct payload type."""
        if isinstance(step, MoveGroupSingleAxisStep):
            return self._get_stepper_motor_message(step, group, seq)
        elif isinstance(step, MoveGroupTipActionStep):
            return self._get_tip_action_motor_message(step, group, seq)
        else:
            return self._get_brushed_motor_message(step, group, seq)

    def _get_brushed_motor_message(
        self, step: MoveGroupSingleGripperStep, group: int, seq: int
    ) -> MessageDefinition:
        payload = GripperMoveRequestPayload(
            group_id=UInt8Field(group),
            seq_id=UInt8Field(seq),
            duration=UInt32Field(
                int(step.duration_sec * brushed_motor_interrupts_per_sec)
            ),
            duty_cycle=UInt32Field(int(step.pwm_duty_cycle)),
            encoder_position_um=Int32Field(int(step.encoder_position_um)),
            stay_engaged=UInt8Field(int(step.stay_engaged)),
        )
        if step.move_type == MoveType.home:
            return GripperHomeRequest(payload=payload)
        elif step.move_type == MoveType.grip:
            return GripperGripRequest(payload=payload)
        else:
            return AddBrushedLinearMoveRequest(payload=payload)

    def _get_stepper_motor_message(
        self, step: MoveGroupSingleAxisStep, group: int, seq: int
    ) -> MessageDefinition:
        if step.move_type == MoveType.home:
            home_payload = HomeRequestPayload(
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * interrupts_per_sec)),
                velocity_mm=self._convert_velocity(
                    step.velocity_mm_sec, interrupts_per_sec
                ),
            )
            return HomeRequest(payload=home_payload)
        else:
            stop_cond = step.stop_condition.value
            if self._ignore_stalls:
                stop_cond += MoveStopCondition.ignore_stalls.value
            linear_payload = AddLinearMoveRequestPayload(
                request_stop_condition=MoveStopConditionField(stop_cond),
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * interrupts_per_sec)),
                acceleration_um=Int32Field(
                    int(
                        (
                            step.acceleration_mm_sec_sq
                            * 1000.0
                            / interrupts_per_sec
                            / interrupts_per_sec
                        )
                        * (2**31)
                    )
                ),
                velocity_mm=Int32Field(
                    int((step.velocity_mm_sec / interrupts_per_sec) * (2**31))
                ),
            )
            return AddLinearMoveRequest(payload=linear_payload)

    def _get_tip_action_motor_message(
        self, step: MoveGroupTipActionStep, group: int, seq: int
    ) -> TipActionRequest:
        tip_action_payload = TipActionRequestPayload(
            group_id=UInt8Field(group),
            seq_id=UInt8Field(seq),
            duration=UInt32Field(int(step.duration_sec * tip_interrupts_per_sec)),
            velocity=self._convert_velocity(
                step.velocity_mm_sec, tip_interrupts_per_sec
            ),
            action=PipetteTipActionTypeField(step.action),
            request_stop_condition=MoveStopConditionField(step.stop_condition),
            acceleration=Int32Field(
                int(
                    (
                        step.acceleration_mm_sec_sq
                        * 1000.0
                        / tip_interrupts_per_sec
                        / tip_interrupts_per_sec
                    )
                    * (2**31)
                )
            ),
        )
        return TipActionRequest(payload=tip_action_payload)
    
    def _convert_velocity(
        self, velocity: Union[float, np.float64], interrupts: int
    ) -> Int32Field:
        return Int32Field(int((velocity / interrupts) * (2**31)))
