from opentrons import containers, instruments

# from opentrons import robot
# robot.connect()
# robot.home()
# print('homed')

tiprack = containers.load('tiprack-200ul', 'C2')
trough = containers.load('trough-12row', 'C3')
trash = containers.load('trash-box', 'C4')
plate = containers.load('96-flat', 'B2')

single = instruments.Pipette(
    mount='right',
    max_volume=300,
    min_volume=10,
    name="p200",
    tip_racks=[tiprack],
    trash_container=trash)

multi = instruments.Pipette(
    mount='left',
    max_volume=300,
    min_volume=10,
    name="p200S",
    tip_racks=[tiprack],
    trash_container=trash,
    channels=8)


for tip in [tiprack[0], tiprack[-1]]:
    single.pick_up_tip(tip)
    single.aspirate(100, trough[0])
    single.aspirate(100, trough[-1])

    single.dispense(100, plate[0])
    single.dispense(100, plate[-1])
    single.drop_tip(tip)

for tips in [tiprack.rows(0), tiprack.rows[-1]]:
    multi.pick_up_tip(tips)
    multi.aspirate(100, trough.rows[0])
    multi.aspirate(100, trough.rows[-1])

    multi.dispense(100, plate.rows[0])
    multi.dispense(100, plate.rows[-1])
    multi.drop_tip(tips)
