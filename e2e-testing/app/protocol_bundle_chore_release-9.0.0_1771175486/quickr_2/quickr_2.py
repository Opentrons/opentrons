from opentrons import types

metadata = { 
    'protocolName': 'QUiCKR V2 kit - part 2 (4 tipboxes)',
    'author': 'Opentrons'
}
requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.20'
}


def add_parameters(parameters):

    parameters.add_int(
    variable_name="num_plate_pairs",
    display_name="Number of 96-384 pairs",
    description="Number of 96-384 pairs",
    default=2,
    choices=[
        {"display_name": "1", "value": 1},
        {"display_name": "2", "value": 2}
    ]
)


def run(ctx):

    num_plate_pairs = ctx.params.num_plate_pairs


    # deck layout
    plate_384_slots = ['D2', 'C2']
    plate_384_name = ['Assay Plate #1', 'Assay Plate #2']
    plate_96_slots = ['D1', 'C1']
    plate_96_name = ['Sample Plate #1', 'Sample Plate #2']

    plate_384 = [ctx.load_labware('enduraplate_384_wellplate_112ul', slot, name) 
                 for slot, name in zip(plate_384_slots[:num_plate_pairs], plate_384_name[:num_plate_pairs])]
    plate_96 = [ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', slot, name) 
                for slot, name in zip(plate_96_slots[:num_plate_pairs], plate_96_name[:num_plate_pairs])]
    
    dumpster = ctx.load_waste_chute()   


    tiprack_adapter = [ctx.load_adapter('opentrons_flex_96_tiprack_adapter', slot) 
                       for slot in ['B1', 'B2', 'B3', 'C3']]
        
    tips = [tiprack_adapter[i].load_labware('opentrons_flex_96_tiprack_50ul',  slot)
                     for i, slot in enumerate(['B1', 'B2', 'B3', 'C3'])]
    
    if num_plate_pairs == 2:
        tips_refill = [ctx.load_labware('opentrons_flex_96_tiprack_50ul',  slot) 
                         for slot in ['A1', 'A2', 'A3', 'A4']]       


    # pipette setting
    p = ctx.load_instrument("flex_96channel_1000")


    # liquid info
    sample_liq = ctx.define_liquid(name="Samples", description="Samples (diluted)", display_color="#7EFF42")
    for plate in plate_96:
        for col in [0, 4]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=40)
             for row in range(8)]
        [plate.rows()[row][8].load_liquid(liquid=sample_liq, volume=40)
             for row in range(7)]
        for col in [1,2,5,6]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=40)
             for row in range(8)]
        for col in [3,7]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=60)
             for row in range(8)]
        for col in [9,10]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=40)
             for row in range(7)]
        [plate.rows()[row][11].load_liquid(liquid=sample_liq, volume=60)
             for row in range(7)]
            
    control_liq = ctx.define_liquid(name="Controls", description="Controls", display_color="#FF4F4F")
    for plate in plate_96:
            [plate.wells()[well].load_liquid(liquid=control_liq, volume=40)
             for well in [71, 79, 87, 95]]



    # # PROTOCOL #
    # # PROTOCOL #
    # # PROTOCOL #
    # # PROTOCOL #
    # # PROTOCOL #


    for i in range(num_plate_pairs):

        if i == 1:
            for j in range(4):
                ctx.move_labware(labware = tips[j],
                                 new_location = dumpster,
                                 use_gripper=True,
                                ) 
                ctx.move_labware(labware = tips_refill[j],
                                 new_location = tiprack_adapter[j],
                                 use_gripper=True,
                                )
            tips = tips_refill

        
        p.tip_racks = tips

        destination_well = ['A1', 'A2', 'B1', 'B2']

        for well in destination_well:

            p.pick_up_tip()

            p.flow_rate.aspirate = 7
            p.flow_rate.dispense = 14

            p.aspirate(8, plate_96[i]['A1'].bottom(z=2))
            ctx.delay(seconds=1)  
            p.dispense(7, plate_384[i][well].bottom(z=4)) # leave 1 ul to avoid bubbles
            ctx.delay(seconds=1)  

            p.mix(5, 14, plate_384[i][well].bottom(z=2))
            ctx.delay(seconds=1)
            default = p.default_speed
            p.default_speed = 50

            p.move_to(plate_384[i][well].top())

            p.default_speed = default

            p.return_tip() 

        ctx.pause('Plate #'+str(i+1)+' Ready')
