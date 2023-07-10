"""Class that executes motion on can bus."""
import asyncio
from collections import defaultdict
import logging
from typing import List, Tuple, Set

from opentrons_shared_data.errors.exceptions import GeneralError
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    ErrorCode,
    MotorPositionFlags,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ClearAllMoveGroupsRequest,
    TipActionResponse,
)
from opentrons_hardware.firmware_bindings.messages.payloads import EmptyPayload

from opentrons_hardware.hardware_control.motion import MoveGroups
from .move_scheduler import (
    _Completions,
    MoveDispatcher,
    MoveScheduler,
)

from opentrons_hardware.hardware_control.types import NodeDict

log = logging.getLogger(__name__)


class MoveGroupRunner:
    """A move command runner."""

    def __init__(
        self,
        move_groups: MoveGroups,
        start_at_index: int = 0,
        ignore_stalls: bool = False,
    ) -> None:
        """Constructor.

        Args:
            move_groups: The move groups to run.
            start_at_index: The index the MoveGroupManager will start at
            ignore_stalls: Depends on the disableStallDetection feature flag
        """
        self._move_scheduler = MoveScheduler(move_groups, start_at_index, ignore_stalls)
        self._is_prepped: bool = False

    async def prep(self, can_messenger: CanMessenger) -> None:
        """Prepare the move group. The first thing that happens during run().

        prep() and execute() can be used to replace a single call to run() to
        ensure tighter timing, if you want something else to start as soon as
        possible to the actual execution of the move.
        """
        if not self._move_scheduler.has_moves():
            log.debug("No moves. Nothing to do.")
            return
        await self._clear_groups(can_messenger)
        await self._move_scheduler.schedule_groups(can_messenger)
        self._is_prepped = True

    async def execute(
        self, can_messenger: CanMessenger
    ) -> NodeDict[Tuple[float, float, bool, bool]]:
        """Execute a pre-prepared move group. The second thing that run() does.

        prep() and execute() can be used to replace a single call to run() to
        ensure tighter timing, if you want something else to start as soon as
        possible to the actual execution of the move.
        """
        if not self._move_scheduler.has_moves():
            log.debug("No moves. Nothing to do.")
            return {}
        if not self._is_prepped:
            raise GeneralError(
                message="A move group must be prepped before it can be executed."
            )
        try:
            move_completion_data = await self._move(can_messenger)
        except (RuntimeError, asyncio.TimeoutError):
            log.error("raising error from Move group runner")
            raise
        return self._accumulate_move_completions(move_completion_data)

    async def run(
        self, can_messenger: CanMessenger
    ) -> NodeDict[Tuple[float, float, bool, bool]]:
        """Run the move group.

        Args:
            can_messenger: a can messenger

        Returns:
            The current position after the move for all the axes that
            acknowledged completing moves.

        This function first prepares all connected devices to move (by sending
        all the data for the moves over) and then executes the move with a
        single call.

        prep() and execute() can be used to replace a single call to run() to
        ensure tighter timing, if you want something else to start as soon as
        possible to the actual execution of the move.
        """
        await self.prep(can_messenger)
        return await self.execute(can_messenger)

    @staticmethod
    def _accumulate_move_completions(
        completions: _Completions,
    ) -> NodeDict[Tuple[float, float, bool, bool]]:
        position: NodeDict[
            List[Tuple[Tuple[int, int], float, float, bool, bool]]
        ] = defaultdict(list)
        for arbid, completion in completions:
            if isinstance(completion, TipActionResponse):
                continue
            position[NodeId(arbid.parts.originating_node_id)].append(
                (
                    (
                        completion.payload.group_id.value,
                        completion.payload.seq_id.value,
                    ),
                    float(completion.payload.current_position_um.value) / 1000.0,
                    float(completion.payload.encoder_position_um.value) / 1000.0,
                    bool(
                        completion.payload.position_flags.value
                        & MotorPositionFlags.stepper_position_ok.value
                    ),
                    bool(
                        completion.payload.position_flags.value
                        & MotorPositionFlags.encoder_position_ok.value
                    ),
                )
            )
        # for each node, pull the position from the completion with the largest
        # combination of group id and sequence id
        return {
            node: next(
                reversed(
                    sorted(poslist, key=lambda position_element: position_element[0])
                )
            )[1:]
            for node, poslist in position.items()
        }

    async def _clear_groups(self, can_messenger: CanMessenger) -> None:
        """Send commands to clear the message groups.

        Args:
            can_messenger: a can messenger
        """
        error = await can_messenger.ensure_send(
            node_id=NodeId.broadcast,
            message=ClearAllMoveGroupsRequest(payload=EmptyPayload()),
            expected_nodes=list(self.all_nodes()),
        )
        if error != ErrorCode.ok:
            log.warning("Clear move group failed")

    def all_nodes(self) -> Set[NodeId]:
        """Get all of the nodes in the move group runner's move gruops."""
        node_set: Set[NodeId] = set()
        for group in self._move_groups:
            for sequence in group:
                for node in sequence.keys():
                    node_set.add(node)
        return node_set
    
    async def _move(self, can_messenger: CanMessenger) -> _Completions:
        """Run all the move groups."""
        dispatcher: MoveDispatcher = self._move_scheduler.build_distpatcher()
        try:
            can_messenger.add_listener(dispatcher)
            completions = await dispatcher.run(can_messenger)
        finally:
            can_messenger.remove_listener(dispatcher)
        return completions
