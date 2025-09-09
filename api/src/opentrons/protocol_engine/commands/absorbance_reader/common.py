"""Common absorbance reader defines."""

# This needs to be re-defined because of circular imports
_PLATE_READER_MAX_LABWARE_Z_MM = 16.0
# Distance to home the gripper when moving the plate reader lid to/from the dock.
LID_Z_CLEARANCE = _PLATE_READER_MAX_LABWARE_Z_MM + 40.0
