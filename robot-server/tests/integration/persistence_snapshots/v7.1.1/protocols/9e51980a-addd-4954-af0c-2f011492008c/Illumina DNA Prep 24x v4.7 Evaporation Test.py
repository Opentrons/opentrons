# Illumina DNA Prep 24x v4.7 Evaporation Test
from opentrons import protocol_api
from opentrons import types

metadata = {
    'protocolName': 'Illumina DNA Prep 24x v4.5 Evaporation Test',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    }

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

def run(protocol: protocol_api.ProtocolContext):
    RES_TYPE = '12x15ml'
    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    heatershaker        = protocol.load_module('heaterShakerModuleV1','D1')
    hs_adapter          = heatershaker.load_adapter('opentrons_96_pcr_adapter')
    if RES_TYPE == '12x15ml':
        reservoir       = protocol.load_labware('nest_12_reservoir_15ml','D2')
    if RES_TYPE == '96x2ml':
        reservoir       = protocol.load_labware('nest_96_wellplate_2ml_deep','D2')    
    temp_block          = protocol.load_module('temperature module gen2', 'D3')
    temp_adapter        = temp_block.load_adapter('opentrons_96_well_aluminum_block')
    reagent_plate       = temp_adapter.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt')
    # ========== SECOND ROW ==========
    mag_block      = protocol.load_module('magneticBlockV1', 'C1')
    tiprack_200_1       = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C2')
    tiprack_50_1        = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'C3')
    # ========== THIRD ROW ===========
    thermocycler        = protocol.load_module('thermocycler module gen2')
    sample_plate_1      = thermocycler.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt')
    tiprack_200_2       = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B2')
    tiprack_50_2        = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B3')
    
    # ========== FOURTH ROW ==========
    tiprack_200_3       = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A2')
    
    # pipette
    p1000 = protocol.load_instrument("flex_8channel_1000", "left", tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3])
    p50 = protocol.load_instrument("flex_8channel_50", "right", tip_racks=[tiprack_50_1,tiprack_50_2])
    p200_tipracks = 3
    p50_tipracks = 2
    
    #-weigh empty Armadillo-
    # set thermocycler block to 4°, lid to 105°
    thermocycler.open_lid()
    thermocycler.set_block_temperature(4)
    thermocycler.set_lid_temperature(105)
    locations = [sample_plate_1['A1'].bottom(z=0.5),
            sample_plate_1['A2'].bottom(z=0.5),
            sample_plate_1['A3'].bottom(z=0.5),
            sample_plate_1['A4'].bottom(z=0.5),
            sample_plate_1['A5'].bottom(z=0.5),
            sample_plate_1['A6'].bottom(z=0.5),
            sample_plate_1['A7'].bottom(z=0.5),
            sample_plate_1['A8'].bottom(z=0.5),
            sample_plate_1['A9'].bottom(z=0.5),
            sample_plate_1['A10'].bottom(z=0.5),
            sample_plate_1['A11'].bottom(z=0.5),
            sample_plate_1['A12'].bottom(z=0.5)]
    volumes = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    protocol.pause('Weight Armadillo Plate, place on thermocycler')
    p50.distribute(volume = volumes, source = reservoir['A1'], dest = locations, return_tips = True, blow_out = False)
    #pipette 10uL into Armadillo wells
    #-weigh filled Armadillo, place onto thermocycler-
    protocol.pause('Weight Armadillo Plate, place on thermocycler')
    #Close lid
    thermocycler.close_lid()
    #hold at 95° for 3 minutes
    profile_TAG = [{'temperature': 95, 'hold_time_minutes': 3}]
    thermocycler.execute_profile(steps = profile_TAG, repetitions = 1,block_max_volume=50)
    #30x cycles of: 70° for 30s 72° for 30s 95° for 10s 
    profile_TAG2 = [{'temperature': 70, 'hold_time_seconds': 30}, {'temperature': 72, 'hold_time_seconds': 30}, {'temperature': 95, 'hold_time_seconds': 10}]
    thermocycler.execute_profile(steps = profile_TAG2, repetitions = 30,block_max_volume=50)
    #hold at 72° for 5min 
    profile_TAG3 = [{'temperature': 72, 'hold_time_minutes': 5}]
    thermocycler.execute_profile(steps = profile_TAG3, repetitions = 1,block_max_volume=50)
    # # Cool to 4° 
    thermocycler.set_block_temperature(4)
    thermocycler.set_lid_temperature(105)
    # Open lid
    thermocycler.open_lid()
    protocol.pause('Weigh Armadillo plate')
    
    