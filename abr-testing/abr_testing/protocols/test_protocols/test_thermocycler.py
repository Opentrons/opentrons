"""Test Thermocycler Concurrency."""
from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.module_contexts import ThermocyclerContext
from datetime import datetime
metadata = {
    "protocolName": "Test concurrent module preheats",
    "author": "Rhyann Clarke",
    "description": "This protocol tests concurrent module preheating ",
}
requirements = {"robotType": "Flex", "apiLevel": "2.27"}
def thermocycler_to_room_temp(thermocycler: ThermocyclerContext) -> None:
    """Return thermocycler block and lid to room temperature."""
    thermocycler.set_lid_temperature(37)
    thermocycler.set_block_temperature(22)
def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    thermocycler: ThermocyclerContext = ctx.load_module(
        "thermocycler module gen2"
    )  # type: ignore[assignment]
    thermocycler.open_lid()
    thermocycler_to_room_temp(thermocycler)
    start = datetime.now()
    print(start)
    thermocycler.set_block_temperature(10)
    thermocycler.set_lid_temperature(105)
    stop = datetime.now()
    print(stop)
    time_elapsed = stop - start
    ctx.comment(f"Non concurrent preheat duration (sec): {time_elapsed}.")
    thermocycler.deactivate_lid()
    thermocycler.deactivate_block()
    thermocycler_to_room_temp(thermocycler)
    start = datetime.now()
    block_task = thermocycler.start_set_block_temperature(10)
    lid_task = thermocycler.start_set_lid_temperature(105)
    ctx.wait_for_tasks([block_task, lid_task])
    stop = datetime.now()
    time_elapsed = stop - start
    ctx.comment(f"Concurrent preheat duration (sec): {time_elapsed}.")
