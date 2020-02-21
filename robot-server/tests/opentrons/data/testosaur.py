from opentrons import instruments, containers

metadata = {
    'protocolName': 'Testosaur',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A variant on "Dinosaur" for testing',
    'source': 'Opentrons Repository'
}

p200rack = containers.load('tiprack-200ul', '5', 'tiprack')

# create a p200 pipette on robot axis B
p300 = instruments.P300_Single(
    mount="right",
    tip_racks=[p200rack])

p300.pick_up_tip()

conts = [
    containers.load('96-PCR-flat', slot)
    for slot
    in ('8', '11')
]

# Uncomment these to test precision
# p300.move_to(robot.deck['11'])
# p300.move_to(robot.deck['6'])

for container in conts:
    p300.aspirate(10, container[0]).dispense(10, container[-1].top(5))

p300.drop_tip()
