"""Constants for the dimensions of the Flex waste chute.

TODO: Delete this when we resolve https://opentrons.atlassian.net/browse/RSS-418.
"""


from opentrons.types import Point

# TODO: This z-coord is misleading. We need to account for the labware height and the paddle height;
# we can't define this as a single coordinate.
SLOT_ORIGIN_TO_GRIPPER_JAW_CENTER = Point(64, 29, 136.5)
