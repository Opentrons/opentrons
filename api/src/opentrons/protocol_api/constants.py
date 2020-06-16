from pathlib import Path

from opentrons.config import get_opentrons_path

OPENTRONS_NAMESPACE = 'opentrons'
CUSTOM_NAMESPACE = 'custom_beta'
STANDARD_DEFS_PATH = Path("labware/definitions/2")
OFFSETS_PATH = get_opentrons_path('labware_calibration_offsets_dir_v2')
USER_DEFS_PATH = get_opentrons_path('labware_user_definitions_dir_v2')
TIP_LENGTH_CALIBRATION_PATH = get_opentrons_path('tip_length_calibration_dir')
