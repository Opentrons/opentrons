"""Reverse companion for Illumina DNA Enrichment.

Water-only ABR: redistributes the forward protocol's consolidated water,
restores the heater-shaker plate, and resets tips for an unattended rerun.
"""

from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    Labware,
    Well,
)
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    ThermocyclerContext,
    TemperatureModuleContext,
)

metadata = {
    "protocolName": "Reverse Illumina DNA Enrichment",
    "author": "Opentrons",
    "description": "Redistribute recovered water and reset labware.",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

# Must match the forward protocol.
COLUMNS = 4
TOTAL_STARTING_VOLUME = 96528.0


def load_disposable_lids(
    protocol: ProtocolContext, num_of_lids: int, deck_slot: str, deck_riser: bool
) -> Labware:
    """Load stack of disposable lids."""
    lid_str = "opentrons_tough_pcr_auto_sealing_lid"
    if deck_riser:
        deck_riser_adapter = protocol.load_adapter(
            "opentrons_flex_deck_riser", deck_slot
        )
        return deck_riser_adapter.load_lid_stack(lid_str, num_of_lids)
    return protocol.load_lid_stack(lid_str, deck_slot, num_of_lids)


def load_temp_adapter_and_labware(
    labware_str: str, temp_mod: TemperatureModuleContext, labware_name: str
) -> tuple[Labware, Labware]:
    """Load appropriate adapter on temperature module based off labware type."""
    temp_adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    labware_on_temp_mod = temp_adapter.load_labware(labware_str, labware_name)
    return labware_on_temp_mod, temp_adapter


def deactivate_modules(protocol: ProtocolContext) -> None:
    """Deactivate all loaded modules."""
    from opentrons.protocol_api.module_contexts import (
        HeaterShakerContext,
        TemperatureModuleContext,
        MagneticModuleContext,
        ThermocyclerContext,
    )

    for module in protocol.loaded_modules.values():
        if isinstance(module, HeaterShakerContext):
            module.deactivate_shaker()
            module.deactivate_heater()
        elif isinstance(module, TemperatureModuleContext):
            module.deactivate()
        elif isinstance(module, MagneticModuleContext):
            module.disengage()
        elif isinstance(module, ThermocyclerContext):
            module.deactivate()


def add_parameters(parameters: ParameterContext) -> None:
    """Mirror the forward protocol's runtime parameters."""
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )
    parameters.add_float(
        variable_name="dot_bottom",
        display_name=".bottom",
        description="Lowest value pipette will go to.",
        default=0.5,
        choices=[
            {"display_name": "0.0", "value": 0.0},
            {"display_name": "0.1", "value": 0.1},
            {"display_name": "0.2", "value": 0.2},
            {"display_name": "0.3", "value": 0.3},
            {"display_name": "0.4", "value": 0.4},
            {"display_name": "0.5", "value": 0.5},
            {"display_name": "0.6", "value": 0.6},
            {"display_name": "0.7", "value": 0.7},
            {"display_name": "0.8", "value": 0.8},
            {"display_name": "0.9", "value": 0.9},
            {"display_name": "1.0", "value": 1.0},
        ],
    )
    parameters.add_bool(
        variable_name="disposable_lid",
        display_name="Disposable Lid",
        description="True means use lid.",
        default=True,
    )
    parameters.add_bool(
        variable_name="deck_riser",
        display_name="Deck Riser",
        description="True means use deck riser.",
        default=True,
    )
    parameters.add_bool(
        variable_name="trash_lid",
        display_name="Trash Disposable Lid",
        description="True means trash lid, false means keep on deck.",
        default=True,
    )
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )
    parameters.add_bool(
        variable_name="enable_camera",
        display_name="Enable Camera",
        description="Capture start- and end-of-run images.",
        default=False,
    )
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
    )


def run(protocol: ProtocolContext) -> None:
    """Restore the complete starting liquid and labware layout."""
    deck_riser = protocol.params.deck_riser  # type: ignore[attr-defined]
    disposable_lid = protocol.params.disposable_lid  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    dot_bottom = protocol.params.dot_bottom  # type: ignore[attr-defined]
    enable_camera = protocol.params.enable_camera  # type: ignore[attr-defined]
    if enable_camera:
        protocol.capture_image(filename="start_of_run")

    # Deck layout must match the forward protocol exactly.
    heatershaker: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "1"
    )  # type: ignore[assignment]
    hs_adapter = heatershaker.load_adapter("opentrons_96_deep_well_adapter")
    reservoir = protocol.load_labware("nest_96_wellplate_2ml_deep", "2", "Liquid Waste")
    temp_block: TemperatureModuleContext = protocol.load_module(
        "temperature module gen2", "3"
    )  # type: ignore[assignment]
    reagent_plate, _temp_adapter = load_temp_adapter_and_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", temp_block, "Reagent Plate"
    )
    mag_block: MagneticBlockContext = protocol.load_module(
        "magneticBlockV1", "C1"
    )  # type: ignore[assignment]
    tiprack_200_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "5")
    protocol.load_labware("opentrons_flex_96_tiprack_50ul", "6")
    if disposable_lid:
        load_disposable_lids(protocol, 3, "C4", deck_riser)
    thermocycler: ThermocyclerContext = protocol.load_module(
        "thermocycler module gen2"
    )  # type: ignore[assignment]
    thermocycler.open_lid()
    sample_plate_1 = thermocycler.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "Sample Plate 1"
    )
    tiprack_200_2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "8")
    protocol.load_labware("opentrons_flex_96_tiprack_50ul", "9")
    tiprack_200_3 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "11")
    return_reservoir = protocol.load_labware(
        "nest_1_reservoir_195ml", "A3", "Return Reservoir"
    )
    recovered_water = protocol.define_liquid(
        name="Recovered water",
        description="All water consolidated by the matching forward protocol.",
        display_color="#808080",
    )
    return_reservoir["A1"].load_liquid(recovered_water, TOTAL_STARTING_VOLUME)
    protocol.load_lid_stack("opentrons_tough_universal_lid", "B4", 2)

    # Forward ends with Sample Plate 2 on the magnetic block.
    sample_plate_2 = mag_block.load_labware(
        "nest_96_wellplate_2ml_deep", "Sample Plate 2 end state"
    )

    p1000 = protocol.load_instrument(
        "flex_8channel_1000",
        "left",
        tip_racks=[tiprack_200_1, tiprack_200_2, tiprack_200_3],
    )

    if COLUMNS != 4:
        raise RuntimeError(f"Unsupported COLUMNS={COLUMNS} for reverse reset.")

    protocol.comment(
        "Return Sample Plate 2 to the heater-shaker for the next forward run."
    )
    heatershaker.open_labware_latch()
    protocol.move_labware(sample_plate_2, hs_adapter, use_gripper=True)
    heatershaker.close_labware_latch()

    protocol.comment("Redistributing the complete forward starting liquid layout.")
    p1000.reset_tipracks()
    p1000.pick_up_tip()

    def restore_column(column_well: Well, volume: float) -> None:
        remaining = float(volume)
        while remaining > 0:
            chunk = min(remaining, 180.0)
            p1000.aspirate(
                chunk,
                return_reservoir["A1"].bottom(z=0.5),
                rate=0.25,
            )
            p1000.dispense(chunk, column_well.bottom(z=dot_bottom), rate=0.25)
            remaining -= chunk

    restore_column(reagent_plate.columns()[3][0], 200.0)
    restore_column(reagent_plate.columns()[4][0], 15.0)
    restore_column(reagent_plate.columns()[5][0], 20.0)
    restore_column(reagent_plate.columns()[6][0], 65.0)
    restore_column(reservoir.columns()[0][0], 120.0 / p1000.active_channels)
    restore_column(reservoir.columns()[1][0], 750.0 / p1000.active_channels)
    restore_column(reservoir.columns()[3][0], 1000.0 / p1000.active_channels)
    restore_column(reservoir.columns()[4][0], 96.0 / p1000.active_channels)
    for wash_column in sample_plate_2.columns()[8:12]:
        restore_column(wash_column[0], 2000.0)
    for sample_column in sample_plate_1.columns():
        restore_column(sample_column[0], 150.0)
    p1000.return_tip()

    wells_col_1_to_7 = [well for col in sample_plate_2.columns()[:7] for well in col]
    sample_plate_2.load_empty(wells_col_1_to_7)

    # Forward end state: universal lid returned to the B4 stack, TC open.
    # Forward start moves a lid from this stack onto the reagent plate itself.
    protocol.comment(
        "Deck layout and liquids match forward start; universal lid stack remains on B4."
    )

    p1000.reset_tipracks()
    if deactivate_modules_bool:
        deactivate_modules(protocol)
    thermocycler.open_lid()

    protocol.comment(
        "Volumes returned and labware reset; forward protocol can rerun as-is."
    )
    if enable_camera:
        protocol.capture_image(filename="end_of_run")
