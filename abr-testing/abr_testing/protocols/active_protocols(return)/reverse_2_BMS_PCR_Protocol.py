"""Reverse companion for the BMS PCR protocol.

Water-only ABR: mixed waste is recoverable. Physically restores DNA, water, and
mastermix starting volumes from liquid waste, returns the used disposable lid to
the unused stack, and resets tip racks so forward can rerun with no operator step.
"""

from opentrons.protocol_api import (
    ALL,
    SINGLE,
    InstrumentContext,
    ParameterContext,
    ProtocolContext,
    TemperatureModuleContext,
    ThermocyclerContext,
    Well,
)

metadata = {
    "protocolName": "Reverse BMS PCR Protocol",
    "author": "Opentrons",
    "description": "Water-only reset after the matching PCR protocol.",
}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}

# Must match the forward protocol's starting liquid map.
WATER_START_VOLUME = 500.0
MASTERMIX_START_VOLUME = 500.0
DNA_START_VOLUME = 100.0
MAX_TRANSFER = 50.0


def add_parameters(parameters: ParameterContext) -> None:
    """Mirror the forward protocol's runtime parameters."""
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
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )
    parameters.add_bool(
        variable_name="disposable_lid",
        display_name="Disposable Lid",
        description="True means use lid.",
        default=False,
    )
    parameters.add_csv_file(
        variable_name="parameters_csv",
        display_name="Sample CSV",
        description="CSV File for Protocol.",
    )
    parameters.add_bool(
        variable_name="deck_riser",
        display_name="Deck Riser",
        description="True means use deck riser.",
        default=False,
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


def _restore_volume(
    pipette: InstrumentContext, waste: Well, destination: Well, volume: float
) -> None:
    """Aspirate volume from waste and dispense into destination in tip-sized chunks."""
    remaining = float(volume)
    while remaining > 0:
        chunk = min(remaining, MAX_TRANSFER)
        pipette.aspirate(chunk, waste.bottom(z=1))
        pipette.dispense(chunk, destination.top(z=-2))
        remaining -= chunk


def run(protocol: ProtocolContext) -> None:
    """Restore starting liquids from waste and reset movable labware."""
    disposable_lid = protocol.params.disposable_lid  # type: ignore[attr-defined]
    deck_riser = protocol.params.deck_riser  # type: ignore[attr-defined]
    pipette_mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]

    tc: ThermocyclerContext = protocol.load_module(
        "thermocycler module gen2"
    )  # type: ignore[assignment]
    tc.open_lid()
    temp: TemperatureModuleContext = protocol.load_module(
        "temperature module gen2", "D3"
    )  # type: ignore[assignment]
    reagent_rack = temp.load_labware(
        "opentrons_24_aluminumblock_nest_1.5ml_snapcap", "Reagent Rack"
    )
    reagent_rack.load_empty(reagent_rack.wells())
    destination = tc.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "Destination Plate 1"
    )
    destination.load_empty(destination.wells())
    dna = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "DNA Plate 1"
    )
    dna.load_empty(dna.wells())
    waste = protocol.load_labware("nest_1_reservoir_195ml", "D2", "Liquid Waste")
    tiprack_50 = [
        protocol.load_labware("opentrons_flex_96_tiprack_50ul", slot)
        for slot in ["B2", "B3"]
    ]
    p50 = protocol.load_instrument(
        "flex_8channel_50", pipette_mount, tip_racks=tiprack_50
    )

    water_well = reagent_rack["B1"]
    mmx_wells = list(reagent_rack.rows()[0])
    restore_targets_single: list[tuple[Well, float]] = [
        (water_well, WATER_START_VOLUME),
        *((well, MASTERMIX_START_VOLUME) for well in mmx_wells),
    ]
    total_volume = (
        WATER_START_VOLUME
        + MASTERMIX_START_VOLUME * len(mmx_wells)
        + DNA_START_VOLUME * len(dna.wells())
    )
    waste["A1"].load_liquid(
        protocol.define_liquid(
            "Mixed water waste",
            description="Forward cleanup output; recoverable for ABR water runs.",
            display_color="#808080",
        ),
        total_volume,
    )

    # Forward end state with disposable_lid: 2 unused lids on C3, 1 used on C2.
    if disposable_lid:
        lid_str = "opentrons_tough_pcr_auto_sealing_lid"
        if deck_riser:
            deck_riser_adapter = protocol.load_adapter(
                "opentrons_flex_deck_riser", "C3"
            )
            unused_lids = deck_riser_adapter.load_lid_stack(lid_str, 2)
        else:
            unused_lids = protocol.load_lid_stack(lid_str, "C3", 2)
        used_lid = protocol.load_lid_stack(lid_str, "C2", 1)
        protocol.move_lid(used_lid, unused_lids, use_gripper=True)

    protocol.comment("Recovering DNA plate starting water from mixed liquid waste.")
    p50.configure_nozzle_layout(style=ALL, tip_racks=tiprack_50)
    p50.pick_up_tip()
    p50.liquid_presence_detection = False
    for column in dna.columns():
        _restore_volume(p50, waste["A1"], column[0], DNA_START_VOLUME)
    p50.return_tip()

    protocol.comment("Recovering water and mastermix starting volumes from waste.")
    p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
    p50.pick_up_tip()
    p50.liquid_presence_detection = False
    for destination_well, volume in restore_targets_single:
        _restore_volume(p50, waste["A1"], destination_well, volume)
    p50.return_tip()
    p50.reset_tipracks()

    if deactivate_modules_bool:
        temp.deactivate()
        tc.deactivate()

    protocol.comment(
        "Reset complete: reagents and DNA restored, destination empty, "
        "lid stack and tips ready. Rerun original."
    )
