"""Class that schedules motion on can bus."""
import asyncio
import logging
from opentrons_ot3_firmware.constants import NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    MessageListener,
)
from opentrons_ot3_firmware.messages import MessageDefinition
from opentrons_ot3_firmware.messages.message_definitions import (
    ClearAllMoveGroupsRequest,
    AddLinearMoveRequest,
    MoveCompleted,
    ExecuteMoveGroupRequest,
)
from opentrons_ot3_firmware.messages.payloads import (
    AddLinearMoveRequestPayload,
    ExecuteMoveGroupRequestPayload,
    EmptyPayload,
)
from .constants import interrupts_per_sec
from opentrons_hardware.hardware_control.motion import MoveGroups
from opentrons_ot3_firmware.utils import UInt8Field, UInt32Field, Int32Field


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
        """Send commands to clear the message groups."""
        await can_messenger.send(
            node_id=NodeId.broadcast,
            message=ClearAllMoveGroupsRequest(payload=EmptyPayload()),
        )

    async def _send_groups(self, can_messenger: CanMessenger) -> None:
        """Send commands to set up the message groups."""
        for group_i, group in enumerate(self._move_groups):
            for seq_i, sequence in enumerate(group):
                for node, step in sequence.items():
                    await can_messenger.send(
                        node_id=node,
                        message=AddLinearMoveRequest(
                            payload=AddLinearMoveRequestPayload(
                                group_id=UInt8Field(group_i),
                                seq_id=UInt8Field(seq_i),
                                duration=UInt32Field(
                                    int(step.duration_sec * interrupts_per_sec)
                                ),
                                acceleration=Int32Field(0),
                                velocity=Int32Field(
                                    int(interrupts_per_sec * step.velocity_mm_sec)
                                ),
                            )
                        ),
                    )

    async def _move(self, can_messenger: CanMessenger) -> None:
        """Run all the move groups."""
        scheduler = MoveScheduler(self._move_groups)
        try:
            can_messenger.add_listener(scheduler)
            await scheduler.run(can_messenger)
        finally:
            can_messenger.remove_listener(scheduler)


class MoveScheduler(MessageListener):
    """A message listener that manages the sending of execute move group messages."""

    def __init__(self, move_groups: MoveGroups) -> None:
        """Constructor."""
        # For each move group create a set identifying the node and seq id.
        self._moves = []
        for move_group in move_groups:
            move_set = set()
            for seq_id, move in enumerate(move_group):
                move_set.update(set((k.value, seq_id) for k in move.keys()))
            self._moves.append(move_set)

        self._event = asyncio.Event()

    def on_message(self, message: MessageDefinition) -> None:
        """Incoming message handler."""
        if isinstance(message, MoveCompleted):
            seq_id = message.payload.seq_id.value
            node_id = message.payload.node_id.value
            group_id = message.payload.group_id.value
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

            await self._event.wait()
