from opentrons import containers, instruments

metadata = {
    'protocolName': 'Pickup accuracy',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A protocol for testing pick up and drop tip',
    'source': 'Opentrons Repository'
}

# from opentrons import robot
# robot.connect()
# robot.home()
# print('homed')

tipracks = [
    containers.load('tiprack-200ul', slot)
    for slot in ('10', '3')]

single = instruments.Pipette(
    mount='right',
    min_volume=10,
    name="p200",
    tip_racks=tipracks)

for tiprack in tipracks:
    for tip in (tiprack[0], tiprack[-1]):
        single.pick_up_tip(tip)
        single.drop_tip(tip)
