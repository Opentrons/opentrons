from opentrons import containers, instruments

metadata = {
    'protocolName': 'Bradford Assay',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A protien quantification assay',
    'source': 'Opentrons Repository'
}

tiprack = containers.load('tiprack-200ul', '9')
tiprack2 = containers.load('tiprack-200ul', '11')


trough = containers.load('trough-12row', '5')
plate = containers.load('96-flat', '1')
tuberack = containers.load('tube-rack-2ml', '4')

p300m = instruments.P300_Multi(tip_racks=[tiprack], mount="left")

p300s = instruments.P300_Single(tip_racks=[tiprack2], mount="right")

# dispense 6 standards from tube racks (A1, B1, C1, D1, A2, B2)
# to first two columns of 96 well plate (duplicates, A1/A2, B1/B2 etc.)
for i in range(6):
    p300s.distribute(
        25, tuberack.wells(i), plate.cols(i).wells('A', 'B'))

# dispense 4 samples from tube rack (C2, D2, A3, B3)
# to row 3 of 96 well plate (duplicates, A3/B3, C3/D3, E3/F3, G3/H3)
p300s.distribute(
    50,
    tuberack.wells('C2', 'D2', 'A3', 'B3'),
    plate.cols('3'))

# fill columns 4 to 11 with 25 uL of dilutent each
p300m.distribute(
    25,
    trough['A1'],
    plate.cols('4', length=8))

# dilute samples down all columns
p300m.pick_up_tip()

p300m.transfer(
    25,
    plate.cols('3', length=8),
    plate.cols('4', length=8),
    mix_after=(3, 25),
    new_tip='never')

# remove 25uL from last row
p300m.aspirate(25, plate.cols('11')).dispense(p300m.trash_container)
p300m.drop_tip()

# fill columns 1 to 11 with 200 uL of Bradford reagent
p300m.transfer(200, trough['A2'], plate.cols('1', length=11))
