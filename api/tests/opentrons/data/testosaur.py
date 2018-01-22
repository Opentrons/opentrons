from opentrons import containers, instruments, robot

p200rack = containers.load('tiprack-200ul', 'B2', 'tiprack')

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
    in ('B3', 'C3')
]

# Uncomment these to test precision
p200.move_to(robot.deck['B4'])
p200.move_to(robot.deck['C2'])

for container in containers:
    p200.aspirate(10, container[0]).dispense(10, container[-1].top(5))

p200.drop_tip()
