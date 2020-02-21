from opentrons import instruments, containers, robot

metadata = {
    'protocolName': 'Testosaur',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A variant on "Dinosaur" for testing',
    'source': 'Opentrons Repository'
}

p200rack = containers.load('tiprack-200ul', '5', 'tiprack')

# create a p20 con0 pipette on robot axis B
p300 = instruments.P300_Single_GEN2(
    mount="right",
    tip_racks=[p200rack])

p300.pick_up_tip()

containers = [
    containers.load('96-PCR-flat', slot)
    for slot
    in ('8', '11')
]

# Uncomment these to test precision
p300.move_to(robot.deck['11'])
p300.move_to(robot.deck['6'])

for container in containers:
    p300.aspirate(10, container[0]).dispense(10, container[-1].top(5))

p300.drop_tip()
