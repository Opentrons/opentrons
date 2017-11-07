from opentrons import containers, instruments

# containers.robot.connect()
# containers.robot.home()

tiprack = containers.load('tiprack-200ul', 'B3')
tiprack2 = containers.load('tiprack-200ul', 'B1')
trash = containers.load('trash-box', 'C4')

trough = containers.load('trough-12row', 'C1')
plate = containers.load('96-PCR-flat', 'C2')
tuberack = containers.load('tube-rack-2ml', 'B2')

m50 = instruments.Pipette(
    name="p200",
    trash_container=trash,
    tip_racks=[tiprack2],
    max_volume=50,
    mount='left',
    channels=8
)

p200 = instruments.Pipette(
    name="p200S",
    trash_container=trash,
    tip_racks=[tiprack],
    max_volume=200,
    mount='right'
)


# dispense 6 standards from tube racks (A1, B1, C1, D1, A2, B2)
# to first two rows of 96 well plate (duplicates, A1/A2, B1/B2 etc.)
# for i in range(6):
#    p200.distribute(
#        25, tuberack.wells(i), plate.cols(i).wells('1', '2'))

# dispense 4 samples from tube rack (C2, D2, A3, B3)
# to row 3 of 96 well plate (duplicates, A3/B3, C3/D3, E3/F3, G3/H3)
p200.distribute(
    50,
    tuberack.wells('C2', 'D2', 'A3', 'B3'),
    plate.rows('3'))


# fill rows 4 to 11 with 25 uL of dilutent each
m50.distribute(
    25,
    trough['A1'],
    plate.rows('4', length=8))

# dilute samples down all rows
m50.pick_up_tip()

m50.transfer(
    25,
    plate.rows('3', length=8),
    plate.rows('4', length=8),
    mix_after=(3, 25),
    new_tip='never')

# remove 25uL from last row
m50.aspirate(25, plate.rows('11')).dispense(trash.wells(0))
m50.drop_tip()

# fill rows 1 to 11 with 200 uL of Bradford reagent
m50.transfer(200, trough['A2'], plate.rows('1', length=11))
