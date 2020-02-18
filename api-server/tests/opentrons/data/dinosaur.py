from opentrons import containers, instruments

metadata = {
    'protocolName': 'Dinosaur',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'Simple protocol to draw a dinosaur in a 96 well plate',
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

# macro commands like .distribute() make writing long sequences easier
p200.distribute(
    50,
    trough.wells('A1'),
    plate.wells(
        'E1', 'D2', 'E2', 'D3', 'E3', 'F3', 'G3', 'H3',
        'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'C5', 'D5',
        'E5', 'F5', 'G5', 'C6', 'D6', 'E6', 'F6', 'G6',
        'C7', 'D7', 'E7', 'F7', 'G7', 'D8', 'E8', 'F8',
        'G8', 'H8', 'E9', 'F9', 'G9', 'H9', 'F10', 'G11',
        'H12'
    ),
    disposal_vol=0
)

p200.distribute(
    50,
    trough.wells('A2'),
    plate.wells(
        'C3', 'B4', 'A5', 'B5', 'B6', 'A7', 'B7',
        'C8', 'C9', 'D9', 'E10', 'E11', 'F11', 'G12'
    ),
    disposal_vol=0
)
