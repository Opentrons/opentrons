from opentrons import containers
from opentrons import instruments

plate = containers.load(
    '96-flat',
    'B2',
    'test-plate'
)

tiprack = containers.load(
    'tiprack-200ul',  # container type from library
    'A1',             # slot on deck
    'test-tiprack'
)

trough = containers.load(
    'trough-12row',
    'B1',
    'test-trough'
)

trash = containers.load(
    'point',
    'A2',
    'test-trash'
)

p1000 = instruments.Pipette(
    name="p1000",
    trash_container=trash,
    tip_racks=[tiprack],
    min_volume=10,  # These are variable
    max_volume=1000,
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
    channels=8
)

p1000.delete_calibration_data()
p10.delete_calibration_data()

p1000.pick_up_tip(tiprack[0])
p1000.aspirate(10, trough[0])
p1000.dispense(10, plate[0])
p1000.drop_tip(trash)
p10.pick_up_tip(tiprack[0])
p10.aspirate(5, trough[0])
p10.dispense(5, plate[0])
p10.drop_tip(trash)
