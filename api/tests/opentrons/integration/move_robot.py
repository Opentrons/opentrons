import os

from opentrons import containers
from opentrons.labware import instruments
from opentrons import Robot
from opentrons.drivers.motor import SmoothieDriver1

from helpers.calibration import import_json_calibration

robot = Robot.get_instance()

robot._driver = SmoothieDriver1()

plate = containers.load('96-flat', 'A2', 'magbead')
trash = containers.load('point', 'A1', 'trash')
tiprack = containers.load('tiprack-200ul', 'B2', 'p200-rack')

# tipracks need a Well height equal to the tip length
for tip in tiprack:
    tip.properties['height'] = 80

p200 = instruments.Pipette(
    name="p200",
    trash_container=trash,
    tip_racks=[tiprack],
    min_volume=0.1,  # These are variable
    axis="b",
    channels=1
)

json_file_path = os.path.join(
    os.path.dirname(__file__),
    'pipette_calibrations.json'
)

import_json_calibration(json_file_path, robot)

while not robot.connect('/dev/tty.usbmodem1411'):
    print('attemping connect...')

# robot.home('z')
# robot.home()


def calibrate_plunger():
    robot.move_head(b=32)
    p200.calibrate('drop_tip')

    robot.move_head(b=30)
    p200.calibrate('blow_out')

    robot.move_head(b=28.5)
    p200.calibrate('bottom')

    robot.move_head(b=13)
    p200.calibrate('top')


def setup_tiprack():

    robot.move_head(z=90)
    robot.move_head(x=112, y=15)
    robot.move_head(z=4)

    bottom_pos = tiprack[0].from_center(x=0, y=0, z=1, reference=tiprack)
    p200.calibrate_position((tiprack, bottom_pos))


def setup_plate():
    robot.move_head(z=90)
    robot.move_head(x=18, y=-119)
    robot.move_head(z=-18)
    p200.calibrate_position((plate, plate[0].center(plate)))


def run_test():
    p200.pick_up_tip(tiprack[0])
    p200.drop_tip(tiprack[0])

    p200.pick_up_tip(tiprack[4])
    p200.drop_tip(tiprack[95])


calibrate_plunger()
setup_tiprack()
setup_plate()
run_test()
