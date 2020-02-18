from opentrons import containers, instruments, robot

metadata = {
    'protocolName': 'Multi/Single',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A protocol that uses both 8- and 1-channel pipettes',
    'source': 'Opentrons Repository'
}

# from opentrons import robot
# robot.connect()
# robot.home()
# print('homed')

tiprack = containers.load('tiprack-200ul', '8')
trough = containers.load('trough-12row', '9')
plate = containers.load('96-flat', '5')

single = instruments.P300_Single(mount='right', tip_racks=[tiprack])
multi = instruments.P300_Multi(mount='left', tip_racks=[tiprack])

robot.home()

for tip in [tiprack[0], tiprack[-1]]:
    single.pick_up_tip(tip)
    single.aspirate(100, trough[0])
    single.aspirate(100, trough[-1])

    single.dispense(100, plate[0])
    single.dispense(100, plate[-1])
    single.drop_tip(tip)

for tips in [tiprack.columns(0), tiprack.columns[-1]]:
    multi.pick_up_tip(tips)
    multi.aspirate(100, trough.columns[0])
    multi.aspirate(100, trough.columns[-1])
    multi.dispense(100, plate.columns[0])
    multi.dispense(100, plate.columns[-1])
    multi.drop_tip(tips)
