"""Reverse/reset companion for 15_Miniprep_Vacuum_96_Stackers.py.

Water-only ABR: vacuum waste is recoverable offline into the D2 refill
reservoir. Returns the collection plate into the vacuum module, reseats the
silica membrane plate on its C1 base, refills the reagent reservoir from D2,
restores the parked sample and filter plates, and resets tip racks.
"""

from math import floor
from typing import cast

from opentrons import protocol_api
from opentrons.protocol_api import COLUMN, VacuumModuleContext
from opentrons.protocol_api.module_contexts import HeaterShakerContext
from opentrons.types import ModuleFixtureLocation


metadata = {
    "author": "Opentrons",
    "protocolName": "Reverse Minipreps with 96-Channel Pipette (Return Tips) - Short Collar",
    "description": "Restore deck layout and reagent volumes after the return-tip miniprep.",
}

requirements = {"robotType": "Flex", "apiLevel": "2.30"}

ELUTION_VOLUME = 20

# Vacuum module is loaded in A3; dock staging area is A4 (API 2.30-compatible).
VACUUM_MANIFOLD_DOCK = ModuleFixtureLocation(
    addressable_area_name="vacuumModuleV1DockA4"
)


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Mirror the original runtime parameters for a matching deck layout."""
    parameters.add_str(
        variable_name="num_samples",
        display_name="Number of Samples to process",
        description="Must match the original miniprep run.",
        choices=[
            {"display_name": "8 Samples", "value": "8"},
            {"display_name": "24 Samples", "value": "24"},
            {"display_name": "48 Samples", "value": "48"},
            {"display_name": "96 Samples", "value": "96"},
        ],
        default="24",
    )
    parameters.add_str(
        variable_name="sample_plate_type",
        display_name="Sample Plate Type",
        choices=[
            {
                "display_name": "24 DeepWell Plate 5.0mL",
                "value": "nest_24_wellplate_10400ul",
            },
            {
                "display_name": "96 DeepWell Plate 2.2mL",
                "value": "nest_96_wellplate_2ml_deep",
            },
        ],
        default="nest_96_wellplate_2ml_deep",
    )
    parameters.add_int(
        variable_name="num_plates",
        display_name="Number of 24DWPs",
        description="Unused for 96DWP path; kept for RTP compatibility.",
        default=1,
        minimum=1,
        maximum=4,
    )
    parameters.add_str(
        variable_name="process_by",
        display_name="Sample Processing",
        choices=[
            {"display_name": "Column by Column", "value": "column"},
            {"display_name": "Full Plate", "value": "plate"},
        ],
        default="column",
        description="Must match the original; 96 samples forces plate mode.",
    )
    parameters.add_str(
        variable_name="lysis_type",
        display_name="Lysis Method",
        choices=[
            {"display_name": "Lyse by pipetting", "value": "pipette"},
            {"display_name": "Lyse by vortexing", "value": "vortex"},
        ],
        default="pipette",
    )
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="Must match the original collar.",
        default="opentrons_vacuum_manifold_collar_short",
        choices=[
            {
                "display_name": "Millipore: Short",
                "value": "opentrons_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Millipore: Tall",
                "value": "opentrons_vacuum_manifold_collar_tall",
            },
        ],
    )
    parameters.add_int(
        variable_name="column_to_process",
        display_name="Column to process",
        description="Unused here; kept for RTP compatibility.",
        default=1,
        minimum=1,
        maximum=12,
    )
    parameters.add_bool(
        variable_name="liquid_run",
        display_name="Liquid Run",
        description="True restores tracked reagent volumes for liquid ABR.",
        default=True,
    )
    parameters.add_bool(
        variable_name="deactivate_modules",
        display_name="Deactivate Modules",
        description="Deactivate heater-shaker at end of reset.",
        default=True,
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
    """Restore starting liquids and return movable labware to the original layout."""
    num_samples = int(protocol.params.num_samples)  # type: ignore[attr-defined]
    sample_plate_type = protocol.params.sample_plate_type  # type: ignore[attr-defined]
    process_by = (
        "plate"
        if num_samples == 96
        else protocol.params.process_by  # type: ignore[attr-defined]
    )
    deactivate_modules = protocol.params.deactivate_modules  # type: ignore[attr-defined]

    h_s: HeaterShakerContext = protocol.load_module(  # type: ignore[assignment]
        "heaterShakerModuleV1", "D1"
    )
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")

    vm_mod = cast(
        VacuumModuleContext,
        protocol.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    manifold_collar = protocol.load_adapter(
        protocol.params.collar,  # type: ignore[attr-defined]
        VACUUM_MANIFOLD_DOCK,
    )

    # End state of the forward protocol:
    # collection on H-S, silica on collar/dock, empty silica base on C1,
    # elution on B1, sample parked on B3, and filter plate parked on a C3 base.
    collection_plate = h_s_adapter.load_labware(
        "nest_96_wellplate_2ml_deep", "Collection Plate (end state)"
    )
    collection_plate.load_empty(collection_plate.wells())

    silica_plate_base = protocol.load_labware(
        "nunc_96_wellplate_450ul", "C1", "Silica membrane plate base"
    )
    silica_plate = manifold_collar.load_labware(
        "millipore_96_wellplate_300ul_pcr_filter", "Silica membrane plate (end state)"
    )
    silica_plate.load_empty(silica_plate.wells())

    elution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B1", "Elution plate"
    )
    elution_plate.load_empty(elution_plate.wells())

    reservoir_12well = protocol.load_labware(
        "usascientific_12_reservoir_22ml", "A2", "Reagent Reservoir"
    )
    reservoir_12well.load_empty(reservoir_12well.wells())

    # Refill source: recovered water is poured in here before this run.
    refill_reservoir = protocol.load_labware(
        "nest_1_reservoir_290ml", "D2", "Refill Reservoir"
    )

    sample_plate = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "B3", "Sample Plate (parked)"
    )
    sample_plate.load_empty(sample_plate.wells())
    filter_plate_parking_base = protocol.load_labware(
        "nunc_96_wellplate_450ul", "C3", "Filter plate parking base"
    )
    nunc_filter_plate = filter_plate_parking_base.load_labware(
        "millipore_96_wellplate_300ul_pcr_filter",
        "Nunc Filter Plate (parked)",
    )
    nunc_filter_plate.load_empty(nunc_filter_plate.wells())

    tip_racks = [
        protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B2", "Tips B2")
    ]
    if process_by == "plate":
        tiprack_adapter = protocol.load_adapter(
            "opentrons_flex_96_tiprack_adapter", "C2"
        )
        tip_racks.append(
            tiprack_adapter.load_labware(
                "opentrons_flex_96_tiprack_1000ul", "Tips C2 adapter"
            )
        )

    pip_96_1000 = protocol.load_instrument(
        "flex_96channel_1000",
        "left",
        tip_racks=tip_racks,
    )

    if sample_plate_type == "nest_96_wellplate_2ml_deep":
        p_buffer_volume = 70
        n3_buffer_volume = 100
    else:
        p_buffer_volume = 250
        n3_buffer_volume = 350

    p_buffer_volume_reservoir = p_buffer_volume * num_samples + 1000
    n3_buffer_volume_reservoir = n3_buffer_volume * num_samples + 1000
    elution_buffer_volume_reservoir = ELUTION_VOLUME * num_samples + 1000
    total_pe_buffer_volume = 425 * num_samples
    pe_buffer_fullwells_num = floor(total_pe_buffer_volume / 20500)
    pe_buffer_lastwell_volume = total_pe_buffer_volume % 20500
    available_wells_for_pe_buffer = ["A12", "A11", "A10", "A9", "A8", "A7", "A6", "A5"]

    liquid_vols_and_wells: dict[
        str, list[dict[str, protocol_api.Well | list[protocol_api.Well] | float]]
    ] = {
        "P1 Buffer": [
            {"well": reservoir_12well["A1"], "volume": float(p_buffer_volume_reservoir)}
        ],
        "P2 Buffer": [
            {"well": reservoir_12well["A2"], "volume": float(p_buffer_volume_reservoir)}
        ],
        "N3 Buffer": [
            {
                "well": reservoir_12well["A3"],
                "volume": float(n3_buffer_volume_reservoir),
            }
        ],
        "Elution Buffer": [
            {
                "well": reservoir_12well["A4"],
                "volume": float(elution_buffer_volume_reservoir),
            }
        ],
    }
    for well_index in range(pe_buffer_fullwells_num):
        liquid_vols_and_wells[f"PE Buffer {well_index + 1}"] = [
            {
                "well": reservoir_12well[available_wells_for_pe_buffer[well_index]],
                "volume": 21500.0,
            }
        ]
    liquid_vols_and_wells["PE Buffer last"] = [
        {
            "well": reservoir_12well[
                available_wells_for_pe_buffer[pe_buffer_fullwells_num]
            ],
            "volume": float(pe_buffer_lastwell_volume + 1000),
        }
    ]

    protocol.comment("Returning silica plate to C1 base.")
    protocol.move_labware(silica_plate, silica_plate_base, use_gripper=True)

    protocol.comment("Returning collection plate into vacuum module.")
    h_s.open_labware_latch()
    protocol.move_labware(collection_plate, vm_mod, use_gripper=True)

    protocol.comment("Returning parked sample plate from B3 to heater-shaker.")
    protocol.move_labware(sample_plate, h_s_adapter, use_gripper=True)
    h_s.close_labware_latch()

    protocol.comment("Returning parked filter plate from C3 to vacuum collar.")
    protocol.move_labware(nunc_filter_plate, manifold_collar, use_gripper=True)

    refill_targets: list[tuple[protocol_api.Well, float]] = []
    for wells_info in liquid_vols_and_wells.values():
        for well_info in wells_info:
            volume = float(cast(float, well_info["volume"]))
            if volume <= 0:
                continue
            raw_wells = cast(
                "protocol_api.Well | list[protocol_api.Well]", well_info["well"]
            )
            wells = (
                [raw_wells]
                if isinstance(raw_wells, protocol_api.Well)
                else list(raw_wells)
            )
            refill_targets.extend((well, volume) for well in wells)

    total_volume = sum(volume for _, volume in refill_targets)
    water = protocol.define_liquid(
        name="Water",
        description="ABR fleet water; mixed vacuum waste is recoverable.",
        display_color="#C0C0C0",
    )
    refill_reservoir["A1"].load_liquid(water, total_volume)

    protocol.comment(
        f"Refilling reagent reservoir with {total_volume:.0f} uL from D2. "
        "Pour recovered water into the refill reservoir before starting."
    )
    # COLUMN uses 8 nozzles, so transfer volumes are per nozzle. The B2 rack is
    # the partial rack (no adapter), which is what COLUMN pickup requires.
    pip_96_1000.configure_nozzle_layout(
        style=COLUMN, start="A12", tip_racks=[tip_racks[0]]
    )
    pip_96_1000.transfer(
        volume=[volume / 8.0 for _, volume in refill_targets],
        source=[refill_reservoir["A1"]] * len(refill_targets),
        dest=[well.top() for well, _ in refill_targets],
        trash=False,
        blow_out=False,
        blowout_location="destination well",
    )
    pip_96_1000.reset_tipracks()

    if deactivate_modules:
        h_s.deactivate_shaker()
        h_s.deactivate_heater()

    protocol.comment("Reset complete. Rerun original return-tip miniprep.")
