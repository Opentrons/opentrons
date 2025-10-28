"""Script to show concurrent module actions and take photos."""


"""Test Module Concurrent Commands."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
    HeaterShakerContext,
    TemperatureModuleContext,
)
from datetime import datetime

metadata = {
    "protocolName": "Test concurrent module preheats",
    "author": "Rhyann Clarke",
    "description": "This protocol tests concurrent module preheating ",
}
requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_bool(
        variable_name="thermocycler", display_name="Test Thermocycler", default=True
    )
    parameters.add_bool(
        variable_name="temp_mod", display_name="Test temperature module", default=True
    )
    parameters.add_str(
        variable_name="left_mount",
        display_name="Left Mount",
        description="Pipette Type on Left Mount.",
        choices=[
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "96ch 1000ul", "value": "flex_96channel_1000"},
            {"display_name": "96ch 200ul", "value": "flex_96channel_200"},
        ],
        default="flex_8channel_1000",
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    tc = ctx.params.thermocycler  # type: ignore [attr-defined]
    tm = ctx.params.temp_mod  # type: ignore [attr-defined]
    pipette = ctx.load_instrument(ctx.params.left_mount, "left")  # type: ignore [attr-defined]
    ctx.load_trash_bin("A3")
    if pipette.channels == 96:
        adapter = ctx.load_adapter("opentrons_flex_96_tiprack_adapter", "D2")
        tiprack = adapter.load_labware("opentrons_flex_96_tiprack_50ul")
    else:
        tiprack = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D2")
    pipette.tip_racks = [tiprack]
    if tc:
        thermocycler: ThermocyclerContext = ctx.load_module(
            "thermocycler module gen2"
        )  # type: ignore[assignment]
        thermocycler.open_lid()
        start = datetime.now()
        thermocycler.set_block_temperature(15)
        thermocycler.set_lid_temperature(105)
        stop = datetime.now()
        time_elapsed = stop - start
        ctx.comment(f"Non concurrent preheat duration (sec): {time_elapsed}.")
        thermocycler.deactivate_lid()
        thermocycler.deactivate_block()
        thermocycler_to_room_temp(thermocycler)
        start = datetime.now()
        block_task = thermocycler.start_set_block_temperature(15)
        lid_task = thermocycler.start_set_lid_temperature(105)
        ctx.wait_for_tasks([block_task, lid_task])
        stop = datetime.now()
        time_elapsed = stop - start
        ctx.comment(f"Concurrent preheat duration (sec): {time_elapsed}.")
        thermocycler.close_lid()
        profile_task = thermocycler.start_execute_profile(
            steps=[
                {"temperature": 98, "hold_time_minutes": 1},
                {"temperature": 95, "hold_time_minutes": 1},
            ],
            repetitions=2,
            block_max_volume=100,
        )
        pipette.pick_up_tip()
        pipette.return_tip()
        ctx.wait_for_tasks([profile_task])
        thermocycler.open_lid()
        thermocycler.deactivate_block()
        thermocycler.deactivate_lid()
    if tm:
        temp_mod: TemperatureModuleContext = ctx.load_module(
            "temperature module gen2", "D3"
        )  # type: ignore[assignment]
        # Concurrent Command - should pick up tips immediately
        temp_task = temp_mod.start_set_temperature(15)
        pipette.pick_up_tip()
        pipette.drop_tip()
        ctx.wait_for_tasks([temp_task])
        temp_mod.deactivate()
        # Not concurrent -  waits for temp module to reach temp before picking up tips
        temp_mod.set_temperature(15)
        pipette.pick_up_tip()
        pipette.drop_tip()
        temp_mod.deactivate()