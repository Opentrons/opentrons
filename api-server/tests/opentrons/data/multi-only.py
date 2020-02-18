from opentrons import containers, instruments

metadata = {
    'protocolName': 'Multi-only',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A protocol that only uses an 8-channel pipette',
    'source': 'Opentrons Repository'
}

tiprack = containers.load('tiprack-200ul', '8')
trough = containers.load('trough-12row', '9')

plate = containers.load('96-flat', '5')

multi = instruments.Pipette(
    mount='left',
    min_volume=10,
    name="p200S",
    tip_racks=[tiprack],
    channels=8)

for tips in [tiprack.rows(0), tiprack.rows[-1]]:
    multi.pick_up_tip(tips)
    multi.aspirate(100, trough.rows[0])
    multi.aspirate(100, trough.rows[-1])

    multi.dispense(100, plate.rows[0])
    multi.dispense(100, plate.rows[-1])
    multi.drop_tip(tips)
