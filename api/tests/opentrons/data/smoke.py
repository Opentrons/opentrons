from opentrons import containers, instruments

tiprack = containers.load('tiprack-200ul', 'B3')
trash = containers.load('trash-box', 'C4')
plate = containers.load('96-PCR-flat', 'B2')

pipette = instruments.Pipette(
    name="p200",
    trash_container=trash,
    tip_racks=[tiprack],
    mount="right",
    channels=1
)

pipette.pick_up_tip()
pipette.aspirate(plate[0])
pipette.dispense(plate[1])
