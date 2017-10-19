from opentrons import containers, instruments, robot

tiprack = containers.load('tiprack-200ul', 'B3')
trash = containers.load('trash-box', 'C4')
plate = containers.load('96-PCR-flat', 'B2')

pipette = instruments.Pipette(
    name="p200",
    trash_container=trash,
    tip_racks=[tiprack],
    max_volume=200,
    mount="right",
    channels=1
)

pipette.pick_up_tip()
for well1, well2 in zip(plate[:-1:2], plate[1::2]):
    pipette.move_to(well1.bottom())
    pipette.move_to(well2.bottom())
