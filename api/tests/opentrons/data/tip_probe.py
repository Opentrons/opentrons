from opentrons import robot, instruments
from opentrons.api import calibration

left = instruments.Pipette(mount='left', channels=8)
right = instruments.Pipette(mount='right', channels=1)

left._instrument = left
right._instrument = right

calibration_manager = calibration.CalibrationManager()

robot.connect()
robot.home()

calibration_manager.tip_probe(right)
calibration_manager.tip_probe(left)
