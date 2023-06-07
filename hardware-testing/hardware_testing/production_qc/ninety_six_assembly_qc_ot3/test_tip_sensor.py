"""Test Tip Sensor."""
import asyncio
from typing import List, Union, cast

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
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount
from hardware_testing.opentrons_api import helpers_ot3

TIP_PRESENCE_POSITION = 6
EXPECTED_STATE_AT_HOME_POSITION = False


def _get_tag_for_state(tips_dropped: bool) -> str:
    t = "empty" if tips_dropped else "with-tips"
    return f"tip-sensor-{t}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [CSVLine(_get_tag_for_state(state), [CSVResult]) for state in [True, False]]


async def get_tip_status(api: OT3API) -> bool:
    """Get the tip status for the 96 channel."""
    can_messenger: CanMessenger = api._backend._messenger  # type: ignore[union-attr]
    node: NodeId = NodeId.pipette_left
    event = asyncio.Event()
    value = 0

    def _listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        nonlocal value
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
            if message.message_id == MessageId.error_message:
                raise RuntimeError(str(message))
            assert originator == node
            assert message.message_id == MessageId.tip_presence_notification
        except (RuntimeError, AssertionError, ValueError) as e:
            ui.print_error(str(e))
        else:
            value = cast(
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
    result = bool(value)
    print(f"tip-status: {result}")
    return result


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    ax = OT3Axis.Q
    await api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = await api.gantry_position(OT3Mount.LEFT)
    await api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    for expected_state in [False, True]:
        print("homing...")
        await api.home([ax])
        if not api.is_simulator:
            if expected_state:
                ui.get_user_ready("remove all tips from the pipette")
            else:
                ui.get_user_ready("press on tips to channels A1 + H12")
        if not api.is_simulator:
            init_state = await get_tip_status(api)
            if init_state != EXPECTED_STATE_AT_HOME_POSITION:
                ui.print_error("tip sensor is not in expected state at home position")
        print(f"moving to tip-presence position ({TIP_PRESENCE_POSITION} mm)")
        await helpers_ot3.move_tip_motor_relative_ot3(api, TIP_PRESENCE_POSITION)
        state = expected_state if api.is_simulator else await get_tip_status(api)
        tag = _get_tag_for_state(expected_state)
        result = state == expected_state
        report(section, tag, [CSVResult.from_bool(result)])
        print("homing...")
        await api.home([ax])
