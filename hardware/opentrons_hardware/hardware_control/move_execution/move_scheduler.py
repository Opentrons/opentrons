"""Class that schedule motion on can bus."""
import asyncio
from dataclasses import dataclass, field
import logging
from typing import List, Set, Tuple, Iterator, Union, Optional
import numpy as np
import time

from opentrons_shared_data.errors.exceptions import (
    GeneralError,
    MoveConditionNotMetError,
    EnumeratedError,
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
    INTERRUPTS_PER_SEC,
    TIP_INTERRUPTS_PER_SEC,
    BRUSHED_MOTOR_INTERRUPTS_PER_SEC,
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
    MoveAckIdField,
)
from opentrons_hardware.hardware_control.motion import MoveStopCondition

from opentrons_hardware.hardware_control.types import NodeDict

log = logging.getLogger(__name__)

_SchedulableRequests = Union[AddLinearMoveRequest, HomeRequest, GripperGripRequest, GripperHomeRequest, AddBrushedLinearMoveRequest, TipActionRequest]
_AcceptableMoves = Union[MoveCompleted, TipActionResponse]
_CompletionPacket = Tuple[ArbitrationId, _AcceptableMoves]
_Completions = List[_CompletionPacket]


@dataclass(order=True)
class ScheduledMove:

    seq_id: int
    node_id: int
    stop_condition: MoveStopCondition
    duration: float
    tip_action_motors: List[GearMotorId] = field(default_factory=list)

    def is_done(self) -> bool:
        return True if not self.tip_action_motors else False
    
    def reject_ack(self, ack: UInt8Field) -> bool:
        if MoveAckId not in MoveStopCondition.acceptable_ack(self.stop_condition):
            log.error(f"Move failed: condition {self.stop_condition} not met")
            return True
        return False


_MoveGroupInfo = Set[ScheduledMove]


class MoveDispatcher:
    def __init__(self, scheduled_moves: List[_MoveGroupInfo], move_durations: List[float], start_index: int = 0):
        self._moves = scheduled_moves
        self._durations = move_durations
        self._start_index = start_index
    
        log.debug(f"Move scheduler running for groups {scheduled_moves}")
        self._completion_queue: asyncio.Queue[_CompletionPacket] = asyncio.Queue()
        self._event = asyncio.Event()
        self._error: Optional[ErrorMessage] = None

        self._current_group_id: Optional[int] = None
        self._current_nodes: List[NodeId] = []
        self._should_stop = False

    def _handle_error(
        self, message: ErrorMessage, arbitration_id: ArbitrationId
    ) -> None:
        self._error = message
        severity = message.payload.severity.value
        log.error(f"Error during move group: {message}")
        if severity == ErrorSeverity.unrecoverable:
            self._should_stop = True
            self._event.set()

    def _handle_move_responses(
        self, message: _AcceptableMoves, arbitration_id: ArbitrationId
    ) -> None:
        group_id = message.payload.group_id.value
        seq_id = message.payload.seq_id.value
        node_id = arbitration_id.parts.originating_node_id
        ack_id = message.payload.ack_id.value

        try:
            matched = next(filter(lambda m: m.seq_id == seq_id and m.node_id == node_id, self._moves[group_id]), None)
            log.debug(
                f"Received completion for {node_id} group {group_id} seq {seq_id}"
                f", which {'is' if matched else 'isn''t'} in group"
            )

            if matched:
                if isinstance(message, TipActionResponse):
                    gear_id = GearMotorId(message.payload.gear_motor_id.value)
                    matched.tip_action_motors.remove(gear_id)
                    if not matched.is_done():
                        return

                if matched.reject_ack(ack_id):
                    self._errors.append(
                        MoveConditionNotMetError(
                            detail={
                                "node": NodeId(node_id).name,
                                "stop-condition": matched.name,
                            }
                        )
                    )
                    self._should_stop = True
                    self._event.set()
                    return
                
                self._completion_queue.put_nowait((arbitration_id, message))
                self._moves[group_id].remove(matched)

                if ack_id == MoveAckId.stopped_by_condition:
                    # When an axis has a stop-on-stall move and stalls, it will clear the rest of its executing moves.
                    # If we wait for those moves, we'll time out.
                    remaining = [elem for elem in self._moves[group_id]]
                    for move_node, move_seq in remaining:
                        if node_id == move_node:
                            self._moves[group_id].remove((move_node, move_seq))
                    log.debug(f"Move condition met by {node_id}")

                if not self._moves[group_id]:
                    log.debug(f"Move group {group_id} has completed.")
                    self._event.set()

        except KeyError:
            log.warning(
                f"Got a move ack for ({node_id}, {seq_id}) which is not in this "
                "group; may have leaked from an earlier timed-out group"
            )
        except IndexError:
            # If we have two move groups running at once, we need to handle
            # moves from a group we don't own
            return

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Incoming message handler."""
        if isinstance(message, MoveCompleted) or isinstance(message, TipActionResponse):
            self._handle_move_responses(message, arbitration_id)
        elif isinstance(message, ErrorMessage):
            self._handle_error(message, arbitration_id)
    
    async def _send_stop_if_necessary(self, can_messenger: CanMessenger) -> None:
        if self._should_stop:
            err = await can_messenger.ensure_send(
                node_id=NodeId.broadcast,
                message=StopRequest(payload=EmptyPayload()),
                expected_nodes=self._current_nodes,
            )
            if err != ErrorCode.stop_requested:
                log.warning("Stop request failed")
            if self._errors:
                if len(self._errors) > 1:
                    raise MotionFailedError(
                        "Motion failed with multiple errors", wrapping=self._errors
                    )
                else:
                    raise self._errors[0]
            else:
                # This happens when the move completed without stop condition
                raise MoveConditionNotMetError(detail={"group-id": str(self._current_group + self._start_at_index)})
        elif self._errors:
            log.warning(
                f"Recoverable firmware errors during {self._current_group + self._start_at_index}: {self._errors}"
            )

    @classmethod
    def get_expected_nodes(cls, move_group: _MoveGroupInfo) -> Set[NodeId]:
        """Update the active nodes of the current move group."""
        return set(list(m.node_id for m in move_group))

    async def _run_one_group(self, group_id: int, can_messenger: CanMessenger) -> None:
        self._event.clear()

        log.debug(f"Executing move group {group_id}.")
        self._current_group = group_id - self._start_at_index
        self._current_nodes = self.get_expected_nodes(self._current_group)

        error = await can_messenger.ensure_send(
            node_id=NodeId.broadcast,
            message=ExecuteMoveGroupRequest(
                payload=ExecuteMoveGroupRequestPayload(
                    group_id=UInt8Field(group_id),
                    # TODO (al, 2021-11-8): The triggers should be populated
                    #  with actual values.
                    start_trigger=UInt8Field(0),
                    cancel_trigger=UInt8Field(0),
                )
            ),
            expected_nodes=self._current_nodes,
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error trying to execute move group {str(error)}")

        group_duration = self._scheduled_durations[self._current_group]
        expected_time = max(
            1.0, group_duration * 1.1
        )
        full_timeout = max(
            1.0, group_duration * 2
        )
        start_time = time.time()

        try:
            # The staged timeout handles some times when a move takes a liiiittle extra
            await asyncio.wait_for(
                self._event.wait(),
                full_timeout,
            )
            time_elasped = time.time() - start_time
            await self._send_stop_if_necessary(can_messenger, group_id)

            if time_elasped >= expected_time:
                log.warning(
                    f"Move set {str(group_id)} took longer ({time_elasped} seconds) than expected ({expected_time} seconds)."
                )
        except asyncio.TimeoutError:
            missing_node_msg = ", ".join(
                node.name for node in self._get_nodes_in_move_group(group_id)
            )
            log.error(
                f"Move set {str(group_id)} timed out of max duration {full_timeout}. Expected time: {expected_time}. Missing: {missing_node_msg}"
            )

            raise MotionFailedError(
                message="Command timed out",
                detail={
                    "missing-nodes": missing_node_msg,
                    "full-timeout": str(full_timeout),
                    "expected-time": expected_time,
                    "elapsed": str(time.time() - start_time),
                },
            )
        except EnumeratedError:
            log.exception("Cancelling move group scheduler")
            raise
        except BaseException as e:
            log.exception("canceling move group scheduler")
            raise PythonException(e) from e

    async def run(self, can_messenger: CanMessenger) -> _Completions:
        """Start each move group after the prior has completed."""

        for group_id in range(
            self._start_at_index, self._start_at_index + len(self._moves)
        ):
            await self._run_one_group(group_id, can_messenger)

        def _reify_queue_iter() -> Iterator[_CompletionPacket]:
            while not self._completion_queue.empty():
                yield self._completion_queue.get_nowait()

        return list(_reify_queue_iter())


class MoveScheduler:
    def __init__(self, move_groups: MoveGroups, start_at_index: int = 0, ignore_stalls: bool = False):
        self._move_groups = move_groups
        self._start_at_index = start_at_index
        self._scheduled: List[_MoveGroupInfo] = [[] for _ in move_groups]
        self._group_durations: List[float] = [0.0 for _ in move_groups]
        self._ignore_stalls = ignore_stalls
        self._ready_for_dispatch = False
    
    @property
    def ready_for_dispatch(self):
        return self._ready_for_dispatch

    @staticmethod
    def _has_moves(move_groups: MoveGroups) -> bool:
        for move_group in move_groups:
            for move in move_group:
                for node, step in move.items():
                    return True
        return False
    
    async def schedule_groups(self, can_messenger: CanMessenger) -> None:
        """Send commands to set up the message groups."""
    
        for group_i, group in enumerate(self._move_groups):
            for seq_i, sequence in enumerate(group):
                for node, step in sequence.items():
                    message = self.get_message_type(
                            step, group_i + self._start_at_index, seq_i, self._ignore_stalls
                        )
                    await can_messenger.send(node_id=node, message=message)
                    self._add_schedule(group_i, node, message)
                self._add_sequence_duration(group_i, sequence.values[0].duration_sec)
        self._ready_for_dispatch = True

    def _add_schedule(self, group_id: int, node: NodeId, message: _SchedulableRequests):
        self._scheduled[group_id].append(
            self._get_schedule_move(message, node)
        )
    
    def _add_sequence_duration(self, group_id: int, seq_duration: float):
        self._group_durations[group_id] += seq_duration

    @staticmethod
    def _get_schedule_move(message: _SchedulableRequests, node: NodeId) -> ScheduledMove:
        return ScheduledMove(
                seq_id=message.seq_id,
                node_id=node.value,
                stop_condition=message.payload.stop_condition,
                duration=float(message.payload.duration),
                tip_action_motors=([
                    GearMotorId.left, GearMotorId.right] if isinstance(message, MoveGroupTipActionStep) else [])   
            )        

    
    @classmethod
    def convert_velocity(
        cls, velocity: Union[float, np.float64], interrupts: int
    ) -> Int32Field:
        return Int32Field(int((velocity / interrupts) * (2**31)))
    
    @classmethod
    def convert_acceleration(
        cls, acceleration: Union[float, np.float64], interrupts: int
    ) -> Int32Field:
        return Int32Field(
            int((acceleration * 1000.0 / (interrupts ** 2)) * (2**31))
        )

    @classmethod
    def get_message_type(
        cls, step: SingleMoveStep, group: int, seq: int, ignore_stalls: bool = False,
    ) -> MessageDefinition:
        """Return the correct payload type."""
        if isinstance(step, MoveGroupSingleAxisStep):
            return cls.get_stepper_motor_message(step, group, seq, ignore_stalls)
        elif isinstance(step, MoveGroupTipActionStep):
            return cls.get_tip_action_motor_message(step, group, seq)
        else:
            return cls.get_brushed_motor_message(step, group, seq)

    @classmethod
    def get_brushed_motor_message(
        cls, step: MoveGroupSingleGripperStep, group: int, seq: int
    ) -> MessageDefinition:
        payload = GripperMoveRequestPayload(
            group_id=UInt8Field(group),
            seq_id=UInt8Field(seq),
            duration=UInt32Field(
                int(step.duration_sec * BRUSHED_MOTOR_INTERRUPTS_PER_SEC)
            ),
            duty_cycle=UInt32Field(int(step.pwm_duty_cycle)),
            encoder_position_um=Int32Field(int(step.encoder_position_um)),
        )
        if step.move_type == MoveType.home:
            return GripperHomeRequest(payload=payload)
        elif step.move_type == MoveType.grip:
            return GripperGripRequest(payload=payload)
        else:
            return AddBrushedLinearMoveRequest(payload=payload)

    @classmethod
    def get_stepper_motor_message(
        cls, step: MoveGroupSingleAxisStep, group: int, seq: int, ignore_stalls: bool = False,
    ) -> MessageDefinition:
        if step.move_type == MoveType.home:
            home_payload = HomeRequestPayload(
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * INTERRUPTS_PER_SEC)),
                velocity_mm=cls.convert_velocity(
                    step.velocity_mm_sec, INTERRUPTS_PER_SEC
                ),
            )
            return HomeRequest(payload=home_payload)
        else:
            stop_cond = step.stop_condition.value
            if ignore_stalls:
                stop_cond += MoveStopCondition.ignore_stalls.value
            linear_payload = AddLinearMoveRequestPayload(
                request_stop_condition=MoveStopConditionField(stop_cond),
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * INTERRUPTS_PER_SEC)),
                acceleration_um=cls.convert_acceleration(
                    step.acceleration_mm_sec_sq, INTERRUPTS_PER_SEC
                ),
                velocity_mm=cls.convert_velocity(
                    step.velocity_mm_sec, INTERRUPTS_PER_SEC
                ),
            )
            return AddLinearMoveRequest(payload=linear_payload)

    @classmethod
    def get_tip_action_motor_message(
        cls, step: MoveGroupTipActionStep, group: int, seq: int
    ) -> TipActionRequest:
        tip_action_payload = TipActionRequestPayload(
            group_id=UInt8Field(group),
            seq_id=UInt8Field(seq),
            duration=UInt32Field(int(step.duration_sec * TIP_INTERRUPTS_PER_SEC)),
            velocity=cls.convert_velocity(
                step.velocity_mm_sec, TIP_INTERRUPTS_PER_SEC
            ),
            action=PipetteTipActionTypeField(step.action),
            request_stop_condition=MoveStopConditionField(step.stop_condition),
        )
        return TipActionRequest(payload=tip_action_payload)

    def build_distpatcher(self) -> MoveDispatcher:
        if not self._ready_for_dispatch:
            raise RuntimeError("Move groups must be scheduled before dispatcher")
        return MoveDispatcher(self._move_groups, self._group_durations, self._start_at_index)
