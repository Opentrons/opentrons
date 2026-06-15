"""Simple Normalize Long with LPD and Single Tip."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    SINGLE,
    ALL,
    Well,
    InstrumentContext,
    Labware
)
from typing import List, Dict, Union

metadata = {
    "protocolName": "Simple Normalize Long with LPD and Single Tip",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}
def load_wells_with_water(
    protocol: ProtocolContext, wells: List[Well], volumes: List[float]
) -> None:
    """Load liquids into wells."""
    water = protocol.define_liquid("Water", display_color="#0000FF")
    for well, volume in zip(wells, volumes):
        well.load_liquid(water, volume)

def comment_height_of_specific_labware(
    protocol: ProtocolContext, labware_name: str, dict_of_labware_heights: Dict
) -> None:
    """Comment height found of specific labware."""
    total_height = 0.0
    for key in dict_of_labware_heights.keys():
        if key[0] == labware_name:
            height = dict_of_labware_heights[key]
            total_height += height
    protocol.comment(f"Liquid Waste Total Height: {total_height}")


def find_liquid_height_of_all_wells(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    wells: List[Well],
) -> Dict:
    """Find the liquid height of all wells in protocol."""
    dict_of_labware_heights = {}
    pipette.pick_up_tip()
    pip_channels = pipette.active_channels
    for well in wells:
        labware_name = well.parent.name
        total_number_of_wells_in_plate = len(well.parent.wells())
        # if pip_channels is > 1 and total_wells > 12 - only probe 1st row.
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
    if pip_channels != pipette.channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()
        pipette.reset_tipracks()
    msg = f"result: {dict_of_labware_heights}"
    protocol.comment(msg=msg)
    comment_height_of_specific_labware(
        protocol, "Liquid Waste", dict_of_labware_heights
    )
    return dict_of_labware_heights


def clean_up_plates(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    list_of_labware: List[Labware],
    liquid_waste: Well,
) -> None:
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
    if pipette.channels != num_of_active_channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()


def load_wells_with_custom_liquids(
    protocol: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
) -> None:
    """Load custom liquids into wells."""
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
        # Define the liquid with a color
        liquid = protocol.define_liquid(
            liquid_name, display_color=liquid_colors[i % len(liquid_colors)]
        )
        # Load liquid into each specified well or list of wells
        for well_info in wells_info:
            if isinstance(well_info["well"], list):
                wells = well_info["well"]
            elif isinstance(well_info["well"], Well):
                wells = [well_info["well"]]
            else:
                wells = []
            if isinstance(well_info["volume"], (float, int)):
                volume = well_info["volume"]
            # Load liquid into each well
            for well in wells:
                well.load_liquid(liquid, volume)


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    """Create parameter for probe liquid height."""
    parameters.add_bool(
        variable_name="probe_liquid_height",
        display_name="Probe Liquid Height",
        description="True means probe liquid height at start of run.",
        default=False,
    )
    parameters.add_csv_file(
        variable_name="parameters_csv",
        display_name="Sample CSV",
        description="CSV File for Protocol.",
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


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    all_data = protocol.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    length = protocol.params.error_capture_duration  # type: ignore[attr-defined]
    data = all_data[1:]

    # DECK SETUP AND LABWARE
    protocol.capture_image(filename="start_of_run")
    protocol.comment("THIS IS A NO MODULE RUN")
    tiprack_x_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D1")
    tiprack_x_2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
    tiprack_x_3 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A1")
    sample_plate_1 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "D3"
    )

    reservoir = protocol.load_labware("opentrons_tough_12_reservoir_22ml", "B3")
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
    load_wells_with_water(protocol, wells, liquid_volumes)
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Dye": [{"well": [Dye_1, Dye_2, Dye_3], "volume": 675.0}],
        "Diluent": [{"well": [Diluent_1, Diluent_2, Diluent_3], "volume": 675.0}],
    }
    water = protocol.get_liquid_class("water")
    lm = "liquid-meniscus"
    tip_racks = [tiprack_x_2, tiprack_x_3]
    for tip in tip_racks:
        props = water.get_for(p1000_single, tip)
        props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        props.aspirate.aspirate_position.offset.z = meniscus_z
        props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
        props.dispense.dispense_position.offset.z = meniscus_z
    tip_racks_multi = [tiprack_x_1]
    for tip in tip_racks_multi:
        props = water.get_for(p1000, tip)
        props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        props.aspirate.aspirate_position.offset.z = meniscus_z
        props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
        props.dispense.dispense_position.offset.z = meniscus_z

    # CONFIGURE SINGLE LAYOUT
    p1000.configure_nozzle_layout(style=SINGLE, start="H1", tip_racks=[tiprack_x_1])

    if probe_height_bool:
        wells: list[Well] = [
            well
            for items in liquid_vols_and_wells.values()
            for entry in items
            if isinstance(entry["well"], (Well, list)) and entry["volume"] != 0.0
            # Ensure "well" is Well or list of Well
            for well in (
                entry["well"]
                if isinstance(entry["well"], list)
                else [entry["well"]]
            )
        ]
    else:
        load_wells_with_custom_liquids(protocol, liquid_vols_and_wells)

    for X in range(10):
        protocol.comment("==============================================")
        protocol.comment("Adding Dye Sample Plate 1")
        protocol.comment("==============================================")

        current = 0

        while current < len(data):
            CurrentWell = str(data[current][0])
            DyeVol = float(data[current][1])
            while Dye_1.current_liquid_volume() < (DyeVol * 8):
                p1000.transfer_with_liquid_class(
                    water,
                    DyeVol,
                    Dye_1,
                    sample_plate_1.wells_by_name()[CurrentWell],
                    return_tip=True,
                )
            current += 1

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
                    DilutionVol,
                    location=Diluent_1.meniscus(
                        z=meniscus_z,
                        target="start",
                    ),
                    end_location=Diluent_1.meniscus(z=-1, target="end"),
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
        while current < len(data):
            CurrentWell = str(data[current][0])
            DyeVol = float(data[current][1])
            while Dye_2.current_liquid_volume() < (DyeVol * 8):
                p1000_single.transfer_with_liquid_class(
                    water,
                    DyeVol,
                    Dye_2,
                    sample_plate_2.wells_by_name()[CurrentWell],
                    new_tip="never",
                )
            current += 1

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
                    DilutionVol,
                    location=Diluent_2.meniscus(z=meniscus_z, target="start"),
                    end_location=Diluent_2.meniscus(z=meniscus_z, target="end"),
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
        while current < len(data):
            CurrentWell = str(data[current][0])
            DyeVol = float(data[current][1])
            if Dye_3.current_liquid_volume() < (DyeVol * 8):
                p1000_single.transfer_with_liquid_class(
                    water,
                    DyeVol,
                    Dye_3,
                    sample_plate_3.wells_by_name()[CurrentWell],
                    return_tip=True,
                )
            current += 1
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
                    DilutionVol,
                    location=Diluent_3.meniscus(z=meniscus_z, target="start"),
                    end_location=Diluent_3.meniscus(z=meniscus_z, target="end"),
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
        while current < len(data):
            CurrentWell = str(data[current][0])
            DyeVol = float(data[current][1])
            if DyeVol != 0 and DyeVol < 100:
                p1000_single.transfer_with_liquid_class(
                    water,
                    DyeVol,
                    Dye_3,
                    sample_plate_4.wells_by_name()[CurrentWell],
                    return_tip=True,
                )
                if DyeVol > 20:
                    wells.append(sample_plate_4.wells_by_name()[CurrentWell])
            current += 1
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
                    DilutionVol,
                    location=Diluent_3.meniscus(z=meniscus_z, target="start"),
                    end_location=Diluent_3.meniscus(z=meniscus_z, target="end"),
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
    clean_up_plates(
        protocol,
        p1000,
        [sample_plate_1, sample_plate_2, sample_plate_3, sample_plate_4, reservoir],
        waste_reservoir["A1"],
    )
    find_liquid_height_of_all_wells(protocol, p1000_single, [waste_reservoir["A1"]])
    protocol.capture_image(filename="end_of_run")
