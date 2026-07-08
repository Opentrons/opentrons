"""All Liquid Set Ups."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    COLUMN,
    ALL,
    OFF_DECK,
    SINGLE,
)
'''
Follow the jira ticket https://opentrons.atlassian.net/browse/RQA-5704 
your goal is to address:
1. ABR2 doesn't fill up the wells enough? 
2. Row/column/single tip pickup now can have return tip! 
for 
 for robot in robot_list:
        parameters.add_bool(variable_name=robot, display_name=robot, default=True)
 put robots you aren't interested in to false 
'''
# For runtime parameters, 

metadata = {
    "protocolName": "Liquid Set up for all robots",
    "author": "Rhyann clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}


SLOTS = {
    "FULL_TIP_RACK": "A1",
    "PARTIAL_TIP_RACK_1000": ["C2", "B3"],
    "SRC_RESERVOIR": "B1",
    "LABWARE": ["D1", "D2", "D3", "C1", "C3", "B2"],
    "TRASH_BIN": "A3",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters to determine which set ups to run."""
    robot_list = [
        "DVT1ABR1",
        "DVT1ABR2",
        "DVT1ABR4",
        "DVT2ABR5",
        "DVT2ABR6",
        "PVT1ABR7",
        "PVT1ABR8",
        "PVT1ABR9",
        "PVT1ABR10",
    ]
    for robot in robot_list:
        parameters.add_bool(variable_name=robot, display_name=robot, default=True)


def run(protocol: ProtocolContext) -> None:
    """Protocol to fill all robot plates."""
    protocol.load_trash_bin(str(SLOTS["TRASH_BIN"]))
    tip_rack = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        str(SLOTS["FULL_TIP_RACK"]),
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tip_rack_partial_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", str(SLOTS["PARTIAL_TIP_RACK_1000"][0])
    )

    src_reservoir = protocol.load_labware(
        "nest_1_reservoir_290ml", str(SLOTS["SRC_RESERVOIR"])
    )
    pipette = protocol.load_instrument("flex_96channel_1000")
    # LOAD PARAMETERS
    dvt1abr1 = protocol.params.DVT1ABR1  # type: ignore[attr-defined]
    dvt1abr2 = protocol.params.DVT1ABR2  # type: ignore[attr-defined]
    dvt1abr4 = protocol.params.DVT1ABR4  # type: ignore[attr-defined]
    dvt2abr5 = protocol.params.DVT2ABR5  # type: ignore[attr-defined]
    dvt2abr6 = protocol.params.DVT2ABR6  # type: ignore[attr-defined]
    pvt1abr7 = protocol.params.PVT1ABR7  # type: ignore[attr-defined]
    pvt1abr8 = protocol.params.PVT1ABR8  # type: ignore[attr-defined]
    pvt1abr9 = protocol.params.PVT1ABR9  # type: ignore[attr-defined]
    pvt1abr10 = protocol.params.PVT1ABR10  # type: ignore[attr-defined]
    if pvt1abr7:
        protocol.pause("SET UP PVT1ABR7")
        res1 = protocol.load_labware(
            "opentrons_tough_12_reservoir_22ml", str(SLOTS["LABWARE"][0]), "Reservoir"
        )
        elution_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][1]),
            "Elution Plate",
        )
        sample_plate = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", str(SLOTS["LABWARE"][2]), "Sample Plate"
        )
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        pipette.transfer(
            [180, 180, 600],
            src_reservoir["A1"],
            [
                sample_plate["A1"].bottom(z=1),
                elution_plate["A1"].bottom(z=1),
                res1["A1"].top(),
            ],
            trash=False,
            blow_out=False,
            blowout_location="destination well",
        )

        pvt1abr7_labware = [res1, elution_plate, sample_plate]
        for lw in pvt1abr7_labware:
            protocol.move_labware(lw, OFF_DECK, use_gripper=False)
        pipette.reset_tipracks()
    if pvt1abr9:
        protocol.pause("SET UP PVT1ABR9")
        res1 = protocol.load_labware(
            "opentrons_tough_12_reservoir_22ml", str(SLOTS["LABWARE"][0]), "Reservoir"
        )
        elution_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][1]),
            "Elution Plate",
        )
        sample_plate = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", str(SLOTS["LABWARE"][2]), "Sample Plate"
        )
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        pipette.reset_tipracks()
        pipette.transfer(
            [12000 / 8, 150, 140],
            src_reservoir["A1"],
            [
                res1["A1"].top(),
                elution_plate["A1"].bottom(z=1),
                sample_plate["A1"].bottom(z=1),
            ],
            trash=False,
            blow_out=False,
            blowout_location="destination well",
        )
        pipette.reset_tipracks()
        pvt1abr9_labware = [res1, elution_plate, sample_plate]
        for lw in pvt1abr9_labware:
            protocol.move_labware(lw, OFF_DECK, use_gripper=False)
    if pvt1abr8:
        protocol.pause("SET UP PVT1ABR8")
        deepwell = protocol.load_labware("nest_96_wellplate_2ml_deep", "D1")
        pipette.configure_nozzle_layout(
            style=COLUMN, start="A1", tip_racks=[tip_rack_partial_1]
        )
        pipette.transfer(
            520,
            src_reservoir["A1"],
            [deepwell["A1"].top(), deepwell["A2"].top()],
            trash=False,
            blow_out=False,
            blowout_location="destination well",
        )
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        protocol.move_labware(deepwell, OFF_DECK, use_gripper=False)
    if pvt1abr10:
        protocol.pause("SET UP PVT1ABR10")
        res1 = protocol.load_labware(
            "opentrons_tough_12_reservoir_22ml",
            str(SLOTS["LABWARE"][0]),
            "Reagent Reservoir 1",
        )
        res2 = protocol.load_labware(
            "opentrons_tough_12_reservoir_22ml",
            str(SLOTS["LABWARE"][1]),
            "Reagent Reservoir 2",
        )
        res3 = protocol.load_labware(
            "opentrons_tough_12_reservoir_22ml",
            str(SLOTS["LABWARE"][2]),
            "Reagent Reservoir 3",
        )
        # lysis_and_pk = 12320 / 8
        # beads_and_binding = 11875 / 8
        binding2 = 13500 / 8
        # wash2 = 9800 / 8
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        pipette.reset_tipracks()
        pipette.transfer(
            1225,
            src_reservoir["A1"],
            res2["A1"].top(),
            trash=False,
            blow_out=False,
            blowout_location="destination well",
        )
        pipette.reset_tipracks()
        pipette.transfer(
            volume=binding2,
            source=src_reservoir["A1"],
            dest=res1["A1"].top(),
            blow_out=False,
            blowout_location="destination well",
            trash=False,
        )
        pipette.reset_tipracks()
        pipette.configure_nozzle_layout(
            style=COLUMN, start="A1", tip_racks=[tip_rack_partial_1]
        )

        pipette.reset_tipracks()

        pipette.transfer(
            volume=[binding2, binding2],
            source=src_reservoir["A1"],
            dest=[
                res3["A1"].top(),
                res3["A2"].top(),
            ],
            blow_out=False,
            blowout_location="destination well",
            trash=False,
        )

        pvt1abr10_labware = [res1, res2, res3]
        for lw in pvt1abr10_labware:
            protocol.move_labware(lw, OFF_DECK, use_gripper=False)

    if dvt1abr4:
        protocol.pause("SET UP DVT1ABR4")
        reservoir_1 = protocol.load_labware(
            "nest_96_wellplate_2ml_deep", str(SLOTS["LABWARE"][0]), "Reservoir 1"
        )  # Reservoir
        sample_plate_2 = protocol.load_labware(
            "nest_96_wellplate_2ml_deep",
            str(SLOTS["LABWARE"][1]),
            "Sample Plate 2",
        )  # Reservoir
        sample_plate_1 = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][2]),
            "Sample Plate 1",
        )  # Sample Plate
        reagent_plate_1 = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][3]),
            "Reagent Plate",
        )  # reagent Plate
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        pipette.pick_up_tip()
        pipette.aspirate(150, src_reservoir["A1"])
        pipette.dispense(150, sample_plate_1["A1"].top())
        pipette.return_tip()
        pipette.reset_tipracks()
        pipette.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[tip_rack_partial_1],
        )
        pipette.transfer(
            volume=[300, 1100, 900, 400, 1000, 1000, 1000, 1000],
            source=src_reservoir["A1"],
            dest=[
                reservoir_1["A1"].top(),  # AMPure
                reservoir_1["A2"].top(),  # SMB
                reservoir_1["A4"].top(),  # EtOH
                reservoir_1["A5"].top(),  # RSB
                sample_plate_2["A9"].top(),
                sample_plate_2["A10"].top(),
                sample_plate_2["A11"].top(),
                sample_plate_2["A12"].top(),
            ],
            blow_out=False,
            blowout_location="destination well",
            trash=False,
        )
        pipette.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[tip_rack_partial_1],
        )

        pipette.reset_tipracks()

        pipette.transfer(
            volume=[120, 100, 100, 100],
            source=src_reservoir["A1"],
            dest=[
                reagent_plate_1["A4"].top(),
                reagent_plate_1["A5"].top(),
                reagent_plate_1["A6"].top(),
                reagent_plate_1["A7"].top(),
            ],
            blow_out=False,
            blowout_location="destination well",
            trash=False,
        )
        dvt1abr4_labware = [
            reservoir_1,
            sample_plate_1,
            sample_plate_2,
            reagent_plate_1,
        ]
        for lw in dvt1abr4_labware:
            protocol.move_labware(lw, OFF_DECK, use_gripper=False)

    if dvt2abr5:
        protocol.pause("SET UP DVT2ABR5")
        reservoir = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][0]),
            "Reservoir",
        )
        pcr_reagents_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][1]),
            "PCR Master Mix",
        )
        indices_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][2]),
            "Indices",
        )
        dna_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt", SLOTS["LABWARE"][3], "DNA"
        )

        pcr_dilution = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][4]),
            "PCR Dilution",
        )
        pcr_dilution2 = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][5]),
            "PCR Dilution Plate",
        )
        # RESERVOIR, INDICES PLATE, DNA PLATE
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        pipette.reset_tipracks()
        pipette.transfer(
            volume=[200, 200, 100, 200, 200],
            source=5 * [src_reservoir["A1"]],
            dest=[reservoir["A1"], indices_plate["A1"], dna_plate["A1"], pcr_dilution["A1"], pcr_dilution2["A1"]],
            trash=False,
            blow_out=False,
            blowout_location="destination well",
        )
        pipette.reset_tipracks()
        # partial tip for pcr_reagents_plate
        pipette.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[tip_rack_partial_1],
        )

        pipette.reset_tipracks()

        pipette.transfer(
            [100, 100],
            source=2 * [src_reservoir["A1"]],
            dest=[pcr_reagents_plate["A1"], pcr_reagents_plate["A2"]],
            trash=False,
            blow_out=False,
            blowout_location="destination well",
        )
        dvt2abr5_plates = [reservoir, pcr_reagents_plate, indices_plate, dna_plate, pcr_dilution, pcr_dilution2]
        for plate in dvt2abr5_plates:
            protocol.move_labware(plate, OFF_DECK, use_gripper=False)

    if dvt2abr6:
        protocol.pause("SET UP DVT2ABR6")
        extension_product_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][0]),
            "Extension Product Plate",
        )
        primer_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][1]),
            "Primer Plate",
        )
        master_mix = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            str(SLOTS["LABWARE"][2]),
            "Master Mix",
        )
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        pipette.reset_tipracks()
        pipette.transfer(
            [100, 12],
            source=2 * [src_reservoir["A1"]],
            dest=[
                extension_product_plate["A1"],
                primer_plate["A1"],
            ],
            trash=False,
            blow_out=True,
            blowout_location="destination well",
        )
        pipette.reset_tipracks()
        pipette.configure_nozzle_layout(
            style=COLUMN, tip_racks=[tip_rack_partial_1], start="A1"
        )

        pipette.reset_tipracks()

        pipette.transfer(
            150,
            source=src_reservoir["A1"],
            dest=master_mix["A1"],
            trash=False,
            blow_out=True,
            blowout_location="destination well",
        )
        dvt2abr6_plates = [
            extension_product_plate,
            primer_plate,
            master_mix,
        ]
        for plate in dvt2abr6_plates:
            protocol.move_labware(plate, OFF_DECK, use_gripper=False)

    if dvt1abr1:
        protocol.pause("SET UP DVT1ABR1")
        reservoir = protocol.load_labware(
            "opentrons_tough_12_reservoir_22ml", str(SLOTS["LABWARE"][0])
        )
        pipette.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[tip_rack_partial_1],
        )
        # fill last column
        print(len(reservoir.wells()[:7]))
        pipette.transfer(
            volume=6 * [1350],
            source=6 * [src_reservoir["A1"]],
            dest=reservoir.wells()[:6],
            blow_out=False,
            trash=False,
            blowout_location="destination well",
        )
        # FILL FIRST 5 COLUMNS
        protocol.move_labware(reservoir, OFF_DECK, use_gripper=False)

    if dvt1abr2:
        protocol.pause("SET UP DVT1ABR2")
        pipette.configure_nozzle_layout(style=ALL, tip_racks=[tip_rack])
        pipette.reset_tipracks()
        sample_plate = protocol.load_labware(
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            SLOTS["LABWARE"][0],
            "Sample Plate",
        )
        snap_caps = protocol.load_labware(
            "opentrons_24_aluminumblock_nest_1.5ml_snapcap",
            SLOTS["LABWARE"][1],
            "Snap Caps",
        )
        pipette.transfer(
            volume=100,
            source=src_reservoir["A1"],
            dest=sample_plate["A1"].bottom(z=1),
            blow_out=False,
            trash=False,
            blowout_location="destination well",
        )
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A12",
            tip_racks=[tip_rack_partial_1],
        )
        pipette.reset_tipracks()
        pipette.transfer(1000, src_reservoir["A1"], snap_caps["B1"], trash=False)

        pipette.reset_tipracks()
        pipette.transfer(1000, src_reservoir["A1"], snap_caps.rows()[0], trash=False)
