"""Simple Normalize Long with LPD and Single Tip."""
from typing import Union
from opentrons.protocol_api import InstrumentContext, Labware
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    SINGLE,
    ALL,
    Well,
)
from typing import List, Dict

metadata = {
    "protocolName": "Simple Normalize Long with LPD and Single Tip",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}


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


def load_wells_with_custom_liquids(
    protocol: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
) -> None:
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


def load_wells_with_water(
    protocol: ProtocolContext, wells: List[Well], volumes: List[float]
) -> None:
    """Load liquids into wells."""
    water = protocol.define_liquid("Water", display_color="#0000FF")
    for well, volume in zip(wells, volumes):
        well.load_liquid(water, volume)


def find_liquid_height_of_all_wells(
    protocol: ProtocolContext, pipette: InstrumentContext, wells: List[Well]
) -> Dict:
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
    if pipette.has_tip:
        pipette.return_tip()
    pipette.reset_tipracks()
    msg = f"result: {dict_of_labware_heights}"
    protocol.comment(msg=msg)
    comment_height_of_specific_labware(
        protocol, "Liquid Waste", dict_of_labware_heights
    )
    return dict_of_labware_heights


def find_liquid_height_of_loaded_liquids(
    ctx: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
    pipette: InstrumentContext,
) -> List[Well]:
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


def transfer_volume(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    source: Well,
    destination: Well,
    volume: float,
) -> None:
    """Transfer a possibly over-capacity volume without changing tips."""
    remaining = float(volume)
    while remaining > 0:
        chunk = min(remaining, 180.0)
        pipette.aspirate(chunk, source.bottom(z=0.5))
        pipette.dispense(chunk, destination.top())
        remaining -= chunk


def clean_up_plates(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    list_of_labware: List[Labware],
    liquid_waste: Well,
) -> None:
    """Move every tracked liquid volume into waste with one returned tip."""
    pipette.pick_up_tip()
    pipette.liquid_presence_detection = False
    for labware in list_of_labware:
        for well in labware.wells():
            volume = well.current_liquid_volume()  # type: ignore[attr-defined]
            if volume > 0:
                transfer_volume(
                    protocol, pipette, well, liquid_waste, volume  # type: ignore[arg-type]
                )
    pipette.return_tip()
    pipette.reset_tipracks()


def restore_reagent_reservoir(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    waste: Well,
    reagent_wells: List[Well],
    volume: float,
) -> None:
    """Physically restore equal starting volumes from waste with one tip."""
    pipette.pick_up_tip()
    pipette.liquid_presence_detection = False
    for well in reagent_wells:
        transfer_volume(protocol, pipette, waste, well, volume)
    pipette.return_tip()
    pipette.reset_tipracks()


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
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
    parameters.add_bool(
        variable_name="enable_camera",
        display_name="Enable Camera",
        description="Capture start- and end-of-run images.",
        default=False,
    )


def _legacy_run(protocol: ProtocolContext) -> None:
    """Retained source version; the automated entry point is defined below."""
    all_data = protocol.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    probe_height_bool = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    data = all_data[1:]
    protocol.comment("Protocol Version: 05")

    # DECK SETUP AND LABWARE
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
        find_liquid_height_of_loaded_liquids(
            protocol, liquid_vols_and_wells, p1000_single
        )
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
                    trash_location=waste_reservoir["A1"],
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
            p1000.touch_tip(sample_plate_1.wells_by_name()[CurrentWell])
            current += 1
        p1000.return_tip()

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
                    trash_location=waste_reservoir["A1"],
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
                p1000_single.touch_tip(sample_plate_2.wells_by_name()[CurrentWell])
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
                    trash_location=waste_reservoir["A1"],
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
                p1000_single.touch_tip(sample_plate_3.wells_by_name()[CurrentWell])
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
                    trash_location=waste_reservoir["A1"],
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
                p1000_single.touch_tip(sample_plate_4.wells_by_name()[CurrentWell])
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


STARTING_REAGENT_VOLUME = 10800.0
RUN_REPETITIONS = 10


def run(protocol: ProtocolContext) -> None:
    """Run ten unattended water-only normalization/reset cycles."""
    all_data = protocol.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    probe_height = protocol.params.probe_liquid_height  # type: ignore[attr-defined]
    meniscus_z = protocol.params.meniscus_z  # type: ignore[attr-defined]
    enable_camera = protocol.params.enable_camera  # type: ignore[attr-defined]
    rows = [
        (str(row[0]), float(row[1]), float(row[2]))
        for row in all_data[1:]
        if row and row[0]
    ]
    protocol.comment("Protocol Version: 06 - unattended return-tip cycle")
    if enable_camera:
        protocol.capture_image(filename="start_of_run")

    tiprack_multi = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D1")
    tiprack_single_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
    tiprack_single_2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A1")
    sample_plates = [
        protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", slot)
        for slot in ["D3", "C2", "B2", "A2"]
    ]
    for plate in sample_plates:
        plate.load_empty(plate.wells())

    reservoir = protocol.load_labware("opentrons_tough_12_reservoir_22ml", "B3")
    reservoir.load_empty(reservoir.wells()[6:])
    waste = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "C1", "Liquid Waste"
    )
    waste.load_empty(waste.wells())

    p1000_multi = protocol.load_instrument(
        "flex_8channel_1000", "left", tip_racks=[tiprack_multi]
    )
    p1000_single = protocol.load_instrument(
        "flex_1channel_1000",
        "right",
        tip_racks=[tiprack_single_1, tiprack_single_2],
    )
    p1000_multi.configure_nozzle_layout(
        style=SINGLE, start="H1", tip_racks=[tiprack_multi]
    )

    dye = protocol.define_liquid(
        "Dye", description="Water-only ABR dye surrogate", display_color="#008000"
    )
    diluent = protocol.define_liquid(
        "Diluent",
        description="Water-only ABR diluent surrogate",
        display_color="#0000FF",
    )
    dye_wells = [reservoir["A1"], reservoir["A2"], reservoir["A3"]]
    diluent_wells = [reservoir["A4"], reservoir["A5"], reservoir["A6"]]
    reagent_wells = dye_wells + diluent_wells
    for well in dye_wells:
        well.load_liquid(dye, STARTING_REAGENT_VOLUME)
    for well in diluent_wells:
        well.load_liquid(diluent, STARTING_REAGENT_VOLUME)

    total_dye = sum(row[1] for row in rows)
    total_diluent = sum(row[2] for row in rows)
    if total_dye * 2 > STARTING_REAGENT_VOLUME:
        raise ValueError("CSV dye volume exceeds the shared Dye 3 starting volume.")
    if total_diluent * 2 > STARTING_REAGENT_VOLUME:
        raise ValueError(
            "CSV diluent volume exceeds the shared Diluent 3 starting volume."
        )
    for well_name, dye_volume, diluent_volume in rows:
        if dye_volume < 0 or diluent_volume < 0:
            raise ValueError(f"Negative volume in CSV row for {well_name}.")
        if dye_volume + diluent_volume > 200:
            raise ValueError(f"Total volume for {well_name} exceeds 200 uL.")

    def transfer_component(
        pipette: InstrumentContext,
        source: Well,
        plate: Labware,
        component_index: int,
        component_name: str,
    ) -> None:
        protocol.comment(f"Adding {component_name} to {plate.load_name}")
        pipette.pick_up_tip()
        for well_name, dye_volume, diluent_volume in rows:
            volume = (dye_volume, diluent_volume)[component_index]
            if volume == 0:
                continue
            pipette.prepare_to_aspirate()
            pipette.aspirate(
                volume,
                source.meniscus(z=meniscus_z, target="start"),
                end_location=source.meniscus(z=meniscus_z, target="end"),
            )
            pipette.dispense(volume, plate[well_name].top(z=0.2))
            pipette.blow_out(plate[well_name].top())
        pipette.return_tip()
        pipette.reset_tipracks()

    if probe_height:
        find_liquid_height_of_all_wells(protocol, p1000_single, reagent_wells)

    assignments = [
        (p1000_multi, sample_plates[0], dye_wells[0], diluent_wells[0]),
        (p1000_single, sample_plates[1], dye_wells[1], diluent_wells[1]),
        (p1000_single, sample_plates[2], dye_wells[2], diluent_wells[2]),
        (p1000_single, sample_plates[3], dye_wells[2], diluent_wells[2]),
    ]

    for repetition in range(RUN_REPETITIONS):
        protocol.comment(f"Normalization cycle {repetition + 1} of {RUN_REPETITIONS}")
        for pipette, plate, dye_source, diluent_source in assignments:
            transfer_component(pipette, dye_source, plate, 0, "Dye")
            transfer_component(pipette, diluent_source, plate, 1, "Diluent")

        clean_up_plates(
            protocol,
            p1000_single,
            [*sample_plates, reservoir],
            waste["A1"],
        )
        if repetition < RUN_REPETITIONS - 1:
            restore_reagent_reservoir(
                protocol,
                p1000_single,
                waste["A1"],
                reagent_wells,
                STARTING_REAGENT_VOLUME,
            )

    find_liquid_height_of_all_wells(protocol, p1000_single, [waste["A1"]])
    p1000_multi.reset_tipracks()
    p1000_single.reset_tipracks()
    if enable_camera:
        protocol.capture_image(filename="end_of_run")
