"""Simple Normalize Long with LPD and Single Tip."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    SINGLE,
    ALL,
    Well,
)
from abr_testing.protocols import helpers
from typing import List, Dict

metadata = {
    "protocolName": "Simple Normalize Long with LPD and Single Tip",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    helpers.create_probe_liquid_height_parameter(parameters)
    helpers.create_csv_parameter(parameters)
    helpers.create_meniscus_z_parameter(parameters)


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    all_data = protocol.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    data = all_data[1:]
    helpers.comment_protocol_version(protocol, "02")
    if not protocol.is_simulating():
        slack_bot = helpers.set_up_slack()
        slack_bot.send_run_started_message(metadata["protocolName"])

    # DECK SETUP AND LABWARE
    protocol.comment("THIS IS A NO MODULE RUN")
    tiprack_x_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D1")
    tiprack_x_2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
    tiprack_x_3 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A1")
    sample_plate_1 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "D3"
    )

    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "B3")
    waste_reservoir = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "C1", "Liquid Waste"
    )
    waste_reservoir.load_empty(waste_reservoir.wells())
    sample_plate_2 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    sample_plate_3 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "B2"
    )
    sample_plate_4 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "A2"
    )
    sample_plates = [sample_plate_1, sample_plate_2, sample_plate_3, sample_plate_4]
    for plate in sample_plates:
        plate.load_empty(plate.wells())

    protocol.load_trash_bin("A3")

    # reagents
    reservoir.load_empty(reservoir.wells()[6:])
    Dye_1 = reservoir["A1"]
    Dye_2 = reservoir["A2"]
    Dye_3 = reservoir["A3"]
    Diluent_1 = reservoir["A4"]
    Diluent_2 = reservoir["A5"]
    Diluent_3 = reservoir["A6"]
    # pipette
    p1000 = protocol.load_instrument(
        "flex_8channel_1000", "left", tip_racks=[tiprack_x_1]
    )
    p1000_single = protocol.load_instrument(
        "flex_1channel_1000",
        "right",
        tip_racks=[tiprack_x_2, tiprack_x_3],
    )
    # LOAD LIQUIDS
    liquid_volumes = [675.0, 675.0, 675.0, 675.0, 675.0]
    wells = [Dye_1, Dye_2, Dye_3, Diluent_1, Diluent_2, Diluent_3]
    helpers.load_wells_with_water(protocol, wells, liquid_volumes)
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Dye": [{"well": [Dye_1, Dye_2, Dye_3], "volume": 675.0}],
        "Diluent": [{"well": [Diluent_1, Diluent_2, Diluent_3], "volume": 675.0}],
    }
    # CONFIGURE SINGLE LAYOUT
    p1000.configure_nozzle_layout(style=SINGLE, start="H1", tip_racks=[tiprack_x_1])
    try:
        if probe_height_bool:
            helpers.find_liquid_height_of_loaded_liquids(
                protocol, liquid_vols_and_wells, p1000_single
            )
        else:
            helpers.load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)

        for X in range(10):
            protocol.comment("==============================================")
            protocol.comment("Adding Dye Sample Plate 1")
            protocol.comment("==============================================")

            current = 0

            p1000.pick_up_tip()
            while current < len(data):
                CurrentWell = str(data[current][0])
                DyeVol = float(data[current][1])
                while Dye_1.current_liquid_volume() < (DyeVol * 8):
                    p1000.transfer(
                        DyeVol,
                        Dye_1.meniscus(z=meniscus_z, target="end"),
                        sample_plate_1.wells_by_name()[CurrentWell].top(z=1),
                        new_tip="never",
                    )
                current += 1
            p1000.blow_out(location=waste_reservoir["A1"])
            p1000.touch_tip()
            p1000.drop_tip()

            protocol.comment("==============================================")
            protocol.comment("Adding Diluent Sample Plate 1")
            protocol.comment("==============================================")

            current = 0
            p1000.pick_up_tip()
            while current < len(data):
                CurrentWell = str(data[current][0])
                DilutionVol = float(data[current][2])
                while Diluent_1.current_liquid_volume() < DilutionVol:
                    p1000.aspirate(
                        DilutionVol, Diluent_1.meniscus(z=meniscus_z, target="end")
                    )
                    p1000.dispense(
                        DilutionVol,
                        sample_plate_1.wells_by_name()[CurrentWell].top(z=0.2),
                    )
                p1000.blow_out(location=waste_reservoir["A1"])
                p1000.touch_tip()
                current += 1
            p1000.drop_tip()

            protocol.comment("Changing pipette configuration to 8ch.")

            protocol.comment("==============================================")
            protocol.comment("Adding Dye Sample Plate 2")
            protocol.comment("==============================================")
            current = 0
            p1000_single.pick_up_tip()
            while current < len(data):
                CurrentWell = str(data[current][0])
                DyeVol = float(data[current][1])
                while Dye_2.current_liquid_volume() < (DyeVol * 8):
                    p1000_single.transfer(
                        DyeVol,
                        Dye_2.meniscus(z=meniscus_z, target="end"),
                        sample_plate_2.wells_by_name()[CurrentWell].top(z=1),
                        new_tip="never",
                    )
                current += 1
            p1000_single.blow_out(location=waste_reservoir["A1"])
            p1000_single.touch_tip()
            p1000_single.return_tip()

            protocol.comment("==============================================")
            protocol.comment("Adding Diluent Sample Plate 2")
            protocol.comment("==============================================")

            current = 0
            while current < len(data):
                CurrentWell = str(data[current][0])
                DilutionVol = float(data[current][2])
                while Diluent_2.current_liquid_volume() < DilutionVol:
                    p1000_single.pick_up_tip()
                    p1000_single.aspirate(
                        DilutionVol, Diluent_2.meniscus(z=meniscus_z, target="end")
                    )
                    p1000_single.dispense(
                        DilutionVol,
                        sample_plate_2.wells_by_name()[CurrentWell].top(z=0.2),
                    )
                    p1000_single.blow_out(location=waste_reservoir["A1"])
                    p1000_single.touch_tip()
                    p1000_single.return_tip()
                current += 1

            protocol.comment("==============================================")
            protocol.comment("Adding Dye Sample Plate 3")
            protocol.comment("==============================================")

            current = 0
            p1000_single.pick_up_tip()
            while current < len(data):
                CurrentWell = str(data[current][0])
                DyeVol = float(data[current][1])
                if Dye_3.current_liquid_volume() < (DyeVol * 8):
                    p1000_single.transfer(
                        DyeVol,
                        Dye_3.meniscus(z=meniscus_z, target="end"),
                        sample_plate_3.wells_by_name()[CurrentWell].top(z=1),
                        blow_out=True,
                        blowout_location="destination well",
                        new_tip="never",
                    )
                current += 1
            p1000_single.blow_out(location=waste_reservoir["A1"])
            p1000_single.touch_tip()
            p1000_single.return_tip()
            protocol.comment("==============================================")
            protocol.comment("Adding Diluent Sample Plate 3")
            protocol.comment("==============================================")
            current = 0
            while current < len(data):
                CurrentWell = str(data[current][0])
                DilutionVol = float(data[current][2])
                while Diluent_3.current_liquid_volume() < DilutionVol:
                    p1000_single.pick_up_tip()
                    p1000_single.aspirate(
                        DilutionVol, Diluent_3.meniscus(z=meniscus_z, target="end")
                    )
                    p1000_single.dispense(
                        DilutionVol,
                        sample_plate_3.wells_by_name()[CurrentWell].top(z=0.2),
                    )
                    p1000_single.blow_out(location=waste_reservoir["A1"])
                    p1000_single.touch_tip()
                    p1000_single.return_tip()
                current += 1

            protocol.comment("==============================================")
            protocol.comment("Adding Dye Sample Plate 4")
            protocol.comment("==============================================")
            p1000_single.reset_tipracks()
            current = 0
            p1000_single.pick_up_tip()
            while current < len(data):
                CurrentWell = str(data[current][0])
                DyeVol = float(data[current][1])
                if DyeVol != 0 and DyeVol < 100:
                    p1000_single.transfer(
                        DyeVol,
                        Dye_3.bottom(z=2),
                        sample_plate_4.wells_by_name()[CurrentWell].top(z=1),
                        blow_out=True,
                        blowout_location="destination well",
                        new_tip="never",
                    )
                    if DyeVol > 20:
                        wells.append(sample_plate_4.wells_by_name()[CurrentWell])
                current += 1
            p1000_single.blow_out(location=waste_reservoir["A1"])
            p1000_single.touch_tip()
            p1000_single.return_tip()
            protocol.comment("==============================================")
            protocol.comment("Adding Diluent Sample Plate 4")
            protocol.comment("==============================================")
            current = 0
            while current < len(data):
                CurrentWell = str(data[current][0])
                DilutionVol = float(data[current][2])
                while Diluent_3.current_liquid_volume() < DilutionVol:
                    p1000_single.pick_up_tip()
                    p1000_single.aspirate(
                        DilutionVol, Diluent_3.meniscus(z=meniscus_z, target="end")
                    )
                    p1000_single.dispense(
                        DilutionVol,
                        sample_plate_4.wells_by_name()[CurrentWell].top(z=0.2),
                    )
                    if DilutionVol > 20:
                        wells.append(sample_plate_4.wells_by_name()[CurrentWell])
                    p1000_single.blow_out(location=waste_reservoir["A1"])
                    p1000_single.touch_tip()
                    p1000_single.return_tip()
                current += 1

            current = 0
        # Probe heights
        p1000.configure_nozzle_layout(style=ALL, tip_racks=[tiprack_x_3])
        helpers.clean_up_plates(
            protocol,
            p1000,
            [sample_plate_1, sample_plate_2, sample_plate_3, sample_plate_4, reservoir],
            waste_reservoir["A1"],
        )
        helpers.find_liquid_height_of_all_wells(
            protocol, p1000_single, [waste_reservoir["A1"]]
        )
        if not protocol.is_simulating():
            slack_bot.send_run_completed_message(metadata["protocolName"])
    except Exception as e:
        if not protocol.is_simulating():
            slack_bot.send_error_message(metadata["protocolName"], str(e))
        raise (e)
