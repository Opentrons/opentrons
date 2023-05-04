"""Test Tip Sensor."""
import asyncio
from typing import List, Union, Dict, Callable, cast

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import MessageId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    TipStatusQueryRequest,
    PushTipPresenceNotification,
)
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return []


async def get_tip_status(api: OT3API) -> int:
    """Get the tip status for the 96 channel."""
    can_messenger: CanMessenger = api._backend._messenger
    node: NodeId = NodeId.pipette_left
    event = asyncio.Event()
    response = -1

    def _listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        nonlocal response
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
            if message.message_id == MessageId.error_message:
                raise RuntimeError(str(message))
            assert originator == node
            assert message.message_id == MessageId.tip_presence_notification
        except (RuntimeError, AssertionError, ValueError) as e:
            ui.print_error(str(e))
        else:
            response = cast(
                PushTipPresenceNotification, message
            ).payload.ejector_flag_status.value
            event.set()

    can_messenger.add_listener(_listener)
    try:
        await can_messenger.send(
            node_id=node,
            message=TipStatusQueryRequest(),
        )
        await asyncio.wait_for(event.wait(), 1.0)
    finally:
        can_messenger.remove_listener(_listener)
    return response


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    ui.print_error("skipping")
    if not api.is_simulator:
        result = await get_tip_status(api)
    else:
        result = 1
    print(f"got {result} as tip-status")
