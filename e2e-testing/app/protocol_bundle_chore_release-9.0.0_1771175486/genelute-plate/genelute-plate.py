import math
from opentrons import types
import sys
plat = sys.platform

metadata = {
    'protocolName': 'Millipore GenElute Protocol - Plate'
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.23'
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
    p.add_int(
        display_name="Number of Samples",
        variable_name="num_samples",
        default=96,
        minimum=1,
        maximum=96,
        description="How many samples are there total, including replicates?"
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
# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    # Import Parameters
    dry_run             = ctx.params.dry_run
    mount_multi         = ctx.params.mount_multi
    mount_single        = "right" if mount_multi == "left" else "left"
    lysis_plate         = ctx.params.lysis_plate
    num_samples         = ctx.params.num_samples

    num_cols = math.ceil(num_samples/8)

    report              = True # prints extra info for troubleshooting

    adapter = 'opentrons_universal_flat_adapter' if lysis_plate == 'bioecho_96_wellplate_1000ul' else 'opentrons_96_deep_well_adapter'

    ######################### DEFINING LABWARE ###################################

    h_s                 = ctx.load_module('heaterShakerModuleV1','D1')
    h_s_adapter         = h_s.load_adapter(adapter)
    h_s.close_labware_latch()

    purification_plate  = ctx.load_labware('bioecho_96_wellplate_200ul','C3','Purification Plate') # purification plate sitting on top of storage plate

    lysis_plate         = h_s_adapter.load_labware(lysis_plate,label='Lysis Plate')

    distribution_plate  = ctx.load_labware('nest_96_wellplate_2ml_deep','C2','Distribution Plate')

    # Make sure to change the reagents.wells_by_name() to reagents.rows()[0] or reagents.columns()[0] depending on how the samples are arranged

    tips_50             = [ctx.load_labware('opentrons_flex_96_filtertiprack_50ul','C1','50 ul Tips #1')]
    tips_200            = ctx.load_labware('opentrons_flex_96_filtertiprack_200ul','B1','200 ul Tips #1')
    tips_201            = ctx.load_labware('opentrons_flex_96_filtertiprack_200ul','B2','200 ul Tips #2')
    tips                = [tips_200, tips_201]

    trash = ctx.load_trash_bin('A3')

    ######################### DEFINING REAGENTS AND VOLUMES ###################################

    lysis_sol           = distribution_plate.wells()[0] # First column of distribution plate
    clear_sol_b         = distribution_plate.wells()[16] # Third column of distribution plate
    
    lysis_wells_m       = lysis_plate.rows()[0][:num_cols] # for accessing with multi-channel

    puri_wells_m        = purification_plate.rows()[0][:num_cols] # for accessing with multi-channel

    lysis_vol           = blood_vol = 60
    clear_vol           = 10
    sn_vol              = lysis_vol + blood_vol + clear_vol # for first supernatant removal

    total_l_vol         = (num_cols*lysis_vol)*1.2 # total lysis volume in each well
    total_clear_vol     = (num_cols*clear_vol)+15 # total clearing volume in each well

    mix_reps            = 6 if not dry_run else 1

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

    #~~~~~~~~~~~~~~~~~~~~~~~~~Transfer Lysis~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    ctx.comment('\n\n\t\tTransferring Lysis + PK mix to sample plate\n\n')
    for well in lysis_wells_m:
        _pick_up(multi, 200)
        multi.aspirate(lysis_vol, lysis_sol.bottom(1))
        ctx.delay(seconds=1)
        multi.air_gap(5)
        multi.dispense(multi.current_volume, well.top(-6))
        ctx.delay(seconds=1)
        for _ in range(mix_reps):
            multi.aspirate(100,well.bottom(1))
            multi.dispense(100,well.bottom(4),push_out=0,rate=0.1 if _ == mix_reps-1 else 1)
        ctx.delay(seconds=1)
        multi.blow_out(well.top(-3))
        multi.drop_tip() if not dry_run else multi.return_tip()

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
    samples = ctx.define_liquid(name='Samples',description=None,display_color='#800080')

    # Add Liquids to Labware

    for well in distribution_plate.columns()[0]:
        well.load_liquid(liquid=lysis_liq,volume=total_l_vol)

    for well in distribution_plate.columns()[2]:
        well.load_liquid(liquid=clear_liq,volume=total_clear_vol)

    for well in lysis_plate.wells()[:8*num_cols]:
        well.load_liquid(liquid=samples,volume=60)








