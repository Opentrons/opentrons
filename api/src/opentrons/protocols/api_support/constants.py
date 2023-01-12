from pathlib import Path

from opentrons_shared_data.deck import DefinitionName as DeckDefinitionName

from opentrons.config import get_opentrons_path
from opentrons.config import feature_flags as ff

OPENTRONS_NAMESPACE = "opentrons"
CUSTOM_NAMESPACE = "custom_beta"
STANDARD_DEFS_PATH = Path("labware/definitions/2")
USER_DEFS_PATH = get_opentrons_path("labware_user_definitions_dir_v2")


def deck_type() -> DeckDefinitionName:
    if ff.enable_ot3_hardware_controller():
        return DeckDefinitionName.OT3_STANDARD
    elif ff.short_fixed_trash():
        return DeckDefinitionName.OT2_SHORT_TRASH
    else:
        return DeckDefinitionName.OT2_STANDARD
