from opentrons import containers, instruments, robot

p200rack = containers.load('tiprack-200ul', '5', 'tiprack')

# create a p200 pipette on robot axis B
p200 = instruments.Pipette(
    name="p200",
    mount="right",
    tip_racks=[p200rack],
    min_volume=20
)

p200.pick_up_tip()

containers = [
    containers.load('96-PCR-flat', slot)
    for slot
    in ('8', '11')
]

# Uncomment these to test precision
p200.move_to(robot.deck['11'])
p200.move_to(robot.deck['6'])

for container in containers:
    p200.aspirate(10, container[0]).dispense(10, container[-1].top(5))

p200.drop_tip()
