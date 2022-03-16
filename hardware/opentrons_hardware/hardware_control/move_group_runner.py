"""Class that schedules motion on can bus."""
import asyncio
import logging
from typing import List, Set, Tuple

from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ClearAllMoveGroupsRequest,
    AddLinearMoveRequest,
    MoveCompleted,
    ExecuteMoveGroupRequest,
    HomeRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    AddLinearMoveRequestPayload,
    ExecuteMoveGroupRequestPayload,
    HomeRequestPayload,
)
from .constants import interrupts_per_sec
from opentrons_hardware.hardware_control.motion import (
    MoveGroups,
    MoveGroupSingleAxisStep,
    MoveType,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.hardware_control.motion import MoveStopCondition

log = logging.getLogger(__name__)


class MoveGroupRunner:
    """A move command scheduler."""

    def __init__(self, move_groups: MoveGroups) -> None:
        """Constructor.

        Args:
            move_groups: The move groups to run.
        """
        self._move_groups = move_groups

    async def run(self, can_messenger: CanMessenger) -> None:
        """Run the move group.

        Args:
            can_messenger: a can messenger
        """
        if not self._move_groups:
            log.debug("No moves. Nothing to do.")
            return

        await self._clear_groups(can_messenger)
        await self._send_groups(can_messenger)
        await self._move(can_messenger)

    async def _clear_groups(self, can_messenger: CanMessenger) -> None:
        """Send commands to clear the message groups.

        Args:
            can_messenger: a can messenger
        """
        await can_messenger.send(
            node_id=NodeId.broadcast,
            message=ClearAllMoveGroupsRequest(),
        )

    async def _send_groups(self, can_messenger: CanMessenger) -> None:
        """Send commands to set up the message groups."""
        for group_i, group in enumerate(self._move_groups):
            for seq_i, sequence in enumerate(group):
                for node, step in sequence.items():
                    await can_messenger.send(
                        node_id=node,
                        message=self._get_message_type(step, group_i, seq_i),
                    )

    def _convert_velocity(self, velocity: float, interrupts: int) -> Int32Field:
        return Int32Field(int((velocity / interrupts) * (2**31)))

    def _get_message_type(
        self, step: MoveGroupSingleAxisStep, group: int, seq: int
    ) -> MessageDefinition:
        """Return the correct payload type."""
        if step.move_type == MoveType.home:
            home_payload = HomeRequestPayload(
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * interrupts_per_sec)),
                velocity=self._convert_velocity(
                    step.velocity_mm_sec, interrupts_per_sec
                ),
            )
            return HomeRequest(payload=home_payload)

        else:
            linear_payload = AddLinearMoveRequestPayload(
                request_stop_condition=UInt8Field(step.stop_condition),
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * interrupts_per_sec)),
                acceleration=Int32Field(
                    int(
                        (
                            step.acceleration_mm_sec_sq
                            / interrupts_per_sec
                            / interrupts_per_sec
                        )
                        * (2**31)
                    )
                ),
                velocity=Int32Field(
                    int((step.velocity_mm_sec / interrupts_per_sec) * (2**31))
                ),
            )
            return AddLinearMoveRequest(payload=linear_payload)

    async def _move(self, can_messenger: CanMessenger) -> None:
        """Run all the move groups."""
        scheduler = MoveScheduler(self._move_groups)
        try:
            can_messenger.add_listener(scheduler)
            await scheduler.run(can_messenger)
        finally:
            can_messenger.remove_listener(scheduler)


class MoveScheduler:
    """A message listener that manages the sending of execute move group messages."""

    def __init__(self, move_groups: MoveGroups) -> None:
        """Constructor."""
        # For each move group create a set identifying the node and seq id.
        self._moves: List[Set[Tuple[int, int]]] = []
        self._durations: List[float] = []
        self._stop_condition: List[MoveStopCondition] = []
        for move_group in move_groups:
            move_set = set()
            duration = 0.0
            for seq_id, move in enumerate(move_group):
                move_set.update(set((k.value, seq_id) for k in move.keys()))
                duration += list(move.values())[0].duration_sec
                for step in move_group[seq_id]:
                    self._stop_condition.append(move_group[seq_id][step].stop_condition)

            self._moves.append(move_set)
            self._durations.append(duration)
        log.info(f"Move scheduler running for groups {move_groups}")

        self._event = asyncio.Event()

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Incoming message handler."""
        if isinstance(message, MoveCompleted):
            seq_id = message.payload.seq_id.value
            group_id = message.payload.group_id.value
            node_id = arbitration_id.parts.originating_node_id
            log.info(
                f"Received completion for {node_id} group {group_id} seq {seq_id}"
                ", which "
                f"{'is' if (node_id, seq_id) in self._moves[group_id] else 'isn''t'}"
                " in group"
            )
            self._moves[group_id].remove((node_id, seq_id))
            if not self._moves[group_id]:
                log.info(f"Move group {group_id} has completed.")
                self._event.set()

    async def run(self, can_messenger: CanMessenger) -> None:
        """Start each move group after the prior has completed."""
        for group_id in range(len(self._moves)):
            self._event.clear()

            log.info(f"Executing move group {group_id}.")
            await can_messenger.send(
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
            )

            try:
                await asyncio.wait_for(
                    self._event.wait(), self._durations[group_id] * 1.1
                )
            except asyncio.TimeoutError:
                log.warning("Move set timed out")
