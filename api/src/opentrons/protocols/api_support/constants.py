from pathlib import Path

from opentrons.config import get_opentrons_path
from opentrons.config import feature_flags as ff

OPENTRONS_NAMESPACE = "opentrons"
CUSTOM_NAMESPACE = "custom_beta"
STANDARD_DEFS_PATH = Path("labware/definitions/2")
USER_DEFS_PATH = get_opentrons_path("labware_user_definitions_dir_v2")

SHORT_TRASH_DECK = "ot2_short_trash"
STANDARD_OT2_DECK = "ot2_standard"
STANDARD_OT3_DECK = "ot3_standard"


def deck_type() -> str:
    if ff.enable_ot3_hardware_controller():
        return STANDARD_OT3_DECK
    elif ff.short_fixed_trash():
        return SHORT_TRASH_DECK
    else:
        return STANDARD_OT2_DECK
