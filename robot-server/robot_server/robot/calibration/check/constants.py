from opentrons.types import Point


MOVE_TO_TIP_RACK_SAFETY_BUFFER = Point(0, 0, 10)

# Add in a 2mm buffer to tiprack thresholds on top of
# the max acceptable range for a given pipette based
# on calibration research data.
DEFAULT_OK_TIP_PICK_UP_VECTOR = Point(3.79, 3.64, 2.8)
P1000_OK_TIP_PICK_UP_VECTOR = Point(4.7, 4.7, 2.8)


# The tolerances below are absolute values that a pipette
# might be off due to things that cannot be controlled
# such as tip straightness or slight changes betweeen
# tip length. Please review the Motion research for
# further information.
PIPETTE_TOLERANCES = {
    'p1000_crosses': Point(2.7, 2.7, 0.0),
    'p1000_height': Point(0.0, 0.0, 1.0),
    'p300_crosses': Point(1.8, 1.8, 0.0),
    'p20_crosses': Point(1.4, 1.4, 0.0),
    'other_height': Point(0.0, 0.0, 0.8)
}
