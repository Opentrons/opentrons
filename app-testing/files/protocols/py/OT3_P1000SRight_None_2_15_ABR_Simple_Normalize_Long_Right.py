import inspect
from dataclasses import replace

from opentrons import protocol_api, types

metadata = {
    "protocolName": "OT3 ABR Simple Normalize Long",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("OT3 ABR Simple Normalize Long"),
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}


# settings
DRYRUN = "NO"  # YES or NO, DRYRUN = 'YES' will return tips, skip incubation times, shorten mix, for testing purposes
MEASUREPAUSE = "NO"


def run(protocol: protocol_api.ProtocolContext):

    if DRYRUN == "YES":
        protocol.comment("THIS IS A DRY RUN")
    else:
        protocol.comment("THIS IS A REACTION RUN")

    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    protocol.comment("THIS IS A NO MODULE RUN")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "1")
    sample_plate_1 = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "3")
    # ========== SECOND ROW ==========
    tiprack_200_1 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "4")
    tiprack_200_2 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "5")
    sample_plate_2 = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "6")
    # ========== THIRD ROW ===========
    tiprack_200_3 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "7")
    tiprack_200_4 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "8")
    sample_plate_3 = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "9")
    # ========== FOURTH ROW ==========
    tiprack_200_5 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "10")
    tiprack_200_6 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "11")

    # reagent
    Dye_1 = reservoir["A1"]
    Dye_2 = reservoir["A2"]
    Dye_3 = reservoir["A3"]
    Diluent_1 = reservoir["A4"]
    Diluent_2 = reservoir["A5"]
    Diluent_3 = reservoir["A6"]

    # pipette
    p1000 = protocol.load_instrument(
        "p1000_single_gen3",
        "right",
        tip_racks=[tiprack_200_1, tiprack_200_2, tiprack_200_3, tiprack_200_4, tiprack_200_5, tiprack_200_6],
    )

    sample_quant_csv = """
    sample_plate_1, Sample_well,DYE,DILUENT
    sample_plate_1,A1,0,100
    sample_plate_1,B1,5,95
    sample_plate_1,C1,10,90
    sample_plate_1,D1,20,80
    sample_plate_1,E1,40,60
    sample_plate_1,F1,60,40
    sample_plate_1,G1,80,20
    sample_plate_1,H1,100,0
    sample_plate_1,A2,35,65
    sample_plate_1,B2,58,42
    sample_plate_1,C2,42,58
    sample_plate_1,D2,92,8
    sample_plate_1,E2,88,12
    sample_plate_1,F2,26,74
    sample_plate_1,G2,31,69
    sample_plate_1,H2,96,4
    sample_plate_1,A3,87,13
    sample_plate_1,B3,82,18
    sample_plate_1,C3,36,64
    sample_plate_1,D3,78,22
    sample_plate_1,E3,26,74
    sample_plate_1,F3,34,66
    sample_plate_1,G3,63,37
    sample_plate_1,H3,20,80
    sample_plate_1,A4,84,16
    sample_plate_1,B4,59,41
    sample_plate_1,C4,58,42
    sample_plate_1,D4,84,16
    sample_plate_1,E4,47,53
    sample_plate_1,F4,67,33
    sample_plate_1,G4,52,48
    sample_plate_1,H4,79,21
    sample_plate_1,A5,80,20
    sample_plate_1,B5,86,14
    sample_plate_1,C5,41,59
    sample_plate_1,D5,48,52
    sample_plate_1,E5,96,4
    sample_plate_1,F5,72,28
    sample_plate_1,G5,45,55
    sample_plate_1,H5,99,1
    sample_plate_1,A6,41,59
    sample_plate_1,B6,20,80
    sample_plate_1,C6,98,2
    sample_plate_1,D6,54,46
    sample_plate_1,E6,30,70
    sample_plate_1,F6,42,58
    sample_plate_1,G6,21,79
    sample_plate_1,H6,48,52
    sample_plate_1,A7,73,27
    sample_plate_1,B7,84,16
    sample_plate_1,C7,40,60
    sample_plate_1,D7,74,26
    sample_plate_1,E7,80,20
    sample_plate_1,F7,44,56
    sample_plate_1,G7,26,74
    sample_plate_1,H7,45,55
    sample_plate_1,A8,99,1
    sample_plate_1,B8,98,2
    sample_plate_1,C8,34,66
    sample_plate_1,D8,89,11
    sample_plate_1,E8,46,54
    sample_plate_1,F8,37,63
    sample_plate_1,G8,58,42
    sample_plate_1,H8,34,66
    sample_plate_1,A9,44,56
    sample_plate_1,B9,89,11
    sample_plate_1,C9,30,70
    sample_plate_1,D9,67,33
    sample_plate_1,E9,46,54
    sample_plate_1,F9,79,21
    sample_plate_1,G9,59,41
    sample_plate_1,H9,23,77
    sample_plate_1,A10,26,74
    sample_plate_1,B10,99,1
    sample_plate_1,C10,51,49
    sample_plate_1,D10,38,62
    sample_plate_1,E10,99,1
    sample_plate_1,F10,21,79
    sample_plate_1,G10,59,41
    sample_plate_1,H10,58,42
    sample_plate_1,A11,45,55
    sample_plate_1,B11,28,72
    sample_plate_1,C11,51,49
    sample_plate_1,D11,34,66
    sample_plate_1,E11,27,73
    sample_plate_1,F11,60,40
    sample_plate_1,G11,33,67
    sample_plate_1,H11,61,39
    sample_plate_1,A12,69,31
    sample_plate_1,B12,47,53
    sample_plate_1,C12,46,54
    sample_plate_1,D12,93,7
    sample_plate_1,E12,54,46
    sample_plate_1,F12,65,35
    sample_plate_1,G12,58,42
    sample_plate_1,H12,37,63
    """

    data = [r.split(",") for r in sample_quant_csv.strip().splitlines() if r][1:]

    for X in range(2):
        protocol.comment("==============================================")
        protocol.comment("Adding Dye Sample Plate 1")
        protocol.comment("==============================================")

        current = 0
        p1000.pick_up_tip()
        while current < len(data):
            CurrentWell = str(data[current][1])
            DyeVol = float(data[current][2])
            if DyeVol != 0:
                p1000.transfer(
                    DyeVol, Dye_1.bottom(z=2), sample_plate_1.wells_by_name()[CurrentWell].top(z=1), new_tip="never"
                )
            current += 1
        p1000.return_tip()

        protocol.comment("==============================================")
        protocol.comment("Adding Diluent Sample Plate 1")
        protocol.comment("==============================================")

        current = 0
        while current < len(data):
            CurrentWell = str(data[current][1])
            DilutionVol = float(data[current][2])
            if DilutionVol != 0:
                p1000.pick_up_tip()
                p1000.aspirate(DilutionVol, Diluent_1.bottom(z=2))
                p1000.dispense(DilutionVol, sample_plate_1.wells_by_name()[CurrentWell].top(z=0.2))
                p1000.return_tip()
            current += 1

        protocol.comment("==============================================")
        protocol.comment("Adding Dye Sample Plate 2")
        protocol.comment("==============================================")

        current = 0
        p1000.pick_up_tip()
        while current < len(data):
            CurrentWell = str(data[current][1])
            DyeVol = float(data[current][2])
            if DyeVol != 0:
                p1000.transfer(
                    DyeVol, Dye_2.bottom(z=2), sample_plate_2.wells_by_name()[CurrentWell].top(z=1), new_tip="never"
                )
            current += 1
        p1000.return_tip()

        protocol.comment("==============================================")
        protocol.comment("Adding Diluent Sample Plate 2")
        protocol.comment("==============================================")

        current = 0
        while current < len(data):
            CurrentWell = str(data[current][1])
            DilutionVol = float(data[current][2])
            if DilutionVol != 0:
                p1000.pick_up_tip()
                p1000.aspirate(DilutionVol, Diluent_2.bottom(z=2))
                p1000.dispense(DilutionVol, sample_plate_2.wells_by_name()[CurrentWell].top(z=0.2))
                p1000.return_tip()
            current += 1

        protocol.comment("==============================================")
        protocol.comment("Adding Dye Sample Plate 3")
        protocol.comment("==============================================")

        current = 0
        p1000.pick_up_tip()
        while current < len(data):
            CurrentWell = str(data[current][1])
            DyeVol = float(data[current][2])
            if DyeVol != 0:
                p1000.transfer(
                    DyeVol, Dye_3.bottom(z=2), sample_plate_3.wells_by_name()[CurrentWell].top(z=1), new_tip="never"
                )
            current += 1
        p1000.return_tip()

        protocol.comment("==============================================")
        protocol.comment("Adding Diluent Sample Plate 3")
        protocol.comment("==============================================")

        current = 0
        while current < len(data):
            CurrentWell = str(data[current][1])
            DilutionVol = float(data[current][2])
            if DilutionVol != 0:
                p1000.pick_up_tip()
                p1000.aspirate(DilutionVol, Diluent_3.bottom(z=2))
                p1000.dispense(DilutionVol, sample_plate_3.wells_by_name()[CurrentWell].top(z=0.2))
                p1000.return_tip()
            current += 1
