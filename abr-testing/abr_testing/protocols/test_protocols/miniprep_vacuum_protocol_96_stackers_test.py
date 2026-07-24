'''
The user has the option to process samples column by column or full plates. However, all buffers (maybe not PE) will be dispensed from a 12-well reservoir 
column by column so we'll always need partial pick up from the 96-channel pipette.

Pending things:
- Revisit mixing to resuspend pellet and for P2/N3 (less mixing enough? Higher speed?)
- Lids?

Pending things when vacuum:
- Labware definitions for new plates (filter plate, silica membrane plate)
    Adjust offsets
    Transfer liquids into silica plate from higher



- Labware definitions for collection plate (which plate?)
- Optimize dispense height into filter and silica membrane plates

HTP version:
- Runtime parameter for number of plates
- Probably rework tips needed calculations
- Labware definitions for stacking plates on the deck (Songnian might have a solve for this already)
- Hack stacker to add more than one type of plate (with opentrons lids?)

'''


from opentrons import protocol_api, types
from opentrons.protocol_api import SINGLE, ALL, PARTIAL_COLUMN, COLUMN
from typing import cast
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    VacuumModuleContext,
)
from math import ceil, floor

# from opentrons.protocol_api import (
#     ProtocolContext,
#     ParameterContext,
#     VacuumModuleContext,
# )

metadata = {
    'protocolName': 'Minipreps with 96-Channel Pipette',
    'author': 'Albert Serra Cardona',
    'description': 'Miniprep protocol with 96-channel pipette and vacuum manifold integration',
    'source': 'Albert Serra Cardona'
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.30'
}

def add_parameters(parameters):
    parameters.add_str(
                       variable_name="num_samples",
                       display_name="Number of Samples to process",
                       description="Number of Samples in the 96DWP to process for miniprep",
                       choices=[
                            {"display_name": "8 Samples", "value": "8"},
                            {"display_name": "24 Samples", "value": "24"},
                            {"display_name": "48 Samples", "value": "48"},
                            {"display_name": "96 Samples", "value": "96"},
                        ],
                        default="24",
                       )
    
    parameters.add_str(
                        variable_name="sample_plate_type",
                        display_name="Sample Plate Type",
                        choices=[
                            {"display_name": "24 DeepWell Plate 5.0mL", "value": "nest_24_wellplate_10400ul"},
                            {"display_name": "96 DeepWell Plate 2.2mL", "value": "nest_96_wellplate_2ml_deep"},
                        ],
                        default="nest_96_wellplate_2ml_deep",
    )

    parameters.add_int(
                       variable_name="num_plates",
                       display_name="Number of 24DWPs",
                       description="Number of 24DWPs with E. coli pellets to be processed ",
                       default=1,
                       minimum=1,
                       maximum=4
                       )
    
    parameters.add_str(
                        variable_name="process_by",
                        display_name="Sample Processing",
                        choices=[
                            {"display_name": "Column by Column", "value": "column"},
                            {"display_name": "Full Plate", "value": "plate"},
                        ],
                        default="column",
                        description='Processing column by column will be slower but will require less tips'
    )

    parameters.add_str(
                        variable_name="lysis_type",
                        display_name="Lysis Method",
                        choices=[
                            {"display_name": "Lyse by pipetting", "value": "pipette"},
                            {"display_name": "Lyse by vortexing", "value": "vortex"},
                        ],
                        default="pipette",
    )
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="The kind of Collar (Opentrons or Millipore)",
        default="opentrons_vacuum_manifold_collar_tall",
        choices=[
            {
                "display_name": "Millipore: Short",
                "value": "opentrons_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Millipore: Tall",
                "value": "opentrons_vacuum_manifold_collar_tall",
            },
        ],
    )
    parameters.add_int(
                       variable_name="column_to_process",
                       display_name="Column to process",
                       description="Column containing the samples (8 samples only)",
                       default=1,
                       minimum=1,
                       maximum=12
    )

    parameters.add_bool(
        variable_name="liquid_run",
        display_name="Liquid Run",
        description="If True, the protocol will run in liquid mode and will dispense all liquids",
        default=False,
    )

  

# def DWP_24_to_96(well, plate_num):
#     '''Function to reformat samples from a 24DWP into a 96DWP. The reformatting happens in columns: column 1 of the 24DWP goes into A1-D1, column 2 into E1-H1, column 3 into A2-D2, ...
#     The function takes a 24DWP well and returns the 96DWP well. It only works for a single 24DWP for now.'''
#     bottom_half = {
#         'A' : 'E',
#         'B' : 'F',
#         'C' : 'G',
#         'D' : 'H',
#     }
#     column_num = int(well[-1]) if len(well) == 2 else int(well[-2:])
#     if column_num % 2 == 0:
#         new_row_num = bottom_half[well[0]]
#         new_column_num = ceil(column_num/2) + ((plate_num-1)*3)
#     else:
#         new_row_num = well[0]
#         new_column_num = ceil(column_num/2) + ((plate_num-1)*3)
#     return str(new_row_num) + str(new_column_num)


def _swap_1000ul_tips(ctx, pip_96_1000, tip_rack, adapter, stacker, trash):
    """
    Trash old 1000µL tip box, retrieve new from D4 stacker, trash lid, move to B3.
    Call before a critical pickup when tips_used exceeds threshold.
    """
    ctx.comment("Swapping 1000µL tip box — retrieving from D4 stacker...")
    ctx.move_labware(tip_rack, trash, use_gripper=True)
    new_tips = stacker.retrieve()
    ctx.move_lid(new_tips, trash, use_gripper=True)
    ctx.move_labware(labware=new_tips, new_location=adapter, use_gripper=True)
    pip_96_1000.tip_racks = [new_tips]
    return new_tips

def swap_pipetting_type(pipette, process_by, tip_rack):
    if process_by == 'column':
        style = COLUMN
        start = 'A12'
    if process_by == 'plate':
        style = ALL 
        start = 'A1'  

    pipette.configure_nozzle_layout(
        style=style,
        start=start,
        tip_racks=[tip_rack])
    
def vacuum(ctx, vm_mod, pressure, time):
        vm_mod.close_vent()
        vm_mod.start_set_vacuum_pressure(pressure, time, vent_after=True)
        ctx.delay(
            time, msg=f"Start Vacuum {pressure} mbar for {time}s"
        )


# Constant variables
ELUTION_VOLUME = 20
VACUUM_PRESSURE = -300
VACUUM_TIME = 20


def run(ctx: protocol_api.ProtocolContext):
    # Access runtime parameter────────────────────────────────────────────────────────────
    num_samples = int(ctx.params.num_samples)
    sample_plate_type = ctx.params.sample_plate_type
    num_plates = ctx.params.num_plates
    process_by = 'plate' if num_samples == 96 else ctx.params.process_by
    num_col = int(num_samples/8)
    lysis_type = ctx.params.lysis_type

    # # Additional validation beyond parameter constraints
    # if num_plates > 1 and sample_plate_type == "nest_96_wellplate_2ml_deep":
    #     raise ValueError(f"This protocol can only process a single 96DWP of samples or up to 24DWPs")
    
    # Load modules and labware────────────────────────────────────────────────────────────
    # Load waste chute
    waste_chute = ctx.load_waste_chute()

    h_s = ctx.load_module('heaterShakerModuleV1', 'D1')
    h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')

    vm_mod = cast(
            VacuumModuleContext,
            ctx.load_module(module_name="vacuumModuleV1", location="A3"),
        )
    manifold_collar = vm_mod.load_adapter_to_dock(ctx.params.collar)  # type: ignore[attr-defined]

    # Load labware
    reservoir_12well = ctx.load_labware('usascientific_12_reservoir_22ml', 'A2')
    # reservoir_12well = ctx.load_labware("mystery_12_reservoir_22000ul", 'A2')
    

    # Plates
    # if sample_plate_type == 'nest_24_wellplate_10400ul':
    #     DWP24_dict = {}
    #     for i in range(num_plates):
    #     #THIS ONLY WORKS FOR A SINGLE PLATE FOR NOW
    #         DWP24_dict[f'DWP24_sample_plate_{i+1}'] = ctx.load_labware('nest_24_wellplate_10400ul', 'A1', f'24DWP Sample plate {i+1}')
    sample_plate = h_s_adapter.load_labware('nest_96_wellplate_2ml_deep', 'Sample Plate')

    #NOTE nunc_96_well_filter_plate
    nunc_filter_plate = manifold_collar.load_labware("millipore_96_wellplate_300ul_pcr_filter", "Nunc Filter Plate") 
    # nunc_filter_plate.set_offset(x=0.00, y=0.00, z=0.00)

    silica_plate_base = ctx.load_labware("nunc_96_wellplate_450ul", 'C1', 'Silica membrane plate base')
    silica_plate_base.set_offset(x=0.00, y=0.00, z=0.00)
    #NOTE luna_silica_96_plate
    silica_plate = silica_plate_base.load_labware("millipore_96_wellplate_300ul_pcr_filter", 'Silica membrane plate')
    silica_plate.set_offset(x=0.00, y=0.00, z=-40)

    elution_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'B1', 'Elution plate')
    collection_plate = vm_mod.load_labware('nest_96_wellplate_2ml_deep', 'Collection Plate') # Loaded inside the manifold on slot A3

    
    # Count tips needed
    total_tips = 0
    # Tips for dispensing buffers (P1, P2, N3, elution): 8 tips per buffer
    total_dispensing_tips = 8 * 4
    total_tips += total_dispensing_tips
    # Tips for mixing P1, mixing P2, mixing N3, transferring to filter plate, transferring to silica plate, and PE buffer: 6 tip per sample or 5 tip boxes
    if process_by == 'column': # By column we can't reuse tips because the Flex can't return them to the tip box
        total_mixing_tips = (num_col * 8 * 4) + 8 - (8 * 3) # Add 8 tips to dispense PE and substract the tips used for dipsensing P1, P2, and N3 because we reuse them for the first column
        total_tips += total_mixing_tips
        total_tipboxes = ceil(total_tips/96)
    if process_by == 'plate': # Reuse tips for P1, P2, N3, and transferring to filter plate
        total_mixing_tips = 96 * 2 + 8 # We only need full tip boxes
        total_tips += total_mixing_tips
        total_tipboxes = ceil(total_tips/96)

    print(total_tipboxes)

    tips_1000 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B2')
    if process_by == 'plate':
        tiprack_adapter = ctx.load_adapter('opentrons_flex_96_tiprack_adapter', 'C2')
        tips_1000_adapter = tiprack_adapter.load_labware('opentrons_flex_96_tiprack_1000ul')
    tip_racks = [tips_1000]

    # Load stackers
    if total_tipboxes > 2 and process_by == 'plate':
        stacker_tips = ctx.load_module("flexStackerModuleV1", "D4")
        tipboxes_on_deck = 2
        stacker_tips.set_stored_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', count=total_tipboxes-tipboxes_on_deck, lid="opentrons_flex_tiprack_lid")
    if total_tipboxes > 1 and process_by == 'column':
        stacker_tips = ctx.load_module("flexStackerModuleV1", "D4")
        tipboxes_on_deck = 1
        stacker_tips.set_stored_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', count=total_tipboxes-tipboxes_on_deck, lid="opentrons_flex_tiprack_lid")
    
    # Load pipette
    pip_96_1000 = ctx.load_instrument(
        'flex_96channel_1000',
        'left',
        tip_racks=tip_racks,
        liquid_presence_detection=ctx.params.liquid_run
    )
    
    # Define liquids    
    p1_buffer = ctx.define_liquid(
        name="P1 Buffer",
        description="P1 Buffer for lysis",
        display_color="#FF0000"
    )
    p2_buffer = ctx.define_liquid(
        name="P2 Buffer",
        description="P2 Buffer for lysis",
        display_color="#0000FF"
    )
    n3_buffer = ctx.define_liquid(
        name="N3 Buffer",
        description="N3 Buffer for neutralization",
        display_color="#FFFF00"
    )
    elution_buffer = ctx.define_liquid(
        name="Elution Buffer",
        description="Elution Buffer",
        display_color="#FF00FF"
    )
    pe_buffer = ctx.define_liquid(
        name="PE Buffer",
        description="PE Buffer for washing",
        display_color="#00FF00"
    )
    filtrate = ctx.define_liquid(
        name="Filtrate",
        description="Filtrate from collection",
        display_color="#808080"
    )
    
    # Load liquids into labware
    if sample_plate_type == 'nest_96_wellplate_2ml_deep':
        P_buffer_volume = 70
        P1_mix_volume = 50
        P2_mix_volume = 120
        N3_buffer_volume = 100
        N3_mix_volume = 200
        pe_buffer_volume = 425

    if sample_plate_type == 'nest_24_wellplate_10400ul':
        P_buffer_volume = 250
        P1_mix_volume = 200
        P2_mix_volume = 400
        N3_buffer_volume = 350
        N3_mix_volume = 700

    p_buffer_volume_reservoir = P_buffer_volume * num_samples + 1000
    n3_buffer_volume_reservoir = N3_buffer_volume * num_samples + 1000
    elution_buffer_volume_reservoir = ELUTION_VOLUME * num_samples + 1000
    reservoir_12well['A1'].load_liquid(liquid=p1_buffer, volume=p_buffer_volume_reservoir)
    reservoir_12well['A2'].load_liquid(liquid=p2_buffer, volume=p_buffer_volume_reservoir)
    reservoir_12well['A3'].load_liquid(liquid=n3_buffer, volume=n3_buffer_volume_reservoir)
    reservoir_12well['A4'].load_liquid(liquid=elution_buffer, volume=elution_buffer_volume_reservoir)

    total_pe_buffer_volume = 425 * num_samples
    pe_buffer_fullwells_num = floor(total_pe_buffer_volume/20500)
    pe_buffer_lastwell_volume = total_pe_buffer_volume % 20500
    available_wells_for_pe_buffer = ['A12', 'A11', 'A10', 'A9', 'A8', 'A7', 'A6', 'A5']
    pe_buffer_reservoir_wells = [] # This will be list with the actual wells containing PE buffer for the run
    for well in range(pe_buffer_fullwells_num):
        reservoir_12well[available_wells_for_pe_buffer[well]].load_liquid(liquid=pe_buffer, volume=21500) # We load 21500µl but only 20500µl are usable
        pe_buffer_reservoir_wells.append(available_wells_for_pe_buffer[well])
    reservoir_12well[available_wells_for_pe_buffer[pe_buffer_fullwells_num]].load_liquid(liquid=pe_buffer, volume=pe_buffer_lastwell_volume+1000) # Last well with PE buffer
    pe_buffer_reservoir_wells.append(available_wells_for_pe_buffer[pe_buffer_fullwells_num])

    
    # Get all columns for transfers
    column_list_96 =[]
    for column in range(1,13):
        current_column = []
        for row in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
            current_column.append(row+str(column))
        column_list_96.append(current_column)
        current_column = []
    column_list_96

    column_list_24 =[]
    for column in range(1,7):
        current_column = []
        for row in ['A', 'B', 'C', 'D']:
            current_column.append(row+str(column))
        column_list_24.append(current_column)
        current_column = []
    column_list_24

    columns_to_pipette = column_list_96[0:num_col]
    columns_to_pipette_24 = column_list_24[0:num_col]

    sample_columns = columns_to_pipette
    sample_columns_24 = columns_to_pipette_24
    nunc_columns = columns_to_pipette
    silica_columns = columns_to_pipette
    collection_columns = columns_to_pipette
        
    wells_to_dispense = [well for col in sample_plate.columns()[:num_col] for well in col]
  
    # Protocol steps

    tip_counter = 96

    if sample_plate_type == 'nest_24_wellplate_10400ul':
        if num_col > 12:
            empty_tips_warning = f'Make sure that the tip box in slot C1 and the first {num_col-12} columns of the tip box in slot C2 have no tips in rows B, D, F, or H and visually inspect the Flex after starting the protcol'
        else:
            empty_tips_warning = f'Make sure that the first {num_col} columns of the tip box in slot C1 have no tips in rows B, D, F, or H and visually inspect the Flex after starting the protcol'
        ctx.pause(empty_tips_warning)
    
    h_s.close_labware_latch()

    ctx.move_labware(manifold_collar, vm_mod, use_gripper=True)

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  STEP 1 — P1 BUFFER DISPENSING AND PELLET RESUSPENSION               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    if lysis_type == 'pipette':
        with ctx.group_steps(name="Step 1 - P1 Buffer Dispensing and Pellet Resuspension", description="Add P1 Buffer to Sample plate and resuspend the pellet"):
            ctx.comment("=== Adding P1 Buffer to Sample plate ===")

            if sample_plate_type == 'nest_96_wellplate_2ml_deep':
                swap_pipetting_type(pip_96_1000, 'column', tips_1000) #always dispense P1 column by column

                pip_96_1000.pick_up_tip()
                pip_96_1000.aspirate(P_buffer_volume*num_col*1.1, reservoir_12well['A1'])

                for col in sample_columns:
                    # pip_96_1000.move_to(sample_plate[col[0]].bottom(z=1))
                    # ctx.pause("Pause")
                    pip_96_1000.dispense(P_buffer_volume, sample_plate[col[0]].bottom(z=20))

                h_s.set_and_wait_for_shake_speed(rpm=1500)
                ctx.delay(seconds=60)
                h_s.deactivate_shaker()


                if process_by == 'plate':
                    pip_96_1000.drop_tip()
                    tip_counter -= 8
                    swap_pipetting_type(pip_96_1000, process_by, tips_1000_adapter)
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.mix(5, P1_mix_volume, sample_plate['A1'].bottom(z=1), rate=0.7)
                    well_offsets = [[1,0],[0.75,0.75],[0,1],[-0.75,0.75],[-1,0],[-0.75,-0.75],[0,-1],[0.75,-0.75]]
                    for offset in well_offsets:
                        adjusted_location = sample_plate['A1'].bottom().move(types.Point(x=offset[0], y=offset[1], z=1))
                        pip_96_1000.mix(5, P1_mix_volume, adjusted_location, rate=0.7)
                    pip_96_1000.move_to(sample_plate['A1'].bottom(z=15)) # Move above where we mixed to blow out
                    pip_96_1000.blow_out()
                    pip_96_1000.return_tip()
                    pip_96_1000.reset_tipracks()
                    # tips_1000_adapter = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000_adapter, tiprack_adapter, stacker_tips, waste_chute)

                if process_by == 'column':
                    for col in sample_columns:
                        if col[0] != 'A1': #for the first column we are reusing the tips used for dispensing P1
                            pip_96_1000.pick_up_tip()
                        pip_96_1000.mix(5, P1_mix_volume, sample_plate[col[0]].bottom(z=1), rate=0.7)
                        well_offsets = [[1,0],[0.75,0.75],[0,1],[-0.75,0.75],[-1,0],[-0.75,-0.75],[0,-1],[0.75,-0.75]]
                        for offset in well_offsets:
                            adjusted_location = sample_plate[col[0]].bottom().move(types.Point(x=offset[0], y=offset[1], z=1))
                            pip_96_1000.mix(5, P1_mix_volume, adjusted_location, rate=0.7)
                        pip_96_1000.move_to(sample_plate['A1'].bottom(z=15)) # Move above where we mixed to blow out
                        pip_96_1000.blow_out()
                        pip_96_1000.drop_tip()
                        tip_counter -= 8
                        if tip_counter <= 0:
                            tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                            tip_counter = 96

        # ╔══════════════════════════════════════════════════════════════════════╗
        # ║  STEP 2 — P2 BUFFER DISPENSING AND MIXING                            ║
        # ╚══════════════════════════════════════════════════════════════════════╝
        with ctx.group_steps(name="Step 2 - P2 Buffer Dispensing and Mixing", description="Add P2 Buffer to Sample plate and mix"):
            ctx.comment("=== Adding P2 Buffer to Sample plate ===")

            if sample_plate_type == 'nest_96_wellplate_2ml_deep':
                swap_pipetting_type(pip_96_1000, 'column', tips_1000) #always dispense P2 column by column

                pip_96_1000.pick_up_tip()
                pip_96_1000.aspirate(P_buffer_volume*num_col*1.1, reservoir_12well['A2'])

                for col in sample_columns:
                    pip_96_1000.dispense(P_buffer_volume, sample_plate[col[0]].bottom(z=20))

                if process_by == 'plate':
                    pip_96_1000.drop_tip()
                    tip_counter -= 8
                    if tip_counter <= 0:
                        tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                    swap_pipetting_type(pip_96_1000, process_by, tips_1000_adapter)
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.mix(7, P2_mix_volume, sample_plate['A1'].bottom(z=1), rate=0.5)
                    pip_96_1000.move_to(sample_plate['A1'].bottom(z=15)) # Move above where we mixed to blow out
                    pip_96_1000.blow_out()
                    pip_96_1000.return_tip()
                    pip_96_1000.reset_tipracks()
                    # tips_1000_adapter = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000_adapter, tiprack_adapter, stacker_tips, waste_chute)

                if process_by == 'column':
                    for col in sample_columns:
                        if col[0] != 'A1': #for the first column we are reusing the tips used for dispensing P2
                            pip_96_1000.pick_up_tip()
                        pip_96_1000.mix(7, P2_mix_volume, sample_plate[col[0]].bottom(z=1), rate=0.5)
                        pip_96_1000.move_to(sample_plate['A1'].bottom(z=15)) # Move above where we mixed to blow out
                        pip_96_1000.blow_out()
                        pip_96_1000.drop_tip()
                        tip_counter -= 8
                        if tip_counter <= 0:
                            tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                            tip_counter = 96

        # ╔══════════════════════════════════════════════════════════════════════╗
        # ║  STEP 3 — N3 BUFFER DISPENSING, MIXING, AND TRANSFER TO FILTER PLATES║
        # ╚══════════════════════════════════════════════════════════════════════╝
        with ctx.group_steps(name="Step 3 - N3 Buffer Dispensing, Mixing, and Transfer to Filter Plates", description="Add N3 Buffer to Sample plate and mix"):
            ctx.comment("=== Adding N3 Buffer to Sample plate ===")

            if sample_plate_type == 'nest_96_wellplate_2ml_deep':
                swap_pipetting_type(pip_96_1000, 'column', tips_1000) #always dispense N3 column by column

                #if there are more than 9 columns of samples we can't aspirate all the N3 buffer needed in one go
                if num_col > 9:
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.aspirate(N3_buffer_volume*9*1.1, reservoir_12well['A3']) 
                    for col in sample_columns[:9]:
                        pip_96_1000.dispense(N3_buffer_volume, sample_plate[col[0]].bottom(z=20))   

                    pip_96_1000.aspirate(N3_buffer_volume*(num_col-9)*1.1, reservoir_12well['A3']) 
                    for col in sample_columns[9:]:
                        pip_96_1000.dispense(N3_buffer_volume, sample_plate[col[0]].bottom(z=20))  

                else:
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.aspirate(N3_buffer_volume*num_col*1.1, reservoir_12well['A3'])
                    for col in sample_columns:
                        pip_96_1000.dispense(N3_buffer_volume, sample_plate[col[0]].bottom(z=20))

                if process_by == 'plate':
                    pip_96_1000.drop_tip()
                    tip_counter -= 8
                    if tip_counter <= 0:
                        tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                    swap_pipetting_type(pip_96_1000, process_by, tips_1000_adapter)
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.mix(7, N3_mix_volume, sample_plate['A1'].bottom(z=1), rate=0.5)
                    pip_96_1000.move_to(sample_plate['A1'].bottom(z=15)) # Move above where we mixed to blow out
                    pip_96_1000.blow_out()

                    pip_96_1000.aspirate(350, sample_plate['A1'].bottom(), rate=0.5)
                    pip_96_1000.dispense(350, nunc_filter_plate['A1'].bottom(z=15), rate=0.5)
                    pip_96_1000.move_to(nunc_filter_plate['A1'].bottom(z=20)) # Move above where we dispensed to blow out
                    pip_96_1000.blow_out()
                    pip_96_1000.drop_tip()
                    tips_1000_adapter = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000_adapter, tiprack_adapter, stacker_tips, waste_chute)
                    # pip_96_1000.return_tip()
                    # pip_96_1000.reset_tipracks()

                if process_by == 'column':
                    for col in sample_columns:
                        if col[0] != 'A1': #for the first column we are reusing the tips used for dispensing P2
                            pip_96_1000.pick_up_tip()
                        pip_96_1000.mix(7, N3_mix_volume, sample_plate[col[0]].bottom(z=1), rate=0.5)
                        pip_96_1000.aspirate(350, sample_plate[col[0]].bottom(), rate=0.5)
                        pip_96_1000.dispense(350, nunc_filter_plate[col[0]].bottom(z=15), rate=0.5)
                        pip_96_1000.move_to(nunc_filter_plate[col[0]].bottom(z=20)) # Move above where we dispensed to blow out
                        pip_96_1000.blow_out()
                        pip_96_1000.drop_tip()
                        tip_counter -= 8
                        if tip_counter <= 0:
                            tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                            tip_counter = 96

    if lysis_type == 'vortex':
        with ctx.group_steps(name="Step 1 - P1 Buffer Dispensing and Pellet Resuspension", description="Add P1 Buffer to Sample plate and resuspend the pellet"):
            ctx.comment("=== Adding P1 Buffer to Sample plate ===")

            if sample_plate_type == 'nest_96_wellplate_2ml_deep':
                swap_pipetting_type(pip_96_1000, 'column', tips_1000) #always dispense P1 column by column

                pip_96_1000.pick_up_tip()
                pip_96_1000.aspirate(P_buffer_volume*num_col*1.1, reservoir_12well['A1'])

                for col in sample_columns:
                    # pip_96_1000.move_to(sample_plate[col[0]].bottom(z=1))
                    # ctx.pause("Pause")
                    pip_96_1000.dispense(P_buffer_volume, sample_plate[col[0]].bottom(z=20))

                pip_96_1000.drop_tip()
                tip_counter -= 8

                h_s.set_and_wait_for_shake_speed(rpm=1700)
                ctx.delay(seconds=120)
                h_s.deactivate_shaker()

        # ╔══════════════════════════════════════════════════════════════════════╗
        # ║  STEP 2 — P2 BUFFER DISPENSING AND MIXING                            ║
        # ╚══════════════════════════════════════════════════════════════════════╝
        with ctx.group_steps(name="Step 2 - P2 Buffer Dispensing and Mixing", description="Add P2 Buffer to Sample plate and mix"):
            ctx.comment("=== Adding P2 Buffer to Sample plate ===")

            if sample_plate_type == 'nest_96_wellplate_2ml_deep':

                pip_96_1000.pick_up_tip()
                pip_96_1000.aspirate(P_buffer_volume*num_col*1.1, reservoir_12well['A2'])

                for col in sample_columns:
                    pip_96_1000.dispense(P_buffer_volume, sample_plate[col[0]].bottom(z=20))

                pip_96_1000.drop_tip()
                tip_counter -= 8

                h_s.set_and_wait_for_shake_speed(rpm=1700)
                ctx.delay(seconds=15)
                h_s.deactivate_shaker()

        # ╔══════════════════════════════════════════════════════════════════════╗
        # ║  STEP 3 — N3 BUFFER DISPENSING, MIXING, AND TRANSFER TO FILTER PLATES║
        # ╚══════════════════════════════════════════════════════════════════════╝
        with ctx.group_steps(name="Step 3 - N3 Buffer Dispensing, Mixing, and Transfer to Filter Plates", description="Add N3 Buffer to Sample plate and mix"):
            ctx.comment("=== Adding N3 Buffer to Sample plate ===")

            if sample_plate_type == 'nest_96_wellplate_2ml_deep':
                swap_pipetting_type(pip_96_1000, 'column', tips_1000) #always dispense N3 column by column

                #if there are more than 9 columns of samples we can't aspirate all the N3 buffer needed in one go
                if num_col > 9:
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.aspirate(N3_buffer_volume*9*1.1, reservoir_12well['A3']) 
                    for col in sample_columns[:9]:
                        pip_96_1000.dispense(N3_buffer_volume, sample_plate[col[0]].bottom(z=20))   

                    pip_96_1000.aspirate(N3_buffer_volume*(num_col-9)*1.1, reservoir_12well['A3']) 
                    for col in sample_columns[9:]:
                        pip_96_1000.dispense(N3_buffer_volume, sample_plate[col[0]].bottom(z=20))  

                else:
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.aspirate(N3_buffer_volume*num_col*1.1, reservoir_12well['A3'])
                    for col in sample_columns:
                        pip_96_1000.dispense(N3_buffer_volume, sample_plate[col[0]].bottom(z=20))

                h_s.set_and_wait_for_shake_speed(rpm=1700)
                ctx.delay(seconds=30)
                h_s.deactivate_shaker()

                if process_by == 'plate':
                    pip_96_1000.drop_tip()
                    tip_counter -= 8
                    if tip_counter <= 0:
                        tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                    swap_pipetting_type(pip_96_1000, process_by, tips_1000_adapter)
                    pip_96_1000.pick_up_tip()
                    pip_96_1000.aspirate(350, sample_plate['A1'].bottom(), rate=0.5)
                    pip_96_1000.dispense(350, nunc_filter_plate['A1'].bottom(z=15), rate=0.5)
                    pip_96_1000.move_to(nunc_filter_plate['A1'].bottom(z=20)) # Move above where we dispensed to blow out
                    pip_96_1000.blow_out()
                    pip_96_1000.drop_tip()
                    tips_1000_adapter = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000_adapter, tiprack_adapter, stacker_tips, waste_chute)
                    # pip_96_1000.return_tip()
                    # pip_96_1000.reset_tipracks()

                if process_by == 'column':
                    for col in sample_columns:
                        if col[0] != 'A1': #for the first column we are reusing the tips used for dispensing P2
                            pip_96_1000.pick_up_tip()
                        pip_96_1000.aspirate(350, sample_plate[col[0]].bottom(), rate=0.5)
                        pip_96_1000.dispense(350, nunc_filter_plate[col[0]].bottom(z=15), rate=0.5)
                        pip_96_1000.move_to(nunc_filter_plate[col[0]].bottom(z=20)) # Move above where we dispensed to blow out
                        pip_96_1000.blow_out()
                        pip_96_1000.drop_tip()
                        tip_counter -= 8
                        if tip_counter <= 0:
                            tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                            tip_counter = 96

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  STEP 4 — VACUUM FILTER PLATE                                        ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    with ctx.group_steps(name="Step 4 - Vacuum Filter Plate", description="Vacuum the filter plate"):

        ctx.comment("=== Vacuum Filter Plate ===")
        # ctx.move_labware(manifold_collar, vm_mod, use_gripper=True) # Move the filter plate + collar from the dock to the manifold
        vacuum(ctx, vm_mod, VACUUM_PRESSURE, VACUUM_TIME)
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True) # Move the filter plate + collar from the manifold to the dock
        ctx.move_labware(nunc_filter_plate, waste_chute, use_gripper=True) # Trash filter plate (should this be optional for less than full plates?)

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  STEP 5 — TRANSFER FROM COLLECTION PLATE INTO SILICA PLATE           ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    with ctx.group_steps(name="Step 5 - Transfer from Collection Plate to Silica Membrane Plate", description="Transfer the collection plate to the silica membrane plate"):
        ctx.comment("=== Transferring from Collection Plate to Silica Membrane Plate ===")
        h_s.open_labware_latch()
        ctx.move_labware(sample_plate, waste_chute, use_gripper=True) # Move the sample plate to the trash to free the heater/shaker slot
        ctx.move_labware(collection_plate, h_s_adapter, use_gripper=True) # Move the collection plate from the inside the manifold onto the heater/shaker
        h_s.close_labware_latch()
        ctx.move_labware(silica_plate, manifold_collar, use_gripper=True) # Move the silica plate onto the collar on the vacuum dock
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True) # Move the silica plate + collar from the dock to the manifold

        if process_by == 'plate':
            swap_pipetting_type(pip_96_1000, process_by, tips_1000_adapter)
            pip_96_1000.pick_up_tip()
            pip_96_1000.aspirate(350, collection_plate['A1'].bottom())
            pip_96_1000.dispense(350, silica_plate['A1'].bottom(z=15))
            pip_96_1000.move_to(silica_plate['A1'].bottom(z=20)) # Move above where we dispensed to blow out
            pip_96_1000.blow_out()
            pip_96_1000.drop_tip()
            tips_1000_adapter = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000_adapter, tiprack_adapter, stacker_tips, waste_chute)
            # pip_96_1000.return_tip()
            # pip_96_1000.reset_tipracks()

        if process_by == 'column':
            # swap_pipetting_type(pip_96_1000, process_by, tips_1000_adapter)
            for col in sample_columns:
                pip_96_1000.pick_up_tip()
                pip_96_1000.aspirate(350, collection_plate[col[0]].bottom())
                pip_96_1000.dispense(350, silica_plate[col[0]].bottom(z=15))
                pip_96_1000.move_to(silica_plate[col[0]].bottom(z=20)) # Move above where we dispensed to blow out
                pip_96_1000.blow_out()
                pip_96_1000.drop_tip()
                tip_counter -= 8
                if tip_counter <= 0:
                    tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
                    tip_counter = 96

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  STEP 6 — VACUUM SILICA PLATE AND WASH                               ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    with ctx.group_steps(name="Step 6 - Vacuum Silica Membrane Plate and Wash", description="Vacuum the silica membrane plate and wash"):
        ctx.comment("=== Vacuum Silica Membrane Plate ===")
        vacuum(ctx, vm_mod, VACUUM_PRESSURE, VACUUM_TIME)

        swap_pipetting_type(pip_96_1000, 'column', tips_1000) #always dispense PE column by column
        pip_96_1000.pick_up_tip()
        pe_buffer_counter = 3 # We can only aspirate PE buffer from each of the reservoir wells 3 times. After that we need to switch to the next well

        for col_pairs in zip(sample_columns[::2], sample_columns[1::2]): # Dispense PE buffer 2 columns at a time. For an odd number of columns this will ignore the last column
            pip_96_1000.aspirate(pe_buffer_volume*2, reservoir_12well[pe_buffer_reservoir_wells[0]])
            pe_buffer_counter -= 1
            if pe_buffer_counter == 0:
                pe_buffer_reservoir_wells.pop(0)
            for col in col_pairs:
                pip_96_1000.dispense(pe_buffer_volume, silica_plate[col[0]].bottom(z=20))
        if len(sample_columns) % 2 > 0: # If we have an odd number of columns, the column above will ignore the last column so here we add the buffer to it
            pip_96_1000.aspirate(pe_buffer_volume, reservoir_12well[pe_buffer_reservoir_wells[0]])
            pip_96_1000.dispense(pe_buffer_volume, silica_plate[sample_columns[-1][0]].bottom(z=20))
        pip_96_1000.drop_tip()
        tip_counter -= 8
        if tip_counter <= 0:
            tips_1000 = _swap_1000ul_tips(ctx, pip_96_1000, tips_1000, 'B2', stacker_tips, waste_chute)
            tip_counter = 96

        vacuum(ctx, vm_mod, VACUUM_PRESSURE, VACUUM_TIME)

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  STEP 7 — ELUTE                                                      ║
    # ╚══════════════════════════════════════════════════════════════════════╝
    with ctx.group_steps(name="Step 7 - Elute DNA from Silica Plate", description="Elute DNA from the silica plate"):
        ctx.comment("=== Eluting DNA from Silica Plate ===")
        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True) # Move the silica plate + collar from the manifold to the dock
        ctx.move_labware(elution_plate, vm_mod, use_gripper=True) # Move the elution plate inside the manifold
        ctx.move_labware(manifold_collar, vm_mod, use_gripper=True) # Move the silica plate + collar from the dock to the manifold

        swap_pipetting_type(pip_96_1000, 'column', tips_1000) #always dispense elution column by column
        pip_96_1000.pick_up_tip()
        pip_96_1000.aspirate(ELUTION_VOLUME*num_col*1.1, reservoir_12well['A4'])

        for col in sample_columns:
            # pip_96_1000.move_to(sample_plate[col[0]].bottom(z=1))
            # ctx.pause("Pause")
            pip_96_1000.dispense(ELUTION_VOLUME, silica_plate[col[0]].bottom(z=20))
        pip_96_1000.drop_tip()

        ctx.delay(seconds=60)
        vacuum(ctx, vm_mod, VACUUM_PRESSURE, VACUUM_TIME)

        ctx.move_labware(manifold_collar, vm_mod.manifold_dock, use_gripper=True) # Move the silica plate + collar from the manifold to the dock
        ctx.move_labware(elution_plate, 'B1', use_gripper=True) # Move the elution plate from inside the manifold onto B1
        h_s.open_labware_latch()

