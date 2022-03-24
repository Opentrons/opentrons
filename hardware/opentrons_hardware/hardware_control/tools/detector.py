"""Head tool detector."""

import logging
import asyncio
from typing import AsyncIterator, Set, Dict

from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.firmware_bindings.constants import ToolType, PipetteName
from opentrons_hardware.firmware_bindings.messages import message_definitions
from opentrons_hardware.firmware_bindings import NodeId
from opentrons_hardware.drivers.can_bus import CanMessenger
from .types import PipetteInformation, ToolSummary

from opentrons_hardware.hardware_control.tools.types import ToolDetectionResult

log = logging.getLogger(__name__)


def _handle_detection_result(
    response: message_definitions.PushToolsDetectedNotification,
) -> ToolDetectionResult:
    def _check_tool(i: int) -> ToolType:
        """Either return a valid tool or "undefined" on error."""
        try:
            return ToolType(i)
        except ValueError:
            return ToolType.undefined_tool

    return ToolDetectionResult(
        left=_check_tool(response.payload.z_motor.value),
        right=_check_tool(response.payload.a_motor.value),
        gripper=_check_tool(response.payload.gripper.value),
    )


async def _await_one_result(callback: WaitableCallback) -> ToolDetectionResult:
    async for response, _ in callback:
        if isinstance(response, message_definitions.PushToolsDetectedNotification):
            return _handle_detection_result(response)
    raise RuntimeError("Messenger closed before a tool was found")


class ToolDetector:
    """Class that detects tools on head."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor.

        Args:
            messenger: An initialized and running CanMessenger.
        """
        self._messenger = messenger

    async def detect(
        self,
    ) -> AsyncIterator[ToolDetectionResult]:
        """Detect tool changes."""
        with WaitableCallback(self._messenger) as wc:
            # send request message once, to establish initial state
            attached_tool_request_message = message_definitions.AttachedToolsRequest()
            await self._messenger.send(
                node_id=NodeId.head, message=attached_tool_request_message
            )
            yield await _await_one_result(wc)


class OneshotToolDetector:
    """Class that detects tools for one command."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Build a oneshot detector.

        Args:
           messenger: An initialized and running can messenger
        """
        self._messenger = messenger

    @staticmethod
    async def _await_responses(
        callback: WaitableCallback, for_nodes: Set[NodeId]
    ) -> Dict[NodeId, PipetteInformation]:
        to_ret: Dict[NodeId, PipetteInformation] = {}

        def _decode_or_default(orig: bytes) -> str:
            try:
                return orig.decode()
            except UnicodeDecodeError:
                return repr(orig)

        while not for_nodes.issubset(set(to_ret.keys())):
            async for response, arbitration_id in callback:
                if isinstance(response, message_definitions.PipetteInfoResponse):
                    to_ret[
                        NodeId(arbitration_id.parts.originating_node_id)
                    ] = PipetteInformation(
                        name=PipetteName(response.payload.pipette_name.value),
                        model=response.payload.pipette_model.value,
                        serial=_decode_or_default(
                            response.payload.pipette_serial.value
                        ),
                    )
                    break
        return to_ret

    async def detect(self, timeout_sec: float = 1.0) -> ToolSummary:
        """Run once and detect tools."""
        with WaitableCallback(self._messenger) as wc:
            attached_status_request = message_definitions.AttachedToolsRequest()
            await self._messenger.send(
                node_id=NodeId.head, message=attached_status_request
            )
            attached = await _await_one_result(wc)
            should_respond: Set[NodeId] = set()

            def _should_query(attach_response: ToolType) -> bool:
                return attach_response not in (
                    ToolType.undefined_tool,
                    ToolType.nothing_attached,
                )

            if _should_query(attached.left):
                should_respond.add(NodeId.pipette_left)
            if _should_query(attached.right):
                should_respond.add(NodeId.pipette_right)

            await self._messenger.send(
                node_id=NodeId.broadcast,
                message=message_definitions.PipetteInfoRequest(),
            )
            all_responses = await asyncio.wait_for(
                self._await_responses(wc, should_respond), timeout=timeout_sec
            )
        return ToolSummary(
            left=all_responses.get(NodeId.pipette_left, None),
            right=all_responses.get(NodeId.pipette_right, None),
            gripper=attached.gripper,
        )
