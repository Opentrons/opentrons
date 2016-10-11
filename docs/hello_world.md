# Hello, Opentrons API

```python
from opentrons_sdk import containers
from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot
from opentrons_sdk.helpers.helpers import import_calibration_json

robot = Robot.get_instance()
robot.list_serial_ports()

robot.connect()
# robot.connect('/dev/tty.usbmodem1421')
robot.home()

tiprack = containers.load(
    'tiprack-200ul',  # container type
    'A1',             # slot
    'tiprack'         # user-defined name
)
plate = containers.load(
    '96-flat',
    'B1',
    'plate'
)
    
p200 = instruments.Pipette(
    name="p200",
    min_volume=0.5,
    axis="b",
    channels=1
)

p200.set_max_volume(200)  # volume calibration, can be called whenever you want

robot.clear()

p200.pick_up_tip(tiprack[0])

# loop through 95 wells, ignoring the 96th
for i in range(0, 94):
    p200.aspirate(100, plate[i])
    p200.dispense(plate[i + 1]).blow_out().touch_tip()

p200.drop_tip(tiprack[0])

robot.run()

```
