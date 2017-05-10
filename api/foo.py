# from opentrons import instruments, containers
#
# print(type(containers))
# print(type(instruments))
#
# print(instruments.Pipette)
# print(containers.load)
#

from opentrons import robot, containers, instruments

print(id(robot))


# a 12 row trough for sources, and 96 well plate for output
trough = containers.load('trough-12row', 'C1', 'trough')
plate = containers.load('96-PCR-flat', 'D1', 'plate')

# a tip rack for our pipette
p200rack = containers.load('tiprack-200ul', 'B1', 'tiprack')

# create a p200 pipette on robot axis B
p200 = instruments.Pipette(
    axis="b",
    min_volume=20,
    max_volume=200,
    tip_racks=[p200rack]
)

# simple, atomic commands to control fine details
p200.pick_up_tip()
p200.aspirate(50, trough.wells('A1'))
p200.dispense(plate.wells('D1'))


