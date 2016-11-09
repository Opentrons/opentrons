from opentrons import containers
from opentrons import instruments
#  from opentrons.robot import Robot

plate = containers.load(
    '96-flat',
    'B2',
    'plate'
)

tiprack = containers.load(
    'tiprack-200ul',  # container type from library
    'A1',             # slot on deck
    'tiprack'         # calibration reference for 1.2 compatibility
)

trough = containers.load(
    'trough-12row',
    'B1',
    'trough'
)

trash = containers.load(
    'point',
    'A2',
    'trash'
)

p200s = instruments.Pipette(
    name="p200",
    trash_container=trash,
    tip_racks=[tiprack],
    min_volume=10,  # These are variable
    max_volume=200,
    axis="b",
    channels=1
)
p10 = instruments.Pipette(
    name="p10",
    trash_container=trash,
    tip_racks=[tiprack],
    min_volume=1,  # These are variable
    max_volume=10,
    axis="a",
    channels=1
)
p200.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)
p10.calibrate_plunger(top=0, bottom=11, blow_out=13, drop_tip=14)

p200.pick_up_tip(tiprack[0])

p200.aspirate(10, trough[0])
p200.dispense(10, plate[0])

p200.drop_tip(trash)

p10.pick_up_tip(tiprack[0])

p10.aspirate(5, trough[0])
p10.dispense(5, plate[0])

p10.drop_tip(trash)
