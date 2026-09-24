"""Reverse/reset companion for 9_Magmax_RNA_Cells_Flex.py.

Water-only ABR: mixed waste is recoverable. Returns the sample plate to the
Heater-Shaker, restores reagent-reservoir and plate starting volumes from liquid
waste, and resets tip racks for automated rerun.
"""

from opentrons import protocol_api
from opentrons.protocol_api.module_contexts import (
    AbsorbanceReaderContext,
    HeaterShakerContext,
    MagneticBlockContext,
    TemperatureModuleContext,
)


metadata = {
    "author": "Opentrons",
    "protocolName": "Reverse Thermo MagMax RNA Extraction: Cells Multi-Channel",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Keep deck, instrument, and module choices compatible with the original."""
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
    parameters.add_str(
        variable_name="pipette_mount",
        display_name="Pipette Mount",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="left",
    )
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_str(
        variable_name="labware_plate_reader_compatible",
        display_name="Plate Reader Labware",
        default="hellma_reference_plate",
        choices=[
            {
                "display_name": "Corning_96well",
                "value": "corning_96_wellplate_360ul_flat",
            },
            {"display_name": "Hellma Plate", "value": "hellma_reference_plate"},
            {"display_name": "Nest_96well", "value": "nest_96_wellplate_200ul_flat"},
        ],
    )
    parameters.add_bool(
        variable_name="plate_orientation",
        display_name="Hellma Plate Orientation",
        default=True,
        description="Use the same Hellma plate orientation as the original run.",
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
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
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Restore starting liquids from waste and return sample plate to H-S."""
    mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    deactivate_modules = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    num_cols = 12

    h_s: HeaterShakerContext = protocol.load_module(  # type: ignore[assignment]
        "heaterShakerModuleV1", "D1"
    )
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")

    temp: TemperatureModuleContext = protocol.load_module(  # type: ignore[assignment]
        "temperature module gen2", "D3"
    )
    temp_adapter = temp.load_adapter("opentrons_96_well_aluminum_block")
    elution_plate = temp_adapter.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate"
    )
    elution_plate.load_empty(elution_plate.wells())

    magblock: MagneticBlockContext = protocol.load_module(  # type: ignore[assignment]
        "magneticBlockV1", "C1"
    )
    sample_plate = magblock.load_labware(
        "nest_96_wellplate_2ml_deep", "Sample Plate (original end state)"
    )
    sample_plate.load_empty(sample_plate.wells())

    waste_reservoir = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "C3", "Liquid Waste"
    )
    reagent_reservoir = protocol.load_labware(
        "opentrons_tough_12_reservoir_22ml", "D2", "Reagent Reservoir 1"
    )
    reagent_reservoir.load_empty(reagent_reservoir.wells())
    protocol.load_labware("nest_96_wellplate_200ul_flat", "B3", "Hellma Plate")
    plate_reader: AbsorbanceReaderContext = protocol.load_module(  # type: ignore[assignment]
        "absorbanceReaderV1", "A3"
    )
    plate_reader.close_lid()

    tip_racks = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_200ul", slot, f"Tips {index}"
        )
        for index, slot in enumerate(("A1", "A2", "B1", "B2", "C2"), start=1)
    ]
    m1000 = protocol.load_instrument(
        "flex_8channel_1000", mount, tip_racks=tip_racks
    )

    waste_reservoir["A1"].load_liquid(
        protocol.define_liquid(
            "Mixed water waste",
            description="Forward cleanup output; recoverable for ABR water runs.",
            display_color="#7A7A7A",
        ),
        290000,
    )

    lysis_wells = reagent_reservoir.wells()[0:2]
    stopreaction = reagent_reservoir.wells()[2]
    all_washes = reagent_reservoir.wells()[3:12]
    beads_ = sample_plate.wells()[: (8 * num_cols)]
    elution_samps = elution_plate.wells()[: (8 * num_cols)]
    dnase1_ = elution_plate.wells()[(8 * num_cols) : (16 * num_cols)]

    liquid_vols_and_wells: dict[
        str, list[dict[str, protocol_api.Well | list[protocol_api.Well] | float]]
    ] = {
        "Beads": [{"well": beads_, "volume": 20.0}],
        "Sample": [{"well": sample_plate.wells(), "volume": 100.0}],
        "DNAse": [{"well": dnase1_, "volume": 200.0}],
        "Elution Buffer": [{"well": elution_samps, "volume": 55.0}],
        "Lysis": [{"well": lysis_wells, "volume": 8400.0}],
        "Stop": [{"well": stopreaction, "volume": 6400.0}],
        "Wash 1": [{"well": all_washes[0], "volume": 9500.0}],
        "Wash 2": [{"well": all_washes[1], "volume": 9500.0}],
        "Wash 3": [{"well": all_washes[2], "volume": 9500.0}],
        "Wash 4": [{"well": all_washes[3], "volume": 9500.0}],
        "Wash 5": [{"well": all_washes[4], "volume": 9500.0}],
        "Wash 6": [{"well": all_washes[5], "volume": 9500.0}],
        "Wash 7": [{"well": all_washes[6], "volume": 9500.0}],
        "Wash 8": [{"well": all_washes[7], "volume": 9500.0}],
        "Wash 9": [{"well": all_washes[8], "volume": 9500.0}],
    }

    protocol.comment("Returning sample plate from magnetic block to heater-shaker.")
    h_s.open_labware_latch()
    protocol.move_labware(sample_plate, h_s_adapter, use_gripper=True)
    h_s.close_labware_latch()

    protocol.comment("Recovering starting water from mixed liquid waste.")
    water = protocol.define_liquid(
        name="Water",
        description="ABR fleet water; mixed waste is recoverable.",
        display_color="#C0C0C0",
    )
    total_volume = 0.0
    for wells_info in liquid_vols_and_wells.values():
        for well_info in wells_info:
            volume = float(well_info["volume"])
            if volume <= 0:
                continue
            raw_wells = well_info["well"]
            wells = (
                [raw_wells]
                if isinstance(raw_wells, protocol_api.Well)
                else list(raw_wells)
            )
            total_volume += volume * len(wells)
            for well in wells:
                well.load_liquid(water, volume)
    if total_volume > 0:
        waste_reservoir["A1"].load_liquid(water, total_volume)

    m1000.reset_tipracks()

    if deactivate_modules:
        h_s.deactivate_shaker()
        h_s.deactivate_heater()
        temp.deactivate()

    protocol.comment("Reset complete. Rerun original.")
