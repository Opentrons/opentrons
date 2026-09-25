"""BMS PCR Protocol."""

from opentrons.protocol_api import ParameterContext, ProtocolContext, InstrumentContext, ModuleContext, Well, Labware,  HeaterShakerContext,MagneticModuleContext, AbsorbanceReaderContext

from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
    TemperatureModuleContext,
)
from opentrons.protocol_api import SINGLE, ALL, InstrumentContext, Labware, Well
from opentrons.hardware_control.modules.types import ThermocyclerStep
from typing import List, Dict, Union


metadata = {
    "protocolName": "PCR Protocol with TC Auto Sealing Lid ABR OFF",
    "author": "Rami Farawi <ndiehl@opentrons.com",
}
requirements = {"robotType": "Flex", "apiLevel": "2.27"}

LiquidMap = Dict[str, List[Dict[str, Union[Well, List[Well], float]]]]
LIQUID_COLORS = ["#008000", "#A52A2A", "#00FFFF", "#0000FF", "#800080"]


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
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
        description="Z offset for meniscus height.",
    )
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )


def load_liquids(protocol: ProtocolContext, liquid_map: LiquidMap) -> List[Well]:
    """Load liquids into wells and return the flattened list of loaded wells."""
    loaded_wells: List[Well] = []
    for i, (liquid_name, wells_info) in enumerate(liquid_map.items()):
        liquid = protocol.define_liquid(
            liquid_name, display_color=LIQUID_COLORS[i % len(LIQUID_COLORS)]
        )
        for well_info in wells_info:
            raw_wells = well_info["well"]
            if isinstance(raw_wells, Well):
                wells: List[Well] = [raw_wells]
            elif isinstance(raw_wells, list):
                wells = raw_wells
            else:
                continue
            volume = float(well_info["volume"])  # type: ignore[arg-type]
            for well in wells:
                well.load_liquid(liquid, volume)
            if volume != 0.0:
                loaded_wells.extend(wells)
    return loaded_wells


def probe_wells(
    protocol: ProtocolContext, pipette: InstrumentContext, wells: List[Well]
) -> None:
    """Measure and report liquid height of wells."""
    pipette.pick_up_tip()
    heights = {}
    for well in wells:
        wells_in_plate = len(well.parent.wells())
        # Multi-channel layouts can only reach the first row of a plate.
        if wells_in_plate <= 12 or (
            pipette.active_channels > 1 and well.well_name.startswith("A")
        ):
            heights[well.parent.name, well] = pipette.measure_liquid_height(well)
    if pipette.active_channels != pipette.channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()
        pipette.reset_tipracks()
    protocol.comment(msg=f"result: {heights}")


def perform_pcr(protocol: ProtocolContext, thermocycler: ThermocyclerContext) -> None:
    """Run the initial denaturation, cycling and final extension profiles."""
    initial_denaturation: List[ThermocyclerStep] = [
        {"temperature": 98, "hold_time_seconds": 120}
    ]
    cycling: List[ThermocyclerStep] = [
        {"temperature": 98, "hold_time_seconds": 10},
        {"temperature": 60, "hold_time_seconds": 10},
        {"temperature": 72, "hold_time_seconds": 30},
    ]
    final_extension: List[ThermocyclerStep] = [
        {"temperature": 72, "hold_time_minutes": 5}
    ]
    protocol.comment("Initial Denaturation for 120 seconds.")
    thermocycler.execute_profile(
        steps=initial_denaturation, repetitions=1, block_max_volume=50
    )
    protocol.comment("PCR for 30 cycles.")
    thermocycler.execute_profile(steps=cycling, repetitions=30, block_max_volume=50)
    protocol.comment("Final Extension profile for 5 minutes.")
    thermocycler.execute_profile(
        steps=final_extension, repetitions=1, block_max_volume=50
    )


def clean_up_plates(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    plates: List[Labware],
    liquid_waste: Well,
) -> None:
    """Aspirate liquid from plates and dispense into liquid waste."""
    pipette.pick_up_tip()
    pipette.liquid_presence_detection = False
    for plate in plates:
        wells = plate.rows()[0] if pipette.active_channels == 8 else plate.wells()
        for well in wells:
            if not protocol.is_simulating():
                vol_transfer: float = well.current_liquid_volume()  # type: ignore
                pipette.transfer(
                    vol_transfer, well, liquid_waste.top(), new_tip="never"
                )
    if pipette.active_channels != pipette.channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    protocol.capture_image(filename="start_of_run")

    pipette_mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    disposable_lid = protocol.params.disposable_lid  # type: ignore[attr-defined]
    parsed_csv = protocol.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    deck_riser = protocol.params.deck_riser  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    protocol.comment("Protocol Version: 06")

    rxn_vol = 50
    real_mode = True
    # DECK SETUP AND LABWARE

    tc_mod: ThermocyclerContext = protocol.load_module("thermocycler module gen2")  # type: ignore[assignment]

    temp_mod: TemperatureModuleContext = protocol.load_module(
        "temperature module gen2", location="D3"
    )  # type: ignore[assignment]
    reagent_rack = temp_mod.load_labware(
        "opentrons_24_aluminumblock_nest_1.5ml_snapcap", "Reagent Rack"
    )
    dest_plate_1 = tc_mod.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "Destination Plate 1"
    )
    dest_plate_1.load_empty(dest_plate_1.wells())
    source_plate_1 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "DNA Plate 1"
    )
    waste = protocol.load_labware("nest_1_reservoir_195ml", "D2", "Liquid Waste")
    liquid_waste = waste["A1"]
    tiprack_50 = [
        protocol.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in [8, 9]
    ]

    # Opentrons tough pcr auto sealing lids
    if disposable_lid:
        lid_str = "opentrons_tough_pcr_auto_sealing_lid"
        if deck_riser:
            riser = protocol.load_adapter("opentrons_flex_deck_riser", "C3")
            unused_lids = riser.load_lid_stack(lid_str, 3)
        else:
            unused_lids = protocol.load_lid_stack(lid_str, "C3", 3)
    # LOAD PIPETTES
    p50 = protocol.load_instrument(
        "flex_8channel_50",
        pipette_mount,
        tip_racks=tiprack_50,
        liquid_presence_detection=True,
    )
    p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
    protocol.load_trash_bin("A3")
    tc_mod.open_lid()
    tc_task = tc_mod.start_set_lid_temperature(105)
    temp_mod_task = temp_mod.start_set_temperature(4)
    protocol.wait_for_tasks(
        [tc_task, temp_mod_task],
    )

    # LOAD LIQUIDS
    water: Well = reagent_rack["B1"]
    mmx_pic: List[Well] = reagent_rack.rows()[0]
    dna_pic: List[Well] = source_plate_1.wells()

    liquid_vols_and_wells: LiquidMap = {
        "Water": [{"well": water, "volume": 500.0}],
        "Mastermix": [{"well": mmx_pic, "volume": 500.0}],
        "DNA": [{"well": dna_pic, "volume": 100.0}],
    }
    loaded_wells = load_liquids(protocol, liquid_vols_and_wells)
    if probe_height_bool:
        probe_wells(protocol, p50, loaded_wells)
    # adding water
    protocol.comment("\n\n----------ADDING WATER----------\n")
    p50.pick_up_tip()
    p50.aspirate(40, water)  # prewet
    p50.dispense(40, water)
    parsed_csv = parsed_csv[1:]
    num_of_rows = len(parsed_csv)
    for row_index in range(num_of_rows):
        row_values = parsed_csv[row_index]
        water_vol = row_values[1]
        if water_vol.lower() == "x":
            continue
        water_vol = int(water_vol)
        dest_well = row_values[0]
        if water_vol == 0:
            break

        p50.configure_for_volume(water_vol)
        p50.prepare_to_aspirate()
        p50.aspirate(
            water_vol,
            location=water.meniscus(z=meniscus_z, target="start"),
            end_location=water.meniscus(z=meniscus_z, target="end"),
        )
        p50.dispense(
            water_vol,
            location=dest_plate_1[dest_well].meniscus(z=2, target="start"),
            end_location=dest_plate_1[dest_well].meniscus(z=2, target="end"),
            rate=0.5,
        )
        p50.configure_for_volume(50)
        p50.blow_out()
    p50.drop_tip()

    # adding Mastermix
    protocol.comment("\n\n----------ADDING MASTERMIX----------\n")
    for i, row in enumerate(parsed_csv):
        p50.pick_up_tip()
        mmx_vol = row[3]
        if mmx_vol.lower() == "x":
            continue

        if i == 0:
            mmx_tube = row[4]
        mmx_tube_check = mmx_tube
        mmx_tube = row[4]
        if mmx_tube_check != mmx_tube:
            p50.drop_tip()
            p50.pick_up_tip()

        if not p50.has_tip:
            p50.pick_up_tip()

        mmx_vol = int(row[3])
        dest_well = row[0]

        if mmx_vol == 0:
            break
        p50.configure_for_volume(mmx_vol)
        p50.aspirate(
            mmx_vol,
            location=reagent_rack[mmx_tube].meniscus(z=meniscus_z, target="start"),
            end_location=reagent_rack[mmx_tube].meniscus(z=meniscus_z, target="end"),
        )
        p50.dispense(
            mmx_vol,
            location=dest_plate_1[dest_well].meniscus(z=2, target="start"),
            end_location=dest_plate_1[dest_well].meniscus(z=2, target="end"),
        )
        protocol.delay(seconds=2)
        p50.blow_out()
        p50.touch_tip()
        p50.configure_for_volume(50)
        p50.drop_tip()
    if p50.has_tip:
        p50.drop_tip()

    # adding DNA
    protocol.comment("\n\n----------ADDING DNA----------\n")
    for row in parsed_csv:
        dna_vol = row[2]
        if dna_vol.lower() == "x":
            continue

        p50.pick_up_tip()

        dna_vol = int(row[2])
        dest_and_source_well = row[0]

        if dna_vol == 0:
            break
        p50.configure_for_volume(dna_vol)
        p50.aspirate(
            dna_vol,
            location=source_plate_1[dest_and_source_well].meniscus(
                z=meniscus_z, target="start"
            ),
            end_location=source_plate_1[dest_and_source_well].meniscus(
                z=meniscus_z, target="end"
            ),
        )
        p50.dispense(
            dna_vol,
            location=dest_plate_1[dest_and_source_well].meniscus(z=2, target="start"),
            end_location=dest_plate_1[dest_and_source_well].meniscus(z=2, target="end"),
            rate=0.5,
        )

        p50.mix(
            10,
            0.7 * rxn_vol if 0.7 * rxn_vol < 30 else 30,
            dest_plate_1[dest_and_source_well],
        )
        p50.drop_tip()
        p50.configure_for_volume(50)
    # A zero-volume row breaks out of the loop with a tip still attached.
    if p50.has_tip:
        p50.drop_tip()

    protocol.comment("\n\n-----------Running PCR------------\n")

    if real_mode:
        if disposable_lid:
            tc_mod.open_lid()
            protocol.move_lid(unused_lids, dest_plate_1, use_gripper=True)
        tc_mod.close_lid()
        perform_pcr(protocol, tc_mod)

        block_task = tc_mod.start_set_block_temperature(4)
        protocol.wait_for_tasks([block_task])
        tc_mod.open_lid()
        if disposable_lid:
            protocol.move_lid(dest_plate_1, "C2", use_gripper=True)
        p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
        mmx_pic.append(water)
    # Empty plates into liquid waste
    p50.configure_nozzle_layout(style=ALL, tip_racks=tiprack_50)
    clean_up_plates(protocol, p50, [source_plate_1, dest_plate_1], liquid_waste)
    # Probe liquid waste
    probe_wells(protocol, p50, [liquid_waste])
    if deactivate_modules_bool:
        tc_mod.deactivate()
        temp_mod.deactivate()
    protocol.capture_image(filename="end_of_run")
