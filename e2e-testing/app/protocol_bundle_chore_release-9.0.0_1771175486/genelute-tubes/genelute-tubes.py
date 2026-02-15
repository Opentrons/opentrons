import math
from opentrons import types
import sys
plat = sys.platform

metadata = {
    'protocolName': 'Millipore GenElute Protocol - Tubes'
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.21'
}

new_vol = 0
height = 0

def add_parameters(p):
    p.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        default=False,
        description="If on, this will perform a dry run with lower mixing reps and shortened incubations."
    )
    p.add_str(
        display_name="Multi-channel Mount",
        variable_name="mount_multi",
        default="left",
        choices=[
        {"display_name":"Left","value":"left"},
        {"display_name":"Right","value":"right"}],
        description="Which mount is the multi-channel pipette on?"
    )
    p.add_str(
        display_name="Tube Size",
        variable_name="tube_size",
        default="small",
        choices=[
        {"display_name":"15 mL","value":"large"},
        {"display_name":"2 mL","value":"small"}],
        description="Which tubes will be used?"
    )
    p.add_str(
        display_name="Lysis Plate Type",
        variable_name="lysis_plate",
        default="nest_96_wellplate_2ml_deep",
        choices=[
        {"display_name":"Nest Deepwell Plate","value":"nest_96_wellplate_2ml_deep"},
        {"display_name":"GenElute-E Lysis Plate","value":"bioecho_96_wellplate_1000ul"}],
        description="Which lysis plate will be used?"
    )
    p.add_csv_file(
        variable_name='csv_file',
        display_name='CSV File',
        description='Please upload the provided template CSV'
    ) # comment out for simulation purposes

# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    # Import Parameters
    dry_run             = ctx.params.dry_run
    tube_size           = ctx.params.tube_size
    tubes               = 'opentrons_15_tuberack_falcon_15ml_conical' if tube_size == 'large' else 'opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap' # may end up using different tuberack
    mount_multi         = ctx.params.mount_multi
    mount_single        = "right" if mount_multi == "left" else "left"
    lysis_plate         = ctx.params.lysis_plate

    report              = True # prints extra info for troubleshooting

    adapter = 'opentrons_universal_flat_adapter' if lysis_plate == 'bioecho_96_wellplate_1000ul' else 'opentrons_96_deep_well_adapter'

    # comment this out when simulating
    try:
        csv_file = ctx.params.csv_file
        
        parsed = csv_file.parse_as_csv()[1:] # Should make list of lists (without header row)
        ctx.comment(f'Parsed CSV File:\n {parsed}')
        ######################### CSV MANIPULATION ###################################
        # comment out when sending to customer
    except:
        csv_file = "Sample,Source Well Location,Volume ,Number of Replicates\\n1,A1,20,3\\n2,A2,30,3\\n3,A3,40,2\\n4,A4,30,3\\n5,B1,25,4\\n6,B2,30,3\\n7,C3,35,2\\n8,B2,10,4\\n9,C4,45,1\\n10,,,\\n11,,,\\n12,,,\\n13,,,"
        #csv_file = "Sample,Source Well Location,Volume ,Number of Replicates\\n1,A1,20,3\\n2,A2,30,3\\n3,,,\\n4,,,\\n5,,,\\n6,,,\\n7,,,\\n8,,,\\n9,,,\\n10,,,\\n11,,,\\n12,,,\\n13,,,"

        parsed = []
        for line in csv_file.split('\\n')[1:]: # Creates list of list without header row
            new_line = []
            for item in line.split(','):
                new_line.append(item)
            parsed.append(new_line)
        ctx.comment(f'Parsed CSV File:\n {parsed}')

    ############################# Comment above out when using RTP ####################

    ######################### DEFINING LABWARE ###################################

    h_s                 = ctx.load_module('heaterShakerModuleV1','D1')
    h_s_adapter         = h_s.load_adapter(adapter)
    h_s.close_labware_latch()

    reagent_label       = 'Reagents and Samples'
    reagents1           = ctx.load_labware(tubes,'D2',label = reagent_label)

    purification_plate  = ctx.load_labware('bioecho_96_wellplate_200ul','C3','Purification Plate') # purification plate sitting on top of storage plate

    lysis_plate         = h_s_adapter.load_labware(lysis_plate,label='Lysis Plate')

    distribution_plate  = ctx.load_labware('nest_96_wellplate_2ml_deep','C2','Distribution Plate')

    tips_50             = [ctx.load_labware('opentrons_flex_96_filtertiprack_50ul','C1','50 ul Tips #1')]
    tips_200            = ctx.load_labware('opentrons_flex_96_filtertiprack_200ul','B1','200 ul Tips #1')
    tips_201            = ctx.load_labware('opentrons_flex_96_filtertiprack_200ul','B2','200 ul Tips #2')
    tips_202            = ctx.load_labware('opentrons_flex_96_filtertiprack_200ul','B3','200 ul Tips #3')
    tips_203            = ctx.load_labware('opentrons_flex_96_filtertiprack_200ul','A1','200 ul Tips #4')
    tips                = [tips_200, tips_201, tips_202, tips_203]

    trash = ctx.load_trash_bin('A3')

# Creating lists from each row
    source_wells = []
    volumes = []
    replicates = []

    for samp in parsed:
        if samp[1] == '':
            break
        source_wells.append(samp[1])
        volumes.append(int(samp[2]))
        replicates.append(samp[3])

    num_samples = len(source_wells)

    num_wells = 0
    for rep in replicates:
        num_wells += int(rep)

    num_cols = math.ceil(num_samples/8)

    # Figure out if there are too many source wells
    last_wells = []

    for s in source_wells:
        if s in last_wells:
            continue
        else:
            last_wells.append(s)

    bad_wells = False # initialize bad_wells variable
    
    # Check for bad wells
    water_well = 'C5' if tube_size == 'large' else 'D6' # C5 for 15 mL tubes, D6 for 1.5 mL tubes reserved for water
    if water_well in last_wells:
        bad_wells = True
    else:
        bad_wells = False

    all_well_rows = ['A','B','C','D','E','F','G','H']
    bad_well_rows = ['D','E','F','G','H'] if tube_size == 'large' else ['E','F','G','H']
    bad_well_cols = ['6','7','8','9','10','11','12'] if tube_size == 'large' else ['7','8','9','10','11','12']

    for letter in all_well_rows: # Check for impossible well combinations
        for num in bad_well_cols:
            if letter+num in last_wells:
                bad_wells = True
                break

    for letter in bad_well_rows: # Check all 96 well locations to see if bad wells were used
        for num in ['1','2','3','4','5','6','7','8','9','10','11','12']:
            if letter+num in last_wells:
                bad_wells = True
                break

    if len(last_wells) > 13 or bad_wells == True:
        raise Exception('Bad sample wells inputted. Please check your CSV file and try again.')
    if num_wells > 96:
        raise Exception('Samples x Volumes x Replicates exceeds 96')

    num_cols = math.ceil(num_wells/8)

    # Generate destination well order
    rand = []
    for i in range(num_samples):
        rand.append(i)

    # \/\/ Taken out until we can download CSV file from app
    # random.shuffle(rand) #randomizes the order we will load samples into destination wells

    # Uses randomized number list to sync the randomization of the volume, source, destination and replicate lists
    new_source = []
    new_vols = []
    new_reps = []
    for x in rand:
        new_source.append(source_wells[x])
        new_vols.append(volumes[x])
        new_reps.append(replicates[x])

    dest_wells = []
    dw = lysis_plate.wells()[:num_cols*8]
    
    for i, rep in enumerate(new_reps):
        dest_intermediate = []
        for x in range(int(rep)):
            dest_intermediate.append(dw.pop(0))
        dest_wells.append(dest_intermediate)
    
    new_d = []

    for n in dest_wells:
        nd = []
        for i in n:
            nd.append(str(i).split(' ')[0])
        new_d.append(nd)
    
    # Create CSV output outlining source wells and destinations
    data = {
        "Source Well":new_source,
        "Volume":new_vols,
        "Destinations": new_d
    }

# Calculate Total Volumes
    sample_volumes = []
    all_sample_volumes = []

    for r, v in zip(replicates, volumes): # Creates list of sample volumes in order of the sample wells inputted
        new_v = int(r)*int(v) # volume to be used times the # of replicates
        sample_volumes.append(new_v)
        vol_reps = [int(v)]*int(r) # creates a list of volumes for each replicate
        all_sample_volumes = all_sample_volumes+ vol_reps

    source_n_vol = {}

    for sw,v in zip(source_wells,sample_volumes): # Creates dictionary with each possible sample well and total sample volume needed
        if sw in source_n_vol.keys():
            source_n_vol[sw] += int(v)
        else:
            source_n_vol[sw] = v + 30

    total_water_vol = 0
    for v in all_sample_volumes:
        total_water_vol += 60-v
    total_water_vol += 100 # + 100 ul for dead volume

    ctx.comment(f'\n\nTotal Water Volume: {total_water_vol}\n\n')

    ############## Testing different method for CSV output##############
    # May go back in if we can download CSV file from app and when we randomize sample distribution
    # ctx.comment(f'Lists:\n {data}')
    # long_path = os.getcwd()
    # lp = long_path.split('/')
    # lp.pop(-1)
    # #file_path = os.getcwd()+str(f'/{datetime.datetime.now().date()}_output.csv') # use this for simulation
    # file_path = str(f'/var/lib/jupyter/notebooks/transfer_log_{datetime.datetime.now()}.csv')
    # ctx.comment(f'Filepath:\n {file_path}')

    # with open(file_path, 'w', newline='') as f:
    #     writer = csv.writer(f)
    #     writer.writerow(['Source Well', 'Volume', 'Destination'])
    #     writer.writerows(zip(new_source, new_vols, new_d))

    ######################### DEFINING REAGENTS AND VOLUMES ###################################

    lysis_sol           = distribution_plate.wells()[0] # First column of distribution plate
    clear_sol_b         = distribution_plate.wells()[16] # Third column of distribution plate
    
    water_sol           = reagents1.wells()[-1] # C5 tube in 15 ml; D6 tube in 1.5 ml
    
    lysis_wells_m       = lysis_plate.rows()[0][:num_cols] # for accessing with multi-channel

    puri_wells_m        = purification_plate.rows()[0][:num_cols] # for accessing with multi-channel

    lysis_vol           = blood_vol = 60
    clear_vol           = 10

    total_l_vol         = (num_cols*lysis_vol)*1.2 # total lysis volume in each well
    total_clear_vol     = (num_cols*clear_vol)+15 # total clearing volume in each well

    mix_reps            = 5 if not dry_run else 1

    blood_mix_reps      = 4 if not dry_run else 1

    # Height Calculations
    well_width          = reagents1.wells()[0].diameter
    w_start_height      = (total_water_vol/(well_width ** 2)) # beginning height of water in tube

    ######################### DEFINING PIPETTES ###################################

    multi               = ctx.load_instrument('flex_8channel_1000',mount_multi)
    single              = ctx.load_instrument('flex_1channel_1000',mount_single)

    ######################### STARTING PROTOCOL ###################################

    def _pick_up(pip,size):
        """
        Switches between tip rack lists depending on the tips being used and picks up tip
        No tracking necessary since there are enough tips on deck to get through entire protocol
        pip: which pipette is being used (single or multi)
        size: which size tip should be picked up
        """
        pip.tip_racks = tips_50 if size == 50 else tips

        pip.pick_up_tip()

    def track_height(vol,first=False):
        """
        tracks height to aspirate from in water tube
        vol: volume being aspirated - used to calculate the new height
        first: is this the first time entering the water well? Determines volume in tube
        """

        global new_vol
        global height
        if first:
            height = w_start_height
            old_vol = total_water_vol
        else:
            old_vol = new_vol

        new_vol = old_vol-vol

        h_dif = vol/(well_width ** 2)

        height -= h_dif

        if height > 1:
            return height
        else:
            return 1

    def divide_list(l,n):
        """
        Used to divide a list into chunks when distributing reagent across the plate
        l = list to divide
        n = size of chunk
        """

        for i in range(0, len(l), n):
            yield l[i:i+n]

    ctx.comment(f'\n\nProcessing {num_samples} samples this run.\n\n')

    #~~~~~~~~~~~~~~~~~~~~~~~~~Transfer Lysis~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ctx.comment('\n\n\t\tTransferring Lysis + PK mix to lysis plate\n\n')
    # this will be from distribution plate, not lysis tube
    _pick_up(multi, 200)
    chunk_list = list(divide_list(lysis_wells_m,(200//lysis_vol))) # create list of multi-disp chunks to iterate through
    for i, chunk in enumerate(chunk_list):
        v = lysis_vol*len(chunk)
        multi.aspirate(v+10,lysis_sol.bottom(1),rate=0.1)
        multi.dispense(5,lysis_sol.bottom(1)) # compensate for backlash
        ctx.delay(seconds=1)
        multi.move_to(lysis_sol.top(-3))
        multi.move_to(lysis_sol.top().move(types.Point(x=0,y=2.5,z=-3))) # move to well wall
        ctx.delay(seconds=1) # allows drop to form 
        multi.move_to(lysis_sol.top().move(types.Point(x=0,y=2.5,z=2))) # drag up well wall to drop extra lysis solution
        for x, well in enumerate(chunk):
            multi.dispense(lysis_vol,well.top(-3))
            ctx.delay(seconds=1)
            multi.touch_tip(radius=0.75,v_offset=-3)
            if x == len(chunk)-1:
                multi.dispense(multi.current_volume,lysis_sol.bottom(15))

    multi.drop_tip() if not dry_run else multi.return_tip()

    #~~~~~~~~~~~~~~~~~~~~~~~~~Transfer Water~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ctx.comment('\n\n\t\tTransferring Water From Tube\n\n')
    skip_water = True
    for i, dest in enumerate(dest_wells): # Make sure there is at least one well that needs water
        if new_vols[i] < 60: # if any well needs water, skip_water = False and water will be added
            skip_water = False
            break
    if not skip_water:
        _pick_up(single,200)
    for i, dest in enumerate(dest_wells):
        if new_vols[i]== 60: # if blood volume is 60, then no water is needed
            continue
        v = 60 - new_vols[i] # volume of water needed
        for d in dest:
            single.aspirate(v,water_sol.bottom(track_height(v,first = True if i == 0 else False)))
            single.air_gap(5)
            single.dispense(single.current_volume, d.top(-2))
            ctx.delay(seconds=1)
            single.blow_out(d.top(-1))
    if single.has_tip:
        single.drop_tip() if not dry_run else single.return_tip()

    #~~~~~~~~~~~~~~~~~~~~~~~~~Transfer Blood~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    src = 'Tubes'
    ctx.comment(f'\n\n\t\tTransferring Blood From Source {src}\n\n')
    reagents = reagents1

    for i, dest in enumerate(dest_wells):
        _pick_up(single,200)
        for d in dest:
            single.aspirate(1,reagents.wells_by_name()[new_source[i]].top())
            for x in range(blood_mix_reps):
                single.aspirate(new_vols[i], reagents.wells_by_name()[new_source[i]].bottom(1))
                single.dispense(new_vols[i], reagents.wells_by_name()[new_source[i]].bottom(4))
            single.aspirate(new_vols[i],reagents.wells_by_name()[new_source[i]].bottom(1))
            single.air_gap(5)
            single.dispense(single.current_volume, d.top(-5))
            for y in range(mix_reps):
                single.aspirate(60,d.bottom(1))
                single.dispense(60,d.bottom(5),push_out=0,rate=1 if i > 4 else 0.15)
            ctx.delay(seconds=1)
            single.blow_out(d.top(-3))
        single.drop_tip() if not dry_run else single.return_tip()

    #~~~~~~~~~~~~~~~~~~~~~~~~~Heater-Shaker Incubation~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ctx.comment('\n\n\t\tHeater-Shaker Incubation\n\n')

    if not dry_run:
        h_s.set_target_temperature(60) # set but allow pause for seal while heating

    h_s.open_labware_latch()
    ctx.pause('Please Seal Plate Before Incubation')
    h_s.close_labware_latch()
    if not dry_run:
        h_s.wait_for_temperature() # wait for temperature to reach 60C before shaking

    h_s.set_and_wait_for_shake_speed(1200)
    ctx.delay(minutes=30 if not dry_run else 0.1,msg=f'Please allow 30 minutes of incubation at 60C and 1200 rpm')
    if not dry_run:
        h_s.set_and_wait_for_temperature(80)
    ctx.delay(minutes=9 if not dry_run else 0.1,msg=f'Please allow 10 more minutes of incubation at 80C and 1200 rpm')

    #doing 9 minutes + time it takes to get to 80, should this just be 10 minutes once the module reaches 80

    h_s.deactivate_shaker()
    h_s.deactivate_heater()

    h_s.open_labware_latch()
    ctx.pause('Please Remove Seal From Plate')
    ctx.move_labware(lysis_plate, 'D3',use_gripper=False) # manually move plate off hot heater-shaker
    h_s.close_labware_latch()

    #~~~~~~~~~~~~~~~~~~~~~~~~~Transferring and Mixing Clearing Solution B to Samples~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ctx.comment('\n\n\t\tTransferring Clearing Solution B to Lysis Plate\n\n')
    
    for well in lysis_wells_m:
        _pick_up(multi, 50)
        multi.aspirate(clear_vol, clear_sol_b.bottom(1))
        ctx.delay(seconds=1)
        multi.air_gap(5)
        multi.dispense(multi.current_volume, well.top(-6))
        ctx.delay(seconds=1)# 1 quick mix
        multi.aspirate(45,well.bottom(1))
        multi.dispense(45,well.bottom(4),push_out=0)
        ctx.delay(seconds=1)
        multi.blow_out(well.top(-3))
 
        multi.drop_tip() if not dry_run else multi.return_tip()

    ctx.comment('\n\n\t\tMixing Clearing Solution on Heater-Shaker\n\n')

    h_s.open_labware_latch()
    ctx.move_labware(lysis_plate, h_s_adapter,use_gripper=True)
    h_s.close_labware_latch()
    h_s.set_and_wait_for_shake_speed(1500)
    ctx.delay(minutes=0.5 if not dry_run else 0.1,msg=f'Please allow 30 seconds of mixing at 1500 rpm')
    h_s.deactivate_shaker()
    h_s.open_labware_latch()
    ctx.move_labware(lysis_plate, 'D3',use_gripper=True) # move plate off heater-shaker
    h_s.close_labware_latch()

    #~~~~~~~~~~~~~~~~~~~~~~~~~Transfer Lysis Supernatant to Puri Plate~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ctx.comment('\n\n\t\tTransferring Supernatant to Purification Plate\n\n')

    for dest, col in zip(puri_wells_m,lysis_wells_m):
        _pick_up(multi,200)
        d = col.length if col.diameter == None else col.diameter
        multi.aspirate(60,col.bottom().move(types.Point(x=d/2-1.5,y=0,z=1)),rate=0.15)
        ctx.delay(seconds=1)
        multi.aspirate(40,col.bottom().move(types.Point(x=d/2-1.5,y=0,z=0.5)),rate=0.03)
        ctx.delay(seconds=1)
        multi.air_gap(5)
        multi.dispense(multi.current_volume, dest.top(-(dest.depth/4)))
        ctx.delay(seconds=1)
        multi.blow_out(dest.top(-5))
        multi.drop_tip() if not dry_run else multi.return_tip()

    #~~~~~~~~~~~~~~~~~~~~~~~~~Protocol complete~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ############################### Liquids ###############################

    # Create Liquid Definitions

    lysis_liq = ctx.define_liquid(name='Lysis Buffer',description=None,display_color='#FF0000')
    clear_liq = ctx.define_liquid(name='Clearing Solution B',description=None,display_color='#00FFFF')
    water_liq = ctx.define_liquid(name='Water',description=None,display_color='#90EE90')
    samp1 = ctx.define_liquid(name='Sample 1',description=None,display_color='#0000FF')
    samp2 = ctx.define_liquid(name='Sample 2',description=None,display_color='#ADD8E6')
    samp3 = ctx.define_liquid(name='Sample 3',description=None,display_color='#800080')
    samp4 = ctx.define_liquid(name='Sample 4',description=None,display_color='#FFFF00')
    samp5 = ctx.define_liquid(name='Sample 5',description=None,display_color='#00FF00')
    samp6 = ctx.define_liquid(name='Sample 6',description=None,display_color='#FF00FF')
    samp7 = ctx.define_liquid(name='Sample 7',description=None,display_color='#FFC0CB')
    samp8 = ctx.define_liquid(name='Sample 8',description=None,display_color='#7FFFD4')
    samp9 = ctx.define_liquid(name='Sample 9',description=None,display_color='#008000')
    samp10 = ctx.define_liquid(name='Sample 10',description=None,display_color='#800000')
    samp11 = ctx.define_liquid(name='Sample 11',description=None,display_color='#FFA500')
    samp12 = ctx.define_liquid(name='Sample 12',description=None,display_color='#000000')
    samp13 = ctx.define_liquid(name='Sample 13',description=None,display_color='#808080')
    samps = [samp1,samp2,samp3,samp4,samp5,samp6,samp7,samp8,samp9,samp10,samp11,samp12,samp13]

    # Add Liquids to Labware
    water_sol.load_liquid(liquid=water_liq,volume=total_water_vol)

    for well in distribution_plate.columns()[0]:
        well.load_liquid(liquid=lysis_liq,volume=total_l_vol)

    for well in distribution_plate.columns()[2]:
        well.load_liquid(liquid=clear_liq,volume=total_clear_vol)

    for i,sw in enumerate(source_n_vol.keys()):
        reagents.wells_by_name()[sw].load_liquid(liquid=samps[i],volume=source_n_vol[sw])







