"""Class that dispatch motion on can bus."""
import asyncio
import logging
from typing import List, Set, Tuple, Iterator, Union, Optional
import time

from opentrons_shared_data.errors.exceptions import (
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
    MoveCompleted,
    ExecuteMoveGroupRequest,
    TipActionResponse,
    ErrorMessage,
    StopRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    ExecuteMoveGroupRequestPayload,
    EmptyPayload,
)
from opentrons_hardware.hardware_control.motion import (
    MoveGroups,
    MoveGroupTipActionStep,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
)
from opentrons_hardware.errors import raise_from_error_message

from opentrons_hardware.hardware_control.motion import MoveStopCondition

from .types import AcceptableMoves, CompletionPacket, Completions, GroupSchedule

log = logging.getLogger(__name__)

class


class MoveCoordinator:
    """A message listener that manages the sending of execute move group messages."""

    def __init__(self, schedule: List[GroupSchedule]) -> None:
        """Constructor."""
        # For each move group create a set identifying the node and seq id.
        self._schedule = schedule
        self._completion_queue: asyncio.Queue[CompletionPacket] = asyncio.Queue()
        self._event = asyncio.Event()
        self._errors: List[EnumeratedError] = []
        self._current_group: Optional[GroupSchedule] = None
        self._should_stop = False
    
    async def start(self, can_messenger: CanMessenger) -> Completions:
        """Start each move group after the prior has completed."""
        for group in self._schedule:
            await self._run_one_group(group, can_messenger)

        def _reify_queue_iter() -> Iterator[CompletionPacket]:
            while not self._completion_queue.empty():
                yield self._completion_queue.get_nowait()

        return list(_reify_queue_iter())

    async def _run_one_group(self, group: GroupSchedule, can_messenger: CanMessenger) -> None:
        self._event.clear()

        self._current_group = group
        log.debug(f"Executing move group {group.group_id}.")

        error = await can_messenger.ensure_send(
            node_id=NodeId.broadcast,
            message=ExecuteMoveGroupRequest(
                payload=ExecuteMoveGroupRequestPayload(
                    group_id=UInt8Field(group.group_id),
                    # TODO (al, 2021-11-8): The triggers should be populated
                    #  with actual values.
                    start_trigger=UInt8Field(0),
                    cancel_trigger=UInt8Field(0),
                )
            ),
            expected_nodes=group.all_nodes,
        )

        if error != ErrorCode.ok:
            log.error(f"received error trying to execute move group: {str(error)}")

        expected_time = max(3.0, group.duration * 1.1)
        full_timeout = max(5.0, group.duration * 2)
        start_time = time.time()

        try:
            # The staged timeout handles some times when a move takes a liiiittle extra
            await asyncio.wait_for(
                self._event.wait(),
                full_timeout,
            )
            duration = time.time() - start_time
            await self._send_stop_if_necessary(can_messenger, group.group_id)

            if duration >= expected_time:
                log.warning(
                    f"Move set {str(group.group_id)} took longer ({duration} seconds) than expected ({expected_time} seconds)."
                )
        except asyncio.TimeoutError:
            missing_node_msg = ", ".join(
                node.name for node in group.all_nodes
            )
            log.error(
                f"Move set {str(group_id)} timed out of max duration {full_timeout}. Expected time: {expected_time}. Missing: {group.moves}"
            )

            raise MotionFailedError(
                message="Command timed out",
                detail={
                    "missing-nodes": missing_node_msg,
                    "full-timeout": str(full_timeout),
                    "expected-time": str(expected_time),
                    "elapsed": str(time.time() - start_time),
                },
            )
        except EnumeratedError:
            log.exception("Cancelling move group scheduler")
            raise
        except BaseException as e:
            log.exception("canceling move group scheduler")
            raise PythonException(e) from e

    def _remove_move_group(
        self, message: AcceptableMoves, arbitration_id: ArbitrationId
    ) -> None:
        seq_id = message.payload.seq_id.value
        group_id = message.payload.group_id.value - self._start_at_index
        node_id = arbitration_id.parts.originating_node_id
        try:
            in_group = (node_id, seq_id) in self._moves[group_id]
            self._moves[group_id].remove((node_id, seq_id))
            self._completion_queue.put_nowait((arbitration_id, message))
            log.debug(
                f"Received completion for {node_id} group {group_id} seq {seq_id}"
                f", which {'is' if in_group else 'isn''t'} in group"
            )
            if not self._moves[group_id]:
                log.debug(f"Move group {group_id+self._start_at_index} has completed.")
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

    def _handle_error(
        self, message: ErrorMessage, arbitration_id: ArbitrationId
    ) -> None:
        try:
            message = raise_from_error_message(message, arbitration_id)
        except EnumeratedError as e:
            self._errors.append(e)
        severity = message.payload.severity.value
        node_name = NodeId(arbitration_id.parts.node_id).name
        log.error(f"Error during move group from {node_name} : {message}")
        if severity == ErrorSeverity.unrecoverable:
            self._should_stop = True
            self._event.set()

    def _handle_move_completed(
        self, message: AcceptableMoves, arbitration_id: ArbitrationId
    ) -> None:
        message_index = message.payload.message_index
        ack_id = message.payload.ack_id
        try:
            move = self._current_group.moves[message.payload.message_index]
            
            log.error(
                f"Homing move from node {node_id} completed without meeting condition {stop_cond}"
            )
            self._errors.append(
                MoveConditionNotMetError(
                    detail={
                        "node": NodeId(node_id).name,
                        "stop-condition": stop_cond.name,
                    }
                )
            )
                self._should_stop = True
                self._event.set()
            if (
                stop_cond.value & MoveStopCondition.stall.value
            ) and ack_id == MoveAckId.stopped_by_condition:
                # When an axis has a stop-on-stall move and stalls, it will clear the rest of its executing moves.
                # If we wait for those moves, we'll time out.
                remaining = [elem for elem in self._moves[group_id]]
                for move_node, move_seq in remaining:
                    if node_id == move_node:
                        self._moves[group_id].remove((move_node, move_seq))
                if not self._moves[group_id]:
                    self._event.set()
        except IndexError:
            # If we have two move group runners running at once, they each
            # pick up groups they don't care about, and need to not fail.
            pass

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Incoming message handler."""
        if isinstance(message, MoveCompleted):
            self._remove_move_group(message, arbitration_id)
            self._handle_move_completed(message, arbitration_id)
        elif isinstance(message, TipActionResponse):
            if self._handle_tip_action_motors(message):
                self._remove_move_group(message, arbitration_id)
                self._handle_move_completed(message, arbitration_id)
        elif isinstance(message, ErrorMessage):
            self._handle_error(message, arbitration_id)

    def _handle_tip_action_motors(self, message: TipActionResponse) -> bool:
        gear_id = GearMotorId(message.payload.gear_motor_id.value)
        group_id = message.payload.group_id.value - self._start_at_index
        seq_id = message.payload.seq_id.value
        self._expected_tip_action_motors[group_id][seq_id].remove(gear_id)
        if len(self._expected_tip_action_motors[group_id][seq_id]) == 0:
            return True
        return False


    def _filtered_errors(self) -> List[EnumeratedError]:
        """If multiple errors occurred, filter which ones we raise.

        This function primarily handles the case when an Estop is pressed during a run.
        Multiple kinds of error messages may arise, but the only one that is important
        to raise is the message about the Estop.
        """
        for err in self._errors:
            if isinstance(err, EStopActivatedError):
                return [err]
        return self._errors

    async def _send_stop_if_necessary(
        self, can_messenger: CanMessenger, group_id: int
    ) -> None:
        if self._should_stop:
            err = await can_messenger.ensure_send(
                node_id=NodeId.broadcast,
                message=StopRequest(payload=EmptyPayload()),
                expected_nodes=self._get_nodes_in_move_group(group_id),
            )
            if err != ErrorCode.stop_requested:
                log.warning("Stop request failed")
            if self._errors:
                errors_to_show = self._filtered_errors()
                if len(errors_to_show) > 1:
                    raise MotionFailedError(
                        "Motion failed with multiple errors", wrapping=errors_to_show
                    )
                else:
                    raise errors_to_show[0]
            else:
                # This happens when the move completed without stop condition
                raise MoveConditionNotMetError(detail={"group-id": str(group_id)})
        elif self._errors:
            log.warning(
                f"Recoverable firmware errors during {group_id}: {self._errors}"
            )

    