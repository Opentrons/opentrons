def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "sample_quant_csv", "type": "textFile", "label": ".CSV File", "default": "Sample_Plate, Sample_well,Target_well\\nsample_plate,A1,A12"}, {"name": "SAMPLES", "type": "dropDown", "label": "Number of Samples", "options": [{"label": "8", "value": "8x"}, {"label": "16", "value": "16x"}, {"label": "24", "value": "24x"}]}, {"name": "DRYRUN", "type": "dropDown", "label": "Dry Run", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "NOMODULES", "type": "dropDown", "label": "Use Modules?", "options": [{"label": "Yes, use modules", "value": "NO"}, {"label": "No, do not use modules", "value": "YES"}]}, {"name": "OFFSET", "type": "dropDown", "label": "Use protocol specific z-offsets?", "options": [{"label": "Yes", "value": "YES"}, {"label": "No", "value": "NO"}]}, {"name": "NGSMAG", "type": "dropDown", "label": "Use NGS Magnetic Block?", "options": [{"label": "Yes, use mag block", "value": "YES"}, {"label": "No, do not use", "value": "NO"}]}, {"name": "p20S_mount", "type": "dropDown", "label": "P20 Single-Channel Mount", "options": [{"label": "Right", "value": "right"}, {"label": "Left", "value": "left"}]}, {"name": "p20M_mount", "type": "dropDown", "label": "P20 Multi-Channel Mount", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}]""")
    return [_all_values[n] for n in names]


def get_values(*names):
    import json
    _all_values = json.loads("""{"sample_quant_csv":"Sample_Plate, Sample_well,Target_well\\nsample_plate,A1,A12","SAMPLES":"8x","DRYRUN":"YES","NOMODULES":"NO","OFFSET":"YES","NGSMAG":"YES","p20S_mount":"right","p20M_mount":"left"}""")
    return [_all_values[n] for n in names]


# flake8: noqa

from opentrons import protocol_api

from opentrons import types

import inspect

metadata = {
    'protocolName': 'IDT Normalase',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.9'
    }

def right(s, amount):
    if s == None:
        return None
    elif amount == None:
        return None
    s = str(s)
    if amount > len(s):
        return s
    elif amount == 0:
        return ""
    else:
        return s[-amount:]


# PROTOCOL BLOCKS
STEP_NORM1          = 1
STEP_NORM1DECK      = 1
STEP_POOL           = 1
STEP_NORM2          = 1
STEP_NORM2DECK      = 1
STEP_NORMINACT      = 1
STEP_NORMINACTDECK  = 1

STEPS = {STEP_NORM1,STEP_NORM1DECK,STEP_POOL,STEP_NORM2,STEP_NORMINACT}

def run(protocol: protocol_api.ProtocolContext):

    [sample_quant_csv, SAMPLES, DRYRUN, NOMODULES, OFFSET, NGSMAG,
      p20S_mount,
     p20M_mount] = get_values(  # noqa: F821
        "sample_quant_csv", "SAMPLES","DRYRUN", "NOMODULES",
        "OFFSET", "NGSMAG",
         "p20S_mount", "p20M_mount")

    if DRYRUN == 'YES':
        protocol.comment("THIS IS A DRY RUN")
    else:
        protocol.comment("THIS IS A REACTION RUN")

    # DECK SETUP AND LABWARE
    protocol.comment("THIS IS A MODULE RUN")
    if NGSMAG == 'YES':
        mag_block           = protocol.load_module('magnetic module gen2','1')
        norm_plate_deck        = mag_block.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')
    else:
        norm_plate_deck     = protocol.load_labware('nest_96_wellplate_100ul_pcr_full_skirt','1')
    temp_block          = protocol.load_module('temperature module gen2', '3')
    reagent_tubes       = temp_block.load_labware('opentrons_96_aluminumblock_biorad_wellplate_200ul')
    tiprack_20M         = protocol.load_labware('opentrons_96_filtertiprack_20ul',  '4')
    tiprack_20S         = protocol.load_labware('opentrons_96_filtertiprack_20ul',  '5')
    thermocycler        = protocol.load_module('thermocycler module')
    norm_plate_thermo   = thermocycler.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')

    # reagent - plate
    NORM1               = reagent_tubes.wells_by_name()['A1']
    NORM2               = reagent_tubes.wells_by_name()['A2']
    NORMINACT           = reagent_tubes.wells_by_name()['B2']

    # pipette
    p20M     = protocol.load_instrument('p20_multi_gen2', p20M_mount, tip_racks=[tiprack_20M])
    p20S     = protocol.load_instrument('p20_single_gen2', p20S_mount, tip_racks=[tiprack_20S])

    #samples
    src_file_path = inspect.getfile(lambda: None)
    protocol.comment(src_file_path)

    #tip and sample tracking
    if SAMPLES == '8x':
        protocol.comment("There are 8 Samples")
        samplecolumns    = 1
    elif SAMPLES == '16x':
        protocol.comment("There are 16 Samples")
        samplecolumns    = 2
    elif SAMPLES == '24x':
        protocol.comment("There are 24 Samples")
        samplecolumns    = 3
    else:
        protocol.pause("ERROR?")

    data = [r.split(',') for r in sample_quant_csv.strip().splitlines() if r][1:]

    # offset
    if OFFSET == 'YES':
        p300_offset_Res     = 2
        p300_offset_Thermo  = 1
        p300_offset_Deck    = 0.3
        if NGSMAG == 'YES':
            p300_offset_Mag = 0.70
        else:
            p300_offset_Mag = p300_offset_Deck

        p300_offset_Temp    = 0.65
        p300_offset_Tube    = 0
        p20_offset_Res      = 2
        p20_offset_Thermo   = 1
        p20_offset_Mag      = 0.75
        p20_offset_Deck     = 0.3
        p20_offset_Temp     = 0.85
        p20_offset_Tube     = 0
    else:
        p300_offset_Res     = 0
        p300_offset_Thermo  = 0
        p300_offset_Mag     = 0
        p300_offset_Deck    = 0
        p300_offset_Temp    = 0
        p300_offset_Tube    = 0
        p20_offset_Res      = 0
        p20_offset_Thermo   = 0
        p20_offset_Mag      = 0
        p20_offset_Deck     = 0
        p20_offset_Temp     = 0
        p20_offset_Tube     = 0

    # positions
    ############################################################################################################################################
    #  norm_plate_thermo on the Thermocycler
    A1_p20_bead_side  = norm_plate_thermo['A1'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Thermo-5))                #Beads to the Right
    A1_p20_bead_top   = norm_plate_thermo['A1'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Thermo+2))                #Beads to the Right
    A1_p20_bead_mid   = norm_plate_thermo['A1'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Thermo-2))                #Beads to the Right
    A1_p300_bead_side = norm_plate_thermo['A1'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Thermo-7.2))             #Beads to the Right
    A1_p300_bead_top  = norm_plate_thermo['A1'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Thermo-1))               #Beads to the Right
    A1_p300_bead_mid  = norm_plate_thermo['A1'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Thermo-4))               #Beads to the Right
    A1_p300_loc1      = norm_plate_thermo['A1'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Thermo-4))               #Beads to the Right
    A1_p300_loc2      = norm_plate_thermo['A1'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Thermo-4))               #Beads to the Right
    A1_p300_loc3      = norm_plate_thermo['A1'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Thermo-4))               #Beads to the Right
    A3_p20_bead_side  = norm_plate_thermo['A3'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Thermo-5))                #Beads to the Right
    A3_p20_bead_top   = norm_plate_thermo['A3'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Thermo+2))                #Beads to the Right
    A3_p20_bead_mid   = norm_plate_thermo['A3'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Thermo-2))                #Beads to the Right
    A3_p300_bead_side = norm_plate_thermo['A3'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Thermo-7.2))             #Beads to the Right
    A3_p300_bead_top  = norm_plate_thermo['A3'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Thermo-1))               #Beads to the Right
    A3_p300_bead_mid  = norm_plate_thermo['A3'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Thermo-4))               #Beads to the Right
    A3_p300_loc1      = norm_plate_thermo['A3'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Thermo-4))               #Beads to the Right
    A3_p300_loc2      = norm_plate_thermo['A3'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Thermo-4))               #Beads to the Right
    A3_p300_loc3      = norm_plate_thermo['A3'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Thermo-4))               #Beads to the Right
    A5_p20_bead_side  = norm_plate_thermo['A5'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Thermo-5))                #Beads to the Right
    A5_p20_bead_top   = norm_plate_thermo['A5'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Thermo+2))                #Beads to the Right
    A5_p20_bead_mid   = norm_plate_thermo['A5'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Thermo-2))                #Beads to the Right
    A5_p300_bead_side = norm_plate_thermo['A5'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Thermo-7.2))             #Beads to the Right
    A5_p300_bead_top  = norm_plate_thermo['A5'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Thermo-1))               #Beads to the Right
    A5_p300_bead_mid  = norm_plate_thermo['A5'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Thermo-4))               #Beads to the Right
    A5_p300_loc1      = norm_plate_thermo['A5'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Thermo-4))               #Beads to the Right
    A5_p300_loc2      = norm_plate_thermo['A5'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Thermo-4))               #Beads to the Right
    A5_p300_loc3      = norm_plate_thermo['A5'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Thermo-4))               #Beads to the Right
    ############################################################################################################################################

    bypass = protocol.deck.position_for('11').move(types.Point(x=70,y=80,z=130))

    # commands
    if DRYRUN == 'NO':
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(100)
        temp_block.set_temperature(4)
        thermocycler.open_lid()
        protocol.pause("Ready")

    # positions
    ############################################################################################################################################
    #  norm_plate_deck on the Mag Block
    A1_p20_bead_side  = norm_plate_deck['A1'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Mag-5))                #Beads to the Right
    A1_p20_bead_top   = norm_plate_deck['A1'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Mag+2))                #Beads to the Right
    A1_p20_bead_mid   = norm_plate_deck['A1'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Mag-2))                #Beads to the Right
    A1_p300_bead_side = norm_plate_deck['A1'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Mag-7.2))             #Beads to the Right
    A1_p300_bead_top  = norm_plate_deck['A1'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Mag-1))               #Beads to the Right
    A1_p300_bead_mid  = norm_plate_deck['A1'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Mag-4))               #Beads to the Right
    A1_p300_loc1      = norm_plate_deck['A1'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Mag-4))               #Beads to the Right
    A1_p300_loc2      = norm_plate_deck['A1'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Mag-4))               #Beads to the Right
    A1_p300_loc3      = norm_plate_deck['A1'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Mag-4))               #Beads to the Right
    A1_p20_loc1       = norm_plate_deck['A1'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p20_offset_Mag-7))             #Beads to the Right
    A1_p20_loc2       = norm_plate_deck['A1'].center().move(types.Point(x=1.3,y=0,               z=p20_offset_Mag-7))             #Beads to the Right
    A1_p20_loc3       = norm_plate_deck['A1'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p20_offset_Mag-7))             #Beads to the Right
    A3_p20_bead_side  = norm_plate_deck['A3'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Mag-5))                #Beads to the Right
    A3_p20_bead_top   = norm_plate_deck['A3'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Mag+2))                #Beads to the Right
    A3_p20_bead_mid   = norm_plate_deck['A3'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Mag-2))                #Beads to the Right
    A3_p300_bead_side = norm_plate_deck['A3'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Mag-7.2))             #Beads to the Right
    A3_p300_bead_top  = norm_plate_deck['A3'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Mag-1))               #Beads to the Right
    A3_p300_bead_mid  = norm_plate_deck['A3'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Mag-4))               #Beads to the Right
    A3_p300_loc1      = norm_plate_deck['A3'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Mag-4))               #Beads to the Right
    A3_p300_loc2      = norm_plate_deck['A3'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Mag-4))               #Beads to the Right
    A3_p300_loc3      = norm_plate_deck['A3'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Mag-4))               #Beads to the Right
    A3_p20_loc1       = norm_plate_deck['A3'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p20_offset_Mag-7))             #Beads to the Right
    A3_p20_loc2       = norm_plate_deck['A3'].center().move(types.Point(x=1.3,y=0,               z=p20_offset_Mag-7))             #Beads to the Right
    A3_p20_loc3       = norm_plate_deck['A3'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p20_offset_Mag-7))             #Beads to the Right
    A5_p20_bead_side  = norm_plate_deck['A5'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Mag-5))                #Beads to the Right
    A5_p20_bead_top   = norm_plate_deck['A5'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Mag+2))                #Beads to the Right
    A5_p20_bead_mid   = norm_plate_deck['A5'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Mag-2))                #Beads to the Right
    A5_p300_bead_side = norm_plate_deck['A5'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Mag-7.2))             #Beads to the Right
    A5_p300_bead_top  = norm_plate_deck['A5'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Mag-1))               #Beads to the Right
    A5_p300_bead_mid  = norm_plate_deck['A5'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Mag-4))               #Beads to the Right
    A5_p300_loc1      = norm_plate_deck['A5'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Mag-4))               #Beads to the Right
    A5_p300_loc2      = norm_plate_deck['A5'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Mag-4))               #Beads to the Right
    A5_p300_loc3      = norm_plate_deck['A5'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Mag-4))               #Beads to the Right
    A5_p20_loc1       = norm_plate_deck['A5'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p20_offset_Mag-7))             #Beads to the Right
    A5_p20_loc2       = norm_plate_deck['A5'].center().move(types.Point(x=1.3,y=0,               z=p20_offset_Mag-7))             #Beads to the Right
    A5_p20_loc3       = norm_plate_deck['A5'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p20_offset_Mag-7))             #Beads to the Right
    A7_p20_bead_side  = norm_plate_deck['A7'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Mag-5))                #Beads to the Right
    A7_p20_bead_top   = norm_plate_deck['A7'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Mag+2))                #Beads to the Right
    A7_p20_bead_mid   = norm_plate_deck['A7'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Mag-2))                #Beads to the Right
    A7_p300_bead_side = norm_plate_deck['A7'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Mag-7.2))             #Beads to the Right
    A7_p300_bead_top  = norm_plate_deck['A7'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Mag-1))               #Beads to the Right
    A7_p300_bead_mid  = norm_plate_deck['A7'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Mag-4))               #Beads to the Right
    A7_p300_loc1      = norm_plate_deck['A7'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Mag-5.5))               #Beads to the Right
    A7_p300_loc2      = norm_plate_deck['A7'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Mag-5.5))               #Beads to the Right
    A7_p300_loc3      = norm_plate_deck['A7'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Mag-5.5))               #Beads to the Right
    A9_p20_bead_side  = norm_plate_deck['A9'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Mag-5))                #Beads to the Right
    A9_p20_bead_top   = norm_plate_deck['A9'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Mag+2))                #Beads to the Right
    A9_p20_bead_mid   = norm_plate_deck['A9'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Mag-2))                #Beads to the Right
    A9_p300_bead_side = norm_plate_deck['A9'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Mag-7.2))             #Beads to the Right
    A9_p300_bead_top  = norm_plate_deck['A9'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Mag-1))               #Beads to the Right
    A9_p300_bead_mid  = norm_plate_deck['A9'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Mag-4))               #Beads to the Right
    A9_p300_loc1      = norm_plate_deck['A9'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Mag-5.5))               #Beads to the Right
    A9_p300_loc2      = norm_plate_deck['A9'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Mag-5.5))               #Beads to the Right
    A9_p300_loc3      = norm_plate_deck['A9'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Mag-5.5))               #Beads to the Right
    A11_p20_bead_side  = norm_plate_deck['A11'].center().move(types.Point(x=-1.8*0.50,y=0,         z=p20_offset_Mag-5))                #Beads to the Right
    A11_p20_bead_top   = norm_plate_deck['A11'].center().move(types.Point(x=1.5,y=0,               z=p20_offset_Mag+2))                #Beads to the Right
    A11_p20_bead_mid   = norm_plate_deck['A11'].center().move(types.Point(x=1,y=0,                 z=p20_offset_Mag-2))                #Beads to the Right
    A11_p300_bead_side = norm_plate_deck['A11'].center().move(types.Point(x=-0.50,y=0,             z=p300_offset_Mag-7.2))             #Beads to the Right
    A11_p300_bead_top  = norm_plate_deck['A11'].center().move(types.Point(x=1.30,y=0,              z=p300_offset_Mag-1))               #Beads to the Right
    A11_p300_bead_mid  = norm_plate_deck['A11'].center().move(types.Point(x=0.80,y=0,              z=p300_offset_Mag-4))               #Beads to the Right
    A11_p300_loc1      = norm_plate_deck['A11'].center().move(types.Point(x=1.3*0.8,y=1.3*0.8,     z=p300_offset_Mag-5.5))               #Beads to the Right
    A11_p300_loc2      = norm_plate_deck['A11'].center().move(types.Point(x=1.3,y=0,               z=p300_offset_Mag-5.5))               #Beads to the Right
    A11_p300_loc3      = norm_plate_deck['A11'].center().move(types.Point(x=1.3*0.8,y=-1.3*0.8,    z=p300_offset_Mag-5.5))               #Beads to the Right
    ############################################################################################################################################

    if STEP_NORM1 == 1:
        protocol.comment('==============================================')
        protocol.comment('--> NORMALASE I')
        protocol.comment('==============================================')

        protocol.comment('--> Adding NORM1')
        if DRYRUN == 'NO':
            NORM1Vol    = 5
            NORM1MixRep = 10
            NORM1MixVol = 20
        if DRYRUN == 'YES':
            NORM1Vol    = 5
            NORM1MixRep = 1
            NORM1MixVol = 10
        if samplecolumns >= 1:#-----------------------------------------------------------------------------------------
            X = 'A1'
            p20M.pick_up_tip()
            p20M.aspirate(NORM1Vol, NORM1.bottom(z=p20_offset_Temp))
            p20M.dispense(NORM1Vol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20M.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20M.mix(NORM1MixRep,NORM1MixVol)
            p20M.drop_tip() if DRYRUN == 'NO' else p20M.return_tip()
        if samplecolumns >= 2:#-----------------------------------------------------------------------------------------
            X = 'A2'
            p20M.pick_up_tip()
            p20M.aspirate(NORM1Vol, NORM1.bottom(z=p20_offset_Temp))
            p20M.dispense(NORM1Vol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20M.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20M.mix(NORM1MixRep,NORM1MixVol)
            p20M.drop_tip() if DRYRUN == 'NO' else p20M.return_tip()
        if samplecolumns >= 3:#-----------------------------------------------------------------------------------------
            X = 'A3'
            p20M.pick_up_tip()
            p20M.aspirate(NORM1Vol, NORM1.bottom(z=p20_offset_Temp))
            p20M.dispense(NORM1Vol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20M.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20M.mix(NORM1MixRep,NORM1MixVol)
            p20M.drop_tip() if DRYRUN == 'NO' else p20M.return_tip()

    if STEP_NORM1DECK == 1:
        if DRYRUN == 'NO':
            ############################################################################################################################################
            protocol.pause('Seal, Run NORM1 (15min)')

            profile_NORM1 = [
                {'temperature': 30, 'hold_time_minutes': 15}
                ]
            thermocycler.execute_profile(steps=profile_NORM1, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(4)
            ############################################################################################################################################
            protocol.pause("Remove Seal")
    else:
        protocol.pause('Seal, Run NORM1 (15min)')

    protocol.pause("MOVE NORM PLATE TO POSITION 1, PLACE NEW PLATE IN THERMO")

    if STEP_POOL == 1:
        protocol.comment('==============================================')
        protocol.comment('--> POOLING SAMPLES')
        protocol.comment('==============================================')

        Poolvol = 5
        current = 0
        Pools = 3
        while current < len(data):
            CurrentWell     = str(data[current][1])
            PoolWell        = str(data[current][2])
            p20S.pick_up_tip()
            p20S.aspirate(Poolvol, norm_plate_deck.wells_by_name()[CurrentWell].bottom(z=p20_offset_Mag))
            p20S.dispense(Poolvol, norm_plate_thermo.wells_by_name()[PoolWell].bottom(z=p20_offset_Thermo))
            p20S.drop_tip() if DRYRUN == 'NO' else p20S.return_tip()
            current += 1

    if STEP_NORM1 == 1:
        protocol.comment('==============================================')
        protocol.comment('--> NORMALASE II')
        protocol.comment('==============================================')

        protocol.comment('--> Adding NORM2')
        if DRYRUN == 'NO':
            NORM2Vol    = 1
            NORM2MixRep = 10
            NORM2MixVol = 20
        if DRYRUN == 'YES':
            NORM2Vol    = 1
            NORM2MixRep = 1
            NORM2MixVol = 10
        if samplecolumns >= 1:#-----------------------------------------------------------------------------------------
            X = 'A12'
            p20S.pick_up_tip()
            p20S.aspirate(NORM2Vol, NORM2.bottom(z=p20_offset_Temp), rate=0.25)
            p20S.dispense(NORM2Vol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20S.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20S.mix(NORM2MixRep,NORM2MixVol)
            p20S.drop_tip() if DRYRUN == 'NO' else p20S.return_tip()
        if samplecolumns >= 2:#-----------------------------------------------------------------------------------------
            X = 'B12'
            p20S.pick_up_tip()
            p20S.aspirate(NORM2Vol, NORM2.bottom(z=p20_offset_Temp), rate=0.25)
            p20S.dispense(NORM2Vol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20S.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20S.mix(NORM2MixRep,NORM2MixVol)
            p20S.drop_tip() if DRYRUN == 'NO' else p20S.return_tip()
        if samplecolumns >= 3:#-----------------------------------------------------------------------------------------
            X = 'C12'
            p20S.pick_up_tip()
            p20S.aspirate(NORM1Vol, NORM2.bottom(z=p20_offset_Temp), rate=0.25)
            p20S.dispense(NORM1Vol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20S.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20S.mix(NORM2MixRep,NORM2MixVol)
            p20S.drop_tip() if DRYRUN == 'NO' else p20S.return_tip()

    if STEP_NORM2DECK == 1:
        if DRYRUN == 'NO':
            ############################################################################################################################################
            protocol.pause('Seal, Run NORM2 (15min)')

            profile_NORM2 = [
                {'temperature': 37, 'hold_time_minutes': 15}
                ]
            thermocycler.execute_profile(steps=profile_NORM2, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(4)
            ############################################################################################################################################
            protocol.pause("Remove Seal")
    else:
        protocol.pause('Seal, Run NORM2 (15min)')

        protocol.comment('--> Adding NORMINACT')
        if DRYRUN == 'NO':
            NORMINACTVol    = 1.6
            NORMINACTMixRep = 10
            NORMINACTMixVol = 20
        if DRYRUN == 'YES':
            NORMINACTVol    = 1.6
            NORMINACTMixRep = 1
            NORMINACTMixVol = 10
        if samplecolumns >= 1:#-----------------------------------------------------------------------------------------
            X = 'A12'
            p20S.pick_up_tip()
            p20S.aspirate(NORMINACTVol, NORMINACT.bottom(z=p20_offset_Temp), rate=0.25)
            p20S.dispense(NORMINACTVol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20S.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20S.mix(NORMINACTMixRep,NORM1MixVol)
            p20S.drop_tip() if DRYRUN == 'NO' else p20S.return_tip()
        if samplecolumns >= 2:#-----------------------------------------------------------------------------------------
            X = 'B12'
            p20S.pick_up_tip()
            p20S.aspirate(NORMINACTVol, NORMINACT.bottom(z=p20_offset_Temp), rate=0.25)
            p20S.dispense(NORMINACTVol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20S.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20S.mix(NORMINACTMixRep,NORM1MixVol)
            p20S.drop_tip() if DRYRUN == 'NO' else p20S.return_tip()
        if samplecolumns >= 3:#-----------------------------------------------------------------------------------------
            X = 'C12'
            p20S.pick_up_tip()
            p20S.aspirate(NORMINACTVol, NORMINACT.bottom(z=p20_offset_Temp), rate=0.25)
            p20S.dispense(NORMINACTVol, norm_plate_thermo.wells_by_name()[X].bottom(z=p20_offset_Thermo))
            p20S.move_to(norm_plate_thermo[X].bottom(z=p20_offset_Thermo))
            p20S.mix(NORMINACTMixRep,NORM1MixVol)
            p20S.drop_tip() if DRYRUN == 'NO' else p20S.return_tip()

    if STEP_NORMINACTDECK == 1:
        if DRYRUN == 'NO':
            ############################################################################################################################################
            protocol.pause('Seal, Run NORMINACT (2min)')

            profile_NORMINACT = [
                {'temperature': 95, 'hold_time_minutes': 2}
                ]
            thermocycler.execute_profile(steps=profile_NORMINACT, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(4)
            ############################################################################################################################################
            protocol.pause("Remove Seal")
    else:
        protocol.pause('Seal, Run NORMINACT (2min)')
