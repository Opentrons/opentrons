from opentrons_sdk import containers
from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot
from opentrons_sdk.drivers.motor import CNCDriver

robot = Robot.get_instance()

robot._driver = CNCDriver()

plate = containers.load('96-flat', 'A2')
trash = containers.load('point', 'A3')
tiprack = containers.load('tiprack-10ul', 'B2')

p200 = instruments.Pipette(
    trash_container=trash,
    tip_racks=[tiprack],
    min_volume=0.1,  # These are variable
    axis="b",
    channels=1
)

robot.connect('/dev/tty.usbmodem1421')

# robot.home()
robot.move_head(x=144, y=269.5)
robot.move_head(z=-50)

p200.calibrate_position((plate, plate[0].center(plate)))
p200.calibrate_plunger(top=0, bottom=15, blow_out=18, drop_tip=20)
p200.set_max_volume(200)

# p200.aspirate(200, plate[0])
# p200.dispense(200, plate[4])
#
# p200.transfer(plate[0], plate[4], 200)
p200.aspirate(100).mix()
# p200.mix(3, 1)
# p200.consolidate(plate[0], [plate[1], plate[2], plate[3]], 100, 9)

robot.run()
