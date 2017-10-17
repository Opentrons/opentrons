from opentrons import containers, instruments, robot

tiprack = containers.load('tiprack-200ul', 'C2')
trash = containers.load('trash-box', 'C4')
plate = containers.load('96-PCR-flat', 'C3')

parents = []
current = robot.pose_tracker._node_dict[tiprack]
while current is not None:
    parents.append(robot.pose_tracker._pose_dict[current.value])
    current = current.parent

print('\n'.join([str(parent) for parent in parents]))

pipette = instruments.Pipette(
    name="p200",
    trash_container=trash,
    tip_racks=[tiprack],
    max_volume=50,
    mount="left",
    channels=8
)

pipette.pick_up_tip()
pipette.aspirate(plate.rows(0))
pipette.dispense(plate.rows(1))
