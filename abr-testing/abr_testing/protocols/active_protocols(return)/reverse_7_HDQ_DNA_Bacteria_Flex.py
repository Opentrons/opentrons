"""Reverse companion for the Omega HDQ DNA extraction protocol.

Water-only ABR: mixed waste is recoverable. Returns the sample plate to B3,
restores reagent-reservoir and elution-plate starting volumes from liquid waste,
and resets tip racks for automated rerun.
"""

from opentrons.protocol_api import ParameterContext, ProtocolContext

metadata = {
    "protocolName": "Reverse Omega HDQ DNA Extraction Reset",
    "author": "Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

SAMPLE_COUNT = 48
SAMPLE_START_VOLUME = 180.0
SAMPLE_END_RESIDUAL = 20.0
ELUTION_START_VOLUME = 100.0
BINDING_START_VOLUME = 9900.0
AL_START_VOLUME = 14310.0
WASH_START_VOLUME = 11400.0
MAX_TRANSFER_PER_NOZZLE = 900.0
# The tough 300 mL reservoir floor is a 96-pocket waffle that narrows to
# 1.8 mm square. Staying above the 2.29 mm taper keeps the tip orifice clear.
WASTE_ASPIRATE_CLEARANCE = 1.0


def add_parameters(parameters: ParameterContext) -> None:
    """Retain the original hardware/reset choices."""
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
        display_name="Original Heater-Shaker Speed",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        default=True,
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Original Height Probe",
        default=False,
    )
    parameters.add_float(
        variable_name="meniscus_z",
        display_name="Original Meniscus Z",
        default=-0.5,
        minimum=-10.0,
        maximum=10.0,
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


def run(protocol: ProtocolContext) -> None:
    """Restore starting liquids from waste and return sample plate to B3."""
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    temp_module = protocol.load_module("temperature module gen2", "D3")
    elution_plate = temp_module.load_adapter(
        "opentrons_96_well_aluminum_block"
    ).load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate"
    )
    elution_plate.load_empty(elution_plate.wells())
    protocol.load_lid_stack("opentrons_tough_universal_lid", "C3", 2)
    magnetic_block = protocol.load_module("magneticBlockV1", "C1")
    waste_reservoir = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "C2", "Liquid Waste"
    )
    reagent_reservoir = protocol.load_labware(
        "opentrons_tough_12_reservoir_22ml", "D2", "Reagent Reservoir 1"
    )
    reagent_reservoir.load_empty(reagent_reservoir.wells())
    fresh_tip_racks = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_1000ul", slot, f"Tips {index + 1}"
        )
        for index, slot in enumerate(["A1", "A2", "B1"])
    ]
    m1000 = protocol.load_instrument(
        "flex_8channel_1000",
        protocol.params.pipette_mount,  # type: ignore[attr-defined]
        tip_racks=fresh_tip_racks,
    )

    sample_plate = magnetic_block.load_labware(
        "nest_96_wellplate_2ml_deep", "Extracted Sample Plate"
    )
    sample_plate.load_empty(sample_plate.wells())
    residual = protocol.define_liquid(
        "Sample plate residual",
        description="Water remaining after the forward elution transfer.",
        display_color="#B0C4DE",
    )
    for well in sample_plate.wells()[:SAMPLE_COUNT]:
        well.load_liquid(residual, SAMPLE_END_RESIDUAL)

    protocol.comment("Returning sample plate from magnetic block to B3.")
    protocol.move_labware(sample_plate, "B3", use_gripper=True)

    binding_buffer = reagent_reservoir.wells()[:2]
    al_well = reagent_reservoir.wells()[2]
    wash1 = reagent_reservoir.wells()[3:6]
    wash2 = reagent_reservoir.wells()[6:9]
    wash3 = reagent_reservoir.wells()[9:]
    reagent_targets = [
        *((well, BINDING_START_VOLUME) for well in binding_buffer),
        (al_well, AL_START_VOLUME),
        *((well, WASH_START_VOLUME) for well in wash1 + wash2 + wash3),
    ]
    total_start_volume = (
        SAMPLE_COUNT * SAMPLE_START_VOLUME
        + SAMPLE_COUNT * ELUTION_START_VOLUME
        + sum(volume for _, volume in reagent_targets)
    )
    sample_residual_volume = SAMPLE_COUNT * SAMPLE_END_RESIDUAL
    waste = waste_reservoir["A1"]
    waste.load_liquid(
        protocol.define_liquid(
            "Mixed water waste",
            description="Forward cleanup output; recoverable for ABR water runs.",
            display_color="#8B4513",
        ),
        total_start_volume - sample_residual_volume,
    )

    protocol.comment("Recovering starting water from mixed liquid waste.")
    m1000.pick_up_tip()
    m1000.liquid_presence_detection = False
    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300
    for source in sample_plate.rows()[0][: SAMPLE_COUNT // 8]:
        m1000.aspirate(SAMPLE_END_RESIDUAL, source.bottom(z=0.5))
        m1000.dispense(SAMPLE_END_RESIDUAL, waste.top(z=-2))
    for destination in sample_plate.rows()[0][: SAMPLE_COUNT // 8]:
        m1000.aspirate(SAMPLE_START_VOLUME, waste.bottom(z=WASTE_ASPIRATE_CLEARANCE))
        m1000.dispense(SAMPLE_START_VOLUME, destination.top(z=-2))
    for destination in elution_plate.rows()[0][: SAMPLE_COUNT // 8]:
        m1000.aspirate(ELUTION_START_VOLUME, waste.bottom(z=WASTE_ASPIRATE_CLEARANCE))
        m1000.dispense(ELUTION_START_VOLUME, destination.top(z=-2))
    for destination, total_destination_volume in reagent_targets:
        remaining_per_nozzle = total_destination_volume / m1000.active_channels
        while remaining_per_nozzle > 0:
            transfer_volume = min(
                remaining_per_nozzle,
                MAX_TRANSFER_PER_NOZZLE,
            )
            m1000.aspirate(transfer_volume, waste.bottom(z=WASTE_ASPIRATE_CLEARANCE))
            m1000.dispense(transfer_volume, destination.top(z=-2))
            remaining_per_nozzle -= transfer_volume
        m1000.blow_out(destination.top())
    m1000.return_tip()
    m1000.reset_tipracks()

    if protocol.params.deactivate_modules:  # type: ignore[attr-defined]
        heater_shaker.close_labware_latch()
        heater_shaker.deactivate_shaker()
        heater_shaker.deactivate_heater()
        temp_module.deactivate()

    protocol.comment("Reset complete. Rerun original.")
