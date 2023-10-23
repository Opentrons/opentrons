"""Constants for the dimensions of the Flex waste chute.

https://docs.google.com/spreadsheets/d/1yGRN-5QOa45p-jLsi4tL_PbHmKSK-QsXqHws6oBK7do/edit#gid=258725851

These should be moved into shared-data and interpreted by Protocol Engine.
"""


from opentrons.types import Point


SLOT_ORIGIN_TO_1_OR_8_TIP_A1 = Point(64, 21.91, 144)
SLOT_ORIGIN_TO_96_TIP_A1 = Point(14.445, 42.085, 115)

# TODO: This z-coord is misleading. We need to account for the labware height and the paddle height;
# we can't define this as a single coordinate.
SLOT_ORIGIN_TO_GRIPPER_JAW_CENTER = Point(64, 29, 136.5)

# This includes the height of the optional lid.
ENVELOPE_HEIGHT = 154
