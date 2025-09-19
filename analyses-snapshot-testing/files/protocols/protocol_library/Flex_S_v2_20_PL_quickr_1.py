from opentrons import protocol_api
from opentrons.protocol_api import ALL, COLUMN

metadata = {
    'protocolName': 'QUiCKR V2 kit - part 1',
    'author': 'Opentrons'
}
requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.20'
}


def add_parameters(parameters):

    parameters.add_bool(
    variable_name="buffer_filling",
    display_name="Fill the buffer on deck",
    description="Fill the buffer on deck",
    default=True
)
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

def run(ctx: protocol_api.ProtocolContext):

    buffer_filling = ctx.params.buffer_filling
    num_plate_pairs = ctx.params.num_plate_pairs


    # deck layout
    plate_96_slots = ['D1', 'C1']
    plate_name = ['Sample Plate #1', 'Sample Plate #2']
    plate_96 = [ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', slot, name) 
                for slot, name in zip(plate_96_slots[:num_plate_pairs], plate_name[:num_plate_pairs])]

    if buffer_filling:
        reagent_res = ctx.load_labware('nest_12_reservoir_15ml', 'C2', 'Assay Buffer')
        buffer_96 = reagent_res.wells()[0]

    partial_tip_rack = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'B2')
    
    ctx.load_waste_chute()


    # pipette setting
    p = ctx.load_instrument("flex_96channel_1000")
    p.configure_nozzle_layout(style=COLUMN,
                              start='A1',
                              tip_racks=[partial_tip_rack]
                             )


    # liquid info
    sample_liq = ctx.define_liquid(name="Samples", description="Samples", display_color="#7EFF42")
    for plate in plate_96:
        for col in [0, 4, 8]:
            [plate.rows()[row][col].load_liquid(liquid=sample_liq, volume=60)
             for row in range(8)]

    control_liq = ctx.define_liquid(name="Controls", description="Controls", display_color="#FF4F4F")
    for plate in plate_96:
            [plate.wells()[well].load_liquid(liquid=control_liq, volume=40)
             for well in [71, 79, 87, 95]]

    if buffer_filling:
        buffer_liq = ctx.define_liquid(name="Assay Buffer", description=" ", display_color="#00FFF2")
        reagent_res.wells()[0].load_liquid(liquid=buffer_liq, volume=3000*num_plate_pairs+2000)



    # # PROTOCOL #
    # # PROTOCOL #
    # # PROTOCOL #
    # # PROTOCOL #
    # # PROTOCOL #


    if buffer_filling:
        ctx.pause('Please remove one tip from tiprack D1 tip H12')
        if num_plate_pairs == 1:
            ctx.pause('Please remove one tip from tiprack D1 tip H8')
        if num_plate_pairs == 2:
            ctx.pause('Please remove one tip from tiprack D1 tip H8, H5')
    else:
        if num_plate_pairs == 1:
            ctx.pause('Please remove one tip from tiprack D1 tip H10')
        if num_plate_pairs == 2:
            ctx.pause('Please remove one tip from tiprack D1 tip H10, H7')      

    p.flow_rate.aspirate = 150
    p.flow_rate.dispense = 150


    if buffer_filling:

        p.pick_up_tip()

        for plate in plate_96:
            p.aspirate(40*3+10, buffer_96.bottom(z=3), rate = 0.5)
            ctx.delay(seconds=1)
            for j in range(3):
                p.dispense(40, plate.rows()[0][9+j].bottom(z=2))
                ctx.delay(seconds=1)
            p.blow_out(buffer_96.top(z=-2))

        p.drop_tip()

        p.pick_up_tip()

        for plate in plate_96:
            for i in range(2):
                p.aspirate(40*3+10, buffer_96.bottom(z=3), rate = 0.5)
                ctx.delay(seconds=1)
                for j in range(3):
                    p.dispense(40, plate.rows()[0][i*4+j+1].bottom(z=2))
                    ctx.delay(seconds=1)
                p.blow_out(buffer_96.top(z=-2))

        p.drop_tip()


    for plate in plate_96:
        for i in range(2):
            p.pick_up_tip()   
            for j in range(3):
                p.aspirate(20, plate.rows()[0][i*4+j].bottom(z=2), rate = 0.2)
                ctx.delay(seconds=1)
                p.dispense(20, plate.rows()[0][i*4+j+1].bottom(z=5), rate = 0.5)
                p.mix(5, 30, plate.rows()[0][i*4+j+1].bottom(z=2))
                p.blow_out(plate.rows()[0][i*4+j+1].top())
            p.drop_tip()
        
        p.pick_up_tip()   
        for j in range(3):
            p.aspirate(20, plate.rows()[0][8+j].bottom(z=2), rate = 0.2)
            ctx.delay(seconds=1)
            p.dispense(20, plate.rows()[0][8+j+1].bottom(z=5), rate = 0.5)
            p.mix(5, 30, plate.rows()[0][8+j+1].bottom(z=2))
            p.blow_out(plate.rows()[0][8+j+1].top())
        p.drop_tip()


 
