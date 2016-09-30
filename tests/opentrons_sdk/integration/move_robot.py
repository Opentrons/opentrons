from opentrons_sdk import containers
from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot
from opentrons_sdk.drivers.motor import CNCDriver

robot = Robot.get_instance()

robot._driver = CNCDriver()

plate = containers.load('96-flat', 'A2')
trash = containers.load('point', 'A1')
tiprack = containers.load('tiprack-10ul', 'B2')

p200 = instruments.Pipette(
    trash_container=trash,
    tip_racks=[tiprack],
    min_volume=0.1,  # These are variable
    axis="b",
    channels=1
)

p200.calibrate_plunger(top=13, bottom=10, blow_out=11, drop_tip=12)
p200.set_max_volume(200)

robot.connect('/dev/tty.usbmodem1411')
# robot.home('z')
# robot.home()

robot.move_head(b=32)
p200.calibrate('drop_tip')

robot.move_head(b=30)
p200.calibrate('blow_out')

robot.move_head(b=28.5)
p200.calibrate('bottom')

robot.move_head(b=13)
p200.calibrate('top')

# robot.move_head(z=10)
# robot.move_head(x=113, y=15)
# robot.move_head(z=2)

# p200.calibrate_position((tiprack, tiprack[0].center(tiprack)))

# robot.home('z')
# robot.home()

# p200.pick_up_tip(tiprack[0])
# p200.drop_tip(tiprack[0])

# robot.run()

# robot.move_head(z=10)
# robot.move_head(x=20, y=-119.5)
# robot.move_head(z=-19)

# p200.calibrate_position((plate, plate[0].center(plate)))

# for well in plate[:-2:2]:
#     p200.aspirate(10.1, well).dispense(10.1, next(well))

# for well in plate[:-2:2]:
#     p200.aspirate(10.1, well).dispense(10.1, next(well))

# robot.run()
