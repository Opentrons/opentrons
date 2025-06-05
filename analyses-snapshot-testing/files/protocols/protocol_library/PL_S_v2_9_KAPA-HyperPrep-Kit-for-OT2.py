def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "SAMPLES", "type": "dropDown", "label": "Number of Samples", "options": [{"label": "8", "value": "8x"}, {"label": "16", "value": "16x"}, {"label": "24", "value": "24x"}]}, {"name": "DRYRUN", "type": "dropDown", "label": "Dry run?", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "NOMODULES", "type": "dropDown", "label": "Modules or no modules?", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "TIPREUSE", "type": "dropDown", "label": "Reuse tips?", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "OFFSET", "type": "dropDown", "label": "Offset?", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "STEP_ERAT", "type": "dropDown", "label": "Step ERAT?", "options": [{"label": "Include ERAT step", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "STEP_ERATDECK", "type": "dropDown", "label": "Include ERAT deck steps?", "options": [{"label": "Include ERAT deck steps", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "STEP_LIG", "type": "dropDown", "label": "Include Ligation?", "options": [{"label": "Yes", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "STEP_LIGDECK", "type": "dropDown", "label": "Include Ligation Deck Steps?", "options": [{"label": "Yes", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "STEP_POSTLIG", "type": "dropDown", "label": "Include Post-Ligation?", "options": [{"label": "Yes", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "STEP_PCR", "type": "dropDown", "label": "Include PCR?", "options": [{"label": "Yes", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "STEP_PCRDECK", "type": "dropDown", "label": "Include PCR Deck Step?", "options": [{"label": "Yes", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "STEP_POSTPCR", "type": "dropDown", "label": "Include Post PCR Step?", "options": [{"label": "Yes", "value": 1}, {"label": "Skip", "value": 0}]}, {"name": "p300_mount", "type": "dropDown", "label": "P300 Multi-Channel Mount (GEN 2)", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}, {"name": "p20_mount", "type": "dropDown", "label": "P20 Multi-Channel Mount (GEN 2)", "options": [{"label": "Right", "value": "right"}, {"label": "Left", "value": "left"}]}, {"name": "p300_mount_1", "type": "dropDown", "label": "P300 Multi-Channel Mount (GEN 1)", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}, {"name": "p10_mount", "type": "dropDown", "label": "P10 Multi-Channel Mount (GEN 1)", "options": [{"label": "Right", "value": "right"}, {"label": "Left", "value": "left"}]}]""")
    return [_all_values[n] for n in names]


from opentrons import protocol_api

from opentrons import types

import inspect

metadata = {
    'protocolName': 'HyperPrep',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.9'
}

# flake8: noqa

def right(s, amount):
    if s is None:
        return None
    elif amount is None:
        return None
    s = str(s)
    if amount > len(s):
        return s
    elif amount == 0:
        return ""
    else:
        return s[-amount:]




def run(protocol: protocol_api.ProtocolContext):
    [SAMPLES, DRYRUN, NOMODULES, TIPREUSE, OFFSET, STEP_ERAT, STEP_ERATDECK, STEP_LIG, STEP_LIGDECK, STEP_POSTLIG, STEP_PCR, STEP_PCRDECK, STEP_POSTPCR, p300_mount, p20_mount, p300_mount_1, p10_mount] = get_values(  # noqa: F821
        "SAMPLES", "DRYRUN", "NOMODULES", "TIPREUSE", "OFFSET", "STEP_ERAT", "STEP_ERATDECK", "STEP_LIG", "STEP_LIGDECK", "STEP_POSTLIG", "STEP_PCR", "STEP_PCRDECK", "STEP_POSTPCR", "p300_mount", "p20_mount", "p300_mount_1", "p10_mount")
    STEPS = {STEP_ERAT, STEP_LIG, STEP_POSTLIG, STEP_PCR, STEP_POSTPCR}

    # global TIPREUSE

    if DRYRUN == 'YES':
        protocol.comment("THIS IS A DRY RUN")
    else:
        protocol.comment("THIS IS A REACTION RUN")
        NOMODULES = 'NO'

    if all(STEPS):
        if TIPREUSE == 'YES':
            TIPREUSE = 'YES'
            protocol.comment("TIP REUSING")
    else:
        TIPREUSE = 'NO'
        protocol.comment("NO TIP REUSING")

    # labware
    if NOMODULES == 'YES':
        protocol.comment("THIS IS A NO MODULE RUN")
        sample_plate_mag = protocol.load_labware(
            'nest_96_wellplate_100ul_pcr_full_skirt',
            '1')  # <--- Actually an Eppendorf 96 well, same dimensions
        if TIPREUSE == 'NO':
            reservoir = protocol.load_labware('nest_12_reservoir_15ml', '2')
        else:
            reservoir = protocol.load_labware(
                'nest_96_wellplate_2ml_deep', '2')
        reagent_plate = protocol.load_labware(
            'opentrons_96_aluminumblock_biorad_wellplate_200ul', '3')
        tiprack_20 = protocol.load_labware(
            'opentrons_96_filtertiprack_20ul', '4')
        tiprack_200_1 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '5')
        tiprack_200_2 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '6')
        sample_plate_thermo = protocol.load_labware(
            'nest_96_wellplate_100ul_pcr_full_skirt', '7')
        tiprack_200_3 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '9')
    else:
        protocol.comment("THIS IS A MODULE RUN")
        mag_block = protocol.load_module('magnetic module gen2', '1')
        # <--- Actually an Eppendorf 96 well, same dimensions
        sample_plate_mag = mag_block.load_labware(
            'nest_96_wellplate_100ul_pcr_full_skirt')
        if TIPREUSE == 'NO':
            reservoir = protocol.load_labware('nest_12_reservoir_15ml', '2')
        else:
            reservoir = protocol.load_labware(
                'nest_96_wellplate_2ml_deep', '2')
        temp_block = protocol.load_module('temperature module gen2', '3')
        reagent_plate = temp_block.load_labware(
            'opentrons_96_aluminumblock_biorad_wellplate_200ul')
        tiprack_20 = protocol.load_labware(
            'opentrons_96_filtertiprack_20ul', '4')
        tiprack_200_1 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '5')
        tiprack_200_2 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '6')
        thermocycler = protocol.load_module('thermocycler module')
        sample_plate_thermo = thermocycler.load_labware(
            'nest_96_wellplate_100ul_pcr_full_skirt')
        tiprack_200_3 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '9')

    if TIPREUSE == 'YES':
        protocol.comment("THIS PROTOCOL WILL REUSE TIPS FOR WASHES")

    # reagent - plate
    ERAT = reagent_plate.wells_by_name()['A1']
    LIG = reagent_plate.wells_by_name()['A2']
    Primer = reagent_plate.wells_by_name()['A3']
    HotStart = reagent_plate.wells_by_name()['A4']
    Barcodes1 = reagent_plate.wells_by_name()['A7']
    Barcodes2 = reagent_plate.wells_by_name()['A8']
    Barcodes3 = reagent_plate.wells_by_name()['A9']

    if TIPREUSE == 'NO':
        AMPure = reservoir['A1']
        EtOH_1 = reservoir['A4']
        EtOH_2 = reservoir['A4']
        EtOH_3 = reservoir['A4']
        RSB = reservoir['A6']
        Liquid_trash = reservoir['A12']
    else:
        AMPure = reservoir['A1']
        EtOH_1 = reservoir['A4']
        EtOH_2 = reservoir['A3']
        EtOH_3 = reservoir['A2']
        RSB = reservoir['A6']
        Liquid_trash = reservoir['A12']

    # pipette
    if NOMODULES == 'NO':
        p300 = protocol.load_instrument(
            'p300_multi_gen2', p300_mount, tip_racks=[
                tiprack_200_1, tiprack_200_2, tiprack_200_3])
        p20 = protocol.load_instrument(
            'p20_multi_gen2', p20_mount, tip_racks=[tiprack_20])
    else:
        p300 = protocol.load_instrument(
            'p300_multi', p300_mount_1, tip_racks=[
                tiprack_200_1, tiprack_200_2, tiprack_200_3])
        p20 = protocol.load_instrument(
            'p10_multi', p10_mount, tip_racks=[tiprack_20])

    # samples
    src_file_path = inspect.getfile(lambda: None)
    protocol.comment(src_file_path)

    # tip and sample tracking
    if SAMPLES == '8x':
        protocol.comment("There are 8 Samples")
        samplecolumns = 1
        W1_ETOH_washtip_1 = tiprack_200_1['A4']
        W1_ETOH_removetip_1 = tiprack_200_2['A5']
        W1_ResusTrans_1 = tiprack_200_2['A6']
        W2_ETOH_washtip_1 = tiprack_200_3['A10']
        W2_ETOH_removetip_1 = tiprack_200_3['A11']
        W2_ResusTrans_1 = tiprack_200_3['A12']
    elif SAMPLES == '16x':
        protocol.comment("There are 16 Samples")
        samplecolumns = 2
        W1_ETOH_washtip_1 = tiprack_200_1['A7']
        W1_ETOH_washtip_2 = tiprack_200_1['A8']
        W1_ETOH_removetip_1 = tiprack_200_2['A9']
        W1_ETOH_removetip_2 = tiprack_200_2['A10']
        W1_ResusTrans_1 = tiprack_200_2['A11']
        W1_ResusTrans_2 = tiprack_200_2['A12']
        W2_ETOH_washtip_1 = tiprack_200_3['A7']
        W2_ETOH_washtip_2 = tiprack_200_3['A8']
        W2_ETOH_removetip_1 = tiprack_200_3['A9']
        W2_ETOH_removetip_2 = tiprack_200_3['A10']
        W2_ResusTrans_1 = tiprack_200_3['A11']
        W2_ResusTrans_2 = tiprack_200_3['A12']
    elif SAMPLES == '24x':
        protocol.comment("There are 24 Samples")
        samplecolumns = 3
        W1_ETOH_washtip_1 = tiprack_200_1['A10']
        W1_ETOH_washtip_2 = tiprack_200_1['A11']
        W1_ETOH_washtip_3 = tiprack_200_1['A12']
        W1_ETOH_removetip_1 = tiprack_200_2['A1']
        W1_ETOH_removetip_2 = tiprack_200_2['A2']
        W1_ETOH_removetip_3 = tiprack_200_2['A3']
        W1_ResusTrans_1 = tiprack_200_2['A4']
        W1_ResusTrans_2 = tiprack_200_2['A5']
        W1_ResusTrans_3 = tiprack_200_2['A6']
        W2_ETOH_washtip_1 = tiprack_200_3['A4']
        W2_ETOH_washtip_2 = tiprack_200_3['A5']
        W2_ETOH_washtip_3 = tiprack_200_3['A6']
        W2_ETOH_removetip_1 = tiprack_200_3['A7']
        W2_ETOH_removetip_2 = tiprack_200_3['A8']
        W2_ETOH_removetip_3 = tiprack_200_3['A9']
        W2_ResusTrans_1 = tiprack_200_3['A10']
        W2_ResusTrans_2 = tiprack_200_3['A11']
        W2_ResusTrans_3 = tiprack_200_3['A12']
    else:
        protocol.pause("ERROR?")

    # offset
    if OFFSET == 'YES':
        if TIPREUSE == 'NO':
            p300_offset_Res = 2
        else:
            p300_offset_Res = 2
        p300_offset_Thermo = 1
        p300_offset_Mag = 0.70
        p300_offset_Deck = 0.3
        p300_offset_Temp = 0.65
        p300_offset_Tube = 0
        if TIPREUSE == 'NO':
            p20_offset_Res = 2
        else:
            p20_offset_Res = 2
        p20_offset_Thermo = 1
        p20_offset_Mag = 0.75
        p20_offset_Deck = 0.3
        p20_offset_Temp = 0.85
        p20_offset_Tube = 0
    else:
        if TIPREUSE == 'NO':
            p300_offset_Res = 0
        else:
            p300_offset_Res = 0
        p300_offset_Thermo = 0
        p300_offset_Mag = 0
        p300_offset_Deck = 0
        p300_offset_Temp = 0
        p300_offset_Tube = 0
        if TIPREUSE == 'NO':
            p20_offset_Res = 0
        else:
            p20_offset_Res = 0
        p20_offset_Thermo = 0
        p20_offset_Mag = 0
        p20_offset_Deck = 0
        p20_offset_Temp = 0
        p20_offset_Tube = 0

    # positions
    ##########################################################################
    #  sample_plate_thermo on the Thermocycler
    A1_p20_bead_side = sample_plate_thermo['A1'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Thermo - 5))  # Beads to the Right
    A1_p20_bead_top = sample_plate_thermo['A1'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Thermo + 2))  # Beads to the Right
    A1_p20_bead_mid = sample_plate_thermo['A1'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Thermo - 2))  # Beads to the Right
    A1_p300_bead_side = sample_plate_thermo['A1'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Thermo - 7.2))  # Beads to the Right  # noqa: E501
    A1_p300_bead_top = sample_plate_thermo['A1'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Thermo - 1))  # Beads to the Right  # noqa: E501
    A1_p300_bead_mid = sample_plate_thermo['A1'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A1_p300_loc1 = sample_plate_thermo['A1'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A1_p300_loc2 = sample_plate_thermo['A1'].center().move(
        types.Point(x=1.3, y=0, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A1_p300_loc3 = sample_plate_thermo['A1'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A3_p20_bead_side = sample_plate_thermo['A3'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Thermo - 5))  # Beads to the Right
    A3_p20_bead_top = sample_plate_thermo['A3'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Thermo + 2))  # Beads to the Right
    A3_p20_bead_mid = sample_plate_thermo['A3'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Thermo - 2))  # Beads to the Right
    A3_p300_bead_side = sample_plate_thermo['A3'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Thermo - 7.2))  # Beads to the Right  # noqa: E501
    A3_p300_bead_top = sample_plate_thermo['A3'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Thermo - 1))  # Beads to the Right  # noqa: E501
    A3_p300_bead_mid = sample_plate_thermo['A3'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A3_p300_loc1 = sample_plate_thermo['A3'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A3_p300_loc2 = sample_plate_thermo['A3'].center().move(
        types.Point(x=1.3, y=0, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A3_p300_loc3 = sample_plate_thermo['A3'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A5_p20_bead_side = sample_plate_thermo['A5'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Thermo - 5))  # Beads to the Right
    A5_p20_bead_top = sample_plate_thermo['A5'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Thermo + 2))  # Beads to the Right
    A5_p20_bead_mid = sample_plate_thermo['A5'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Thermo - 2))  # Beads to the Right
    A5_p300_bead_side = sample_plate_thermo['A5'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Thermo - 7.2))  # Beads to the Right  # noqa: E501
    A5_p300_bead_top = sample_plate_thermo['A5'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Thermo - 1))  # Beads to the Right  # noqa: E501
    A5_p300_bead_mid = sample_plate_thermo['A5'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A5_p300_loc1 = sample_plate_thermo['A5'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A5_p300_loc2 = sample_plate_thermo['A5'].center().move(
        types.Point(x=1.3, y=0, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    A5_p300_loc3 = sample_plate_thermo['A5'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Thermo - 4))  # Beads to the Right  # noqa: E501
    ##########################################################################

    bypass = protocol.deck.position_for(
        '11').move(types.Point(x=70, y=80, z=130))

    # commands
    if DRYRUN == 'NO':
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(100)
        temp_block.set_temperature(4)
        thermocycler.open_lid()
        protocol.pause("Ready")

    if STEP_ERAT == 1:
        protocol.comment('==============================================')
        protocol.comment('--> End Repair / A-Tailing')
        protocol.comment('==============================================')

        protocol.comment('--> Adding ERAT')
        if DRYRUN == 'NO':
            ERATVol = 10
            ERATMixRep = 10
            ERATMixVol = 20
        if DRYRUN == 'YES':
            ERATVol = 10
            ERATMixRep = 1
            ERATMixVol = 10
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A1'
            p20.pick_up_tip()
            p20.aspirate(ERATVol, ERAT.bottom(z=p20_offset_Temp))
            p20.dispense(
                ERATVol,
                sample_plate_thermo.wells_by_name()[X].bottom(
                    z=p20_offset_Thermo))
            p20.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p20.mix(ERATMixRep, ERATMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A3'
            p20.pick_up_tip()
            p20.aspirate(ERATVol, ERAT.bottom(z=p20_offset_Temp))
            p20.dispense(
                ERATVol,
                sample_plate_thermo.wells_by_name()[X].bottom(
                    z=p20_offset_Thermo))
            p20.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p20.mix(ERATMixRep, ERATMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A5'
            p20.pick_up_tip()
            p20.aspirate(ERATVol, ERAT.bottom(z=p20_offset_Temp))
            p20.dispense(
                ERATVol,
                sample_plate_thermo.wells_by_name()[X].bottom(
                    z=p20_offset_Thermo))
            p20.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p20.mix(ERATMixRep, ERATMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()

    if STEP_ERATDECK == 1:
        if DRYRUN == 'NO':
            ###################################################################
            protocol.pause('Seal, Run ERAT (60min)')

            thermocycler.close_lid()
            profile_ERAT = [
                {'temperature': 20, 'hold_time_minutes': 30},
                {'temperature': 65, 'hold_time_minutes': 30}
            ]
            thermocycler.execute_profile(
                steps=profile_ERAT, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(10)
            ###################################################################
            thermocycler.open_lid()
            protocol.pause("Remove Seal")
    else:
        protocol.pause('Seal, Run ERAT (60min)')

    if STEP_LIG == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Adapter Ligation')
        protocol.comment('==============================================')

        protocol.comment('--> Adding Barcodes')
        if DRYRUN == 'NO':
            BarcodeVol = 5
            BarcodeMixRep = 5
            BarcodeMixVol = 10
        if DRYRUN == 'YES':
            BarcodeVol = 5
            BarcodeMixRep = 1
            BarcodeMixVol = 10
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A1'
            p20.pick_up_tip()
            p20.aspirate(
                BarcodeVol, Barcodes1.bottom(
                    z=p20_offset_Temp), rate=0.5)
            p20.dispense(BarcodeVol, sample_plate_thermo.wells_by_name()[
                         X].bottom(z=p20_offset_Thermo), rate=0.25)
            p20.mix(BarcodeMixRep, BarcodeMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A3'
            p20.pick_up_tip()
            p20.aspirate(
                BarcodeVol, Barcodes2.bottom(
                    z=p20_offset_Temp), rate=0.5)
            p20.dispense(BarcodeVol, sample_plate_thermo.wells_by_name()[
                         X].bottom(z=p20_offset_Thermo), rate=0.25)
            p20.mix(BarcodeMixRep, BarcodeMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A5'
            p20.pick_up_tip()
            p20.aspirate(
                BarcodeVol, Barcodes3.bottom(
                    z=p20_offset_Temp), rate=0.5)
            p20.dispense(BarcodeVol, sample_plate_thermo.wells_by_name()[
                         X].bottom(z=p20_offset_Thermo), rate=0.25)
            p20.mix(BarcodeMixRep, BarcodeMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()

        protocol.comment('--> Adding Lig')
        if DRYRUN == 'NO':
            LIGVol = 45
            LIGMixRep = 50
            LIGMixVol = 80
        if DRYRUN == 'YES':
            LIGVol = 45
            LIGMixRep = 1
            LIGMixVol = 80
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A1'
            p300.pick_up_tip()
            p300.mix(3, LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.5)
            p300.aspirate(LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.2)
            p300.default_speed = 5
            p300.move_to(LIG.top(z=p300_offset_Temp + 5))
            protocol.delay(seconds=0.2)
            p300.default_speed = 400
            p300.dispense(
                LIGVol, sample_plate_thermo[X].bottom(
                    z=p300_offset_Thermo), rate=0.25)
            p300.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p300.mix(LIGMixRep, LIGMixVol, rate=0.5)
            p300.blow_out(sample_plate_thermo[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A3'
            p300.pick_up_tip()
            p300.mix(3, LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.5)
            p300.aspirate(LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.2)
            p300.default_speed = 5
            p300.move_to(LIG.top(z=p300_offset_Temp + 5))
            protocol.delay(seconds=0.2)
            p300.default_speed = 400
            p300.dispense(
                LIGVol, sample_plate_thermo[X].bottom(
                    z=p300_offset_Thermo), rate=0.25)
            p300.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p300.mix(LIGMixRep, LIGMixVol, rate=0.5)
            p300.blow_out(sample_plate_thermo[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A5'
            p300.pick_up_tip()
            p300.mix(3, LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.5)
            p300.aspirate(LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.2)
            p300.default_speed = 5
            p300.move_to(LIG.top(z=p300_offset_Temp + 5))
            protocol.delay(seconds=0.2)
            p300.default_speed = 400
            p300.dispense(
                LIGVol, sample_plate_thermo[X].bottom(
                    z=p300_offset_Thermo), rate=0.25)
            p300.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p300.mix(LIGMixRep, LIGMixVol, rate=0.5)
            p300.blow_out(sample_plate_thermo[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

    if STEP_LIGDECK == 1:
        if DRYRUN == 'NO':
            ###################################################################
            protocol.pause('Seal, Run LIG (15min)')

            thermocycler.close_lid()
            profile_LIG = [
                {'temperature': 20, 'hold_time_minutes': 15}
            ]
            thermocycler.execute_profile(
                steps=profile_LIG, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(10)
            ###################################################################
            thermocycler.open_lid()
            protocol.pause("Remove Seal")
    else:
        protocol.pause('Seal, Run LIG (15min)')

    # positions
    ##########################################################################
    #  sample_plate_mag on the Mag Block
    A1_p20_bead_side = sample_plate_mag['A1'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Mag - 5))  # Beads to the Right
    A1_p20_bead_top = sample_plate_mag['A1'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Mag + 2))  # Beads to the Right
    A1_p20_bead_mid = sample_plate_mag['A1'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Mag - 2))  # Beads to the Right
    A1_p300_bead_side = sample_plate_mag['A1'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Mag - 7.2))  # Beads to the Right
    A1_p300_bead_top = sample_plate_mag['A1'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Mag - 1))  # Beads to the Right
    A1_p300_bead_mid = sample_plate_mag['A1'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A1_p300_loc1 = sample_plate_mag['A1'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))  # Beads to the Right
    A1_p300_loc2 = sample_plate_mag['A1'].center().move(
        types.Point(x=1.3, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A1_p300_loc3 = sample_plate_mag['A1'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))  # Beads to the Right
    A1_p20_loc1 = sample_plate_mag['A1'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))  # Beads to the Right
    A1_p20_loc2 = sample_plate_mag['A1'].center().move(
        types.Point(x=1.3, y=0, z=p20_offset_Mag - 7))  # Beads to the Right
    A1_p20_loc3 = sample_plate_mag['A1'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))  # Beads to the Right
    A3_p20_bead_side = sample_plate_mag['A3'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Mag - 5))  # Beads to the Right
    A3_p20_bead_top = sample_plate_mag['A3'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Mag + 2))  # Beads to the Right
    A3_p20_bead_mid = sample_plate_mag['A3'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Mag - 2))  # Beads to the Right
    A3_p300_bead_side = sample_plate_mag['A3'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Mag - 7.2))  # Beads to the Right  # noqa: E501
    A3_p300_bead_top = sample_plate_mag['A3'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Mag - 1))  # Beads to the Right
    A3_p300_bead_mid = sample_plate_mag['A3'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A3_p300_loc1 = sample_plate_mag['A3'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))  # Beads to the Right
    A3_p300_loc2 = sample_plate_mag['A3'].center().move(
        types.Point(x=1.3, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A3_p300_loc3 = sample_plate_mag['A3'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))  # Beads to the Right
    A3_p20_loc1 = sample_plate_mag['A3'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))  # Beads to the Right
    A3_p20_loc2 = sample_plate_mag['A3'].center().move(
        types.Point(x=1.3, y=0, z=p20_offset_Mag - 7))  # Beads to the Right
    A3_p20_loc3 = sample_plate_mag['A3'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))  # Beads to the Right
    A5_p20_bead_side = sample_plate_mag['A5'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Mag - 5))  # Beads to the Right
    A5_p20_bead_top = sample_plate_mag['A5'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Mag + 2))  # Beads to the Right
    A5_p20_bead_mid = sample_plate_mag['A5'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Mag - 2))  # Beads to the Right
    A5_p300_bead_side = sample_plate_mag['A5'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Mag - 7.2))  # Beads to the Right  # noqa: E501
    A5_p300_bead_top = sample_plate_mag['A5'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Mag - 1))  # Beads to the Right
    A5_p300_bead_mid = sample_plate_mag['A5'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A5_p300_loc1 = sample_plate_mag['A5'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))  # Beads to the Right
    A5_p300_loc2 = sample_plate_mag['A5'].center().move(
        types.Point(x=1.3, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A5_p300_loc3 = sample_plate_mag['A5'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))  # Beads to the Right  # noqa: E501
    A5_p20_loc1 = sample_plate_mag['A5'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))  # Beads to the Right
    A5_p20_loc2 = sample_plate_mag['A5'].center().move(
        types.Point(x=1.3, y=0, z=p20_offset_Mag - 7))  # Beads to the Right
    A5_p20_loc3 = sample_plate_mag['A5'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))  # Beads to the Right
    A7_p20_bead_side = sample_plate_mag['A7'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Mag - 5))  # Beads to the Right
    A7_p20_bead_top = sample_plate_mag['A7'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Mag + 2))  # Beads to the Right
    A7_p20_bead_mid = sample_plate_mag['A7'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Mag - 2))  # Beads to the Right
    A7_p300_bead_side = sample_plate_mag['A7'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Mag - 7.2))  # Beads to the Right  # noqa: E501
    A7_p300_bead_top = sample_plate_mag['A7'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Mag - 1))  # Beads to the Right
    A7_p300_bead_mid = sample_plate_mag['A7'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A7_p300_loc1 = sample_plate_mag['A7'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Mag - 5.5))  # Beads to the Right  # noqa: E501
    A7_p300_loc2 = sample_plate_mag['A7'].center().move(types.Point(
        x=1.3, y=0, z=p300_offset_Mag - 5.5))  # Beads to the Right
    A7_p300_loc3 = sample_plate_mag['A7'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 5.5))  # Beads to the Right  # noqa: E501
    A9_p20_bead_side = sample_plate_mag['A9'].center().move(types.Point(
        x=-1.8 * 0.50, y=0, z=p20_offset_Mag - 5))  # Beads to the Right
    A9_p20_bead_top = sample_plate_mag['A9'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Mag + 2))  # Beads to the Right
    A9_p20_bead_mid = sample_plate_mag['A9'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Mag - 2))  # Beads to the Right
    A9_p300_bead_side = sample_plate_mag['A9'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Mag - 7.2))  # Beads to the Right  # noqa: E501
    A9_p300_bead_top = sample_plate_mag['A9'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Mag - 1))  # Beads to the Right
    A9_p300_bead_mid = sample_plate_mag['A9'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A9_p300_loc1 = sample_plate_mag['A9'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Mag - 5.5))  # Beads to the Right  # noqa: E501
    A9_p300_loc2 = sample_plate_mag['A9'].center().move(types.Point(
        x=1.3, y=0, z=p300_offset_Mag - 5.5))  # Beads to the Right
    A9_p300_loc3 = sample_plate_mag['A9'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 5.5))  # Beads to the Right  # noqa: E501
    A11_p20_bead_side = sample_plate_mag['A11'].center().move(
        types.Point(x=-1.8 * 0.50, y=0, z=p20_offset_Mag - 5))  # Beads to the Right  # noqa: E501
    A11_p20_bead_top = sample_plate_mag['A11'].center().move(
        types.Point(x=1.5, y=0, z=p20_offset_Mag + 2))  # Beads to the Right
    A11_p20_bead_mid = sample_plate_mag['A11'].center().move(
        types.Point(x=1, y=0, z=p20_offset_Mag - 2))  # Beads to the Right
    A11_p300_bead_side = sample_plate_mag['A11'].center().move(
        types.Point(x=-0.50, y=0, z=p300_offset_Mag - 7.2))  # Beads to the Right  # noqa: E501
    A11_p300_bead_top = sample_plate_mag['A11'].center().move(
        types.Point(x=1.30, y=0, z=p300_offset_Mag - 1))  # Beads to the Right
    A11_p300_bead_mid = sample_plate_mag['A11'].center().move(
        types.Point(x=0.80, y=0, z=p300_offset_Mag - 4))  # Beads to the Right
    A11_p300_loc1 = sample_plate_mag['A11'].center().move(types.Point(
        x=1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Mag - 5.5))  # Beads to the Right  # noqa: E501
    A11_p300_loc2 = sample_plate_mag['A11'].center().move(
        types.Point(x=1.3, y=0, z=p300_offset_Mag - 5.5))  # Beads to the Right
    A11_p300_loc3 = sample_plate_mag['A11'].center().move(types.Point(
        x=1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 5.5))  # Beads to the Right  # noqa: E501
    ##########################################################################

    if STEP_POSTLIG == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 1')
        protocol.comment('==============================================')

        if DRYRUN == 'NO':
            protocol.pause("PLACE sample_plate_mag MAGNET")

        protocol.comment('--> ADDING AMPure (0.8x)')
        if DRYRUN == 'NO':
            AMPureVol = 88
            AMPureMixRep = 50
            AMPureMixVol = 126
        if DRYRUN == 'YES':
            AMPureVol = 88
            AMPureMixRep = 5
            AMPureMixVol = 126
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A1'
            p300.pick_up_tip()
            p300.mix(10, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(
                AMPureVol, AMPure.bottom(
                    z=p300_offset_Res), rate=0.25)
            p300.dispense(
                AMPureVol / 2,
                sample_plate_mag[X].bottom(
                    z=p300_offset_Mag),
                rate=0.25)
            p300.default_speed = 5
            p300.dispense(
                AMPureVol / 2,
                sample_plate_mag[X].center(),
                rate=0.25)
            p300.move_to(sample_plate_mag[X].center())
            for Mix in range(AMPureMixRep):
                p300.aspirate(AMPureMixVol / 2, rate=0.5)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(AMPureMixVol / 2, rate=0.5)
                p300.dispense(AMPureMixVol / 2, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(AMPureMixVol / 2, rate=0.5)
                Mix += 1
            p300.blow_out(sample_plate_mag[X].top(z=1))
            p300.default_speed = 400
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A3'
            p300.pick_up_tip()
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(
                AMPureVol, AMPure.bottom(
                    z=p300_offset_Res), rate=0.25)
            p300.dispense(
                AMPureVol / 2,
                sample_plate_mag[X].bottom(
                    z=p300_offset_Mag),
                rate=0.25)
            p300.default_speed = 5
            p300.dispense(
                AMPureVol / 2,
                sample_plate_mag[X].center(),
                rate=0.25)
            p300.move_to(sample_plate_mag[X].center())
            for Mix in range(AMPureMixRep):
                p300.aspirate(AMPureMixVol / 2, rate=0.5)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(AMPureMixVol / 2, rate=0.5)
                p300.dispense(AMPureMixVol / 2, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(AMPureMixVol / 2, rate=0.5)
                Mix += 1
            p300.blow_out(sample_plate_mag[X].top(z=1))
            p300.default_speed = 400
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A5'
            p300.pick_up_tip()
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(
                AMPureVol, AMPure.bottom(
                    z=p300_offset_Res), rate=0.25)
            p300.dispense(
                AMPureVol / 2,
                sample_plate_mag[X].bottom(
                    z=p300_offset_Mag),
                rate=0.25)
            p300.default_speed = 5
            p300.dispense(
                AMPureVol / 2,
                sample_plate_mag[X].center(),
                rate=0.25)
            p300.move_to(sample_plate_mag[X].center())
            for Mix in range(AMPureMixRep):
                p300.aspirate(AMPureMixVol / 2, rate=0.5)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(AMPureMixVol / 2, rate=0.5)
                p300.dispense(AMPureMixVol / 2, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(AMPureMixVol / 2, rate=0.5)
                Mix += 1
            p300.blow_out(sample_plate_mag[X].top(z=1))
            p300.default_speed = 400
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

        if DRYRUN == 'NO':
            if samplecolumns == 1:
                protocol.delay(minutes=4.2)
            if samplecolumns == 2:
                protocol.delay(minutes=2.5)
            if samplecolumns == 3:
                protocol.delay(minutes=1)

            protocol.comment('MAGNET ENGAGE')
            mag_block.engage(height_from_base=8.5)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=7.5)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=7)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=6)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=5)
            protocol.delay(minutes=1)

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A1'
            p300.pick_up_tip()
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 20, rate=0.25)
            p300.default_speed = 5
            if X == 'A1':
                p300.move_to(A1_p300_bead_side)
            if X == 'A3':
                p300.move_to(A3_p300_bead_side)
            if X == 'A5':
                p300.move_to(A5_p300_bead_side)
            protocol.delay(minutes=0.1)
            p300.aspirate(20, rate=0.2)
            p300.move_to(sample_plate_mag[X].top(z=2))
            p300.default_speed = 400
            p300.dispense(200, Liquid_trash)
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A3'
            p300.pick_up_tip()
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 20, rate=0.25)
            p300.default_speed = 5
            if X == 'A1':
                p300.move_to(A1_p300_bead_side)
            if X == 'A3':
                p300.move_to(A3_p300_bead_side)
            if X == 'A5':
                p300.move_to(A5_p300_bead_side)
            protocol.delay(minutes=0.1)
            p300.aspirate(20, rate=0.2)
            p300.move_to(sample_plate_mag[X].top(z=2))
            p300.default_speed = 400
            p300.dispense(200, Liquid_trash)
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------  # noqa: E501
            X = 'A5'
            p300.pick_up_tip()
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 20, rate=0.25)
            p300.default_speed = 5
            if X == 'A1':
                p300.move_to(A1_p300_bead_side)
            if X == 'A3':
                p300.move_to(A3_p300_bead_side)
            if X == 'A5':
                p300.move_to(A5_p300_bead_side)
            protocol.delay(minutes=0.1)
            p300.aspirate(20, rate=0.2)
            p300.move_to(sample_plate_mag[X].top(z=2))
            p300.default_speed = 400
            p300.dispense(200, Liquid_trash)
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

        protocol.comment('--> Repeating 2 washes')
        washreps = 2
        for wash in range(washreps):
            protocol.comment('--> ETOH Wash #' + str(wash + 1))
            ETOHMaxVol = 150
            WASHNUM = 1
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------  # noqa: E501
                X = 'A1'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_1)
                p300.aspirate(ETOHMaxVol, EtOH_1.bottom(z=p300_offset_Res))
                if X == 'A1':
                    p300.move_to(A1_p300_bead_side)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_side)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_side)
                p300.dispense(ETOHMaxVol - 50, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(50, rate=0.5)
                p300.move_to(sample_plate_mag[X].top(z=2))
                p300.default_speed = 5
                p300.move_to(sample_plate_mag[X].top(z=-2))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.default_speed = 400
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------  # noqa: E501
                X = 'A3'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_2)
                p300.aspirate(ETOHMaxVol, EtOH_2.bottom(z=p300_offset_Res))
                if X == 'A1':
                    p300.move_to(A1_p300_bead_side)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_side)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_side)
                p300.dispense(ETOHMaxVol - 50, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(50, rate=0.5)
                p300.move_to(sample_plate_mag[X].top(z=2))
                p300.default_speed = 5
                p300.move_to(sample_plate_mag[X].top(z=-2))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.default_speed = 400
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------  # noqa: E501
                X = 'A5'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_3)
                p300.aspirate(ETOHMaxVol, EtOH_3.bottom(z=p300_offset_Res))
                if X == 'A1':
                    p300.move_to(A1_p300_bead_side)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_side)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_side)
                p300.dispense(ETOHMaxVol - 50, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(50, rate=0.5)
                p300.move_to(sample_plate_mag[X].top(z=2))
                p300.default_speed = 5
                p300.move_to(sample_plate_mag[X].top(z=-2))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.default_speed = 400
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

            protocol.delay(minutes=0.5)

            protocol.comment('--> Remove ETOH Wash #' + str(wash + 1))
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A1'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_1)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A1':
                    p300.move_to(A1_p300_bead_side)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_side)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A3'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_2)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A1':
                    p300.move_to(A1_p300_bead_side)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_side)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A5'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_3)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A1':
                    p300.move_to(A1_p300_bead_side)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_side)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            wash += 1

        if DRYRUN == 'NO':
            protocol.delay(minutes=2)

        protocol.comment('--> Removing Residual ETOH')
        if TIPREUSE == 'NO':
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A1'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(
                    20, rate=0.25)if NOMODULES == 'NO' else p20.aspirate(
                    10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A3'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(
                    20, rate=0.25)if NOMODULES == 'NO' else p20.aspirate(
                    10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A5'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(
                    20, rate=0.25)if NOMODULES == 'NO' else p20.aspirate(
                    10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A1'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_1)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 1))
                p300.aspirate(20, rate=0.25)
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A3'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_2)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 1))
                p300.aspirate(20, rate=0.25)
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A5'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_3)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 1))
                p300.aspirate(20, rate=0.25)
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

        if DRYRUN == 'NO':
            mag_block.engage(height_from_base=6)
            protocol.comment('AIR DRY')
            protocol.delay(minutes=0.5)

            protocol.comment('MAGNET DISENGAGE')
            mag_block.disengage()

        protocol.comment('--> Adding RSB')
        RSBVol = 25
        RSBMixRep = 5
        RSBMixVol = 25
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
            X = 'A1'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_1)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A1':
                p300.move_to(A1_p300_loc1)
            if X == 'A3':
                p300.move_to(A3_p300_loc1)
            if X == 'A5':
                p300.move_to(A5_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A1':
                p300.move_to(A1_p300_loc2)
            if X == 'A3':
                p300.move_to(A3_p300_loc2)
            if X == 'A5':
                p300.move_to(A5_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc3)
            if X == 'A3':
                p300.move_to(A3_p300_loc3)
            if X == 'A5':
                p300.move_to(A5_p300_loc3)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc2)
            if X == 'A3':
                p300.move_to(A3_p300_loc2)
            if X == 'A5':
                p300.move_to(A5_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc1)
            if X == 'A3':
                p300.move_to(A3_p300_loc1)
            if X == 'A5':
                p300.move_to(A5_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A1':
                    p300.move_to(A1_p300_bead_top)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_top)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_top)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A1':
                    p300.move_to(A1_p300_loc2)
                if X == 'A3':
                    p300.move_to(A3_p300_loc2)
                if X == 'A5':
                    p300.move_to(A5_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc1)
                if X == 'A3':
                    p300.move_to(A3_p300_loc1)
                if X == 'A5':
                    p300.move_to(A5_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc2)
                if X == 'A3':
                    p300.move_to(A3_p300_loc2)
                if X == 'A5':
                    p300.move_to(A5_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc3)
                if X == 'A3':
                    p300.move_to(A3_p300_loc3)
                if X == 'A5':
                    p300.move_to(A5_p300_loc3)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A3'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_2)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A1':
                p300.move_to(A1_p300_loc1)
            if X == 'A3':
                p300.move_to(A3_p300_loc1)
            if X == 'A5':
                p300.move_to(A5_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A1':
                p300.move_to(A1_p300_loc2)
            if X == 'A3':
                p300.move_to(A3_p300_loc2)
            if X == 'A5':
                p300.move_to(A5_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc3)
            if X == 'A3':
                p300.move_to(A3_p300_loc3)
            if X == 'A5':
                p300.move_to(A5_p300_loc3)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc2)
            if X == 'A3':
                p300.move_to(A3_p300_loc2)
            if X == 'A5':
                p300.move_to(A5_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc1)
            if X == 'A3':
                p300.move_to(A3_p300_loc1)
            if X == 'A5':
                p300.move_to(A5_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A1':
                    p300.move_to(A1_p300_bead_top)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_top)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_top)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A1':
                    p300.move_to(A1_p300_loc2)
                if X == 'A3':
                    p300.move_to(A3_p300_loc2)
                if X == 'A5':
                    p300.move_to(A5_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc1)
                if X == 'A3':
                    p300.move_to(A3_p300_loc1)
                if X == 'A5':
                    p300.move_to(A5_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc2)
                if X == 'A3':
                    p300.move_to(A3_p300_loc2)
                if X == 'A5':
                    p300.move_to(A5_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc3)
                if X == 'A3':
                    p300.move_to(A3_p300_loc3)
                if X == 'A5':
                    p300.move_to(A5_p300_loc3)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
            X = 'A5'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_3)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A1':
                p300.move_to(A1_p300_loc1)
            if X == 'A3':
                p300.move_to(A3_p300_loc1)
            if X == 'A5':
                p300.move_to(A5_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A1':
                p300.move_to(A1_p300_loc2)
            if X == 'A3':
                p300.move_to(A3_p300_loc2)
            if X == 'A5':
                p300.move_to(A5_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc3)
            if X == 'A3':
                p300.move_to(A3_p300_loc3)
            if X == 'A5':
                p300.move_to(A5_p300_loc3)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc2)
            if X == 'A3':
                p300.move_to(A3_p300_loc2)
            if X == 'A5':
                p300.move_to(A5_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A1':
                p300.move_to(A1_p300_loc1)
            if X == 'A3':
                p300.move_to(A3_p300_loc1)
            if X == 'A5':
                p300.move_to(A5_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A1':
                    p300.move_to(A1_p300_bead_top)
                if X == 'A3':
                    p300.move_to(A3_p300_bead_top)
                if X == 'A5':
                    p300.move_to(A5_p300_bead_top)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A1':
                    p300.move_to(A1_p300_loc2)
                if X == 'A3':
                    p300.move_to(A3_p300_loc2)
                if X == 'A5':
                    p300.move_to(A5_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc1)
                if X == 'A3':
                    p300.move_to(A3_p300_loc1)
                if X == 'A5':
                    p300.move_to(A5_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc2)
                if X == 'A3':
                    p300.move_to(A3_p300_loc2)
                if X == 'A5':
                    p300.move_to(A5_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A1':
                    p300.move_to(A1_p300_loc3)
                if X == 'A3':
                    p300.move_to(A3_p300_loc3)
                if X == 'A5':
                    p300.move_to(A5_p300_loc3)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()

        if DRYRUN == 'NO':
            protocol.comment('MAGNET ENGAGE')
            mag_block.engage(height_from_base=5)
            protocol.delay(minutes=4)

        protocol.comment('--> Transferring Supernatant')
        TransferSup = 20
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
            X = 'A1'
            Y = 'A7'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_1)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.aspirate(TransferSup, rate=0.25)
            p300.dispense(
                TransferSup + 5,
                sample_plate_mag[Y].bottom(
                    z=p300_offset_Mag))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A3'
            Y = 'A9'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_2)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.aspirate(TransferSup, rate=0.25)
            p300.dispense(
                TransferSup + 5,
                sample_plate_mag[Y].bottom(
                    z=p300_offset_Mag))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
            X = 'A5'
            Y = 'A11'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_3)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.aspirate(TransferSup, rate=0.25)
            p300.dispense(
                TransferSup + 5,
                sample_plate_mag[Y].bottom(
                    z=p300_offset_Mag))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()

        if DRYRUN == 'NO':
            protocol.comment('MAGNET DISENGAGE')
            mag_block.disengage()

    if STEP_PCR == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Amplification')
        protocol.comment('==============================================')

        protocol.comment('--> Adding Barcodes')
        PrimerVol = 5
        PrimerMixRep = 3
        PrimerMixVol = 10
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
            X = 'A7'
            p20.pick_up_tip()
            p20.aspirate(
                PrimerVol, Primer.bottom(
                    z=p20_offset_Temp), rate=0.25)
            p20.dispense(
                PrimerVol,
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p20_offset_Mag + 1))
            p20.mix(PrimerMixRep, PrimerMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A9'
            p20.pick_up_tip()
            p20.aspirate(
                PrimerVol, Primer.bottom(
                    z=p20_offset_Temp), rate=0.25)
            p20.dispense(
                PrimerVol,
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p20_offset_Mag + 1))
            p20.mix(PrimerMixRep, PrimerMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
            X = 'A11'
            p20.pick_up_tip()
            p20.aspirate(
                PrimerVol, Primer.bottom(
                    z=p20_offset_Temp), rate=0.25)
            p20.dispense(
                PrimerVol,
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p20_offset_Mag + 1))
            p20.mix(PrimerMixRep, PrimerMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()

        protocol.comment('--> Adding HotStart')
        if DRYRUN == 'NO':
            HotStartVol = 25
            HotStartMixRep = 10
            HotStartMixVol = 50
        if DRYRUN == 'YES':
            HotStartVol = 25
            HotStartMixRep = 1
            HotStartMixVol = 50
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
            X = 'A7'
            p300.pick_up_tip()
            p300.mix(
                2, HotStartVol, HotStart.bottom(
                    z=p300_offset_Temp), rate=0.5)
            p300.aspirate(
                HotStartVol, HotStart.bottom(
                    z=p300_offset_Temp), rate=0.25)
            p300.dispense(
                HotStartVol,
                sample_plate_mag[X].bottom(
                    z=p300_offset_Mag),
                rate=0.25)
            p300.mix(HotStartMixRep, HotStartMixVol, rate=0.5)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A9'
            p300.pick_up_tip()
            p300.mix(
                2, HotStartVol, HotStart.bottom(
                    z=p300_offset_Temp), rate=0.5)
            p300.aspirate(
                HotStartVol, HotStart.bottom(
                    z=p300_offset_Temp), rate=0.25)
            p300.dispense(
                HotStartVol,
                sample_plate_mag[X].bottom(
                    z=p300_offset_Mag),
                rate=0.25)
            p300.mix(HotStartMixRep, HotStartMixVol, rate=0.5)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
            X = 'A11'
            p300.pick_up_tip()
            p300.mix(
                2, HotStartVol, HotStart.bottom(
                    z=p300_offset_Temp), rate=0.5)
            p300.aspirate(
                HotStartVol, HotStart.bottom(
                    z=p300_offset_Temp), rate=0.25)
            p300.dispense(
                HotStartVol,
                sample_plate_mag[X].bottom(
                    z=p300_offset_Mag),
                rate=0.25)
            p300.mix(HotStartMixRep, HotStartMixVol, rate=0.5)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

    if STEP_PCRDECK == 1:
        if DRYRUN == 'NO':
            ###################################################################
            protocol.pause('Seal, Run PCR (60min)')

            thermocycler.close_lid()
            profile_PCR_1 = [
                {'temperature': 98, 'hold_time_seconds': 45}
            ]
            thermocycler.execute_profile(
                steps=profile_PCR_1, repetitions=1, block_max_volume=50)
            profile_PCR_2 = [
                {'temperature': 98, 'hold_time_seconds': 15},
                {'temperature': 60, 'hold_time_seconds': 30},
                {'temperature': 72, 'hold_time_seconds': 30}
            ]
            thermocycler.execute_profile(
                steps=profile_PCR_2, repetitions=4, block_max_volume=50)
            profile_PCR_3 = [
                {'temperature': 72, 'hold_time_minutes': 1}
            ]
            thermocycler.execute_profile(
                steps=profile_PCR_3, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(4)
            ###################################################################
            thermocycler.open_lid()
            protocol.pause("Remove Seal")
            protocol.pause("PLACE sample_plate_mag MAGNET")
    else:
        protocol.pause('Seal, Run PCR (60min)')

    Liquid_trash = reservoir['A11']

    if STEP_POSTPCR == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 2')
        protocol.comment('==============================================')

        protocol.comment('--> ADDING AMPure (0.8x)')
        if DRYRUN == 'NO':
            AMPureVol = 40
            AMPureMixRep = 50
            AMPureMixVol = 80
        if DRYRUN == 'YES':
            AMPureVol = 40
            AMPureMixRep = 5
            AMPureMixVol = 80
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
            X = 'A7'
            p300.pick_up_tip()
            p300.mix(10, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(
                AMPureVol, AMPure.bottom(
                    z=p300_offset_Res), rate=0.25)
            p300.dispense(
                AMPureVol, sample_plate_mag[X].bottom(
                    z=p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A9'
            p300.pick_up_tip()
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(
                AMPureVol, AMPure.bottom(
                    z=p300_offset_Res), rate=0.25)
            p300.dispense(
                AMPureVol, sample_plate_mag[X].bottom(
                    z=p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
            X = 'A11'
            p300.pick_up_tip()
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(
                AMPureVol, AMPure.bottom(
                    z=p300_offset_Res), rate=0.25)
            p300.dispense(
                AMPureVol, sample_plate_mag[X].bottom(
                    z=p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

        if DRYRUN == 'NO':
            protocol.delay(minutes=5)

            protocol.comment('MAGNET ENGAGE')
            mag_block.engage(height_from_base=8.5)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=7.5)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=7)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=6)
            protocol.delay(minutes=1)
            mag_block.engage(height_from_base=5)
            protocol.delay(minutes=1)

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 100
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
            X = 'A7'
            p300.pick_up_tip()
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 30, rate=0.25)
            p300.default_speed = 5
            if X == 'A7':
                p300.move_to(A7_p300_bead_side)
            if X == 'A9':
                p300.move_to(A9_p300_bead_side)
            if X == 'A11':
                p300.move_to(A11_p300_bead_side)
            protocol.delay(minutes=0.1)
            p300.aspirate(20, rate=0.2)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.aspirate(10, rate=0.1)
            p300.move_to(sample_plate_mag[X].top(z=2))
            p300.default_speed = 400
            p300.dispense(200, Liquid_trash)
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A9'
            p300.pick_up_tip()
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 30, rate=0.25)
            p300.default_speed = 5
            if X == 'A7':
                p300.move_to(A7_p300_bead_side)
            if X == 'A9':
                p300.move_to(A9_p300_bead_side)
            if X == 'A11':
                p300.move_to(A11_p300_bead_side)
            protocol.delay(minutes=0.1)
            p300.aspirate(20, rate=0.2)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.aspirate(10, rate=0.1)
            p300.move_to(sample_plate_mag[X].top(z=2))
            p300.default_speed = 400
            p300.dispense(200, Liquid_trash)
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
            X = 'A11'
            p300.pick_up_tip()
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 30, rate=0.25)
            p300.default_speed = 5
            if X == 'A7':
                p300.move_to(A7_p300_bead_side)
            if X == 'A9':
                p300.move_to(A9_p300_bead_side)
            if X == 'A11':
                p300.move_to(A11_p300_bead_side)
            protocol.delay(minutes=0.1)
            p300.aspirate(20, rate=0.2)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.aspirate(10, rate=0.1)
            p300.move_to(sample_plate_mag[X].top(z=2))
            p300.default_speed = 400
            p300.dispense(200, Liquid_trash)
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

        if TIPREUSE == 'NO':
            if all(STEPS):
                protocol.pause('RESET TIPS')
                p300.reset_tipracks()
                p20.reset_tipracks()

        protocol.comment('--> Repeating 2 washes')
        washreps = 2
        for wash in range(washreps):
            protocol.comment('--> ETOH Wash #' + str(wash + 1))
            ETOHMaxVol = 150
            WASHNUM = 2
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A7'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_1)
                p300.aspirate(ETOHMaxVol, EtOH_1.bottom(z=p300_offset_Res))
                if X == 'A7':
                    p300.move_to(A7_p300_bead_side)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_side)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_side)
                p300.dispense(ETOHMaxVol - 50, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(50, rate=0.5)
                p300.move_to(sample_plate_mag[X].top(z=2))
                p300.default_speed = 5
                p300.move_to(sample_plate_mag[X].top(z=-2))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.default_speed = 400
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A9'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_2)
                p300.aspirate(ETOHMaxVol, EtOH_2.bottom(z=p300_offset_Res))
                if X == 'A7':
                    p300.move_to(A7_p300_bead_side)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_side)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_side)
                p300.dispense(ETOHMaxVol - 50, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(50, rate=0.5)
                p300.move_to(sample_plate_mag[X].top(z=2))
                p300.default_speed = 5
                p300.move_to(sample_plate_mag[X].top(z=-2))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.default_speed = 400
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A11'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_3)
                p300.aspirate(ETOHMaxVol, EtOH_3.bottom(z=p300_offset_Res))
                if X == 'A7':
                    p300.move_to(A7_p300_bead_side)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_side)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_side)
                p300.dispense(ETOHMaxVol - 50, rate=0.5)
                p300.move_to(sample_plate_mag[X].center())
                p300.dispense(50, rate=0.5)
                p300.move_to(sample_plate_mag[X].top(z=2))
                p300.default_speed = 5
                p300.move_to(sample_plate_mag[X].top(z=-2))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.default_speed = 400
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

            protocol.delay(minutes=0.5)

            protocol.comment('--> Remove ETOH Wash #' + str(wash + 1))
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A7'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_1)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A7':
                    p300.move_to(A7_p300_bead_side)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_side)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A9'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_2)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A7':
                    p300.move_to(A7_p300_bead_side)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_side)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A11'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_3)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A7':
                    p300.move_to(A7_p300_bead_side)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_side)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

            wash += 1

        if DRYRUN == 'NO':
            protocol.delay(minutes=2)

        protocol.comment('--> Removing Residual ETOH')
        if TIPREUSE == 'NO':
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A7'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(
                    20, rate=0.25)if NOMODULES == 'NO' else p20.aspirate(
                    10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A9'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(
                    20, rate=0.25)if NOMODULES == 'NO' else p20.aspirate(
                    10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A11'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(
                    20, rate=0.25)if NOMODULES == 'NO' else p20.aspirate(
                    10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A7'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_1)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 1))
                p300.aspirate(20, rate=0.25)
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A9'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_2)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 1))
                p300.aspirate(20, rate=0.25)
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A11'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_3)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 1))
                p300.aspirate(20, rate=0.25)
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

        if DRYRUN == 'NO':
            mag_block.engage(height_from_base=6)
            protocol.comment('AIR DRY')
            protocol.delay(minutes=0.5)

            protocol.comment('MAGNET DISENGAGE')
            mag_block.disengage()

        protocol.comment('--> Adding RSB')
        RSBVol = 32
        RSBMixRep = 5
        RSBMixVol = 25
        if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
            X = 'A7'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_1)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A7':
                p300.move_to(A7_p300_loc1)
            if X == 'A9':
                p300.move_to(A9_p300_loc1)
            if X == 'A11':
                p300.move_to(A11_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A7':
                p300.move_to(A7_p300_loc2)
            if X == 'A9':
                p300.move_to(A9_p300_loc2)
            if X == 'A11':
                p300.move_to(A11_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc3)
            if X == 'A9':
                p300.move_to(A9_p300_loc3)
            if X == 'A11':
                p300.move_to(A11_p300_loc3)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc2)
            if X == 'A9':
                p300.move_to(A9_p300_loc2)
            if X == 'A11':
                p300.move_to(A11_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc1)
            if X == 'A9':
                p300.move_to(A9_p300_loc1)
            if X == 'A11':
                p300.move_to(A11_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A7':
                    p300.move_to(A7_p300_bead_top)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_top)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_top)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A7':
                    p300.move_to(A7_p300_loc2)
                if X == 'A9':
                    p300.move_to(A9_p300_loc2)
                if X == 'A11':
                    p300.move_to(A11_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc1)
                if X == 'A9':
                    p300.move_to(A9_p300_loc1)
                if X == 'A11':
                    p300.move_to(A11_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc2)
                if X == 'A9':
                    p300.move_to(A9_p300_loc2)
                if X == 'A11':
                    p300.move_to(A11_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc3)
                if X == 'A9':
                    p300.move_to(A9_p300_loc3)
                if X == 'A11':
                    p300.move_to(A11_p300_loc3)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
            X = 'A9'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_2)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A7':
                p300.move_to(A7_p300_loc1)
            if X == 'A9':
                p300.move_to(A9_p300_loc1)
            if X == 'A11':
                p300.move_to(A11_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A7':
                p300.move_to(A7_p300_loc2)
            if X == 'A9':
                p300.move_to(A9_p300_loc2)
            if X == 'A11':
                p300.move_to(A11_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc3)
            if X == 'A9':
                p300.move_to(A9_p300_loc3)
            if X == 'A11':
                p300.move_to(A11_p300_loc3)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc2)
            if X == 'A9':
                p300.move_to(A9_p300_loc2)
            if X == 'A11':
                p300.move_to(A11_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc1)
            if X == 'A9':
                p300.move_to(A9_p300_loc1)
            if X == 'A11':
                p300.move_to(A11_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A7':
                    p300.move_to(A7_p300_bead_top)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_top)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_top)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A7':
                    p300.move_to(A7_p300_loc2)
                if X == 'A9':
                    p300.move_to(A9_p300_loc2)
                if X == 'A11':
                    p300.move_to(A11_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc1)
                if X == 'A9':
                    p300.move_to(A9_p300_loc1)
                if X == 'A11':
                    p300.move_to(A11_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc2)
                if X == 'A9':
                    p300.move_to(A9_p300_loc2)
                if X == 'A11':
                    p300.move_to(A11_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc3)
                if X == 'A9':
                    p300.move_to(A9_p300_loc3)
                if X == 'A11':
                    p300.move_to(A11_p300_loc3)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
            X = 'A11'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_3)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A7':
                p300.move_to(A7_p300_loc1)
            if X == 'A9':
                p300.move_to(A9_p300_loc1)
            if X == 'A11':
                p300.move_to(A11_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A7':
                p300.move_to(A7_p300_loc2)
            if X == 'A9':
                p300.move_to(A9_p300_loc2)
            if X == 'A11':
                p300.move_to(A11_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc3)
            if X == 'A9':
                p300.move_to(A9_p300_loc3)
            if X == 'A11':
                p300.move_to(A11_p300_loc3)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc2)
            if X == 'A9':
                p300.move_to(A9_p300_loc2)
            if X == 'A11':
                p300.move_to(A11_p300_loc2)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A7':
                p300.move_to(A7_p300_loc1)
            if X == 'A9':
                p300.move_to(A9_p300_loc1)
            if X == 'A11':
                p300.move_to(A11_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A7':
                    p300.move_to(A7_p300_bead_top)
                if X == 'A9':
                    p300.move_to(A9_p300_bead_top)
                if X == 'A11':
                    p300.move_to(A11_p300_bead_top)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A7':
                    p300.move_to(A7_p300_loc2)
                if X == 'A9':
                    p300.move_to(A9_p300_loc2)
                if X == 'A11':
                    p300.move_to(A11_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc1)
                if X == 'A9':
                    p300.move_to(A9_p300_loc1)
                if X == 'A11':
                    p300.move_to(A11_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc2)
                if X == 'A9':
                    p300.move_to(A9_p300_loc2)
                if X == 'A11':
                    p300.move_to(A11_p300_loc2)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A7':
                    p300.move_to(A7_p300_loc3)
                if X == 'A9':
                    p300.move_to(A9_p300_loc3)
                if X == 'A11':
                    p300.move_to(A11_p300_loc3)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(
                sample_plate_mag.wells_by_name()[X].bottom(
                    z=p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()

        if DRYRUN == 'NO':
            protocol.delay(minutes=2)

            protocol.comment('MAGNET ENGAGE')
            mag_block.engage(height_from_base=5)

            protocol.delay(minutes=4)

        protocol.comment('--> Transferring Supernatant')

        if NOMODULES == 'NO':
            TransferSup = 30
        else:
            TransferSup = 20

        if TIPREUSE == 'NO':
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A7'
                Y = 'A8'
                p20.pick_up_tip()
                p20.aspirate(
                    TransferSup / 2,
                    sample_plate_mag[X].bottom(
                        z=p20_offset_Mag),
                    rate=0.25)
                p20.dispense(
                    TransferSup / 2,
                    sample_plate_mag[Y].bottom(
                        z=p20_offset_Mag))
                p20.aspirate(
                    TransferSup / 2,
                    sample_plate_mag[X].bottom(
                        z=p20_offset_Mag),
                    rate=0.25)
                p20.dispense(
                    TransferSup / 2 + 5,
                    sample_plate_mag[Y].bottom(
                        z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A9'
                Y = 'A10'
                p20.pick_up_tip()
                p20.aspirate(
                    TransferSup / 2,
                    sample_plate_mag[X].bottom(
                        z=p20_offset_Mag),
                    rate=0.25)
                p20.dispense(
                    TransferSup / 2,
                    sample_plate_mag[Y].bottom(
                        z=p20_offset_Mag))
                p20.aspirate(
                    TransferSup / 2,
                    sample_plate_mag[X].bottom(
                        z=p20_offset_Mag),
                    rate=0.25)
                p20.dispense(
                    TransferSup / 2 + 5,
                    sample_plate_mag[Y].bottom(
                        z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A11'
                Y = 'A12'
                p20.pick_up_tip()
                p20.aspirate(
                    TransferSup / 2,
                    sample_plate_mag[X].bottom(
                        z=p20_offset_Mag),
                    rate=0.25)
                p20.dispense(
                    TransferSup / 2,
                    sample_plate_mag[Y].bottom(
                        z=p20_offset_Mag))
                p20.aspirate(
                    TransferSup / 2,
                    sample_plate_mag[X].bottom(
                        z=p20_offset_Mag),
                    rate=0.25)
                p20.dispense(
                    TransferSup / 2 + 5,
                    sample_plate_mag[Y].bottom(
                        z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:  # -----------------------------------------------------------------------------------------
                X = 'A7'
                Y = 'A8'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_1)
                p300.aspirate(
                    TransferSup, sample_plate_mag[X].bottom(
                        z=p300_offset_Mag), rate=0.25)
                p300.dispense(
                    TransferSup + 5,
                    sample_plate_mag[Y].bottom(
                        z=p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:  # -----------------------------------------------------------------------------------------
                X = 'A9'
                Y = 'A10'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_2)
                p300.aspirate(
                    TransferSup, sample_plate_mag[X].bottom(
                        z=p300_offset_Mag), rate=0.25)
                p300.dispense(
                    TransferSup + 5,
                    sample_plate_mag[Y].bottom(
                        z=p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:  # -----------------------------------------------------------------------------------------
                X = 'A11'
                Y = 'A12'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_3)
                p300.aspirate(
                    TransferSup, sample_plate_mag[X].bottom(
                        z=p300_offset_Mag), rate=0.25)
                p300.dispense(
                    TransferSup + 5,
                    sample_plate_mag[Y].bottom(
                        z=p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()

        if DRYRUN == 'NO':
            protocol.comment('MAGNET DISENGAGE')
            mag_block.disengage()
