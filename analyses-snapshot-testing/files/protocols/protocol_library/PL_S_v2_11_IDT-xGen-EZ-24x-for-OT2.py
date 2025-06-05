def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "SAMPLES", "type": "dropDown", "label": "Number of Samples", "options": [{"label": "8", "value": "8x"}, {"label": "16", "value": "16x"}, {"label": "24", "value": "24x"}]}, {"name": "FRAGTIME", "type": "int", "label": "Fragmentation Time (minutes)", "default": 30}, {"name": "PCRCYCLES", "type": "int", "label": "PCR Cycles", "default": 4}, {"name": "DRYRUN", "type": "dropDown", "label": "Dry Run", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "NOMODULES", "type": "dropDown", "label": "Use Modules?", "options": [{"label": "Yes", "value": "NO"}, {"label": "NO", "value": "YES"}]}, {"name": "TIPREUSE", "type": "dropDown", "label": "Reuse Tips?", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "OFFSET", "type": "dropDown", "label": "Use protocol specific z-offsets?", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "STEP_FRERAT", "type": "dropDown", "label": "Include Fragmentation / End-Repair / A-Tailing Step?", "options": [{"label": "Yes", "value": "1"}, {"label": "No", "value": "0"}]}, {"name": "STEP_FRERATDECK", "type": "dropDown", "label": "If yes, Fragmentation / End-Repair / A-Tailing on deck or off deck?", "options": [{"label": "On Deck", "value": "1"}, {"label": "Off Deck", "value": "0"}]}, {"name": "STEP_LIG", "type": "dropDown", "label": "Include Ligation Step?", "options": [{"label": "Yes", "value": "1"}, {"label": "No", "value": "0"}]}, {"name": "STEP_LIGDECK", "type": "dropDown", "label": "If yes, ligation Step on or off deck?", "options": [{"label": "On deck", "value": "1"}, {"label": "Off deck", "value": "0"}]}, {"name": "STEP_POSTLIG", "type": "dropDown", "label": "Include Post Ligation Step?", "options": [{"label": "Yes", "value": "1"}, {"label": "No", "value": "0"}]}, {"name": "STEP_PCR", "type": "dropDown", "label": "Include PCR Step?", "options": [{"label": "Yes", "value": "1"}, {"label": "No", "value": "0"}]}, {"name": "STEP_PCRDECK", "type": "dropDown", "label": "If yes, PCR step on or off deck?", "options": [{"label": "On Deck", "value": "1"}, {"label": "Off Deck", "value": "0"}]}, {"name": "STEP_POSTPCR1", "type": "dropDown", "label": "Include First Post PCR Step?", "options": [{"label": "Yes", "value": "1"}, {"label": "No", "value": "0"}]}, {"name": "STEP_POSTPCR2", "type": "dropDown", "label": "Include Second Post PCR Step?", "options": [{"label": "Yes", "value": "1"}, {"label": "No", "value": "0"}]}, {"name": "p20_mount", "type": "dropDown", "label": "P20 Multi-Channel Mount", "options": [{"label": "Right", "value": "right"}, {"label": "Left", "value": "left"}]}, {"name": "p300_mount", "type": "dropDown", "label": "P300 Multi-Channel Mount", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}]""")
    return [_all_values[n] for n in names]


from opentrons import protocol_api
from opentrons import types
import inspect
metadata = {'protocolName': 'IDT xGEN EZ', 'author':
    'Opentrons <protocols@opentrons.com>', 'source': 'Protocol Library',
    'apiLevel': '2.11'}


def right(s, amount):
    if s == None:
        return None
    elif amount == None:
        return None
    s = str(s)
    if amount > len(s):
        return s
    elif amount == 0:
        return ''
    else:
        return s[-amount:]


def run(protocol: protocol_api.ProtocolContext):
    [SAMPLES, FRAGTIME, PCRCYCLES, DRYRUN, NOMODULES, TIPREUSE, OFFSET,
        STEP_FRERAT, STEP_FRERATDECK, STEP_LIG, STEP_LIGDECK, STEP_POSTLIG,
        STEP_PCR, STEP_PCRDECK, STEP_POSTPCR1, STEP_POSTPCR2, p20_mount,
        p300_mount] = get_values('SAMPLES', 'FRAGTIME', 'PCRCYCLES',
        'DRYRUN', 'NOMODULES', 'TIPREUSE', 'OFFSET', 'STEP_FRERAT',
        'STEP_FRERATDECK', 'STEP_LIG', 'STEP_LIGDECK', 'STEP_POSTLIG',
        'STEP_PCR', 'STEP_PCRDECK', 'STEP_POSTPCR1', 'STEP_POSTPCR2',
        'p20_mount', 'p300_mount')
    STEPS = {int(STEP_FRERAT), int(STEP_LIG), int(STEP_POSTLIG), int(
        STEP_PCR), int(STEP_POSTPCR1), int(STEP_POSTPCR2)}
    STEP_FRERATDECK = int(STEP_FRERATDECK)
    STEP_LIGDECK = int(STEP_LIGDECK)
    STEP_PCRDECK = int(STEP_PCRDECK)
    if DRYRUN == 'YES':
        protocol.comment('THIS IS A DRY RUN')
    else:
        protocol.comment('THIS IS A REACTION RUN')
    if all(STEPS) == True:
        if TIPREUSE == 'YES':
            TIPREUSE = 'YES'
            protocol.comment('TIP REUSING')
    else:
        TIPREUSE = 'NO'
        protocol.comment('NO TIP REUSING')
    if NOMODULES == 'YES':
        protocol.comment('THIS IS A NO MODULE RUN')
        sample_plate_mag = protocol.load_labware(
            'nest_96_wellplate_100ul_pcr_full_skirt', '1')
        if TIPREUSE == 'NO':
            reservoir = protocol.load_labware('nest_12_reservoir_15ml', '2')
        else:
            reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep', '2'
                )
        reagent_plate = protocol.load_labware(
            'opentrons_96_aluminumblock_biorad_wellplate_200ul', '3')
        tiprack_20 = protocol.load_labware('opentrons_96_filtertiprack_20ul',
            '4')
        tiprack_200_1 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '5')
        tiprack_200_2 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '6')
        sample_plate_thermo = protocol.load_labware(
            'nest_96_wellplate_100ul_pcr_full_skirt', '7')
        tiprack_200_3 = protocol.load_labware(
            'opentrons_96_filtertiprack_200ul', '9')
    else:
        protocol.comment('THIS IS A MODULE RUN')
        mag_block = protocol.load_module('magnetic module gen2', '1')
        sample_plate_mag = mag_block.load_labware(
            'nest_96_wellplate_100ul_pcr_full_skirt')
        if TIPREUSE == 'NO':
            reservoir = protocol.load_labware('nest_12_reservoir_15ml', '2')
        else:
            reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep', '2'
                )
        temp_block = protocol.load_module('temperature module gen2', '3')
        reagent_plate = temp_block.load_labware(
            'opentrons_96_aluminumblock_biorad_wellplate_200ul')
        tiprack_20 = protocol.load_labware('opentrons_96_filtertiprack_20ul',
            '4')
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
        protocol.comment('THIS PROTOCOL WILL REUSE TIPS FOR WASHES')
    FRERAT = reagent_plate.wells_by_name()['A1']
    LIG = reagent_plate.wells_by_name()['A2']
    PCR = reagent_plate.wells_by_name()['A4']
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
    if NOMODULES == 'NO':
        p300 = protocol.load_instrument('p300_multi_gen2', p300_mount,
            tip_racks=[tiprack_200_1, tiprack_200_2, tiprack_200_3])
        p20 = protocol.load_instrument('p20_multi_gen2', p20_mount,
            tip_racks=[tiprack_20])
    else:
        p300 = protocol.load_instrument('p300_multi', p300_mount, tip_racks
            =[tiprack_200_1, tiprack_200_2, tiprack_200_3])
        p20 = protocol.load_instrument('p10_multi', p20_mount, tip_racks=[
            tiprack_20])
    src_file_path = inspect.getfile(lambda : None)
    protocol.comment(src_file_path)
    if SAMPLES == '8x':
        protocol.comment('There are 8 Samples')
        samplecolumns = 1
    elif SAMPLES == '16x':
        protocol.comment('There are 16 Samples')
        samplecolumns = 2
    elif SAMPLES == '24x':
        protocol.comment('There are 24 Samples')
        samplecolumns = 3
    else:
        protocol.pause('ERROR?')
    if OFFSET == 'YES':
        if TIPREUSE == 'NO':
            p300_offset_Res = 2
        else:
            p300_offset_Res = 2
        p300_offset_Thermo = 1
        p300_offset_Mag = 0.7
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
    A1_p20_bead_side = sample_plate_thermo['A1'].center().move(types.Point(
        x=-1.8 * 0.5, y=0, z=p20_offset_Thermo - 5))
    A1_p20_bead_top = sample_plate_thermo['A1'].center().move(types.Point(x
        =1.5, y=0, z=p20_offset_Thermo + 2))
    A1_p20_bead_mid = sample_plate_thermo['A1'].center().move(types.Point(x
        =1, y=0, z=p20_offset_Thermo - 2))
    A1_p300_bead_side = sample_plate_thermo['A1'].center().move(types.Point
        (x=-0.5, y=0, z=p300_offset_Thermo - 7.2))
    A1_p300_bead_top = sample_plate_thermo['A1'].center().move(types.Point(
        x=1.3, y=0, z=p300_offset_Thermo - 1))
    A1_p300_bead_mid = sample_plate_thermo['A1'].center().move(types.Point(
        x=0.8, y=0, z=p300_offset_Thermo - 4))
    A1_p300_loc1 = sample_plate_thermo['A1'].center().move(types.Point(x=
        1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Thermo - 4))
    A1_p300_loc2 = sample_plate_thermo['A1'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Thermo - 4))
    A1_p300_loc3 = sample_plate_thermo['A1'].center().move(types.Point(x=
        1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Thermo - 4))
    A3_p20_bead_side = sample_plate_thermo['A3'].center().move(types.Point(
        x=-1.8 * 0.5, y=0, z=p20_offset_Thermo - 5))
    A3_p20_bead_top = sample_plate_thermo['A3'].center().move(types.Point(x
        =1.5, y=0, z=p20_offset_Thermo + 2))
    A3_p20_bead_mid = sample_plate_thermo['A3'].center().move(types.Point(x
        =1, y=0, z=p20_offset_Thermo - 2))
    A3_p300_bead_side = sample_plate_thermo['A3'].center().move(types.Point
        (x=-0.5, y=0, z=p300_offset_Thermo - 7.2))
    A3_p300_bead_top = sample_plate_thermo['A3'].center().move(types.Point(
        x=1.3, y=0, z=p300_offset_Thermo - 1))
    A3_p300_bead_mid = sample_plate_thermo['A3'].center().move(types.Point(
        x=0.8, y=0, z=p300_offset_Thermo - 4))
    A3_p300_loc1 = sample_plate_thermo['A3'].center().move(types.Point(x=
        1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Thermo - 4))
    A3_p300_loc2 = sample_plate_thermo['A3'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Thermo - 4))
    A3_p300_loc3 = sample_plate_thermo['A3'].center().move(types.Point(x=
        1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Thermo - 4))
    A5_p20_bead_side = sample_plate_thermo['A5'].center().move(types.Point(
        x=-1.8 * 0.5, y=0, z=p20_offset_Thermo - 5))
    A5_p20_bead_top = sample_plate_thermo['A5'].center().move(types.Point(x
        =1.5, y=0, z=p20_offset_Thermo + 2))
    A5_p20_bead_mid = sample_plate_thermo['A5'].center().move(types.Point(x
        =1, y=0, z=p20_offset_Thermo - 2))
    A5_p300_bead_side = sample_plate_thermo['A5'].center().move(types.Point
        (x=-0.5, y=0, z=p300_offset_Thermo - 7.2))
    A5_p300_bead_top = sample_plate_thermo['A5'].center().move(types.Point(
        x=1.3, y=0, z=p300_offset_Thermo - 1))
    A5_p300_bead_mid = sample_plate_thermo['A5'].center().move(types.Point(
        x=0.8, y=0, z=p300_offset_Thermo - 4))
    A5_p300_loc1 = sample_plate_thermo['A5'].center().move(types.Point(x=
        1.3 * 0.8, y=1.3 * 0.8, z=p300_offset_Thermo - 4))
    A5_p300_loc2 = sample_plate_thermo['A5'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Thermo - 4))
    A5_p300_loc3 = sample_plate_thermo['A5'].center().move(types.Point(x=
        1.3 * 0.8, y=-1.3 * 0.8, z=p300_offset_Thermo - 4))
    bypass = protocol.deck.position_for('11').move(types.Point(x=70, y=80,
        z=130))
    if DRYRUN == 'NO':
        protocol.comment('SETTING THERMO and TEMP BLOCK Temperature')
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(100)
        temp_block.set_temperature(4)
        thermocycler.open_lid()
        protocol.pause('Ready')
    if STEP_FRERAT == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Fragmenting / End Repair / A-Tailing')
        protocol.comment('==============================================')
        protocol.comment('--> Adding FRERAT')
        if DRYRUN == 'NO':
            FRERATVol = 10.5
            FRERATMixRep = 10
            FRERATMixVol = 20
        if DRYRUN == 'YES':
            FRERATVol = 10
            FRERATMixRep = 1
            FRERATMixVol = 10
        if samplecolumns >= 1:
            X = 'A1'
            p20.pick_up_tip()
            p20.aspirate(FRERATVol, FRERAT.bottom(z=p20_offset_Temp))
            p20.dispense(FRERATVol, sample_plate_thermo.wells_by_name()[X].
                bottom(z=p20_offset_Thermo))
            p20.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p20.mix(FRERATMixRep, FRERATMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 2:
            X = 'A3'
            p20.pick_up_tip()
            p20.aspirate(FRERATVol, FRERAT.bottom(z=p20_offset_Temp))
            p20.dispense(FRERATVol, sample_plate_thermo.wells_by_name()[X].
                bottom(z=p20_offset_Thermo))
            p20.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p20.mix(FRERATMixRep, FRERATMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 3:
            X = 'A5'
            p20.pick_up_tip()
            p20.aspirate(FRERATVol, FRERAT.bottom(z=p20_offset_Temp))
            p20.dispense(FRERATVol, sample_plate_thermo.wells_by_name()[X].
                bottom(z=p20_offset_Thermo))
            p20.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p20.mix(FRERATMixRep, FRERATMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
    if STEP_FRERATDECK == 1:
        if DRYRUN == 'NO':
            protocol.pause('Seal, Run FRERAT (60min)')
            thermocycler.close_lid()
            profile_FRERAT = [{'temperature': 32, 'hold_time_minutes':
                FRAGTIME}, {'temperature': 65, 'hold_time_minutes': 30}]
            thermocycler.execute_profile(steps=profile_FRERAT, repetitions=
                1, block_max_volume=50)
            thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
            protocol.pause('Remove Seal')
    else:
        protocol.pause('Seal, Run FRERAT (~60min)')
    if STEP_LIG == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Adapter Ligation')
        protocol.comment('==============================================')
        protocol.comment('--> Adding Lig')
        if DRYRUN == 'NO':
            LIGVol = 30
            LIGMixRep = 50
            LIGMixVol = 55
        if DRYRUN == 'YES':
            LIGVol = 30
            LIGMixRep = 1
            LIGMixVol = 55
        if samplecolumns >= 1:
            X = 'A1'
            p300.pick_up_tip()
            p300.mix(3, LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.5)
            p300.aspirate(LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.2)
            p300.default_speed = 5
            p300.move_to(LIG.top(z=p300_offset_Temp + 5))
            protocol.delay(seconds=0.2)
            p300.default_speed = 400
            p300.dispense(LIGVol, sample_plate_thermo[X].bottom(z=
                p300_offset_Thermo), rate=0.25)
            p300.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p300.mix(LIGMixRep, LIGMixVol, rate=0.5)
            p300.blow_out(sample_plate_thermo[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:
            X = 'A3'
            p300.pick_up_tip()
            p300.mix(3, LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.5)
            p300.aspirate(LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.2)
            p300.default_speed = 5
            p300.move_to(LIG.top(z=p300_offset_Temp + 5))
            protocol.delay(seconds=0.2)
            p300.default_speed = 400
            p300.dispense(LIGVol, sample_plate_thermo[X].bottom(z=
                p300_offset_Thermo), rate=0.25)
            p300.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p300.mix(LIGMixRep, LIGMixVol, rate=0.5)
            p300.blow_out(sample_plate_thermo[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:
            X = 'A5'
            p300.pick_up_tip()
            p300.mix(3, LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.5)
            p300.aspirate(LIGVol, LIG.bottom(z=p300_offset_Temp + 1), rate=0.2)
            p300.default_speed = 5
            p300.move_to(LIG.top(z=p300_offset_Temp + 5))
            protocol.delay(seconds=0.2)
            p300.default_speed = 400
            p300.dispense(LIGVol, sample_plate_thermo[X].bottom(z=
                p300_offset_Thermo), rate=0.25)
            p300.move_to(sample_plate_thermo[X].bottom(z=p300_offset_Thermo))
            p300.mix(LIGMixRep, LIGMixVol, rate=0.5)
            p300.blow_out(sample_plate_thermo[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
    if STEP_LIGDECK == 1:
        if DRYRUN == 'NO':
            protocol.pause('Seal, Run LIG (15min)')
            profile_LIG = [{'temperature': 20, 'hold_time_minutes': 20}]
            thermocycler.execute_profile(steps=profile_LIG, repetitions=1,
                block_max_volume=50)
            thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
            protocol.pause('Remove Seal')
    else:
        protocol.pause('Seal, Run LIG (20min)')
    A1_p20_bead_side = sample_plate_mag['A1'].center().move(types.Point(x=-
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A1_p20_bead_top = sample_plate_mag['A1'].center().move(types.Point(x=
        1.5, y=0, z=p20_offset_Mag + 2))
    A1_p20_bead_mid = sample_plate_mag['A1'].center().move(types.Point(x=1,
        y=0, z=p20_offset_Mag - 2))
    A1_p300_bead_side = sample_plate_mag['A1'].center().move(types.Point(x=
        -0.5, y=0, z=p300_offset_Mag - 7.2))
    A1_p300_bead_top = sample_plate_mag['A1'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Mag - 1))
    A1_p300_bead_mid = sample_plate_mag['A1'].center().move(types.Point(x=
        0.8, y=0, z=p300_offset_Mag - 4))
    A1_p300_loc1 = sample_plate_mag['A1'].center().move(types.Point(x=1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))
    A1_p300_loc2 = sample_plate_mag['A1'].center().move(types.Point(x=1.3,
        y=0, z=p300_offset_Mag - 4))
    A1_p300_loc3 = sample_plate_mag['A1'].center().move(types.Point(x=1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))
    A1_p20_loc1 = sample_plate_mag['A1'].center().move(types.Point(x=1.3 * 
        0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))
    A1_p20_loc2 = sample_plate_mag['A1'].center().move(types.Point(x=1.3, y
        =0, z=p20_offset_Mag - 7))
    A1_p20_loc3 = sample_plate_mag['A1'].center().move(types.Point(x=1.3 * 
        0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))
    A3_p20_bead_side = sample_plate_mag['A3'].center().move(types.Point(x=-
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A3_p20_bead_top = sample_plate_mag['A3'].center().move(types.Point(x=
        1.5, y=0, z=p20_offset_Mag + 2))
    A3_p20_bead_mid = sample_plate_mag['A3'].center().move(types.Point(x=1,
        y=0, z=p20_offset_Mag - 2))
    A3_p300_bead_side = sample_plate_mag['A3'].center().move(types.Point(x=
        -0.5, y=0, z=p300_offset_Mag - 7.2))
    A3_p300_bead_top = sample_plate_mag['A3'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Mag - 1))
    A3_p300_bead_mid = sample_plate_mag['A3'].center().move(types.Point(x=
        0.8, y=0, z=p300_offset_Mag - 4))
    A3_p300_loc1 = sample_plate_mag['A3'].center().move(types.Point(x=1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))
    A3_p300_loc2 = sample_plate_mag['A3'].center().move(types.Point(x=1.3,
        y=0, z=p300_offset_Mag - 4))
    A3_p300_loc3 = sample_plate_mag['A3'].center().move(types.Point(x=1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))
    A3_p20_loc1 = sample_plate_mag['A3'].center().move(types.Point(x=1.3 * 
        0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))
    A3_p20_loc2 = sample_plate_mag['A3'].center().move(types.Point(x=1.3, y
        =0, z=p20_offset_Mag - 7))
    A3_p20_loc3 = sample_plate_mag['A3'].center().move(types.Point(x=1.3 * 
        0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))
    A5_p20_bead_side = sample_plate_mag['A5'].center().move(types.Point(x=-
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A5_p20_bead_top = sample_plate_mag['A5'].center().move(types.Point(x=
        1.5, y=0, z=p20_offset_Mag + 2))
    A5_p20_bead_mid = sample_plate_mag['A5'].center().move(types.Point(x=1,
        y=0, z=p20_offset_Mag - 2))
    A5_p300_bead_side = sample_plate_mag['A5'].center().move(types.Point(x=
        -0.5, y=0, z=p300_offset_Mag - 7.2))
    A5_p300_bead_top = sample_plate_mag['A5'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Mag - 1))
    A5_p300_bead_mid = sample_plate_mag['A5'].center().move(types.Point(x=
        0.8, y=0, z=p300_offset_Mag - 4))
    A5_p300_loc1 = sample_plate_mag['A5'].center().move(types.Point(x=1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))
    A5_p300_loc2 = sample_plate_mag['A5'].center().move(types.Point(x=1.3,
        y=0, z=p300_offset_Mag - 4))
    A5_p300_loc3 = sample_plate_mag['A5'].center().move(types.Point(x=1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))
    A5_p20_loc1 = sample_plate_mag['A5'].center().move(types.Point(x=1.3 * 
        0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))
    A5_p20_loc2 = sample_plate_mag['A5'].center().move(types.Point(x=1.3, y
        =0, z=p20_offset_Mag - 7))
    A5_p20_loc3 = sample_plate_mag['A5'].center().move(types.Point(x=1.3 * 
        0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))
    A7_p20_bead_side = sample_plate_mag['A7'].center().move(types.Point(x=-
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A7_p20_bead_top = sample_plate_mag['A7'].center().move(types.Point(x=
        1.5, y=0, z=p20_offset_Mag + 2))
    A7_p20_bead_mid = sample_plate_mag['A7'].center().move(types.Point(x=1,
        y=0, z=p20_offset_Mag - 2))
    A7_p300_bead_side = sample_plate_mag['A7'].center().move(types.Point(x=
        -0.5, y=0, z=p300_offset_Mag - 7.2))
    A7_p300_bead_top = sample_plate_mag['A7'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Mag - 1))
    A7_p300_bead_mid = sample_plate_mag['A7'].center().move(types.Point(x=
        0.8, y=0, z=p300_offset_Mag - 4))
    A7_p300_loc1 = sample_plate_mag['A7'].center().move(types.Point(x=1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 5.5))
    A7_p300_loc2 = sample_plate_mag['A7'].center().move(types.Point(x=1.3,
        y=0, z=p300_offset_Mag - 5.5))
    A7_p300_loc3 = sample_plate_mag['A7'].center().move(types.Point(x=1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 5.5))
    A9_p20_bead_side = sample_plate_mag['A9'].center().move(types.Point(x=-
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A9_p20_bead_top = sample_plate_mag['A9'].center().move(types.Point(x=
        1.5, y=0, z=p20_offset_Mag + 2))
    A9_p20_bead_mid = sample_plate_mag['A9'].center().move(types.Point(x=1,
        y=0, z=p20_offset_Mag - 2))
    A9_p300_bead_side = sample_plate_mag['A9'].center().move(types.Point(x=
        -0.5, y=0, z=p300_offset_Mag - 7.2))
    A9_p300_bead_top = sample_plate_mag['A9'].center().move(types.Point(x=
        1.3, y=0, z=p300_offset_Mag - 1))
    A9_p300_bead_mid = sample_plate_mag['A9'].center().move(types.Point(x=
        0.8, y=0, z=p300_offset_Mag - 4))
    A9_p300_loc1 = sample_plate_mag['A9'].center().move(types.Point(x=1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 5.5))
    A9_p300_loc2 = sample_plate_mag['A9'].center().move(types.Point(x=1.3,
        y=0, z=p300_offset_Mag - 5.5))
    A9_p300_loc3 = sample_plate_mag['A9'].center().move(types.Point(x=1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 5.5))
    A11_p20_bead_side = sample_plate_mag['A11'].center().move(types.Point(x
        =-1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A11_p20_bead_top = sample_plate_mag['A11'].center().move(types.Point(x=
        1.5, y=0, z=p20_offset_Mag + 2))
    A11_p20_bead_mid = sample_plate_mag['A11'].center().move(types.Point(x=
        1, y=0, z=p20_offset_Mag - 2))
    A11_p300_bead_side = sample_plate_mag['A11'].center().move(types.Point(
        x=-0.5, y=0, z=p300_offset_Mag - 7.2))
    A11_p300_bead_top = sample_plate_mag['A11'].center().move(types.Point(x
        =1.3, y=0, z=p300_offset_Mag - 1))
    A11_p300_bead_mid = sample_plate_mag['A11'].center().move(types.Point(x
        =0.8, y=0, z=p300_offset_Mag - 4))
    A11_p300_loc1 = sample_plate_mag['A11'].center().move(types.Point(x=1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 5.5))
    A11_p300_loc2 = sample_plate_mag['A11'].center().move(types.Point(x=1.3,
        y=0, z=p300_offset_Mag - 5.5))
    A11_p300_loc3 = sample_plate_mag['A11'].center().move(types.Point(x=1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 5.5))
    if STEP_POSTLIG == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 1')
        protocol.comment('==============================================')
        if DRYRUN == 'NO':
            protocol.pause('PLACE sample_plate_mag MAGNET')
        protocol.comment('--> ADDING AMPure (0.8x)')
        WASHNUM = 1
        if DRYRUN == 'NO':
            AMPureVol = 48
            AMPureMixRep = 50
            AMPureMixVol = 90
        if DRYRUN == 'YES':
            AMPureVol = 48
            AMPureMixRep = 5
            AMPureMixVol = 90
        if samplecolumns >= 1:
            X = 'A1'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_1)
            p300.mix(10, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol / 2, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.default_speed = 5
            p300.dispense(AMPureVol / 2, sample_plate_mag[X].center(), rate
                =0.25)
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
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A3'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_2)
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol / 2, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.default_speed = 5
            p300.dispense(AMPureVol / 2, sample_plate_mag[X].center(), rate
                =0.25)
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
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A5'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_3)
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol / 2, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.default_speed = 5
            p300.dispense(AMPureVol / 2, sample_plate_mag[X].center(), rate
                =0.25)
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
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
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
        if samplecolumns >= 1:
            X = 'A1'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_1)
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
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A3'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_2)
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
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A5'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_3)
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
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        protocol.comment('--> Repeating 2 washes')
        washreps = 2
        for wash in range(washreps):
            protocol.comment('--> ETOH Wash #' + str(wash + 1))
            ETOHMaxVol = 150
            WASHNUM = 1
            if samplecolumns >= 1:
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
            if samplecolumns >= 2:
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
            if samplecolumns >= 3:
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
            if samplecolumns >= 1:
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
            if samplecolumns >= 2:
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
            if samplecolumns >= 3:
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
            if samplecolumns >= 1:
                X = 'A1'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:
                X = 'A3'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:
                X = 'A5'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:
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
            if samplecolumns >= 2:
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
            if samplecolumns >= 3:
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
        WASHNUM = 1
        RSBVol = 21
        RSBMixRep = 5
        RSBMixVol = 20
        if samplecolumns >= 1:
            X = 'A1'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_1)
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
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A3'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_2)
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
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A5'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_3)
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
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
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
        if samplecolumns >= 1:
            X = 'A1'
            Y = 'A7'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_1)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.aspirate(TransferSup, rate=0.25)
            p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z=
                p300_offset_Mag))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A3'
            Y = 'A9'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_2)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.aspirate(TransferSup, rate=0.25)
            p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z=
                p300_offset_Mag))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A5'
            Y = 'A11'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_3)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.aspirate(TransferSup, rate=0.25)
            p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z=
                p300_offset_Mag))
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
        if samplecolumns >= 1:
            X = 'A7'
            p20.pick_up_tip()
            p20.aspirate(PrimerVol, Barcodes1.bottom(z=p20_offset_Temp),
                rate=0.25)
            p20.dispense(PrimerVol, sample_plate_mag.wells_by_name()[X].
                bottom(z=p20_offset_Mag + 1))
            p20.mix(PrimerMixRep, PrimerMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 2:
            X = 'A9'
            p20.pick_up_tip()
            p20.aspirate(PrimerVol, Barcodes2.bottom(z=p20_offset_Temp),
                rate=0.25)
            p20.dispense(PrimerVol, sample_plate_mag.wells_by_name()[X].
                bottom(z=p20_offset_Mag + 1))
            p20.mix(PrimerMixRep, PrimerMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if samplecolumns >= 3:
            X = 'A11'
            p20.pick_up_tip()
            p20.aspirate(PrimerVol, Barcodes3.bottom(z=p20_offset_Temp),
                rate=0.25)
            p20.dispense(PrimerVol, sample_plate_mag.wells_by_name()[X].
                bottom(z=p20_offset_Mag + 1))
            p20.mix(PrimerMixRep, PrimerMixVol)
            p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        protocol.comment('--> Adding PCR')
        if DRYRUN == 'NO':
            PCRVol = 25
            PCRMixRep = 10
            PCRMixVol = 50
        if DRYRUN == 'YES':
            PCRVol = 25
            PCRMixRep = 1
            PCRMixVol = 50
        if samplecolumns >= 1:
            X = 'A7'
            p300.pick_up_tip()
            p300.mix(2, PCRVol, PCR.bottom(z=p300_offset_Temp), rate=0.5)
            p300.aspirate(PCRVol, PCR.bottom(z=p300_offset_Temp), rate=0.25)
            p300.dispense(PCRVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.mix(PCRMixRep, PCRMixVol, rate=0.5)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 2:
            X = 'A9'
            p300.pick_up_tip()
            p300.mix(2, PCRVol, PCR.bottom(z=p300_offset_Temp), rate=0.5)
            p300.aspirate(PCRVol, PCR.bottom(z=p300_offset_Temp), rate=0.25)
            p300.dispense(PCRVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.mix(PCRMixRep, PCRMixVol, rate=0.5)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if samplecolumns >= 3:
            X = 'A11'
            p300.pick_up_tip()
            p300.mix(2, PCRVol, PCR.bottom(z=p300_offset_Temp), rate=0.5)
            p300.aspirate(PCRVol, PCR.bottom(z=p300_offset_Temp), rate=0.25)
            p300.dispense(PCRVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.mix(PCRMixRep, PCRMixVol, rate=0.5)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            protocol.delay(minutes=0.1)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
    if STEP_PCRDECK == 1:
        if DRYRUN == 'NO':
            protocol.pause('Seal, Run PCR (~30min)')
            thermocycler.close_lid()
            profile_PCR_1 = [{'temperature': 98, 'hold_time_seconds': 45}]
            thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1,
                block_max_volume=50)
            profile_PCR_2 = [{'temperature': 98, 'hold_time_seconds': 15},
                {'temperature': 60, 'hold_time_seconds': 30}, {
                'temperature': 72, 'hold_time_seconds': 30}]
            thermocycler.execute_profile(steps=profile_PCR_2, repetitions=
                PCRCYCLES, block_max_volume=50)
            profile_PCR_3 = [{'temperature': 72, 'hold_time_minutes': 1}]
            thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1,
                block_max_volume=50)
            thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
            protocol.pause('Remove Seal')
            protocol.pause('PLACE sample_plate_mag MAGNET')
    else:
        protocol.pause('Seal, Run PCR (~30min)')
    Liquid_trash = reservoir['A11']
    if STEP_POSTPCR1 == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 2')
        protocol.comment('==============================================')
        protocol.comment('--> ADDING AMPure (0.65x)')
        WASHNUM = 2
        if DRYRUN == 'NO':
            AMPureVol = 32.5
            AMPureMixRep = 50
            AMPureMixVol = 80
        if DRYRUN == 'YES':
            AMPureVol = 32.5
            AMPureMixRep = 5
            AMPureMixVol = 80
        if samplecolumns >= 1:
            X = 'A7'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_1)
            p300.mix(10, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A9'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_2)
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A11'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_3)
            p300.mix(10, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
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
        if samplecolumns >= 1:
            X = 'A7'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_1)
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
        if samplecolumns >= 2:
            X = 'A9'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_2)
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
        if samplecolumns >= 3:
            X = 'A11'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_3)
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
        if samplecolumns == 3:
            protocol.pause('RESET TIPS')
            p300.reset_tipracks()
        protocol.comment('--> Repeating 2 washes')
        washreps = 2
        for wash in range(washreps):
            protocol.comment('--> ETOH Wash #' + str(wash + 1))
            ETOHMaxVol = 150
            WASHNUM = 2
            if samplecolumns >= 1:
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
            if samplecolumns >= 2:
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
            if samplecolumns >= 3:
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
            if samplecolumns >= 1:
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
            if samplecolumns >= 2:
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
            if samplecolumns >= 3:
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
            if samplecolumns >= 1:
                X = 'A7'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:
                X = 'A9'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:
                X = 'A11'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:
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
            if samplecolumns >= 2:
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
            if samplecolumns >= 3:
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
        WASHNUM = 2
        RSBVol = 25
        RSBMixRep = 5
        RSBMixVol = 20
        if samplecolumns >= 1:
            X = 'A7'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_1)
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
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A9'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_2)
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
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A11'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_3)
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
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
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
        if samplecolumns == 3:
            protocol.pause('RESET TIPS')
            p20.reset_tipracks()
        protocol.comment('--> Transferring Supernatant')
        if NOMODULES == 'NO':
            TransferSup = 20
        else:
            TransferSup = 20
        if TIPREUSE == 'NO':
            if samplecolumns >= 1:
                X = 'A7'
                Y = 'A2'
                p20.pick_up_tip()
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2, sample_plate_mag[Y].bottom(z=
                    p20_offset_Mag))
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2 + 5, sample_plate_mag[Y].
                    bottom(z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:
                X = 'A9'
                Y = 'A4'
                p20.pick_up_tip()
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2, sample_plate_mag[Y].bottom(z=
                    p20_offset_Mag))
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2 + 5, sample_plate_mag[Y].
                    bottom(z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:
                X = 'A11'
                Y = 'A6'
                p20.pick_up_tip()
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2, sample_plate_mag[Y].bottom(z=
                    p20_offset_Mag))
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2 + 5, sample_plate_mag[Y].
                    bottom(z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:
                X = 'A7'
                Y = 'A2'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_1)
                elif WASHNUM == 3:
                    p300.pick_up_tip(W3_ResusTrans_1)
                p300.aspirate(TransferSup, sample_plate_mag[X].bottom(z=
                    p300_offset_Mag), rate=0.25)
                p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z
                    =p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:
                X = 'A9'
                Y = 'A4'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_2)
                elif WASHNUM == 3:
                    p300.pick_up_tip(W3_ResusTrans_2)
                p300.aspirate(TransferSup, sample_plate_mag[X].bottom(z=
                    p300_offset_Mag), rate=0.25)
                p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z
                    =p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:
                X = 'A11'
                Y = 'A6'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_3)
                elif WASHNUM == 3:
                    p300.pick_up_tip(W3_ResusTrans_3)
                p300.aspirate(TransferSup, sample_plate_mag[X].bottom(z=
                    p300_offset_Mag), rate=0.25)
                p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z
                    =p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if DRYRUN == 'NO':
            protocol.comment('MAGNET DISENGAGE')
            mag_block.disengage()
    A2_p20_bead_side = sample_plate_mag['A2'].center().move(types.Point(x=
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A2_p20_bead_top = sample_plate_mag['A2'].center().move(types.Point(x=-
        1.5, y=0, z=p20_offset_Mag + 2))
    A2_p20_bead_mid = sample_plate_mag['A2'].center().move(types.Point(x=-1,
        y=0, z=p20_offset_Mag - 2))
    A2_p300_bead_side = sample_plate_mag['A2'].center().move(types.Point(x=
        0.5, y=0, z=p300_offset_Mag - 7.2))
    A2_p300_bead_top = sample_plate_mag['A2'].center().move(types.Point(x=-
        1.3, y=0, z=p300_offset_Mag - 1))
    A2_p300_bead_mid = sample_plate_mag['A2'].center().move(types.Point(x=-
        0.8, y=0, z=p300_offset_Mag - 4))
    A2_p300_loc1 = sample_plate_mag['A2'].center().move(types.Point(x=-1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))
    A2_p300_loc2 = sample_plate_mag['A2'].center().move(types.Point(x=-1.3,
        y=0, z=p300_offset_Mag - 4))
    A2_p300_loc3 = sample_plate_mag['A2'].center().move(types.Point(x=-1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))
    A2_p20_loc1 = sample_plate_mag['A2'].center().move(types.Point(x=-1.3 *
        0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))
    A2_p20_loc2 = sample_plate_mag['A2'].center().move(types.Point(x=-1.3,
        y=0, z=p20_offset_Mag - 7))
    A2_p20_loc3 = sample_plate_mag['A2'].center().move(types.Point(x=-1.3 *
        0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))
    A4_p20_bead_side = sample_plate_mag['A4'].center().move(types.Point(x=
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A4_p20_bead_top = sample_plate_mag['A4'].center().move(types.Point(x=-
        1.5, y=0, z=p20_offset_Mag + 2))
    A4_p20_bead_mid = sample_plate_mag['A4'].center().move(types.Point(x=-1,
        y=0, z=p20_offset_Mag - 2))
    A4_p300_bead_side = sample_plate_mag['A4'].center().move(types.Point(x=
        0.5, y=0, z=p300_offset_Mag - 7.2))
    A4_p300_bead_top = sample_plate_mag['A4'].center().move(types.Point(x=-
        1.3, y=0, z=p300_offset_Mag - 1))
    A4_p300_bead_mid = sample_plate_mag['A4'].center().move(types.Point(x=-
        0.8, y=0, z=p300_offset_Mag - 4))
    A4_p300_loc1 = sample_plate_mag['A4'].center().move(types.Point(x=-1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))
    A4_p300_loc2 = sample_plate_mag['A4'].center().move(types.Point(x=-1.3,
        y=0, z=p300_offset_Mag - 4))
    A4_p300_loc3 = sample_plate_mag['A4'].center().move(types.Point(x=-1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))
    A4_p20_loc1 = sample_plate_mag['A4'].center().move(types.Point(x=-1.3 *
        0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))
    A4_p20_loc2 = sample_plate_mag['A4'].center().move(types.Point(x=-1.3,
        y=0, z=p20_offset_Mag - 7))
    A4_p20_loc3 = sample_plate_mag['A4'].center().move(types.Point(x=-1.3 *
        0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))
    A6_p20_bead_side = sample_plate_mag['A6'].center().move(types.Point(x=
        1.8 * 0.5, y=0, z=p20_offset_Mag - 5))
    A6_p20_bead_top = sample_plate_mag['A6'].center().move(types.Point(x=-
        1.5, y=0, z=p20_offset_Mag + 2))
    A6_p20_bead_mid = sample_plate_mag['A6'].center().move(types.Point(x=-1,
        y=0, z=p20_offset_Mag - 2))
    A6_p300_bead_side = sample_plate_mag['A6'].center().move(types.Point(x=
        0.5, y=0, z=p300_offset_Mag - 7.2))
    A6_p300_bead_top = sample_plate_mag['A6'].center().move(types.Point(x=-
        1.3, y=0, z=p300_offset_Mag - 1))
    A6_p300_bead_mid = sample_plate_mag['A6'].center().move(types.Point(x=-
        0.8, y=0, z=p300_offset_Mag - 4))
    A6_p300_loc1 = sample_plate_mag['A6'].center().move(types.Point(x=-1.3 *
        0.8, y=1.3 * 0.8, z=p300_offset_Mag - 4))
    A6_p300_loc2 = sample_plate_mag['A6'].center().move(types.Point(x=-1.3,
        y=0, z=p300_offset_Mag - 4))
    A6_p300_loc3 = sample_plate_mag['A6'].center().move(types.Point(x=-1.3 *
        0.8, y=-1.3 * 0.8, z=p300_offset_Mag - 4))
    A6_p20_loc1 = sample_plate_mag['A6'].center().move(types.Point(x=-1.3 *
        0.8, y=1.3 * 0.8, z=p20_offset_Mag - 7))
    A6_p20_loc2 = sample_plate_mag['A6'].center().move(types.Point(x=-1.3,
        y=0, z=p20_offset_Mag - 7))
    A6_p20_loc3 = sample_plate_mag['A6'].center().move(types.Point(x=-1.3 *
        0.8, y=-1.3 * 0.8, z=p20_offset_Mag - 7))
    if STEP_POSTPCR2 == 1:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 3')
        protocol.comment('==============================================')
        protocol.comment('--> ADDING AMPure (1.2x)')
        WASHNUM = 3
        if DRYRUN == 'NO':
            AMPureVol = 24
            AMPureMixRep = 50
            AMPureMixVol = 42
        if DRYRUN == 'YES':
            AMPureVol = 24
            AMPureMixRep = 5
            AMPureMixVol = 42
        if samplecolumns >= 1:
            X = 'A2'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_1)
            p300.mix(10, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A4'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_2)
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A6'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_3)
            p300.mix(3, AMPureVol + 10, AMPure.bottom(z=p300_offset_Res))
            p300.aspirate(AMPureVol, AMPure.bottom(z=p300_offset_Res), rate
                =0.25)
            p300.dispense(AMPureVol, sample_plate_mag[X].bottom(z=
                p300_offset_Mag), rate=0.25)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
            p300.mix(AMPureMixRep, AMPureMixVol)
            p300.blow_out(sample_plate_mag[X].top(z=-5))
            p300.move_to(bypass)
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
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
        if samplecolumns == 2:
            protocol.pause('RESET TIPS')
            p300.reset_tipracks()
        protocol.comment('--> Removing Supernatant')
        RemoveSup = 100
        if samplecolumns >= 1:
            X = 'A2'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_1)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 30, rate=0.25)
            p300.default_speed = 5
            if X == 'A2':
                p300.move_to(A2_p300_bead_side)
            if X == 'A4':
                p300.move_to(A4_p300_bead_side)
            if X == 'A6':
                p300.move_to(A6_p300_bead_side)
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
        if samplecolumns >= 2:
            X = 'A4'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_2)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 30, rate=0.25)
            p300.default_speed = 5
            if X == 'A2':
                p300.move_to(A2_p300_bead_side)
            if X == 'A4':
                p300.move_to(A4_p300_bead_side)
            if X == 'A6':
                p300.move_to(A6_p300_bead_side)
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
        if samplecolumns >= 3:
            X = 'A6'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_AMPure_Bind_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_AMPure_Bind_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_AMPure_Bind_3)
            p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
            p300.aspirate(RemoveSup - 30, rate=0.25)
            p300.default_speed = 5
            if X == 'A2':
                p300.move_to(A2_p300_bead_side)
            if X == 'A4':
                p300.move_to(A4_p300_bead_side)
            if X == 'A6':
                p300.move_to(A6_p300_bead_side)
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
        protocol.comment('--> Repeating 2 washes')
        washreps = 2
        for wash in range(washreps):
            protocol.comment('--> ETOH Wash #' + str(wash + 1))
            ETOHMaxVol = 150
            WASHNUM = 2
            if samplecolumns >= 1:
                X = 'A2'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_1)
                p300.aspirate(ETOHMaxVol, EtOH_1.bottom(z=p300_offset_Res))
                if X == 'A2':
                    p300.move_to(A2_p300_bead_side)
                if X == 'A4':
                    p300.move_to(A4_p300_bead_side)
                if X == 'A6':
                    p300.move_to(A6_p300_bead_side)
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
            if samplecolumns >= 2:
                X = 'A4'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_2)
                p300.aspirate(ETOHMaxVol, EtOH_2.bottom(z=p300_offset_Res))
                if X == 'A2':
                    p300.move_to(A2_p300_bead_side)
                if X == 'A4':
                    p300.move_to(A4_p300_bead_side)
                if X == 'A6':
                    p300.move_to(A6_p300_bead_side)
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
            if samplecolumns >= 3:
                X = 'A6'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_washtip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_washtip_3)
                p300.aspirate(ETOHMaxVol, EtOH_2.bottom(z=p300_offset_Res))
                if X == 'A2':
                    p300.move_to(A2_p300_bead_side)
                if X == 'A4':
                    p300.move_to(A4_p300_bead_side)
                if X == 'A6':
                    p300.move_to(A6_p300_bead_side)
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
            if samplecolumns >= 1:
                X = 'A2'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_1)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A2':
                    p300.move_to(A2_p300_bead_side)
                if X == 'A4':
                    p300.move_to(A4_p300_bead_side)
                if X == 'A6':
                    p300.move_to(A6_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:
                X = 'A4'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_2)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A2':
                    p300.move_to(A2_p300_bead_side)
                if X == 'A4':
                    p300.move_to(A4_p300_bead_side)
                if X == 'A6':
                    p300.move_to(A6_p300_bead_side)
                protocol.delay(minutes=0.1)
                p300.aspirate(200 - ETOHMaxVol, rate=0.25)
                p300.default_speed = 400
                p300.dispense(200, Liquid_trash)
                p300.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p300.blow_out()
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:
                X = 'A6'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ETOH_removetip_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ETOH_removetip_3)
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag + 4))
                p300.aspirate(ETOHMaxVol, rate=0.25)
                p300.default_speed = 5
                if X == 'A2':
                    p300.move_to(A2_p300_bead_side)
                if X == 'A4':
                    p300.move_to(A4_p300_bead_side)
                if X == 'A6':
                    p300.move_to(A6_p300_bead_side)
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
            if samplecolumns >= 1:
                X = 'A2'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:
                X = 'A4'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:
                X = 'A6'
                p20.pick_up_tip()
                p20.move_to(sample_plate_mag[X].bottom(z=p20_offset_Mag + 1))
                p20.aspirate(20, rate=0.25
                    ) if NOMODULES == 'NO' else p20.aspirate(10, rate=0.25)
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:
                X = 'A2'
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
            if samplecolumns >= 2:
                X = 'A4'
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
            if samplecolumns >= 3:
                X = 'A6'
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
        WASHNUM = 3
        RSBVol = 22
        RSBMixRep = 5
        RSBMixVol = 20
        if samplecolumns >= 1:
            X = 'A2'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_1)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_1)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_1)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 2:
            X = 'A4'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_2)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_2)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_2)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
            p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].top())
            protocol.delay(seconds=0.5)
            p300.move_to(sample_plate_mag.wells_by_name()[X].center())
            p300.default_speed = 400
            if TIPREUSE == 'NO':
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            else:
                p300.return_tip()
        if samplecolumns >= 3:
            X = 'A6'
            if TIPREUSE == 'NO':
                p300.pick_up_tip()
            elif WASHNUM == 1:
                p300.pick_up_tip(W1_ResusTrans_3)
            elif WASHNUM == 2:
                p300.pick_up_tip(W2_ResusTrans_3)
            elif WASHNUM == 3:
                p300.pick_up_tip(W3_ResusTrans_3)
            p300.aspirate(RSBVol, RSB.bottom(p300_offset_Res))
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            p300.default_speed = 5
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            if X == 'A2':
                p300.move_to(A2_p300_loc1)
            if X == 'A4':
                p300.move_to(A4_p300_loc1)
            if X == 'A6':
                p300.move_to(A6_p300_loc1)
            p300.dispense(RSBVol / 5, rate=0.75)
            reps = 5
            for x in range(reps):
                p300.move_to(sample_plate_mag[X].bottom(z=p300_offset_Mag))
                p300.aspirate(RSBVol, rate=0.5)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.dispense(RSBVol, rate=1)
            reps = 3
            for x in range(reps):
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
                if X == 'A2':
                    p300.move_to(A2_p300_loc1)
                if X == 'A4':
                    p300.move_to(A4_p300_loc1)
                if X == 'A6':
                    p300.move_to(A6_p300_loc1)
                p300.mix(RSBMixRep, RSBMixVol)
            p300.move_to(sample_plate_mag.wells_by_name()[X].bottom(z=
                p300_offset_Mag))
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
        if samplecolumns == 2:
            protocol.pause('RESET TIPS')
            p20.reset_tipracks()
        protocol.comment('--> Transferring Supernatant')
        if NOMODULES == 'NO':
            TransferSup = 20
        else:
            TransferSup = 20
        if TIPREUSE == 'NO':
            if samplecolumns >= 1:
                X = 'A2'
                Y = 'A8'
                p20.pick_up_tip()
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2, sample_plate_mag[Y].bottom(z=
                    p20_offset_Mag))
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2 + 5, sample_plate_mag[Y].
                    bottom(z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 2:
                X = 'A4'
                Y = 'A10'
                p20.pick_up_tip()
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2, sample_plate_mag[Y].bottom(z=
                    p20_offset_Mag))
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2 + 5, sample_plate_mag[Y].
                    bottom(z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
            if samplecolumns >= 3:
                X = 'A6'
                Y = 'A12'
                p20.pick_up_tip()
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2, sample_plate_mag[Y].bottom(z=
                    p20_offset_Mag))
                p20.aspirate(TransferSup / 2, sample_plate_mag[X].bottom(z=
                    p20_offset_Mag), rate=0.25)
                p20.dispense(TransferSup / 2 + 5, sample_plate_mag[Y].
                    bottom(z=p20_offset_Mag))
                p20.move_to(bypass)
                p20.drop_tip() if DRYRUN == 'NO' else p20.return_tip()
        if TIPREUSE == 'YES':
            if samplecolumns >= 1:
                X = 'A2'
                Y = 'A8'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_1)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_1)
                elif WASHNUM == 3:
                    p300.pick_up_tip(W3_ResusTrans_1)
                p300.aspirate(TransferSup, sample_plate_mag[X].bottom(z=
                    p300_offset_Mag), rate=0.25)
                p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z
                    =p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 2:
                X = 'A4'
                Y = 'A10'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_2)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_2)
                elif WASHNUM == 3:
                    p300.pick_up_tip(W3_ResusTrans_2)
                p300.aspirate(TransferSup, sample_plate_mag[X].bottom(z=
                    p300_offset_Mag), rate=0.25)
                p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z
                    =p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
            if samplecolumns >= 3:
                X = 'A6'
                Y = 'A12'
                if TIPREUSE == 'NO':
                    p300.pick_up_tip()
                elif WASHNUM == 1:
                    p300.pick_up_tip(W1_ResusTrans_3)
                elif WASHNUM == 2:
                    p300.pick_up_tip(W2_ResusTrans_3)
                elif WASHNUM == 3:
                    p300.pick_up_tip(W3_ResusTrans_3)
                p300.aspirate(TransferSup, sample_plate_mag[X].bottom(z=
                    p300_offset_Mag), rate=0.25)
                p300.dispense(TransferSup + 5, sample_plate_mag[Y].bottom(z
                    =p300_offset_Mag))
                p300.move_to(bypass)
                p300.drop_tip() if DRYRUN == 'NO' else p300.return_tip()
        if DRYRUN == 'NO':
            protocol.comment('MAGNET DISENGAGE')
            mag_block.disengage()
