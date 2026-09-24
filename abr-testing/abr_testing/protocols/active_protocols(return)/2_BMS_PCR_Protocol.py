"""BMS PCR Protocol."""

from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
    TemperatureModuleContext,
)
from opentrons.protocol_api import SINGLE, Well, ALL
from typing import List, Dict


metadata = {
    "protocolName": "PCR Protocol with TC Auto Sealing Lid",
    "author": "Rami Farawi <ndiehl@opentrons.com",
}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}



def comment_height_of_specific_labware(protocol, labware_name, dict_of_labware_heights):
    """Comment height found of specific labware."""
    total_height = 0.0
    for key in dict_of_labware_heights.keys():
        if key[0] == labware_name:
            height = dict_of_labware_heights[key]
            total_height += height
    protocol.comment(f"Liquid Waste Total Height: {total_height}")


def load_wells_with_custom_liquids(protocol, liquid_vols_and_wells):
    """Load custom liquids into wells."""
    from opentrons.protocol_api import Well

    liquid_colors = [
        "#008000",
        "#A52A2A",
        "#00FFFF",
        "#0000FF",
        "#800080",
        "#ADD8E6",
        "#FF0000",
        "#FFFF00",
        "#FF00FF",
        "#00008B",
        "#7FFFD4",
        "#FFC0CB",
        "#FFA500",
        "#00FF00",
        "#C0C0C0",
    ]
    i = 0
    volume = 0.0
    for liquid_name, wells_info in liquid_vols_and_wells.items():
        liquid = protocol.define_liquid(
            liquid_name, display_color=liquid_colors[i % len(liquid_colors)]
        )
        for well_info in wells_info:
            if isinstance(well_info["well"], list):
                wells = well_info["well"]
            elif isinstance(well_info["well"], Well):
                wells = [well_info["well"]]
            else:
                wells = []
            if isinstance(well_info["volume"], (float, int)):
                volume = well_info["volume"]
            for well in wells:
                well.load_liquid(liquid, volume)


def find_liquid_height_of_all_wells(protocol, pipette, wells):
    """Find the liquid height of all wells in protocol."""
    dict_of_labware_heights = {}
    pipette.pick_up_tip()
    pip_channels = pipette.active_channels
    for well in wells:
        labware_name = well.parent.name
        total_number_of_wells_in_plate = len(well.parent.wells())
        if (
            pip_channels > 1
            and total_number_of_wells_in_plate > 12
            and well.well_name.startswith("A")
        ):
            height = pipette.measure_liquid_height(well)
            dict_of_labware_heights[labware_name, well] = height
        elif total_number_of_wells_in_plate <= 12:
            height = pipette.measure_liquid_height(well)
            dict_of_labware_heights[labware_name, well] = height
    # Always return tips so forward+reverse ABR cycles need no tip restocking.
    pipette.return_tip()
    pipette.reset_tipracks()
    msg = f"result: {dict_of_labware_heights}"
    protocol.comment(msg=msg)
    comment_height_of_specific_labware(
        protocol, "Liquid Waste", dict_of_labware_heights
    )
    return dict_of_labware_heights


def find_liquid_height_of_loaded_liquids(ctx, liquid_vols_and_wells, pipette):
    """Find Liquid height of loaded liquids."""
    from opentrons.protocol_api import Well

    load_wells_with_custom_liquids(ctx, liquid_vols_and_wells)
    wells = [
        well
        for items in liquid_vols_and_wells.values()
        for entry in items
        if isinstance(entry["well"], (Well, list)) and entry["volume"] != 0.0
        for well in (
            entry["well"] if isinstance(entry["well"], list) else [entry["well"]]
        )
    ]
    if pipette.active_channels == 96:
        wells = [well for well in wells if well.display_name.split(" ")[0] == "A1"]
    find_liquid_height_of_all_wells(ctx, pipette, wells)
    return wells


def load_disposable_lids(protocol, num_of_lids, deck_slot, deck_riser=False):
    """Load Stack of Disposable lids."""
    lid_str = "opentrons_tough_pcr_auto_sealing_lid"
    if deck_riser:
        deck_riser_adapter = protocol.load_adapter(
            "opentrons_flex_deck_riser", deck_slot
        )
        unused_lids = deck_riser_adapter.load_lid_stack(lid_str, num_of_lids)
    else:
        unused_lids = protocol.load_lid_stack(lid_str, deck_slot, num_of_lids)
    return unused_lids


def deactivate_modules(protocol):
    """Deactivate all loaded modules."""
    from opentrons.protocol_api.module_contexts import (
        HeaterShakerContext,
        TemperatureModuleContext,
        MagneticModuleContext,
        ThermocyclerContext,
    )

    modules = protocol.loaded_modules
    if modules:
        for module in modules.values():
            if isinstance(module, HeaterShakerContext):
                module.deactivate_shaker()
                module.deactivate_heater()
            elif isinstance(module, TemperatureModuleContext):
                module.deactivate()
            elif isinstance(module, MagneticModuleContext):
                module.disengage()
            elif isinstance(module, ThermocyclerContext):
                module.deactivate()


def use_disposable_lid_with_tc(protocol, lid_stack, plate_in_thermocycler, thermocycler):
    """Use disposable lid with thermocycler."""
    thermocycler.open_lid()
    protocol.move_lid(lid_stack, plate_in_thermocycler, use_gripper=True)
    thermocycler.close_lid()


def clean_up_plates(protocol, pipette, list_of_labware, liquid_waste):
    """Aspirate liquid from labware and dispense into liquid waste."""
    pipette.pick_up_tip()
    pipette.liquid_presence_detection = False
    num_of_active_channels = pipette.active_channels
    for labware in list_of_labware:
        if num_of_active_channels == 8:
            list_of_wells = labware.rows()[0]
        elif num_of_active_channels == 1:
            list_of_wells = labware.wells()
        elif num_of_active_channels == 96:
            list_of_wells = [labware.wells()[0]]
        for well in list_of_wells:
            if protocol.is_simulating():
                vol_transfer = well.max_volume
            else:
                vol_transfer = well.current_liquid_volume()  # type: ignore
                pipette.transfer(
                    vol_transfer, well, liquid_waste.top(), new_tip="never"
                )
    # Always return tips so forward+reverse ABR cycles need no tip restocking.
    pipette.return_tip()
    pipette.reset_tipracks()


def perform_pcr(
    protocol,
    thermocycler,
    initial_denature_time_sec,
    denaturation_time_sec,
    anneal_time_sec,
    extension_time_sec,
    cycle_repetitions,
    final_extension_time_min,
):
    """Perform PCR."""
    initial_denaturation_profile = [
        {"temperature": 98, "hold_time_seconds": initial_denature_time_sec}
    ]
    cycling_profile = [
        {"temperature": 98, "hold_time_seconds": denaturation_time_sec},
        {"temperature": 60, "hold_time_seconds": anneal_time_sec},
        {"temperature": 72, "hold_time_seconds": extension_time_sec},
    ]
    final_extension_profile = [
        {"temperature": 72, "hold_time_minutes": final_extension_time_min}
    ]
    protocol.comment(f"Initial Denaturation for {initial_denature_time_sec} seconds.")
    thermocycler.execute_profile(
        steps=initial_denaturation_profile, repetitions=1, block_max_volume=50
    )
    protocol.comment(f"PCR for {cycle_repetitions} cycles.")
    thermocycler.execute_profile(
        steps=cycling_profile, repetitions=cycle_repetitions, block_max_volume=50
    )
    protocol.comment(f"Final Extension profile for {final_extension_time_min} minutes.")
    thermocycler.execute_profile(
        steps=final_extension_profile, repetitions=1, block_max_volume=50
    )


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

    tc_mod: ThermocyclerContext = protocol.load_module(
        "thermocycler module gen2"
    )  # type: ignore[assignment]

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
        protocol.load_labware("opentrons_flex_96_tiprack_50ul", slot)
        for slot in ["B2", "B3"]
    ]

    # Opentrons tough pcr auto sealing lids
    if disposable_lid:
        unused_lids = load_disposable_lids(protocol, 3, "C3", deck_riser)
    # LOAD PIPETTES
    p50 = protocol.load_instrument(
        "flex_8channel_50",
        pipette_mount,
        tip_racks=tiprack_50,
        liquid_presence_detection=True,
    )
    p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
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

    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Water": [{"well": water, "volume": 500.0}],
        "Mastermix": [{"well": mmx_pic, "volume": 500.0}],
        "DNA": [{"well": dna_pic, "volume": 100.0}],
    }
    if probe_height_bool:
        find_liquid_height_of_loaded_liquids(
            protocol, liquid_vols_and_wells, p50
        )
    else:
        load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)
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
            continue

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
    p50.return_tip()
    p50.reset_tipracks()

    # adding Mastermix
    protocol.comment("\n\n----------ADDING MASTERMIX----------\n")
    mmx_tube = parsed_csv[0][4]
    for row in parsed_csv:
        mmx_vol_raw = row[3]
        if mmx_vol_raw.lower() == "x":
            continue
        mmx_vol = int(mmx_vol_raw)
        if mmx_vol == 0:
            continue
        dest_well = row[0]
        next_tube = row[4]
        if next_tube != mmx_tube and p50.has_tip:
            p50.return_tip()
            p50.reset_tipracks()
        mmx_tube = next_tube
        if not p50.has_tip:
            p50.pick_up_tip()
        p50.configure_for_volume(mmx_vol)
        p50.aspirate(
            mmx_vol,
            location=reagent_rack[mmx_tube].meniscus(z=meniscus_z, target="start"),
            end_location=reagent_rack[mmx_tube].meniscus(
                z=meniscus_z, target="end"
            ),
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
        p50.return_tip()
        p50.reset_tipracks()
    if p50.has_tip:
        p50.return_tip()
        p50.reset_tipracks()

    # adding DNA
    # D1 plate + TC dest: A1 nozzle reaches rows A-E; H1 nozzle reaches rows F-H.
    protocol.comment("\n\n----------ADDING DNA----------\n")
    current_start = "A1"
    for row in parsed_csv:
        dna_vol_raw = row[2]
        if dna_vol_raw.lower() == "x":
            continue
        dna_vol = int(dna_vol_raw)
        if dna_vol == 0:
            continue
        dest_and_source_well = row[0]
        nozzle_start = "A1" if dest_and_source_well[0] in "ABCDE" else "H1"
        if nozzle_start != current_start:
            p50.configure_nozzle_layout(
                style=SINGLE, start=nozzle_start, tip_racks=tiprack_50
            )
            current_start = nozzle_start
        p50.pick_up_tip()
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
            location=dest_plate_1[dest_and_source_well].meniscus(
                z=2, target="start"
            ),
            end_location=dest_plate_1[dest_and_source_well].meniscus(
                z=2, target="end"
            ),
            rate=0.5,
        )

        p50.mix(
            10,
            0.7 * rxn_vol if 0.7 * rxn_vol < 30 else 30,
            dest_plate_1[dest_and_source_well],
        )
        p50.return_tip()
        p50.reset_tipracks()
        p50.configure_for_volume(50)

    protocol.comment("\n\n-----------Running PCR------------\n")

    if real_mode:
        if disposable_lid:
            use_disposable_lid_with_tc(
                protocol, unused_lids, dest_plate_1, tc_mod
            )
            tc_mod.close_lid()
        perform_pcr(
            protocol,
            tc_mod,
            initial_denature_time_sec=120,
            denaturation_time_sec=10,
            anneal_time_sec=10,
            extension_time_sec=30,
            cycle_repetitions=30,
            final_extension_time_min=5,
        )

        block_task = tc_mod.start_set_block_temperature(4)
        protocol.wait_for_tasks([block_task])
        tc_mod.open_lid()
        if disposable_lid:
            protocol.move_lid(dest_plate_1, "C2", use_gripper=True)
        if p50.has_tip:
            p50.return_tip()

    # Empty plates and leftover reagents into liquid waste so reverse can
    # restore full starting volumes with no operator refill.
    p50.configure_nozzle_layout(style=ALL, tip_racks=tiprack_50)
    clean_up_plates(
        protocol, p50, [source_plate_1, dest_plate_1], liquid_waste
    )
    p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
    p50.pick_up_tip()
    p50.liquid_presence_detection = False
    for well in [water, *mmx_pic]:
        if protocol.is_simulating():
            continue
        vol_transfer = well.current_liquid_volume()  # type: ignore
        if vol_transfer and vol_transfer > 0:
            p50.transfer(
                vol_transfer, well, liquid_waste.top(), new_tip="never"
            )
    p50.return_tip()
    p50.reset_tipracks()
    # Probe liquid waste
    p50.configure_nozzle_layout(style=ALL, tip_racks=tiprack_50)
    find_liquid_height_of_all_wells(protocol, p50, [liquid_waste])
    if deactivate_modules_bool:
        deactivate_modules(protocol)
    protocol.capture_image(filename="end_of_run")
