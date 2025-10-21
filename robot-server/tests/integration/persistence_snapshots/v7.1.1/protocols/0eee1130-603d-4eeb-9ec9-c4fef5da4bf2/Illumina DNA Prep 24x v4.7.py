from opentrons import protocol_api
from opentrons import types

metadata = {
    'protocolName': 'Illumina DNA Prep 24x v4.7',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    }

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}

# SCRIPT SETTINGS
DRYRUN              = True          # True = skip incubation times, shorten mix, for testing purposes
USE_GRIPPER         = True          # True = Uses Gripper, False = Manual Move
TIP_TRASH           = False         # True = Used tips go in Trash, False = Used tips go back into rack

# PROTOCOL SETTINGS
COLUMNS             = 3             # 1-4
PCRCYCLES           = 7             # Amount of PCR cycles
RES_TYPE            = '12x15ml'     # '12x15ml' or '96x2ml'
ETOH_AirMultiDis    = True
RSB_AirMultiDis     = True

# PROTOCOL BLOCKS
STEP_TAG            = 1
STEP_WASH           = 1
STEP_PCRDECK        = 1
STEP_CLEANUP        = 1

############################################################################################################################################
############################################################################################################################################
############################################################################################################################################

p200_tips           = 0
p50_tips            = 0
WasteVol            = 0
Resetcount          = 0

ABR_TEST            = True
if ABR_TEST == True:
    COLUMNS         = 3              # Overrides to 3 columns
    DRYRUN          = True           # Overrides to only DRYRUN
    TIP_TRASH       = False          # Overrides to only REUSING TIPS
    RUN             = 1              # Repetitions
else:
    RUN             = 1

def run(protocol: protocol_api.ProtocolContext):
    
    global p200_tips
    global p50_tips
    global WasteVol
    global Resetcount

    if ABR_TEST == True:
        protocol.comment('THIS IS A ABR RUN WITH '+str(RUN)+' REPEATS') 
    protocol.comment('THIS IS A DRY RUN') if DRYRUN == True else protocol.comment('THIS IS A REACTION RUN')
    protocol.comment('USED TIPS WILL GO IN TRASH') if TIP_TRASH == True else protocol.comment('USED TIPS WILL BE RE-RACKED')

    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    heatershaker        = protocol.load_module('heaterShakerModuleV1','D1')
    hs_adapter          = heatershaker.load_adapter('opentrons_96_pcr_adapter')
    sample_plate_1      = hs_adapter.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt')
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
    tiprack_200_2       = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B2')
    tiprack_50_2        = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B3')
    # ========== FOURTH ROW ==========
    tiprack_200_3       = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A2')

    # =========== RESERVOIR ==========
    AMPure              = reservoir['A1']    
    TAGSTOP             = reservoir['A2'] 
    TWB                 = reservoir['A4']
    EtOH                = reservoir['A6']
    Liquid_trash_well_1 = reservoir['A11']
    Liquid_trash_well_2 = reservoir['A12']
    
    # ========= REAGENT PLATE =========
    TAGMIX              = reagent_plate['A1']
    EPM                 = reagent_plate['A2']
    H20                 = reagent_plate['A3']
    RSB                 = reagent_plate['A4']
    Barcodes_1          = reagent_plate['A7']
    Barcodes_2          = reagent_plate['A8']
    Barcodes_3          = reagent_plate['A9']
    Barcodes_4          = reagent_plate['A10']

    # pipette
    p1000 = protocol.load_instrument("flex_8channel_1000", "left", tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3])
    p50 = protocol.load_instrument("flex_8channel_50", "right", tip_racks=[tiprack_50_1,tiprack_50_2])
    p200_tipracks = 3
    p50_tipracks = 2
    
    #tip and sample tracking
    if COLUMNS == 1:
        column_1_list = ['A1']
        column_2_list = ['A5']
        column_3_list = ['A9']
        barcodes = ['A7']
    if COLUMNS == 2:
        column_1_list = ['A1','A2']
        column_2_list = ['A5','A6']
        column_3_list = ['A9','A10']
        barcodes = ['A7','A8']
    if COLUMNS == 3:
        column_1_list = ['A1','A2','A3']
        column_2_list = ['A5','A6','A7']
        column_3_list = ['A9','A10','A11']
        barcodes = ['A7','A8','A9']
    if COLUMNS == 4:
        column_1_list = ['A1','A2','A3','A4']
        column_2_list = ['A5','A6','A7','A8']
        column_3_list = ['A9','A10','A11','A12']
        barcodes = ['A7','A8','A9','A10']

    def tipcheck():
        global p200_tips
        global p50_tips
        global Resetcount
        if p200_tips == p200_tipracks*12:
            if ABR_TEST == True: 
                p1000.reset_tipracks()
            else:
                protocol.pause('RESET p200 TIPS')
                p1000.reset_tipracks()
            Resetcount += 1
            p200_tips = 0 
        if p50_tips == p50_tipracks*12:
            if ABR_TEST == True: 
                p50.reset_tipracks()
            else:
                protocol.pause('RESET p50 TIPS')
                p50.reset_tipracks()
            Resetcount += 1
            p50_tips = 0

    Liquid_trash = Liquid_trash_well_1

    def DispWasteVol(Vol):
        global WasteVol
        WasteVol += int(Vol)
        if WasteVol <1500:
            Liquid_trash = Liquid_trash_well_1
        if WasteVol >=1500:
            Liquid_trash = Liquid_trash_well_2


############################################################################################################################################
############################################################################################################################################
############################################################################################################################################
    # commands
    for loop in range(RUN):
        thermocycler.open_lid()
        heatershaker.open_labware_latch()
        if DRYRUN == False:
            protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
            thermocycler.set_block_temperature(4)
            thermocycler.set_lid_temperature(100)    
            temp_block.set_temperature(4)
        protocol.pause("Ready")
        heatershaker.close_labware_latch()

        # Sample Plate contains 50ng of DNA in 30ul Low EDTA TE

        if STEP_TAG == 1:
            protocol.comment('==============================================')
            protocol.comment('--> Tagment')
            protocol.comment('==============================================')

            protocol.comment('--> ADDING TAGMIX')
            TagVol = 20
            SampleVol = 50
            TagMixTime = 5*60 if DRYRUN == False else 0.1*60
            TagPremix = 3 if DRYRUN == False else 1
            #===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck()
                p1000.pick_up_tip()
                p1000.mix(TagPremix,TagVol+10, TAGMIX.bottom(z=1))
                p1000.aspirate(TagVol+3, TAGMIX.bottom(z=1), rate=0.25)
                p1000.dispense(3, TAGMIX.bottom(z=1), rate=0.25)
                p1000.dispense(TagVol, sample_plate_1[X].bottom(z=1), rate=0.25)
                p1000.mix(2,SampleVol, sample_plate_1[X].bottom(z=0.75))
                p1000.move_to(sample_plate_1[X].top(z=-3))
                protocol.delay(minutes=0.1)
                p1000.blow_out(sample_plate_1[X].top(z=-3))
                p1000.move_to(sample_plate_1[X].top(z=5))
                p1000.move_to(sample_plate_1[X].top(z=0))
                p1000.move_to(sample_plate_1[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            #===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=1600)
            protocol.delay(TagMixTime)
            heatershaker.deactivate_shaker()
            
            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM HEATERSHAKER TO THERMOCYCLER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=thermocycler,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================
            
            ############################################################################################################################################
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_TAG = [
                    {'temperature': 55, 'hold_time_minutes': 15}
                    ]
                thermocycler.execute_profile(steps=profile_TAG, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
            ############################################################################################################################################

            protocol.comment('--> Adding TAGSTOP')
            TAGSTOPVol    = 10
            TAGSTOPMixRep = 10 if DRYRUN == False else 1
            TAGSTOPMixVol = 20
            #===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck()
                p50.pick_up_tip()
                p50.aspirate(TAGSTOPVol+3, TAGSTOP.bottom(z=0.5))  #original = ()
                p50.dispense(3, TAGSTOP.bottom(z=0.5))  #original = ()
                p50.dispense(TAGSTOPVol, sample_plate_1[X].bottom(z=0.5))  #original = ()
                p50.move_to(sample_plate_1[X].bottom(z=0.5))  #original = ()
                p50.mix(TAGSTOPMixRep,TAGSTOPMixVol)
                p50.blow_out(sample_plate_1[X].top(z=-2))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            #===============================================

            ############################################################################################################################################
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_TAGSTOP = [
                    {'temperature': 37, 'hold_time_minutes': 15}
                    ]
                thermocycler.execute_profile(steps=profile_TAGSTOP, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
            ############################################################################################################################################

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM THERMOCYCLER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================
        
            if DRYRUN == False:
                protocol.comment("SETTING THERMO to Room Temp")
                thermocycler.set_block_temperature(20)
                thermocycler.set_lid_temperature(37)    

        if DRYRUN == False:
            protocol.delay(minutes=4)

        if STEP_WASH == 1:
            protocol.comment('==============================================')
            protocol.comment('--> Wash')
            protocol.comment('==============================================')
            # Setting Labware to Resume at Wash
            if STEP_TAG == 0:
                #============================================================================================
                # GRIPPER MOVE sample_plate_1 FROM HEATERSHAKER TO MAG PLATE
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=mag_block,
                    use_gripper=USE_GRIPPER,
                )
                heatershaker.close_labware_latch()
                #============================================================================================

            protocol.comment('--> Removing Supernatant')
            RemoveSup = 200
            #===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck()
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup-100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_1[X].bottom(z=0.75))
                p1000.aspirate(100, rate=0.25)
                p1000.move_to(sample_plate_1[X].top(z=-2))
                DispWasteVol(60)
                p1000.dispense(200, Liquid_trash.top(z=0))
                protocol.delay(minutes=0.1)
                p1000.blow_out(Liquid_trash.top(z=0))
                p1000.aspirate(20)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            #===============================================

            for X in range(3):
                #============================================================================================
                # GRIPPER MOVE sample_plate_1 FROM MAG PLATE TO HEATER SHAKER
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=hs_adapter,
                    use_gripper=USE_GRIPPER,
                )
                heatershaker.close_labware_latch()
                #============================================================================================

                protocol.comment('--> Wash ')
                TWBMaxVol = 100
                TWBTime = 3*60 if DRYRUN == False else 0.1*60
                #===============================================
                for loop, X in enumerate(column_1_list):
                    tipcheck()
                    p1000.pick_up_tip()
                    p1000.aspirate(TWBMaxVol+3, TWB.bottom(z=1), rate=0.25)
                    p1000.dispense(3, TWB.bottom(z=1), rate=0.25)
                    p1000.move_to(sample_plate_1[X].bottom(z=1))
                    p1000.dispense(TWBMaxVol, rate=0.25)
                    p1000.mix(2,90,rate=0.5)
                    p1000.move_to(sample_plate_1[X].top(z=1))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out(sample_plate_1[X].top(z=1))
                    p1000.aspirate(20)
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                #===============================================

                #============================================================================================
                # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO MAG PLATE
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=mag_block,
                    use_gripper=USE_GRIPPER,
                )
                heatershaker.close_labware_latch()
                #============================================================================================

                if DRYRUN == False:
                    protocol.delay(minutes=3)

                protocol.comment('--> Remove Wash')
                #===============================================
                for loop, X in enumerate(column_1_list):
                    tipcheck()
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_1[X].bottom(4))
                    p1000.aspirate(TWBMaxVol, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_1[X].bottom(z=0.5))  #original = ()
                    protocol.delay(minutes=0.1)
                    p1000.aspirate(200-TWBMaxVol, rate=0.25)
                    p1000.default_speed = 400
                    DispWasteVol(100)
                    p1000.dispense(200, Liquid_trash)
                    p1000.move_to(Liquid_trash.top(z=5))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out(Liquid_trash.top(z=5))
                    p1000.aspirate(20)
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                #===============================================

            if DRYRUN == False:
                protocol.delay(minutes=1)

            protocol.comment('--> Removing Residual Wash')
            #===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck()
                p50.pick_up_tip()
                p50.move_to(sample_plate_1[X].bottom(1))
                p50.aspirate(20, rate=0.25)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            #===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================

            protocol.comment('--> Adding EPM')
            EPMVol = 40 
            EPMMixTime = 3*60 if DRYRUN == False else 0.1*60
            EPMMixRPM = 2000
            EPMMixVol = 35
            EPMVolCount = 0
            #===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck()
                p50.pick_up_tip()
                p50.aspirate(EPMVol+3, EPM.bottom(z=1))
                p50.dispense(3, EPM.bottom(z=1))
                EPMVolCount += 1
                p50.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=1.3*0.8,y=0,z=-4))))
                p50.dispense(EPMMixVol, rate=1)
                p50.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*0.8,z=-4))))
                p50.dispense(EPMMixVol, rate=1)
                p50.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=1.3*-0.8,y=0,z=-4))))
                p50.dispense(EPMMixVol, rate=1)
                p50.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*-0.8,z=-4))))
                p50.dispense(EPMMixVol, rate=1)
                p50.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.dispense(EPMMixVol, rate=1)
                p50.blow_out(sample_plate_1.wells_by_name()[X].center())
                p50.move_to(sample_plate_1.wells_by_name()[X].bottom(z=0.5))
                p50.move_to(sample_plate_1.wells_by_name()[X].top(z=5))
                p50.move_to(sample_plate_1.wells_by_name()[X].top(z=0))
                p50.move_to(sample_plate_1.wells_by_name()[X].top(z=5))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            #===============================================
            heatershaker.close_labware_latch()
            heatershaker.set_and_wait_for_shake_speed(rpm=EPMMixRPM)
            protocol.delay(EPMMixTime)
            heatershaker.deactivate_shaker()
            heatershaker.open_labware_latch()

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO THERMOCYCLER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=thermocycler,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================

            protocol.comment('--> Adding Barcodes')
            BarcodeVol    = 10
            BarcodeMixRep = 3 if DRYRUN == False else 1
            BarcodeMixVol = 10
            #===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck()
                p50.pick_up_tip()
                p50.aspirate(BarcodeVol+1, reagent_plate.wells_by_name()[barcodes[loop]].bottom(z=0.5), rate=0.25) 
                p50.dispense(1, reagent_plate.wells_by_name()[barcodes[loop]].bottom(z=0.5), rate=0.25)  
                p50.dispense(BarcodeVol, sample_plate_1.wells_by_name()[X].bottom(z=1))
                p50.mix(BarcodeMixRep,BarcodeMixVol)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            #===============================================

        if STEP_PCRDECK == 1:
            ############################################################################################################################################

            if DRYRUN == False:
                protocol.comment("SETTING THERMO to Room Temp")
                thermocycler.set_block_temperature(4)
                thermocycler.set_lid_temperature(100) 

            thermocycler.close_lid()
            if DRYRUN == False:
                profile_PCR_1 = [
                    {'temperature': 68, 'hold_time_seconds': 180},
                    {'temperature': 98, 'hold_time_seconds': 180}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                profile_PCR_2 = [
                    {'temperature': 98, 'hold_time_seconds': 45},
                    {'temperature': 62, 'hold_time_seconds': 30},
                    {'temperature': 68, 'hold_time_seconds': 120}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_2, repetitions=PCRCYCLES, block_max_volume=50)
                profile_PCR_3 = [
                    {'temperature': 68, 'hold_time_minutes': 1}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            ############################################################################################################################################
            thermocycler.open_lid()

        if STEP_CLEANUP == 1:
            protocol.comment('==============================================')
            protocol.comment('--> Cleanup')
            protocol.comment('==============================================')

            # Setting Labware to Resume at Wash
            if STEP_TAG == 0 and STEP_WASH == 0:
                #============================================================================================
                # GRIPPER MOVE sample_plate_1 FROM HEATERSHAKER TO MAG PLATE
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=mag_block,
                    use_gripper=USE_GRIPPER,
                )
                heatershaker.close_labware_latch()
                #============================================================================================
            else:
                #============================================================================================
                # GRIPPER MOVE sample_plate_1 FROM THERMOCYCLER To HEATERSHAKER
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=hs_adapter,
                    use_gripper=USE_GRIPPER,
                )
                heatershaker.close_labware_latch()
                #============================================================================================

            protocol.comment('--> TRANSFERRING AND ADDING AMPure (0.8x)')
            H20Vol    = 40
            AMPureVol = 45
            SampleVol = 45
            AMPureMixRPM = 1800
            AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60
            AMPurePremix = 3 if DRYRUN == False else 1
            #===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck()
                p50.pick_up_tip()

                protocol.comment('--> Adding H20')
                
                p50.aspirate(H20Vol+5, H20.bottom(z=0.5), rate=1)  #original = ()
                p50.dispense(5, H20.bottom(z=0.5), rate=1)  #original = ()
                p50.dispense(H20Vol, sample_plate_1[column_2_list[loop]].bottom(z=0.75))


                protocol.comment('--> ADDING AMPure (0.8x)')
                p50.move_to(AMPure.bottom(z=0.75))
                p50.mix(3,AMPureVol)
                p50.aspirate(AMPureVol+5, AMPure.bottom(z=0.75), rate=0.25)
                p50.dispense(5, AMPure.bottom(z=0.75), rate=0.5)
                p50.dispense(AMPureVol, sample_plate_1[column_2_list[loop]].bottom(z=0.75), rate=1)
                protocol.delay(seconds=0.2)
                p50.blow_out(sample_plate_1[column_2_list[loop]].top(z=-2))

                protocol.comment('--> Adding SAMPLE')
                p50.aspirate(SampleVol+3, sample_plate_1[column_1_list[loop]].bottom(z=0.75), rate=0.5)
                p50.dispense(SampleVol+3, sample_plate_1[column_2_list[loop]].bottom(z=0.75), rate=1)
                p50.aspirate(SampleVol+3, sample_plate_1[column_2_list[loop]].bottom(z=0.75), rate=0.5)
                p50.dispense(SampleVol+3, sample_plate_1[column_2_list[loop]].bottom(z=0.75), rate=1)
                p50.move_to(sample_plate_1[column_2_list[loop]].top(z=-3))
                protocol.delay(seconds=0.2)
                p50.blow_out(sample_plate_1[column_2_list[loop]].top(z=-3))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            #===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

            if DRYRUN == False:
                protocol.comment("SETTING THERMO to Room Temp")
                thermocycler.set_block_temperature(20)
                thermocycler.set_lid_temperature(37) 

            #============================================================================================
            # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment('--> Removing Supernatant')
            RemoveSup = 200
            #===============================================
            for loop, X in enumerate(column_2_list):
                tipcheck()
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup-100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_1[X].bottom(z=0.75))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_1[X].top(z=2))
                p1000.default_speed = 200
                DispWasteVol(90)
                p1000.dispense(200, Liquid_trash.top(z=0))
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.default_speed = 400
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            #===============================================

            for X in range(2):
                protocol.comment('--> ETOH Wash')
                ETOHMaxVol = 150
                #===============================================
                if ETOH_AirMultiDis == True:
                    tipcheck()
                    p1000.pick_up_tip()
                    for loop, X in enumerate(column_2_list):
                        p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(EtOH.top(z=-5))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=-2))
                        p1000.dispense(ETOHMaxVol, rate=1)
                        protocol.delay(minutes=0.1)
                        p1000.blow_out()
                        p1000.move_to(sample_plate_1[X].top(z=5))
                        p1000.move_to(sample_plate_1[X].top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=5))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                else:
                    for loop, X in enumerate(column_2_list):
                        tipcheck()
                        p1000.pick_up_tip()
                        p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(EtOH.top(z=-5))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=-2))
                        p1000.dispense(ETOHMaxVol, rate=1)
                        protocol.delay(minutes=0.1)
                        p1000.blow_out()
                        p1000.move_to(sample_plate_1[X].top(z=5))
                        p1000.move_to(sample_plate_1[X].top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=5))
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                #===============================================

                if DRYRUN == False:
                    protocol.delay(minutes=0.5)
                
                protocol.comment('--> Remove ETOH Wash')
                #===============================================
                for loop, X in enumerate(column_2_list):
                    tipcheck()
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup-100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_1[X].bottom(z=0.75))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_1[X].top(z=2))
                    p1000.default_speed = 200
                    DispWasteVol(150)
                    p1000.dispense(200, Liquid_trash.top(z=0))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.default_speed = 400
                    p1000.move_to(Liquid_trash.top(z=-5))
                    p1000.move_to(Liquid_trash.top(z=0))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                #===============================================

            if DRYRUN == False:
                protocol.delay(minutes=1)

            protocol.comment('--> Removing Residual Wash')
            #===============================================
            for loop, X in enumerate(column_2_list):
                tipcheck()    
                p50.pick_up_tip()
                p50.move_to(sample_plate_1[X].bottom(1))
                p50.aspirate(20, rate=0.25)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            #===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================

            protocol.comment('--> Adding RSB')
            RSBVol = 32
            RSBMixRPM = 2000
            RSBMixTime = 1*60 if DRYRUN == False else 0.1*60
            #===============================================
            if RSB_AirMultiDis == True:
                tipcheck()                
                p50.pick_up_tip()
                for loop, X in enumerate(column_2_list):
                    p50.aspirate(RSBVol, RSB.bottom(z=1))
                    p50.move_to(sample_plate_1.wells_by_name()[X].top(z=-3))
                    p50.dispense(RSBVol, rate=2)
                    p50.blow_out(sample_plate_1.wells_by_name()[X].top(z=-3))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            else:
                for loop, X in enumerate(column_2_list):
                    tipcheck()
                    p50.pick_up_tip()
                    p50.aspirate(RSBVol, RSB.bottom(z=1))
                    p50.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                    p50.dispense(RSBVol, rate=1)
                    p50.blow_out(sample_plate_1.wells_by_name()[X].top(z=-3))
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                    p50_tips += 1
                    tipcheck()
            #===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=3)

            protocol.comment('--> Transferring Supernatant')
            TransferSup = 30
            #===============================================
            for loop, X in enumerate(column_2_list):
                tipcheck()
                p50.pick_up_tip()
                p50.move_to(sample_plate_1[X].bottom(z=0.5)) 
                p50.aspirate(TransferSup+1, rate=0.25)
                p50.dispense(TransferSup+1, sample_plate_1[column_3_list[loop]].bottom(z=1))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            #===============================================
        
        if ABR_TEST == True:
            protocol.comment('==============================================')
            protocol.comment('--> Resetting Run')
            protocol.comment('==============================================')

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
            )
            heatershaker.close_labware_latch()
            #============================================================================================

            tipcheck()
            p50.pick_up_tip()
            # Removing Final Samples
            for loop, X in enumerate(column_3_list):
                p50.aspirate(32, sample_plate_1[X].bottom(z=1))
                p50.dispense(32, Liquid_trash_well_2.bottom(z=1))
            # Resetting Samples
            for loop, X in enumerate(column_1_list):
                p50.aspirate(30, Liquid_trash_well_2.bottom(z=1))
                p50.dispense(30, sample_plate_1[X].bottom(z=1))
            # Resetting Barcodes
            for loop, X in enumerate(barcodes):
                p50.aspirate(10, Liquid_trash_well_2.bottom(z=1))
                p50.dispense(10, sample_plate_1[X].bottom(z=1))
            p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
            p50_tips += 1

            tipcheck()
            p1000.pick_up_tip()
            # Resetting TAGMIX
            p1000.aspirate(COLUMNS*20, Liquid_trash_well_2.bottom(z=1))
            p1000.dispense(COLUMNS*20, TAGMIX.bottom(z=1))
            # Resetting EPM
            p1000.aspirate(COLUMNS*40, Liquid_trash_well_2.bottom(z=1))
            p1000.dispense(COLUMNS*40, EPM.bottom(z=1))
            # Resetting H20
            p1000.aspirate(COLUMNS*40, Liquid_trash_well_2.bottom(z=1))
            p1000.dispense(COLUMNS*40, H20.bottom(z=1))
            # Resetting RSB
            p1000.aspirate(COLUMNS*32, Liquid_trash_well_2.bottom(z=1))
            p1000.dispense(COLUMNS*32, RSB.bottom(z=1))
            # Resetting AMPURE
            for X in range(COLUMNS):
                p1000.aspirate(COLUMNS*45, Liquid_trash_well_2.bottom(z=1))
                p1000.dispense(COLUMNS*45, AMPure.bottom(z=1))
            # Resetting TAGSTOP
            p1000.aspirate(COLUMNS*10, Liquid_trash_well_2.bottom(z=1))
            p1000.dispense(COLUMNS*10, TAGSTOP.bottom(z=1))
            # Resetting WASH
            for X in range(COLUMNS):
                p1000.aspirate(150, Liquid_trash_well_1.bottom(z=1))
                p1000.dispense(150, TWB.bottom(z=1))
                p1000.aspirate(150, Liquid_trash_well_1.bottom(z=1))
                p1000.dispense(150, TWB.bottom(z=1))
            # Resetting ETOH
            for X in range(COLUMNS):
                p1000.aspirate(150, Liquid_trash_well_1.bottom(z=1))
                p1000.dispense(150, EtOH.bottom(z=1))
                p1000.aspirate(150, Liquid_trash_well_1.bottom(z=1))
                p1000.dispense(150, EtOH.bottom(z=1))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            p200_tips += 1

        protocol.comment('Number of Resets: '+str(Resetcount))