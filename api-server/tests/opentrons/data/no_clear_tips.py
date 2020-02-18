from opentrons import containers, instruments

metadata = {
    'protocolName': 'No-clear-tips',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A test protocol that does not drop tips at the end',
    'source': 'Opentrons Repository'
}

# a 12 row trough for sources, and 96 well plate for output
trough = containers.load('trough-12row', '3', 'trough')
plate = containers.load('96-PCR-flat', '1', 'plate')

# a tip rack for our pipette
p200rack = containers.load('tiprack-200ul', '2', 'tiprack')

# create a p200 pipette on robot axis B
p200 = instruments.P300_Single(mount="left", tip_racks=[p200rack])

# simple, atomic commands to control fine details
p200.pick_up_tip()
p200.aspirate(50, trough.wells('A1'))
p200.dispense(plate.wells('D1'))
