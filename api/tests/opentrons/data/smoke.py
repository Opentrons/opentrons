from opentrons import containers, instruments

tiprack = containers.load('tiprack-200ul', '8')
plate = containers.load('96-PCR-flat', '5')

pipette = instruments.P300_Single(
    tip_racks=[tiprack],
    mount="right"
)

pipette.pick_up_tip()
pipette.aspirate(plate[0])
pipette.dispense(plate[1])
