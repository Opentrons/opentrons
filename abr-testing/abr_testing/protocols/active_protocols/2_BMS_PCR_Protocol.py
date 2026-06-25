"""BMS PCR Protocol."""

from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
    TemperatureModuleContext,
)
from opentrons.protocol_api import SINGLE, Well, ALL
from abr_testing.protocols.helpers import run_helpers, background_helpers
from typing import List, Dict


metadata = {
    "protocolName": "PCR Protocol with TC Auto Sealing Lid",
    "author": "Rami Farawi <ndiehl@opentrons.com",
}
requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    run_helpers.create_single_pipette_mount_parameter(parameters)
    run_helpers.create_error_capture_duration_duration(parameters)
    run_helpers.create_disposable_lid_parameter(parameters, False)
    run_helpers.create_csv_parameter(parameters)
    run_helpers.create_tc_lid_deck_riser_parameter(parameters, False)
    run_helpers.create_deactivate_modules_parameter(parameters)
    run_helpers.create_meniscus_z_parameter(parameters)
    run_helpers.create_probe_liquid_height_parameter(parameters)


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    if not protocol.is_simulating():
        background_helpers.launch_background_tasks()

    protocol.capture_image(filename="start_of_run")
    length = protocol.params.error_capture_duration  # type: ignore[attr-defined]

    pipette_mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    disposable_lid = protocol.params.disposable_lid  # type: ignore[attr-defined]
    parsed_csv = protocol.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    deck_riser = protocol.params.deck_riser  # type: ignore[attr-defined]
    deactivate_modules_bool = protocol.params.deactivate_modules  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    run_helpers.comment_protocol_version(protocol, "06")
    if not protocol.is_simulating():
        slack_bot = run_helpers.set_up_slack()
        slack_bot.send_run_started_message(metadata["protocolName"])

    rxn_vol = 50
    real_mode = True
    # DECK SETUP AND LABWARE

    tc_mod: ThermocyclerContext = protocol.load_module(
        run_helpers.tc_str
    )  # type: ignore[assignment]

    temp_mod: TemperatureModuleContext = protocol.load_module(
        run_helpers.temp_str, location="D3"
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
        unused_lids = run_helpers.load_disposable_lids(protocol, 3, "C3", deck_riser)
    # LOAD PIPETTES
    p50 = protocol.load_instrument(
        "flex_8channel_50",
        pipette_mount,
        tip_racks=tiprack_50,
        liquid_presence_detection=True,
    )
    p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
    protocol.load_trash_bin("A3")
    try:
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
            run_helpers.find_liquid_height_of_loaded_liquids(
                protocol, liquid_vols_and_wells, p50
            )
        else:
            run_helpers.load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)
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
            p50.drop_tip()
            p50.configure_for_volume(50)

        protocol.comment("\n\n-----------Running PCR------------\n")

        if real_mode:
            if disposable_lid:
                run_helpers.use_disposable_lid_with_tc(
                    protocol, unused_lids, dest_plate_1, tc_mod
                )
                tc_mod.close_lid()
            run_helpers.perform_pcr(
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
            p50.drop_tip()
            p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
            mmx_pic.append(water)
        # Empty plates into liquid waste
        p50.configure_nozzle_layout(style=ALL, tip_racks=tiprack_50)
        run_helpers.clean_up_plates(
            protocol, p50, [source_plate_1, dest_plate_1], liquid_waste
        )
        # Probe liquid waste
        run_helpers.find_liquid_height_of_all_wells(protocol, p50, [liquid_waste])
        if deactivate_modules_bool:
            run_helpers.deactivate_modules(protocol)
        protocol.capture_image(filename="end_of_run")
        if not protocol.is_simulating():
            run_helpers.send_slack_message_with_image(
                slack_bot, metadata["protocolName"]
            )
    except Exception as e:
        if not protocol.is_simulating():
            run_helpers.send_slack_error_message_with_attachments(
                slack_bot, metadata["protocolName"], str(e), length
            )
        raise (e)
