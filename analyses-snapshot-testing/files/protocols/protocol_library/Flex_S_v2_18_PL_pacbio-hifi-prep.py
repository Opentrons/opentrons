from opentrons import protocol_api
from opentrons import types
import math

metadata= {
	'protocolName': 'PacBio Hifi Prep 96',
	'author': 'Opentrons <protocols@opentrons.com>',
	'source': 'Protocol Library',
}

requirements = {
	"robotType": "Flex",
	"apiLevel": "2.18",
}

def add_parameters(parameters):
    parameters.add_int(
        display_name="Samples",
        variable_name="Samples",
        default=8,
        minimum=1,
        maximum=48,
        description="Number of samples being processed"
        )

    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DryRun",
        description="Dry runs will skip incubations on the thermocycler",
        default=False
        )

    parameters.add_bool(
        display_name="On Deck Thermocycler",
        variable_name="on_deck_thermo",
        description="Will you be using an Opentrons Thermocycler?",
        default=True
        )

    parameters.add_int(
        display_name="Column on SMRTbell Index Plate",
        variable_name="SMRTbell_index_start",
        description="Choose starting column on the SMRTbell index plate",
        default=1,
        minimum=1,
        maximum=12,
        )
    parameters.add_bool(
    	display_name="SMRTbell Library Preparation",
    	variable_name="LibPrep",
    	description="Are you performing library prep?",
    	default=True
    	)
    parameters.add_bool(
    	display_name="Annealing, binding and cleanup",
    	variable_name="ABC",
    	description="Will libraires undergo ABC?",
    	default=True
    	)
    parameters.add_str(
    	display_name="Polymerase Kit",
    	variable_name="SPRQ",
    	description="Which Polymerase kit are you using?",
    	choices=[
    		{"display_name":"SPRQ", "value":"SPRQ"},
    		{"display_name":"Non-SPRQ", "value":"Non-SPRQ"},
    		],
    	default="SPRQ"
    	)

tt_50=0
tt_200=0

def run(ctx):
	#Parameters
	DryRun=ctx.params.DryRun
	Samples=ctx.params.Samples
	on_deck_thermo= ctx.params.on_deck_thermo
	SMRTbell_index_start=ctx.params.SMRTbell_index_start
	Columns=math.ceil(Samples/8)
	LibPrep=ctx.params.LibPrep
	ABC=ctx.params.ABC
	SPRQ=ctx.params.SPRQ
	
	#Modules
	thermocycler		=ctx.load_module('thermocycler module gen2')
	temp_block			=ctx.load_module('temperature module gen2', 'D1')
	temp_adapter		=temp_block.load_adapter('opentrons_96_well_aluminum_block')
	mag_block			=ctx.load_module('magneticBlockV1', 'A3')
	chute				=ctx.load_waste_chute()
	
	#Pipettes
	p1000     =ctx.load_instrument('flex_8channel_1000','left')
	p1000.flow_rate.aspirate= 100
	p1000.flow_rate.dispense= 100
	p1000.flow_rate.blow_out=100
	
	p50= ctx.load_instrument('flex_8channel_50','right')
	p50.flow_rate.aspirate=15
	p50.flow_rate.dispense=15
	if Columns==1:
		tiprack_50_1= ctx.load_labware('opentrons_flex_96_tiprack_50ul','B3','tip50_1')
		tiprack_50_2= ctx.load_labware('opentrons_flex_96_tiprack_50ul','C3','tip50_2')
		tiprack_200_1=ctx.load_labware('opentrons_flex_96_tiprack_200ul','B2','tip200_1')
		tiprack_200_2=ctx.load_labware('opentrons_flex_96_tiprack_200ul','C2','tip200_2')

		p1000.tip_racks=[tiprack_200_1,tiprack_200_1,tiprack_200_2]
		p50.tip_racks=[tiprack_50_1,tiprack_50_2]

		#Lists for Tip Tracking
		p50_on_deck_slots= ['B3','C3']
		p50_extension_tips=[]
		p50_manual_tips=[]
		p50_slots=['B3','C3','A4','B4']
		p50_extension_slots=['A4','B4']

		p1000_on_deck_slots=['B2','C2','D2']
		p1000_extension_tips=[]
		p1000_manual_tips=[]
		p1000_slots=['B2','C2','D2','C4','D4']
		p1000_extension_slots=['C4','D4']

	if Columns>=2:
		tiprack_50_1= ctx.load_labware('opentrons_flex_96_tiprack_50ul','B3','tip50_1')
		tiprack_50_2= ctx.load_labware('opentrons_flex_96_tiprack_50ul','C3','tip50_2')
		tiprack_50_3= ctx.load_labware('opentrons_flex_96_tiprack_50ul','A4','tip50_3')
		tiprack_200_1=ctx.load_labware('opentrons_flex_96_tiprack_200ul','B2','tip200_1')
		tiprack_200_2=ctx.load_labware('opentrons_flex_96_tiprack_200ul','C2','tip200_2')
		tiprack_200_3=ctx.load_labware('opentrons_flex_96_tiprack_200ul','D2','tip200_3')
		tiprack_200_4=ctx.load_labware('opentrons_flex_96_tiprack_200ul','C4','tip200_4')

		p1000.tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3,tiprack_200_4]

		p50.tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3]

		#Lists for Tip Tracking
		p50_on_deck_slots= ['B3','C3']
		p50_extension_tips=[tiprack_50_3]
		p50_manual_tips=[]
		p50_slots=['B3','C3','A4','B4']
		p50_extension_slots=['A4','B4']

		p1000_on_deck_slots=['B2','C2','D2']
		p1000_extension_tips=[tiprack_200_4]
		p1000_manual_tips=[]
		p1000_slots=['B2','C2','D2','C4','D4']
		p1000_extension_slots=['C4','D4']
	if Columns>=3:
		tiprack_50_4= ctx.load_labware('opentrons_flex_96_tiprack_50ul','B4','tip50_4')
		tiprack_200_5=ctx.load_labware('opentrons_flex_96_tiprack_200ul','D4','tip200_5')
		
		p1000.tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3,tiprack_200_4,tiprack_200_5]
		p50.tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3,tiprack_50_4]

		#Lists for Tip Tracking
		p50_on_deck_slots= ['B3','C3']
		p50_extension_tips=[tiprack_50_3,tiprack_50_4]
		p50_manual_tips=[]
		p50_slots=['B3','C3','A4','B4']
		p50_extension_slots=['A4','B4']

		p1000_on_deck_slots=['B2','C2','D2']
		p1000_extension_tips=[tiprack_200_4,tiprack_200_5]
		p1000_manual_tips=[]
		p1000_slots=['B2','C2','D2','C4','D4']
		p1000_extension_slots=['C4','D4']

	if Columns>=4:
		tiprack_50_5= ctx.load_labware('opentrons_flex_96_tiprack_50ul',protocol_api.OFF_DECK,'tip50_5')
		tiprack_200_6=ctx.load_labware('opentrons_flex_96_tiprack_200ul',protocol_api.OFF_DECK,'tip200_6')
		tiprack_200_7=ctx.load_labware('opentrons_flex_96_tiprack_200ul',protocol_api.OFF_DECK,'tip200_7')
		
		p1000.tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3,tiprack_200_4,tiprack_200_5,tiprack_200_6,tiprack_200_7]
		p50.tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3,tiprack_50_4,tiprack_50_5]

		#Lists for Tip Tracking
		p50_on_deck_slots= ['B3','C3']
		p50_extension_tips=[tiprack_50_3,tiprack_50_4]
		p50_manual_tips=[tiprack_50_5]
		p50_slots=['B3','C3','A4','B4']
		p50_extension_slots=['A4','B4']

		p1000_on_deck_slots=['B2','C2','D2']
		p1000_extension_tips=[tiprack_200_4,tiprack_200_5]
		p1000_manual_tips=[tiprack_200_6,tiprack_200_7]
		p1000_slots=['B2','C2','D2','C4','D4']
		p1000_extension_slots=['C4','D4']
	if Columns>=5:
		tiprack_50_6= ctx.load_labware('opentrons_flex_96_tiprack_50ul',protocol_api.OFF_DECK,'tip50_6')
		tiprack_200_8=ctx.load_labware('opentrons_flex_96_tiprack_200ul',protocol_api.OFF_DECK,'tip200_8')
		
		p1000.tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3,tiprack_200_4,tiprack_200_5,tiprack_200_6,tiprack_200_7,tiprack_200_8]
		p50.tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3,tiprack_50_4,tiprack_50_5,tiprack_50_6]

		#Lists for Tip Tracking
		p50_on_deck_slots= ['B3','C3']
		p50_extension_tips=[tiprack_50_3,tiprack_50_4]
		p50_manual_tips=[tiprack_50_5,tiprack_50_6]
		p50_slots=['B3','C3','A4','B4']
		p50_extension_slots=['A4','B4']

		p1000_on_deck_slots=['B2','C2','D2']
		p1000_extension_tips=[tiprack_200_4,tiprack_200_5]
		p1000_manual_tips=[tiprack_200_6,tiprack_200_7,tiprack_200_8]
		p1000_slots=['B2','C2','D2','C4','D4']
		p1000_extension_slots=['C4','D4']
	if Columns==6:
		tiprack_50_7= ctx.load_labware('opentrons_flex_96_tiprack_50ul',protocol_api.OFF_DECK,'tip50_7')
		tiprack_200_9=ctx.load_labware('opentrons_flex_96_tiprack_200ul',protocol_api.OFF_DECK,'tip200_9')
		tiprack_200_10=ctx.load_labware('opentrons_flex_96_tiprack_200ul',protocol_api.OFF_DECK,'tip200_10')
		tiprack_200_11=ctx.load_labware('opentrons_flex_96_tiprack_200ul',protocol_api.OFF_DECK,'tip200_11')
		
		p1000.tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3,tiprack_200_4,tiprack_200_5,tiprack_200_6,tiprack_200_7,tiprack_200_8,tiprack_200_9,tiprack_200_10,tiprack_200_11]
		p50.tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3,tiprack_50_4,tiprack_50_5,tiprack_50_6,tiprack_50_7]

		#Lists for Tip Tracking
		p50_on_deck_slots= ['B3','C3']
		p50_extension_tips=[tiprack_50_3,tiprack_50_4]
		p50_manual_tips=[tiprack_50_5,tiprack_50_6,tiprack_50_7]
		p50_slots=['B3','C3','A4','B4']
		p50_extension_slots=['A4','B4']

		p1000_on_deck_slots=['B2','C2','D2']
		p1000_extension_tips=[tiprack_200_4,tiprack_200_5]
		p1000_manual_tips=[tiprack_200_6,tiprack_200_7,tiprack_200_8,tiprack_200_9,tiprack_200_10,tiprack_200_11]
		p1000_slots=['B2','C2','D2','C4','D4']
		p1000_extension_slots=['C4','D4']
	
	def move_chute(labware):
		ctx.move_labware(labware,chute,use_gripper=True) if DryRun==False else ctx.move_labware(labware,chute,use_gripper=False)

	def TipTrack(pipette):
		global tt_50
		global tt_200

		if pipette==p50:
			tt_50+=1 #Add for tip tracking
			ctx.comment(f"tt_50={tt_50}")
			if tt_50==25: # if tips on deck are depleted
				for x in p50.tip_racks[:]: #discard tipracks on deck
					if x.wells()[-1].has_tip == False: #if tip racks are empty move to chute and remove empty tip rack from list
						move_chute(x)
						p50.tip_racks.remove(x)
				for y,z in zip(p50_extension_tips,p50_on_deck_slots):
					try:
						ctx.move_labware(y,z,use_gripper=True)
					except ValueError as e:
						#ctx.comment(f'p50 Move labware list error: {e}')
						pass
				for b in range(len(p50_on_deck_slots)):
					try:
						del p50_extension_tips[0]
					except IndexError as e:
						#ctx.comment(f'p50 Extension Tip Removal Error:{e}')
						pass
			if tt_50==49:
				for x in p50.tip_racks[:]:
					if x.wells()[-1].has_tip == False: #if tip racks are empty move to chute and remove empty tip rack from list
						move_chute(x)
						p50.tip_racks.remove(x)
				for x,a in zip(p50_manual_tips,p50_slots):
					try:
						ctx.move_labware(x,a,use_gripper=False)
					except ValueError as e:
						#ctx.comment(f' p50 Move labware list error: {e}')
						pass
				for b in range(len(p50_slots)):
					try:
						del p50_manual_tips[0]
					except IndexError as e:
						#ctx.comment(f'p50 Manual Tips Removal Error: {e}')
						pass
				for c in p50_extension_slots: # only add tipracks on extension slot to extension tip list
					try:
						p50_extension_tips.append(ctx.deck[c])
					except IndexError as e:
						#ctx.comment(f'p50 Extension Tip Addition Error:{e}')
						pass
				tt_50=1
			p50.pick_up_tip()


		if pipette==p1000:
			tt_200+=1
			ctx.comment(f"tt_200={tt_200}")
			if tt_200==37:
				for x in p1000.tip_racks[:]: #discard tip racks on deck
					if x.wells()[-1].has_tip == False: #if tip racks are empty move to chute and remove empty tip rack from list
						move_chute(x)
						p1000.tip_racks.remove(x)
				for y,z in zip(p1000_extension_tips,p1000_on_deck_slots):
					try:
						ctx.move_labware(y,z,use_gripper=True)
					except ValueError as e:
						#ctx.comment(f' p1000 Move labware list error: {e}')
						pass
				for b in range(2):
					try:
						del p1000_extension_tips[0]
					except IndexError as e:
						#ctx.comment(f'p1000 Extension Tip Removal Error:{e}')
						pass
			if tt_200==61:
				for x in p1000.tip_racks[:]: #discard tip racks on deck
					if x.wells()[-1].has_tip == False: #if tip racks are empty move to chute and remove empty tip rack from list
						move_chute(x)
						p1000.tip_racks.remove(x)
				for x,a in zip(p1000_manual_tips,p1000_slots):
					try:
						ctx.move_labware(x,a,use_gripper=False)
					except ValueError as e:
						#ctx.comment(f'p1000 Move labware list error: {e}')
						pass
				for b in range(len(p1000_slots)):
					try:
						del p1000_manual_tips[0]
					except IndexError as e:
						#ctx.comment(f'p1000 Manual Tips Removal Error: {e}')
						pass
				for c in p1000_extension_slots: # only add tipracks on extension slot to extension tip list
					try:
						p1000_extension_tips.append(ctx.deck[c])
					except IndexError as e:
						#ctx.comment(f'p1000 Extension Tips Addition Error: {e}')
						pass
				tt_200=1
			p1000.pick_up_tip()

	#Labware
	if LibPrep==True:
		if on_deck_thermo==True:
			Sample_Plate_1=thermocycler.load_labware('biorad_96_wellplate_200ul_pcr')
		else:
			Sample_Plate_1=ctx.load_labware('biorad_96_wellplate_200ul_pcr','C1')
		SP1=Sample_Plate_1.rows()[0][:12]

		SMRTbell_index=ctx.load_labware('biorad_96_wellplate_200ul_pcr',protocol_api.OFF_DECK,'SMRTbell adapter index plate')
		Index=SMRTbell_index.rows()[0][SMRTbell_index_start-1:12]

		Cleanup_plate=ctx.load_labware('nest_96_wellplate_2ml_deep',protocol_api.OFF_DECK)
		CP=Cleanup_plate.rows()[0][:12]
	else:
		Cleanup_plate=ctx.load_labware('nest_96_wellplate_2ml_deep','C1')
		CP=Cleanup_plate.rows()[0][:12]


	RT_res= ctx.load_labware('nest_96_wellplate_2ml_deep','A2')
	Reagent_plate=temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
	
	
	Transfer_Plate_1=ctx.load_labware('biorad_96_wellplate_200ul_pcr',protocol_api.OFF_DECK)
	TS_1=Transfer_Plate_1.rows()[0][:12]

	#Reagent Assignments
	SMRTbell_beads=RT_res['A1']
	Ampure	=RT_res['A2']
	RSB		=RT_res['A3']
	LoadBuff96=RT_res['A4']
	EtOH	=RT_res.rows()[0][4:10]
	Supernatant_trash= RT_res['A12']
	DNArep_MM=Reagent_plate['A1']
	Ligation_MM=Reagent_plate['A2']
	Nuclease_MM=Reagent_plate['A3']
	Anneal_MM=Reagent_plate['A4']
	Polymerase_dil=Reagent_plate['A5']
	
	
	def move_gripper(labware,new_location):
		ctx.move_labware(
        labware,
        new_location,
        use_gripper=True,
        )

	def drop_tip(pipette): #return or drop tip based on boolean value
		if DryRun==True:
			pipette.return_tip()
		else:
			pipette.drop_tip()

	def mix(pipette,mix,volume,reagent,depth):
		pipette.configure_for_volume(volume)
		for x in range (mix):
			pipette.aspirate(volume,reagent.bottom(.5))
			pipette.dispense(volume,reagent.bottom(1),push_out=0)
		ctx.delay(seconds=4)
		pipette.blow_out(reagent.bottom(depth))

	#Commands
	if DryRun==False:
		temp_block.set_temperature(4)
	if LibPrep==True:
		if on_deck_thermo==True:
			thermocycler.open_lid()
			if DryRun==False:
				thermocycler.set_lid_temperature(75)
				thermocycler.set_block_temperature(4)

		#Repair and A-tail
		for x in range(Columns):
			TipTrack(p50)
			p50.aspirate(11,DNArep_MM.bottom(.4))
			ctx.delay(seconds=3)
			p50.dispense(11,SP1[x])
			mix(p50,15,50,SP1[x],7)
			drop_tip(p50)
		if on_deck_thermo==True:
			thermocycler.close_lid()
			if DryRun==False:
				profile_ER_AT = [
					{'temperature':37, 'hold_time_minutes': 30},
					{'temperature':65, 'hold_time_minutes':5}
					]
				thermocycler.execute_profile(steps=profile_ER_AT, repetitions=1, block_max_volume=60)
				thermocycler.set_block_temperature(4)
			thermocycler.open_lid()
		else:
			ctx.pause("Transfer Plate to external thermocycler")
			ctx.move_labware(
				SP1,
				protocol_api.OFF_DECK,
				use_gripper=False)
			ctx.pause('Transfer plate from external thermocycler to A1')
			ctx.move_labware(
	    		SP1,
	    		'A1',
	    		use_gripper=False)

		#Adapter Ligation
		ctx.move_labware(SMRTbell_index,'C1',use_gripper=False)
		for x in range(Columns):#poke holes into foil
			TipTrack(p1000)
			p1000.move_to(Index[x].top(-5))
			p1000.touch_tip(Index[x],radius=1.3,v_offset=-5,speed=10)
			drop_tip(p1000)
		for x in range (Columns):
			TipTrack(p50)
			p50.aspirate(4,Index[x])
			p50.dispense(4,SP1[x],push_out=0)
			ctx.delay(seconds=3)
			p50.blow_out()
			drop_tip(p50)
		for x in range(Columns):
			TipTrack(p1000)
			p1000.flow_rate.aspirate=50
			p1000.flow_rate.dispense=70
			p1000.aspirate(21,Ligation_MM)
			ctx.delay(seconds=3)
			p1000.dispense(21,SP1[x])
			mix(p1000,17,80,SP1[x],8)
			p1000.flow_rate.aspirate=100
			drop_tip(p1000)
		ctx.move_labware(SMRTbell_index,protocol_api.OFF_DECK,use_gripper=False)
		if on_deck_thermo==True:
			thermocycler.close_lid()
			if DryRun==False:
				profile_Adapter_Ligation = [
					{'temperature':20, 'hold_time_minutes': 30},
					]
				thermocycler.execute_profile(steps=profile_Adapter_Ligation, repetitions=1, block_max_volume=85)
				thermocycler.set_block_temperature(4)
			thermocycler.open_lid()
		else:
			ctx.pause("Transfer Plate to external thermocycler")
			ctx.move_labware(
	    		SP1,
	    		protocol_api.OFF_DECK,
	    		use_gripper=False)
			ctx.pause('Transfer plate from external thermocycler to C1')
			ctx.move_labware(
	    		SP1,
	    		'C1',
	    		use_gripper=False)
		
		#Ligation Cleanup
		if on_deck_thermo==True:
			move_gripper(Sample_Plate_1,'C1')
		TipTrack(p1000)
		p1000.flow_rate.aspirate=2000
		p1000.flow_rate.dispense=2000
		if Columns==1:
			p1000.mix(60,185,SMRTbell_beads)
		else:
			p1000.mix(80,200,SMRTbell_beads)
		ctx.delay(seconds=5)
		p1000.blow_out(SMRTbell_beads.bottom(12))
		drop_tip(p1000)
		p1000.flow_rate.aspirate=70
		p1000.flow_rate.dispense=70
		#Adding Ampure to NA
		for x in range(Columns):
			TipTrack(p1000)
			p1000.aspirate(85,SMRTbell_beads.bottom(z=.4))
			ctx.delay(seconds=3)
			p1000.dispense(85,SP1[x].bottom(5))
			ctx.delay(seconds=3)
			for x in range (Columns):
				for z in range(18):
					p1000.aspirate(160,SP1[x].bottom(1.5))
					p1000.dispense(160,SP1[x].bottom(4),push_out=0)
			ctx.delay(seconds=4)
			p1000.flow_rate.blow_out=70
			p1000.blow_out(SP1[x].top(-2))
			drop_tip(p1000)
		ctx.delay(minutes=10)
		move_gripper(Sample_Plate_1,mag_block)
		ctx.delay(minutes=5)
		for x in range(Columns): #Removing Sup
			TipTrack(p1000)
			p1000.flow_rate.aspirate= 40
			p1000.aspirate(85,SP1[x].bottom(3))
			ctx.delay(seconds=5)
			p1000.aspirate(75,SP1[x].bottom(1))
			p1000.dispense(160,chute)
			drop_tip(p1000)
		#ETOH washes
		p1000.flow_rate.aspirate=100
		p1000.flow_rate.dispense=100
		for z in range(2):
			for x in range(Columns): #adding EtOH
				TipTrack(p1000)
				p1000.aspirate(180, EtOH[x])
				p1000.dispense(180, SP1[x].top(-3))
				drop_tip(p1000)
			ctx.delay(seconds=30)
			for x in range(Columns): #remove EtOH
				TipTrack(p1000)
				p1000.flow_rate.aspirate=75
				p1000.aspirate(90,SP1[x].bottom(3))
				ctx.delay(seconds=5)
				p1000.aspirate(90,SP1[x].bottom(1))
				p1000.dispense(180,chute)
				drop_tip(p1000)
		p1000.flow_rate.aspirate=100
		for x in range(Columns): #remove residual liquid
			TipTrack(p50)
			p50.flow_rate.aspirate=8
			p50.aspirate(50,SP1[x].bottom(.4))
			p50.dispense(50,chute)
			drop_tip(p50)
		ctx.delay(minutes=1)
		move_gripper(Sample_Plate_1,'C1')
		for x in range(Columns):
			TipTrack(p50)
			p50.flow_rate.aspirate=15
			p50.aspirate(41,RSB.bottom(.5))
			p50.dispense(41,SP1[x].bottom(.5),push_out=0)
			p50.blow_out(SP1[x].top(-10))
			mix(p50,20,30,SP1[x],10)
			drop_tip(p50)
		ctx.delay(minutes=5)
		move_gripper(Sample_Plate_1, mag_block)
		ctx.delay(minutes=3)
		for x in range(Columns):
			TipTrack(p50)
			p50.flow_rate.aspirate=5
			p50.aspirate(30, SP1[x].bottom(z=1))
			ctx.delay(seconds=5)
			p50.aspirate(10.5,SP1[x].bottom(z=.6))
			p50.flow_rate.aspirate=12
			p50.dispense(40.5, SP1[x+6])
			ctx.delay(seconds=3)
			p50.blow_out()
			drop_tip(p50)

	    #Nuclease Treatment
		move_gripper(Sample_Plate_1,thermocycler)
		ctx.pause(f"Prepare Nuclease Master Mix and add {12*Columns} ul to each well of Column 3 of Reagent plate")
		for x in range(Columns):
			TipTrack(p50)
			p50.aspirate(10,Nuclease_MM.bottom(.4))
			p50.dispense(10,SP1[x+6])
			mix(p50,15,40,SP1[x+6],5)
			drop_tip(p50)
		if on_deck_thermo==True:
			thermocycler.close_lid()
			if DryRun==False:
				profile_Nuclease_treatment = [
					{'temperature':37, 'hold_time_minutes': 15},
					]
				thermocycler.execute_profile(steps=profile_Nuclease_treatment, repetitions=1, block_max_volume=50)
				thermocycler.set_block_temperature(4)
			thermocycler.open_lid()
		else:
			ctx.pause("Transfer Plate to external thermocycler")
			ctx.move_labware(
	    		SP1,
	    		protocol_api.OFF_DECK,
	    		use_gripper=False)
			ctx.pause('Transfer plate from external thermocycler to B1')
			ctx.move_labware(
	    		SP1,
	    		'B1',
	    		use_gripper=False)

	    #Ampure Cleanup
		ctx.move_labware(Cleanup_plate,'C1',use_gripper=False)
		p1000.flow_rate.aspirate=40
		for x in range(Columns):
			TipTrack(p1000)
			p1000.aspirate(50,SP1[x+6].bottom(z=.4))
			ctx.delay(seconds=3)
			p1000.aspirate(10,SP1[x+6].bottom(z=.2))
			ctx.delay(seconds=3)
			p1000.dispense(60,CP[x])
			ctx.delay(seconds=3)
			p1000.blow_out()
			drop_tip(p1000)
		TipTrack(p1000)
		p1000.flow_rate.aspirate=1500
		p1000.flow_rate.dispense=1500
		if Columns==1:
			p1000.mix(70,150,Ampure.bottom(2.5))
		else:
			p1000.mix(80,200,Ampure.bottom(2))
		ctx.delay(seconds=5)
		p1000.blow_out(Ampure.bottom(12))
		drop_tip(p1000)
		p1000.flow_rate.aspirate=100
		p1000.flow_rate.dispense=100
		#Adding Ampure to NA
		for x in range(Columns):
			TipTrack(p1000)
			p1000.aspirate(155,Ampure.bottom(.3))
			ctx.delay(seconds=3)
			p1000.dispense(155, CP[x])
			mix(p1000,15,190,CP[x],3)
			drop_tip(p1000)
		move_gripper(Sample_Plate_1,chute)
		ctx.delay(minutes=20)
		move_gripper(Cleanup_plate,mag_block)
		ctx.delay(minutes=5)
		for x in range(Columns): #Removing Sup
			TipTrack(p1000)
			p1000.flow_rate.aspirate=25
			p1000.aspirate(100,CP[x])
			ctx.delay(seconds=5)
			p1000.aspirate(100,CP[x].bottom(.2))
			p1000.flow_rate.aspirate=100
			p1000.dispense(200,chute)
			drop_tip(p1000)
		#ETOH washes
		for z in range(2):
			for x in range(Columns): #adding EtOH
				TipTrack(p1000)
				p1000.aspirate(180, EtOH[x].bottom(.2))
				p1000.dispense(180, CP[x])
				drop_tip(p1000)
			ctx.delay(seconds=30)
			for x in range(Columns): #remove EtOH
				TipTrack(p1000)
				p1000.aspirate(180,CP[x].bottom(0))
				p1000.dispense(180,chute)
				drop_tip(p1000)
		for x in range(Columns): #remove residual liquid
			TipTrack(p50)
			p50.flow_rate.aspirate=8
			p50.aspirate(50,CP[x].bottom(0))
			p50.dispense(50,chute)
			drop_tip(p50)
		ctx.delay(minutes=1.5)
		ctx.move_labware(Cleanup_plate,'C1',use_gripper=True)
		for x in range(Columns):
			TipTrack(p50)
			p50.aspirate(25,RSB.bottom(.1))
			p50.dispense(25,CP[x].bottom(.3),push_out=0)
			p50.blow_out(CP[x].bottom(1.5))
			#mix(20,20,CP[x])
			drop_tip(p50)
		for x in range(Columns):
			TipTrack(p50)
			'''p1000.aspirate(20,CP[x])
			p1000.default_speed=10
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,x=2.4)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,x=2.4)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=5)))

			p1000.aspirate(20,CP[x])
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,x=-2.4)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,x=-2.3)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=-5)))

			p1000.aspirate(20,CP[x])
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,y=2.4)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,y=2.3)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=-5)))

			p1000.aspirate(20,CP[x])
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,y=-2.4)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,y=-2.3)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=-5)))

			p1000.aspirate(20,CP[x])
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,x=1.8,y=1.8)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,x=1.8,y=1.8)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=-5)))

			p1000.aspirate(20,CP[x])
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,x=-1.8,y=1.8)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,x=-1.8,y=1.8)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=-5)))

			p1000.aspirate(20,CP[x])
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,x=1.8,y=-1.8)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,x=1.8,y=-1.8)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=-5)))

			p1000.aspirate(20,CP[x])
			p1000.move_to(CP[x].bottom().move(types.Point(z=5,x=-1.8,y=-1.8)))
			p1000.move_to(CP[x].bottom().move(types.Point(z=1,x=-1.8,y=-1.8)),force_direct=True)
			p1000.dispense(20,CP[x],push_out=0)
			p1000.blow_out(CP[x].top().move(types.Point(x=0,y=0,z=-5)))
	    
			for y in range (10):
				p1000.aspirate(20,CP[x])
				p1000.dispense(20,CP[x],push_out=0)
			ctx.delay(seconds=5)
			p1000.blow_out(CP[x].bottom(7))
			p1000.default_speed=400
			drop_tip(p1000)'''
			mix(p50,15,20,CP[x],2)
			drop_tip(p50)
		ctx.delay(minutes=5)
		ctx.move_labware(Cleanup_plate, mag_block,use_gripper=True)
		ctx.delay(minutes=3)
		for x in range(Columns):
			TipTrack(p50)
			p50.flow_rate.aspirate=8
			p50.aspirate(15, CP[x].bottom(.4))
			ctx.delay(seconds=5)
			p50.flow_rate.aspirate=2
			p50.aspirate(15,CP[x].bottom(0))
			p50.flow_rate.aspirate=15
			p50.dispense(30, CP[x+6],push_out=0)
			ctx.delay(seconds=3)
			p50.blow_out()
			drop_tip(p50)
		move_gripper(Cleanup_plate, 'C1')
		ctx.pause(f"QC SMRTbell Libraries")
		if not ABC:
			ctx.home()

	#ABC
	if ABC==True:
		for x in range(Columns):
			p1000.flow_rate.aspirate=40
			p1000.flow_rate.dispense=40
			p50.flow_rate.aspirate=8
			p50.flow_rate.dispense=8
			TipTrack(p50)
			p50.aspirate(25,Anneal_MM.bottom(.3))
			ctx.delay(seconds=3)
			p50.dispense(25,CP[x+6])
			mix(p50,17,40,CP[x+6],1)
			drop_tip(p50)
		ctx.delay(minutes=15)
		for x in range(Columns):
			TipTrack(p1000)
			p1000.aspirate(50,Polymerase_dil.bottom(.3))
			ctx.delay(seconds=3)
			p1000.dispense(50,CP[x+6])
			mix(p1000,15,90,CP[x+6],2)
			drop_tip(p1000)
		ctx.delay(minutes=15)

		TipTrack(p1000)
		p1000.flow_rate.aspirate=1000
		p1000.flow_rate.dispense=1000
		if Columns<=2:
			p1000.mix(60,80,SMRTbell_beads.bottom(2))
		else:
			p1000.mix(80,200,SMRTbell_beads.bottom(2))
		ctx.delay(seconds=5)
		p1000.blow_out(SMRTbell_beads.bottom(12))
		drop_tip(p1000)
		p1000.flow_rate.aspirate=50
		p1000.flow_rate.dispense=50

	    #Post-Binding cleanup with 1X SMRTbell cleanup beads
		for x in range(Columns):
			TipTrack(p1000)
			p1000.flow_rate.blow_out=40
			p1000.aspirate(100,SMRTbell_beads.bottom(z=.4))
			ctx.delay(seconds=3)
			p1000.dispense(100, CP[x+6],push_out=0)
			p1000.blow_out(CP[x+6].top(-20))
			mix(p1000,15,175,CP[x+6],2)
			drop_tip(p1000)
		ctx.delay(minutes=10)
		ctx.move_labware(Cleanup_plate,mag_block,use_gripper=True)
		ctx.delay(minutes=5)
		for x in range(Columns): #Removing Sup
			TipTrack(p1000)
			p1000.aspirate(120,CP[x+6].bottom(1))
			ctx.delay(seconds=5)
			p1000.flow_rate.aspirate=25
			p1000.aspirate(65,CP[x+6].bottom(0))
			p1000.dispense(185,chute)
			drop_tip(p1000)
		for x in range(Columns): #remove residual liquid
			p50.flow_rate.aspirate=8
			p50.flow_rate.dispense=8
			TipTrack(p50)
			p50.aspirate(50,CP[x+6].bottom(0))
			p50.dispense(50,chute)
			drop_tip(p50)
		ctx.move_labware(Cleanup_plate,'C1',use_gripper=True)
		ctx.pause('add loading buffer to Column 4 in Nest plate on slot A2')
		if SPRQ=="SPRQ":
			for x in range(Columns):
				TipTrack(p50)
				p50.aspirate(25,LoadBuff96.bottom(.1))
				p50.dispense(25,CP[x+6].bottom(.3),push_out=0)
				ctx.delay(seconds=3)
				p50.blow_out(CP[x+6].bottom(1))
				mix(p50,15,20,CP[x+6],1)
				drop_tip(p50)
		else:
			for x in range(Columns):
				TipTrack(p50)
				p50.aspirate(50,LoadBuff96.bottom(.1))
				p50.dispense(50,CP[x+6].bottom(.3),push_out=0)
				ctx.delay(seconds=3)
				p50.blow_out(CP[x+6].bottom(1))
				mix(p50,15,40,CP[x+6],1)
				drop_tip(p50)
		if SPRQ=="SPRQ":
			ctx.delay(minutes=15)
		else:
			ctx.delay(minutes=5)
		move_gripper(Cleanup_plate,mag_block)
		ctx.move_labware(Transfer_Plate_1,'C1',use_gripper=False)
		ctx.delay(minutes=3)
		if SPRQ=="SPRQ":
			for x in range(Columns):
				TipTrack(p50)
				p50.aspirate(20, CP[x+6].bottom(z=.3))
				ctx.delay(seconds=5)
				p50.flow_rate.aspirate=4
				p50.aspirate(10,CP[x+6].bottom(0))
				p50.flow_rate.dispense=4
				p50.dispense(30, TS_1[x])
				ctx.delay(seconds=4)
				p50.blow_out()
				drop_tip(p50)
		else:
			for x in range(Columns):
				TipTrack(p50)
				p50.aspirate(40, CP[x+6].bottom(z=.3))
				ctx.delay(seconds=5)
				p50.flow_rate.aspirate=4
				p50.aspirate(10,CP[x+6].bottom(0))
				p50.flow_rate.dispense=4
				p50.dispense(50, TS_1[x])
				ctx.delay(seconds=4)
				p50.blow_out()
				drop_tip(p50)
		ctx.home()
		thermocycler.deactivate_block()
		thermocycler.deactivate_lid()

	#													Liquid Definitions and Assignments
		##################################################################################################################################################
		Samples_=ctx.define_liquid(name="Samples",description="Samples",display_color="#0000cc")
		for well in Sample_Plate_1.wells()[:Columns*8]:
			well.load_liquid(liquid=Samples_,volume=49)
		SMRTbell_beads_=ctx.define_liquid(name="SMRTbell Beads",description="SMRTbell Beads",display_color="#663300")
		for well in RT_res.wells()[0:8]:
			well.load_liquid(liquid=SMRTbell_beads_, volume=200*Columns)
		Amp_=ctx.define_liquid(name="35% Ampure",description="35% Ampure",display_color="#966333")
		for well in RT_res.wells()[8:16]:
			well.load_liquid(liquid=Amp_,volume=185*Columns)
		RSB_=ctx.define_liquid(name="Elution Buffer",description="Elution Buffer", display_color="#e6f9ff")
		for well in RT_res.wells()[16:24]:
			well.load_liquid(liquid=RSB_,volume=72*Columns)
		Loadbuff_=ctx.define_liquid(name="Loading Buffer 96",description="Loading Buffer 96", display_color="#009900")
		for well in RT_res.wells()[24:32]:
			well.load_liquid(liquid=Loadbuff_,volume=55*Columns)
		EtOH_=ctx.define_liquid(name="80% Ethanol", description="80% Ethanol",display_color="#a3a3c2")
		for well in RT_res.wells()[32:32+(Columns*8)]:
			well.load_liquid(liquid=EtOH_,volume=800)


		DNArep_MM_=ctx.define_liquid(name="DNA Repair Mix",description="DNA Repair Master Mix",display_color="#fcc000")
		for well in Reagent_plate.wells()[0:8]:
			well.load_liquid(liquid=DNArep_MM_,volume=12.5*Columns)
		Ligation_MM_=ctx.define_liquid(name="Ligation Mix", description="Ligation Master Mix",display_color="#e60000")
		for well in Reagent_plate.wells()[8:16]:
			well.load_liquid(liquid=Ligation_MM_,volume=23.1*Columns)
		Nuclease_MM_=ctx.define_liquid(name="Nuclease Mix",description="Nuclease Master Mix", display_color="#9900ff")
		for well in Reagent_plate.wells()[16:24]:
			well.load_liquid(liquid=Nuclease_MM_,volume=11*Columns)
		Anneal_MM_=ctx.define_liquid(name="Annealing Mix", description="Annealing Master Mix",display_color="#99d6ff")
		for well in Reagent_plate.wells()[24:32]:
			well.load_liquid(liquid=Anneal_MM_,volume=27.5*Columns)
		Polymerase_dil_=ctx.define_liquid(name="Polymerase Dilution", description="Polymerase Dilution",display_color="#ff66a3")
		for well in Reagent_plate.wells()[32:40]:
			well.load_liquid(liquid=Polymerase_dil_,volume=55*Columns)
