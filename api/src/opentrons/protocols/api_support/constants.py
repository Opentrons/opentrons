from pathlib import Path

from opentrons.config import get_opentrons_path

OPENTRONS_NAMESPACE = 'opentrons'
CUSTOM_NAMESPACE = 'custom_beta'
STANDARD_DEFS_PATH = Path("labware/definitions/2")
USER_DEFS_PATH = get_opentrons_path('labware_user_definitions_dir_v2')

SHORT_TRASH_DECK = 'ot2_short_trash'
STANDARD_DECK = 'ot2_standard'
