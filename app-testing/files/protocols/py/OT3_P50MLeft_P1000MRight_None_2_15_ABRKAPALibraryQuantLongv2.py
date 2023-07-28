from opentrons import protocol_api

from opentrons import types

import inspect

metadata = {
    "protocolName": "OT3 ABR KAPA Library Quant v2",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "description": "OT3 ABR KAPA Library Quant v2",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}


def right(s, amount):
    if s == None:
        return None
    elif amount == None:
        return None  # Or throw a missing argument error
    s = str(s)
    if amount > len(s):
        return s
    elif amount == 0:
        return ""
    else:
        return s[-amount:]


# SCRIPT SETTINGS
DRYRUN = "YES"  # YES or NO, DRYRUN = 'YES' will return tips, skip incubation times, shorten mix, for testing purposes
OFFSET = "YES"  # YES or NO, Sets whether to use protocol specific z offsets for each tip and labware or no offsets aside from defaults

# PROTOCOL SETTINGS
SAMPLES = "24x"  # 8x, 16x, or 24x
FORMAT = "384"  # 96 or 384
INICOLUMN1 = "A1"
INICOLUMN2 = "A3"
INICOLUMN3 = "A5"

# PROTOCOL BLOCKS
STEP_DILUTE = 1
STEP_MIX = 1
STEP_DISPENSE = 1

STEPS = {STEP_DILUTE, STEP_MIX, STEP_DISPENSE}


def run(protocol: protocol_api.ProtocolContext):

    if DRYRUN == "YES":
        protocol.comment("THIS IS A DRY RUN")
    else:
        protocol.comment("THIS IS A REACTION RUN")

        # DECK SETUP AND LABWARE
        protocol.comment("THIS IS A NO MODULE RUN")
    source_plate = protocol.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt", "1"
    )  # <--- Actually an Eppendorf 96 well, same dimensions
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "2")
    dilution_plate_1 = protocol.load_labware("opentrons_96_aluminumblock_biorad_wellplate_200ul", "3")

    tiprack_50_1 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul", "4")
    tiprack_200_1 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "5")
    tiprack_50_2 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul", "6")

    reagent_plate = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "7")  # <--- NEST Strip Tubes
    dilution_plate_2 = protocol.load_labware("opentrons_96_aluminumblock_biorad_wellplate_200ul", "8")
    if FORMAT == "96":
        qpcrplate_1 = protocol.load_labware(
            "nest_96_wellplate_100ul_pcr_full_skirt", "9"
        )  # <--- Actually an Eppendorf 96 well, same dimensions
        qpcrplate_2 = protocol.load_labware(
            "nest_96_wellplate_100ul_pcr_full_skirt", "10"
        )  # <--- Actually an Eppendorf 96 well, same dimensions
    if FORMAT == "384":
        qpcrplate_1 = protocol.load_labware(
            "corning_384_wellplate_112ul_flat", "9"
        )  # <--- Actually an Eppendorf 96 well, same dimensions
        qpcrplate_2 = protocol.load_labware(
            "corning_384_wellplate_112ul_flat", "10"
        )  # <--- Actually an Eppendorf 96 well, same dimensions

    # REAGENT PLATE
    STD_1 = reagent_plate["A1"]
    STD_2 = reagent_plate["A2"]
    PCR_1 = reagent_plate["A3"]
    PCR_2 = reagent_plate["A4"]

    # RESERVOIR
    DIL = reservoir["A5"]

    # pipette
    p50 = protocol.load_instrument("p50_multi_gen3", "left", tip_racks=[tiprack_50_1, tiprack_50_2])
    p1000 = protocol.load_instrument("p1000_multi_gen3", "right", tip_racks=[tiprack_200_1])

    # samples
    src_file_path = inspect.getfile(lambda: None)
    protocol.comment(src_file_path)

    # tip and sample tracking
    if SAMPLES == "8x":
        protocol.comment("There are 8 Samples")
        samplecolumns = 1
    elif SAMPLES == "16x":
        protocol.comment("There are 16 Samples")
        samplecolumns = 2
    elif SAMPLES == "24x":
        protocol.comment("There are 24 Samples")
        samplecolumns = 3
    else:
        protocol.pause("ERROR?")

    # offset
    p1000_offset_Deck = 0
    p1000_offset_Res = 0
    p1000_offset_Tube = 0
    p1000_offset_Thermo = 0
    p1000_offset_Mag = 0
    p1000_offset_Temp = 0

    p50_offset_Deck = 0
    p50_offset_Res = 0
    p50_offset_Tube = 0
    p50_offset_Thermo = 0
    p50_offset_Mag = 0
    p50_offset_Temp = 0

    # commands

    if STEP_DILUTE == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Dispensing Diluent Part 1 and Part 2")
        protocol.comment("==============================================")
        p1000.pick_up_tip()
        if (
            samplecolumns >= 1
        ):  # -----------------------------------------------------------------------------------------
            X = "A2"
            Y = "A6"
            p1000.move_to(DIL.bottom(z=p1000_offset_Res))
            p1000.mix(3, 200, rate=0.5)
            p1000.move_to(DIL.top(z=+5))
            protocol.delay(seconds=2)
            p1000.aspirate(200, DIL.bottom(z=p1000_offset_Res), rate=0.25)
            p1000.dispense(98, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.dispense(95, dilution_plate_1[Y].bottom(z=p1000_offset_Temp), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[Y].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.move_to(DIL.top())
            p1000.blow_out()
        if (
            samplecolumns >= 2
        ):  # -----------------------------------------------------------------------------------------
            X = "A3"
            Y = "A7"
            p1000.move_to(DIL.bottom(z=p1000_offset_Res))
            p1000.mix(3, 200, rate=0.5)
            p1000.move_to(DIL.top(z=+5))
            protocol.delay(seconds=2)
            p1000.aspirate(200, DIL.bottom(z=p1000_offset_Res), rate=0.25)
            p1000.dispense(98, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.dispense(95, dilution_plate_1[Y].bottom(z=p1000_offset_Temp), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[Y].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.move_to(DIL.top())
            p1000.blow_out()
        if (
            samplecolumns >= 3
        ):  # -----------------------------------------------------------------------------------------
            X = "A4"
            Y = "A8"
            p1000.move_to(DIL.bottom(z=p1000_offset_Res))
            p1000.mix(3, 200, rate=0.5)
            p1000.move_to(DIL.top(z=+5))
            protocol.delay(seconds=2)
            p1000.aspirate(200, DIL.bottom(z=p1000_offset_Res), rate=0.25)
            p1000.dispense(98, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.dispense(95, dilution_plate_1[Y].bottom(z=p1000_offset_Temp), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[Y].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.move_to(DIL.top())
            p1000.blow_out()
        p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

        protocol.comment("==============================================")
        protocol.comment("--> Adding Sample to Diluent Part 1")
        protocol.comment("==============================================")
        if (
            samplecolumns >= 1
        ):  # -----------------------------------------------------------------------------------------
            X = INICOLUMN1
            Y = "A2"
            p50.pick_up_tip()
            p50.aspirate(2, source_plate[X].bottom(z=p50_offset_Mag), rate=0.25)
            p50.dispense(2, dilution_plate_1[Y].center(), rate=0.5)
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
        if (
            samplecolumns >= 2
        ):  # -----------------------------------------------------------------------------------------
            X = INICOLUMN2
            Y = "A3"
            p50.pick_up_tip()
            p50.aspirate(2, source_plate[X].bottom(z=p50_offset_Mag), rate=0.25)
            p50.dispense(2, dilution_plate_1[Y].center(), rate=0.5)
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
        if (
            samplecolumns >= 3
        ):  # -----------------------------------------------------------------------------------------
            X = INICOLUMN3
            Y = "A4"
            p50.pick_up_tip()
            p50.aspirate(2, source_plate[X].bottom(z=p50_offset_Mag), rate=0.25)
            p50.dispense(2, dilution_plate_1[Y].center(), rate=0.5)
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()

        protocol.comment("--> Mixing")
        if (
            samplecolumns >= 1
        ):  # -----------------------------------------------------------------------------------------
            X = "A2"
            p1000.pick_up_tip()
            p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
            p1000.mix(50, 80)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
        if (
            samplecolumns >= 2
        ):  # -----------------------------------------------------------------------------------------
            X = "A3"
            p1000.pick_up_tip()
            p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))

            p1000.mix(50, 80)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
        if (
            samplecolumns >= 3
        ):  # -----------------------------------------------------------------------------------------
            X = "A4"
            p1000.pick_up_tip()
            p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
            p1000.mix(50, 80)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

        protocol.comment("==============================================")
        protocol.comment("--> Adding Diluted Sample to Diluent Part 2")
        protocol.comment("==============================================")
        if (
            samplecolumns >= 1
        ):  # -----------------------------------------------------------------------------------------
            X = "A2"
            Y = "A6"
            p50.pick_up_tip()
            p50.aspirate(5, dilution_plate_1[X].center(), rate=0.5)
            p50.dispense(5, dilution_plate_1[Y].center(), rate=0.5)
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
        if (
            samplecolumns >= 2
        ):  # -----------------------------------------------------------------------------------------
            X = "A3"
            Y = "A7"
            p50.pick_up_tip()
            p50.aspirate(5, dilution_plate_1[X].center(), rate=0.5)
            p50.dispense(5, dilution_plate_1[Y].center(), rate=0.5)
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
        if (
            samplecolumns >= 3
        ):  # -----------------------------------------------------------------------------------------
            X = "A4"
            Y = "A8"
            p50.pick_up_tip()
            p50.aspirate(5, dilution_plate_1[X].center(), rate=0.5)
            p50.dispense(5, dilution_plate_1[Y].center(), rate=0.5)
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()

        protocol.comment("--> Mixing")
        if (
            samplecolumns >= 1
        ):  # -----------------------------------------------------------------------------------------
            X = "A6"
            p1000.pick_up_tip()
            p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
            p1000.mix(50, 80)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
        if (
            samplecolumns >= 2
        ):  # -----------------------------------------------------------------------------------------
            X = "A7"
            p1000.pick_up_tip()
            p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
            p1000.mix(50, 80)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
        if (
            samplecolumns >= 3
        ):  # -----------------------------------------------------------------------------------------
            X = "A8"
            p1000.pick_up_tip()
            p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
            p1000.mix(50, 80)
            p1000.default_speed = 5
            p1000.move_to(dilution_plate_1[X].top())
            protocol.delay(seconds=2)
            p1000.default_speed = 400
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

    for repeat in range(6):
        if STEP_MIX == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Adding qPCR Mix")
            protocol.comment("==============================================")
            qPCRVol = 50
            p1000.pick_up_tip()
            p1000.aspirate((qPCRVol), PCR_1.bottom(z=p1000_offset_Thermo), rate=0.25)
            p1000.dispense(qPCRVol, dilution_plate_1["A9"].bottom(z=p1000_offset_Temp), rate=0.25)
            if (
                samplecolumns >= 1
            ):  # -----------------------------------------------------------------------------------------
                X = "A10"
                p1000.aspirate((qPCRVol), PCR_1.bottom(z=p1000_offset_Thermo), rate=0.25)
                p1000.dispense(qPCRVol, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
            if (
                samplecolumns >= 2
            ):  # -----------------------------------------------------------------------------------------
                X = "A11"
                p1000.aspirate((qPCRVol), PCR_1.bottom(z=p1000_offset_Thermo), rate=0.25)
                p1000.dispense(qPCRVol, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
            if (
                samplecolumns >= 3
            ):  # -----------------------------------------------------------------------------------------
                X = "A12"
                p1000.aspirate((qPCRVol), PCR_1.bottom(z=p1000_offset_Thermo), rate=0.25)
                p1000.dispense(qPCRVol, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

            p1000.pick_up_tip()
            p1000.aspirate((qPCRVol), PCR_2.bottom(z=p1000_offset_Thermo), rate=0.25)
            p1000.dispense(qPCRVol, dilution_plate_2["A9"].bottom(z=p1000_offset_Deck), rate=0.25)
            if (
                samplecolumns >= 1
            ):  # -----------------------------------------------------------------------------------------
                X = "A10"
                p1000.aspirate((qPCRVol), PCR_2.bottom(z=p1000_offset_Thermo), rate=0.25)
                p1000.dispense(qPCRVol, dilution_plate_2[X].bottom(z=p1000_offset_Deck), rate=0.25)
            if (
                samplecolumns >= 2
            ):  # -----------------------------------------------------------------------------------------
                X = "A11"
                p1000.aspirate((qPCRVol), PCR_2.bottom(z=p1000_offset_Thermo), rate=0.25)
                p1000.dispense(qPCRVol, dilution_plate_2[X].bottom(z=p1000_offset_Deck), rate=0.25)
            if (
                samplecolumns >= 3
            ):  # -----------------------------------------------------------------------------------------
                X = "A12"
                p1000.aspirate((qPCRVol), PCR_2.bottom(z=p1000_offset_Thermo), rate=0.25)
                p1000.dispense(qPCRVol, dilution_plate_2[X].bottom(z=p1000_offset_Deck), rate=0.25)
            p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

            protocol.comment("==============================================")
            protocol.comment("--> Adding Standards to Mix")
            protocol.comment("==============================================")
            SampleVol = 12.5
            p50.pick_up_tip()
            p50.aspirate(SampleVol, STD_1.bottom(z=p50_offset_Thermo), rate=0.5)
            p50.dispense(SampleVol, dilution_plate_1["A9"].bottom(z=p50_offset_Temp), rate=0.5)
            p50.default_speed = 2.5
            p50.move_to(dilution_plate_1["A9"].center())
            protocol.delay(seconds=2)
            p50.default_speed = 400
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()

            p50.pick_up_tip()
            p50.aspirate(SampleVol, STD_2.bottom(z=p50_offset_Thermo), rate=0.5)
            p50.dispense(SampleVol, dilution_plate_2["A9"].bottom(z=p50_offset_Deck), rate=0.5)
            p50.default_speed = 2.5
            p50.move_to(dilution_plate_2["A9"].center())
            protocol.delay(seconds=2)
            p50.default_speed = 400
            p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()

            protocol.comment("==============================================")
            protocol.comment("--> Adding Diluted Sample to Mix")
            protocol.comment("==============================================")
            if (
                samplecolumns >= 1
            ):  # -----------------------------------------------------------------------------------------
                X = "A6"
                Y = "A10"
                p50.pick_up_tip()
                p50.aspirate(SampleVol, dilution_plate_1[X].center(), rate=0.5)
                p50.dispense(SampleVol, dilution_plate_1[Y].bottom(z=p50_offset_Temp), rate=0.5)
                p50.default_speed = 2.5
                p50.move_to(dilution_plate_1[Y].center())
                protocol.delay(seconds=2)
                p50.default_speed = 400
                p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
            if (
                samplecolumns >= 2
            ):  # -----------------------------------------------------------------------------------------
                X = "A7"
                Y = "A11"
                p50.pick_up_tip()
                p50.aspirate(SampleVol, dilution_plate_1[X].center(), rate=0.5)
                p50.dispense(SampleVol, dilution_plate_1[Y].bottom(z=p50_offset_Temp), rate=0.5)
                p50.default_speed = 2.5
                p50.move_to(dilution_plate_1[Y].center())
                protocol.delay(seconds=2)
                p50.default_speed = 400
                p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
            if (
                samplecolumns >= 3
            ):  # -----------------------------------------------------------------------------------------
                X = "A8"
                Y = "A12"
                p50.pick_up_tip()
                p50.aspirate(SampleVol, dilution_plate_1[X].center(), rate=0.5)
                p50.dispense(SampleVol, dilution_plate_1[Y].bottom(z=p50_offset_Temp), rate=0.5)
                p50.default_speed = 2.5
                p50.move_to(dilution_plate_1[Y].center())
                protocol.delay(seconds=2)
                p50.default_speed = 400
                p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()

            if (
                samplecolumns >= 1
            ):  # -----------------------------------------------------------------------------------------
                X = "A6"
                Y = "A10"
                p50.pick_up_tip()
                p50.aspirate(SampleVol, dilution_plate_2[X].center(), rate=0.5)
                p50.dispense(SampleVol, dilution_plate_2[Y].bottom(z=p50_offset_Deck), rate=0.5)
                p50.default_speed = 2.5
                p50.move_to(dilution_plate_2[Y].center())
                protocol.delay(seconds=2)
                p50.default_speed = 400
                p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
            if (
                samplecolumns >= 2
            ):  # -----------------------------------------------------------------------------------------
                X = "A7"
                Y = "A11"
                p50.pick_up_tip()
                p50.aspirate(SampleVol, dilution_plate_2[X].center(), rate=0.5)
                p50.dispense(SampleVol, dilution_plate_2[Y].bottom(z=p50_offset_Deck), rate=0.5)
                p50.default_speed = 2.5
                p50.move_to(dilution_plate_2[Y].center())
                protocol.delay(seconds=2)
                p50.default_speed = 400
                p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()
            if (
                samplecolumns >= 3
            ):  # -----------------------------------------------------------------------------------------
                X = "A8"
                Y = "A12"
                p50.pick_up_tip()
                p50.aspirate(SampleVol, dilution_plate_2[X].center(), rate=0.5)
                p50.dispense(SampleVol, dilution_plate_2[Y].bottom(z=p50_offset_Deck), rate=0.5)
                p50.default_speed = 2.5
                p50.move_to(dilution_plate_2[Y].center())
                protocol.delay(seconds=2)
                p50.default_speed = 400
                p50.drop_tip() if DRYRUN == "NO" else p50.return_tip()

        if STEP_DISPENSE == 1:
            if FORMAT == "96":
                protocol.comment("==============================================")
                protocol.comment("--> Dispensing 96 well")
                protocol.comment("==============================================")
                X = "A9"
                Y1 = "A1"
                Y2 = "A2"
                Y3 = "A3"
                p1000.pick_up_tip()
                p1000.aspirate(60, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.5)
                p1000.dispense(20, qpcrplate_1[Y1].bottom(z=p1000_offset_Mag), rate=0.5)
                p1000.dispense(20, qpcrplate_1[Y2].bottom(z=p1000_offset_Mag), rate=0.5)
                p1000.dispense(20, qpcrplate_1[Y3].bottom(z=p1000_offset_Mag), rate=0.5)
                p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
                if (
                    samplecolumns >= 1
                ):  # -----------------------------------------------------------------------------------------
                    X = "A10"
                    Y1 = "A4"
                    Y2 = "A5"
                    Y3 = "A6"
                    p1000.pick_up_tip()
                    p1000.aspirate(60, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y1].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y2].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y3].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
                if (
                    samplecolumns >= 2
                ):  # -----------------------------------------------------------------------------------------
                    X = "A11"
                    Y1 = "A7"
                    Y2 = "A8"
                    Y3 = "A9"
                    p1000.pick_up_tip()
                    p1000.aspirate(60, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y1].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y2].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y3].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
                if (
                    samplecolumns >= 3
                ):  # -----------------------------------------------------------------------------------------
                    X = "A12"
                    Y1 = "A10"
                    Y2 = "A11"
                    Y3 = "A12"
                    p1000.pick_up_tip()
                    p1000.aspirate(60, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y1].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y2].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.dispense(20, qpcrplate_1[Y3].bottom(z=p1000_offset_Mag), rate=0.5)
                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
            if FORMAT == "384":

                p1000.reset_tipracks()
                p50.reset_tipracks()

                protocol.comment("==============================================")
                protocol.comment("--> Dispensing 384 well")
                protocol.comment("==============================================")
                X = "A9"
                Y1 = "A1"
                Y2 = "A2"
                Y3 = "A3"
                Y4 = "A4"
                Y5 = "A5"
                Y6 = "A6"
                p1000.pick_up_tip()
                p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
                p1000.mix(30, 58)
                p1000.aspirate(62, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.move_to(qpcrplate_1[Y1].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_1[Y1].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_1[Y2].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_1[Y2].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_1[Y3].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_1[Y3].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400

                p1000.move_to(qpcrplate_1[Y4].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_1[Y4].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_1[Y5].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_1[Y5].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_1[Y6].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_1[Y6].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400

                p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
                if (
                    samplecolumns >= 1
                ):  # -----------------------------------------------------------------------------------------
                    X = "A10"
                    Y1 = "B1"
                    Y2 = "B2"
                    Y3 = "B3"
                    Y4 = "B4"
                    Y5 = "B5"
                    Y6 = "B6"
                    p1000.pick_up_tip()
                    p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
                    p1000.mix(30, 58)
                    p1000.aspirate(62, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(qpcrplate_1[Y1].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y1].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y2].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y2].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y3].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y3].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.move_to(qpcrplate_1[Y4].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y4].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y5].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y5].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y6].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y6].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

                if (
                    samplecolumns >= 2
                ):  # -----------------------------------------------------------------------------------------
                    X = "A11"
                    Y1 = "A7"
                    Y2 = "A8"
                    Y3 = "A9"
                    Y4 = "A10"
                    Y5 = "A11"
                    Y6 = "A12"
                    p1000.pick_up_tip()
                    p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
                    p1000.mix(30, 58)
                    p1000.aspirate(62, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(qpcrplate_1[Y1].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y1].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y2].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y2].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y3].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y3].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.move_to(qpcrplate_1[Y4].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y4].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y5].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y5].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y6].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y6].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

                if (
                    samplecolumns >= 3
                ):  # -----------------------------------------------------------------------------------------
                    X = "A12"
                    Y1 = "B7"
                    Y2 = "B8"
                    Y3 = "B9"
                    Y4 = "B10"
                    Y5 = "B11"
                    Y6 = "B12"
                    p1000.pick_up_tip()
                    p1000.move_to(dilution_plate_1[X].bottom(z=p1000_offset_Temp))
                    p1000.mix(30, 58)
                    p1000.aspirate(62, dilution_plate_1[X].bottom(z=p1000_offset_Temp), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(qpcrplate_1[Y1].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y1].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y2].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y2].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y3].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y3].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.move_to(qpcrplate_1[Y4].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y4].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y5].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y5].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_1[Y6].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_1[Y6].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

                X = "A9"
                Y1 = "A1"
                Y2 = "A2"
                Y3 = "A3"
                Y4 = "A4"
                Y5 = "A5"
                Y6 = "A6"
                p1000.pick_up_tip()
                p1000.move_to(dilution_plate_2[X].bottom(z=p1000_offset_Temp))
                p1000.mix(30, 58)
                p1000.aspirate(62, dilution_plate_2[X].bottom(z=p1000_offset_Temp), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.move_to(qpcrplate_2[Y1].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_2[Y1].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_2[Y2].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_2[Y2].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_2[Y3].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_2[Y3].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400

                p1000.move_to(qpcrplate_2[Y4].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_2[Y4].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_2[Y5].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_2[Y5].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.move_to(qpcrplate_2[Y6].top(z=1.0))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 2.5
                p1000.dispense(10, qpcrplate_2[Y6].bottom(z=1.75), rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400

                p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()
                if (
                    samplecolumns >= 1
                ):  # -----------------------------------------------------------------------------------------
                    X = "A10"
                    Y1 = "B1"
                    Y2 = "B2"
                    Y3 = "B3"
                    Y4 = "B4"
                    Y5 = "B5"
                    Y6 = "B6"
                    p1000.pick_up_tip()
                    p1000.move_to(dilution_plate_2[X].bottom(z=p1000_offset_Temp))
                    p1000.mix(30, 58)
                    p1000.aspirate(62, dilution_plate_2[X].bottom(z=p1000_offset_Temp), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(qpcrplate_2[Y1].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y1].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y2].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y2].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y3].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y3].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.move_to(qpcrplate_2[Y4].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y4].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y5].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y5].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y6].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y6].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

                if (
                    samplecolumns >= 2
                ):  # -----------------------------------------------------------------------------------------
                    X = "A11"
                    Y1 = "A7"
                    Y2 = "A8"
                    Y3 = "A9"
                    Y4 = "A10"
                    Y5 = "A11"
                    Y6 = "A12"
                    p1000.pick_up_tip()
                    p1000.move_to(dilution_plate_2[X].bottom(z=p1000_offset_Temp))
                    p1000.mix(30, 58)
                    p1000.aspirate(62, dilution_plate_2[X].bottom(z=p1000_offset_Temp), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(qpcrplate_2[Y1].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y1].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y2].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y2].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y3].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y3].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.move_to(qpcrplate_2[Y4].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y4].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y5].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y5].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y6].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y6].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

                if (
                    samplecolumns >= 3
                ):  # -----------------------------------------------------------------------------------------
                    X = "A12"
                    Y1 = "B7"
                    Y2 = "B8"
                    Y3 = "B9"
                    Y4 = "B10"
                    Y5 = "B11"
                    Y6 = "B12"
                    p1000.pick_up_tip()
                    p1000.move_to(dilution_plate_2[X].bottom(z=p1000_offset_Temp))
                    p1000.mix(30, 58)
                    p1000.aspirate(62, dilution_plate_2[X].bottom(z=p1000_offset_Temp), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(qpcrplate_2[Y1].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y1].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y2].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y2].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y3].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y3].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.move_to(qpcrplate_2[Y4].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y4].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y5].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y5].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400
                    p1000.move_to(qpcrplate_2[Y6].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 2.5
                    p1000.dispense(10, qpcrplate_2[Y6].bottom(z=1.75), rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.default_speed = 400

                    p1000.drop_tip() if DRYRUN == "NO" else p1000.return_tip()

        p1000.reset_tipracks()
        p50.reset_tipracks()
        repeat += 1
