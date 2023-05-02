"""Head tool detector."""

import logging
import asyncio
from typing import AsyncIterator, Set, Dict, Tuple, Union

from opentrons_hardware.drivers.can_bus.can_messenger import WaitableCallback
from opentrons_hardware.firmware_bindings.constants import ToolType, PipetteName
from opentrons_hardware.firmware_bindings.messages import message_definitions
from opentrons_hardware.firmware_bindings import NodeId, ArbitrationId
from opentrons_hardware.instruments.serial_utils import model_versionstring_from_int
from opentrons_hardware.drivers.can_bus import CanMessenger
from .types import (
    PipetteInformation,
    ToolSummary,
    GripperInformation,
)
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
            return ToolType.tool_error

    return ToolDetectionResult(
        left=_check_tool(response.payload.z_motor.value),
        right=_check_tool(response.payload.a_motor.value),
        gripper=_check_tool(response.payload.gripper.value),
    )


async def _await_one_result(callback: WaitableCallback) -> ToolDetectionResult:
    async for response, _ in callback:
        if isinstance(response, message_definitions.PushToolsDetectedNotification):
            return _handle_detection_result(response)
        if isinstance(response, message_definitions.ErrorMessage):
            log.error(f"Recieved error message {str(response)}")
    raise RuntimeError("Messenger closed before a tool was found")


def _decode_or_default(orig: bytes) -> str:
    try:
        return orig.decode(errors="replace").split("\x00")[0]
    except UnicodeDecodeError:
        return repr(orig)


async def _await_responses(
    callback: WaitableCallback,
    for_nodes: Set[NodeId],
    response_queue: "asyncio.Queue[Tuple[NodeId, Union[PipetteInformation, GripperInformation]]]",
) -> None:
    """Wait for pipette or gripper information and send back through a queue."""
    seen: Set[NodeId] = set()

    while not for_nodes.issubset(seen):
        async for response, arbitration_id in callback:
            if isinstance(response, message_definitions.PipetteInfoResponse):
                node = await _handle_pipette_info(
                    response_queue, response, arbitration_id
                )
                seen.add(node)
                break
            elif isinstance(response, message_definitions.GripperInfoResponse):
                node = await _handle_gripper_info(
                    response_queue, response, arbitration_id
                )
                seen.add(node)
                break
            elif isinstance(response, message_definitions.ErrorMessage):
                log.error(f"Recieved error message {str(response)}")


async def _handle_gripper_info(
    response_queue: "asyncio.Queue[Tuple[NodeId, Union[PipetteInformation, GripperInformation]]]",
    response: message_definitions.GripperInfoResponse,
    arbitration_id: ArbitrationId,
) -> NodeId:
    node = NodeId(arbitration_id.parts.originating_node_id)
    await response_queue.put(
        (
            node,
            GripperInformation(
                model=model_versionstring_from_int(response.payload.model.value),
                serial=_decode_or_default(response.payload.serial.value),
            ),
        )
    )
    return node


async def _handle_pipette_info(
    response_queue: "asyncio.Queue[Tuple[NodeId, Union[PipetteInformation, GripperInformation]]]",
    response: message_definitions.PipetteInfoResponse,
    arbitration_id: ArbitrationId,
) -> NodeId:
    node = NodeId(arbitration_id.parts.originating_node_id)
    try:
        name = PipetteName(response.payload.name.value)
    except ValueError:
        name = PipetteName.unknown
    await response_queue.put(
        (
            node,
            PipetteInformation(
                name=name,
                name_int=response.payload.name.value,
                model=model_versionstring_from_int(response.payload.model.value),
                serial=_decode_or_default(response.payload.serial.value),
            ),
        )
    )
    return node


def _need_type_query(attached: ToolDetectionResult) -> Set[NodeId]:
    should_respond: Set[NodeId] = set()

    def _should_query(attach_response: ToolType) -> bool:
        return attach_response != ToolType.nothing_attached

    if _should_query(attached.left):
        should_respond.add(NodeId.pipette_left)
    if _should_query(attached.right):
        should_respond.add(NodeId.pipette_right)
    if _should_query(attached.gripper):
        should_respond.add(NodeId.gripper)
    return should_respond


async def _resolve_tool_types(
    messenger: CanMessenger,
    wc: WaitableCallback,
    attached: ToolDetectionResult,
    timeout_sec: float,
) -> ToolSummary:

    should_respond = _need_type_query(attached)
    if not should_respond:
        return ToolSummary(left=None, right=None, gripper=None)
    await messenger.send(
        node_id=NodeId.broadcast,
        message=message_definitions.InstrumentInfoRequest(),
    )
    incoming_queue: "asyncio.Queue[Tuple[NodeId, Union[PipetteInformation, GripperInformation]]]" = (
        asyncio.Queue()
    )
    try:
        await asyncio.wait_for(
            _await_responses(wc, should_respond, incoming_queue),
            timeout=timeout_sec,
        )
    except asyncio.TimeoutError:
        pass

    pipettes: Dict[NodeId, PipetteInformation] = {}
    gripper: Dict[NodeId, GripperInformation] = {}
    while not incoming_queue.empty():
        node, info = incoming_queue.get_nowait()
        if isinstance(info, PipetteInformation):
            pipettes[node] = info
        else:
            gripper[node] = info

    return ToolSummary(
        left=pipettes.get(NodeId.pipette_left, None),
        right=pipettes.get(NodeId.pipette_right, None),
        gripper=gripper.get(NodeId.gripper, None),
    )


class ToolDetector:
    """Class that detects tools on head."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor.

        Args:
            messenger: An initialized and running CanMessenger.
        """
        self._messenger = messenger

    async def check_once(self) -> None:
        """Send one tool status ping. Useful only if something is waiting for responses."""
        attached_tool_request_message = message_definitions.AttachedToolsRequest()
        await self._messenger.send(
            node_id=NodeId.head, message=attached_tool_request_message
        )

    async def detect(
        self,
    ) -> AsyncIterator[ToolDetectionResult]:
        """Detect tool changes."""
        with WaitableCallback(self._messenger) as wc:
            # send request message once, to establish initial state
            await self.check_once()
            while True:
                yield await _await_one_result(wc)

    async def resolve(
        self, with_tools: ToolDetectionResult, timeout_sec: float = 1.0
    ) -> ToolSummary:
        """Based on a detection result, return details of attached tools."""
        with WaitableCallback(self._messenger) as wc:
            return await _resolve_tool_types(
                self._messenger, wc, with_tools, timeout_sec
            )


class OneshotToolDetector:
    """Class that detects tools for one command."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Build a oneshot detector.

        Args:
           messenger: An initialized and running can messenger
        """
        self._messenger = messenger

    async def detect(self, timeout_sec: float = 1.0) -> ToolSummary:
        """Run once and detect tools."""
        with WaitableCallback(self._messenger) as wc:
            attached_status_request = message_definitions.AttachedToolsRequest()
            await self._messenger.send(
                node_id=NodeId.head, message=attached_status_request
            )
            tools = await _await_one_result(wc)
            return await _resolve_tool_types(self._messenger, wc, tools, timeout_sec)
