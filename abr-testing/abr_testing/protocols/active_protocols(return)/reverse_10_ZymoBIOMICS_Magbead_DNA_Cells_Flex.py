"""Reverse/reset companion for 10_ZymoBIOMICS_Magbead_DNA_Cells_Flex.py.

Water-only ABR: mixed waste is recoverable. Returns the sample plate to the
Heater-Shaker, restores reagent-reservoir and plate starting volumes from liquid
waste, and resets tip racks for automated rerun.
"""

from opentrons import protocol_api
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    TemperatureModuleContext,
)


metadata = {
    "author": "Opentrons",
    "protocolName": "Reverse Flex ZymoBIOMICS Magbead DNA Extraction: Cells",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

LYSIS_START_VOLUME = 12320.0
BINDING_START_VOLUME = 11875.0
BINDING_2_START_VOLUME = 13500.0
ELUTION_START_VOLUME = 7500.0
WASH_START_VOLUME = 9800.0
MAX_TRANSFER_PER_NOZZLE = 900.0


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Keep module and mount choices compatible with the original."""
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
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
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="deactivate all modules at end of run",
        default=True,
    )
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
        description="Z offset for meniscus height. Default is -1.5mm.",
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
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
        "opentrons_tough_1_reservoir_300ml", "B3", "Liquid Waste"
    )
    res1 = protocol.load_labware(
        "opentrons_tough_12_reservoir_22ml", "D2", "Reagent Reservoir 1"
    )
    res2 = protocol.load_labware(
        "opentrons_tough_12_reservoir_22ml", "C2", "Reagent Reservoir 2"
    )
    res3 = protocol.load_labware(
        "opentrons_tough_12_reservoir_22ml", "B2", "Reagent Reservoir 3"
    )
    for reservoir in (res1, res2, res3):
        reservoir.load_empty(reservoir.wells())

    tip_racks = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_1000ul", slot, f"Tips {index}"
        )
        for index, slot in enumerate(("A1", "A2", "B1"), start=1)
    ]
    m1000 = protocol.load_instrument(
        "flex_8channel_1000", mount, tip_racks=tip_racks
    )

    lysis_ = res1.wells()[0]
    binding_buffer = res1.wells()[1:8]
    bind2_res = res1.wells()[8:12]
    elution_solution = res2.wells()[0]
    all_washes = res2.wells()[1:] + res3.wells()[:2]
    restore_targets = [
        (lysis_, LYSIS_START_VOLUME),
        *((well, BINDING_START_VOLUME) for well in binding_buffer[:-1]),
        *((well, BINDING_2_START_VOLUME) for well in bind2_res),
        (elution_solution, ELUTION_START_VOLUME),
        *((well, WASH_START_VOLUME) for well in all_washes),
        # The seventh binding-buffer trough is unused by the 96-sample forward
        # run. Restore it last so the wells needed for rerun are prioritized if
        # a small physical dead volume remains in the 300 mL waste reservoir.
        (binding_buffer[-1], BINDING_START_VOLUME),
    ]
    total_volume = sum(volume for _, volume in restore_targets)
    waste = waste_reservoir["A1"]
    waste.load_liquid(
        protocol.define_liquid(
            "Mixed water waste",
            description="Forward cleanup output; recoverable for ABR water runs.",
            display_color="#7A7A7A",
        ),
        total_volume,
    )

    protocol.comment("Returning sample plate from magnetic block to heater-shaker.")
    h_s.open_labware_latch()
    protocol.move_labware(sample_plate, h_s_adapter, use_gripper=True)
    h_s.close_labware_latch()

    protocol.comment("Recovering starting water from mixed liquid waste.")
    m1000.pick_up_tip()
    m1000.liquid_presence_detection = False
    for destination, total_destination_volume in restore_targets:
        remaining_per_nozzle = total_destination_volume / m1000.active_channels
        while remaining_per_nozzle > 0:
            transfer_volume = min(
                remaining_per_nozzle,
                MAX_TRANSFER_PER_NOZZLE,
            )
            m1000.aspirate(transfer_volume, waste.bottom(z=1))
            m1000.dispense(transfer_volume, destination.top(z=-2))
            remaining_per_nozzle -= transfer_volume
        m1000.blow_out(destination.top())
    m1000.return_tip()
    m1000.reset_tipracks()

    if deactivate_modules:
        h_s.deactivate_shaker()
        h_s.deactivate_heater()
        temp.deactivate()

    protocol.comment("Reset complete. Rerun original.")
