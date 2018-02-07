from opentrons import containers, instruments

tiprack = containers.load('tiprack-200ul', '8')
plate = containers.load('96-PCR-flat', '5')

pipette = instruments.Pipette(
    name="p200",
    tip_racks=[tiprack],
    mount="right",
    channels=1
)

pipette.pick_up_tip()
pipette.aspirate(plate[0])
pipette.dispense(plate[1])
