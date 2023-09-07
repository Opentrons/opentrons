from opentrons import protocol_api
requirements = {'robotType': 'Flex', 'apiLevel': '2.15'}

def run(protocol):

    # labware
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', location='D1')
    tiprack = protocol.load_labware(
        'opentrons_flex_96_tiprack_200ul', location='D2')

    # pipettes
    left_pipette = protocol.load_instrument(
        'flex_1channel_1000', mount='left', tip_racks=[tiprack])

    # commands
    left_pipette.pick_up_tip()
    left_pipette.aspirate(100, plate['A1'])
    left_pipette.dispense(100, plate['B2'])
    left_pipette.blow_out(protocol.fixed_trash['A1'])
    left_pipette.drop_tip()
    left_pipette.home_plunger()