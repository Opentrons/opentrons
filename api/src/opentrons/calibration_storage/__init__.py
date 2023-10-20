from opentrons import config

from .ot3 import gripper_offset
from .ot2 import mark_bad_calibration

# TODO these functions are only used in robot server. We should think about moving them and/or
# abstracting it away from a robot specific function. We should also check if the tip rack
# definition information is still needed.
from .ot2.tip_length import (
    get_custom_tiprack_definition_for_tlc,
    get_all_tip_length_calibrations,
    _save_custom_tiprack_definition,
)
from .ot2.pipette_offset import get_all_pipette_offset_calibrations
from .ot3.deck_attitude import (
    save_robot_belt_attitude,
    get_robot_belt_attitude,
    delete_robot_belt_attitude,
)
from .ot2.deck_attitude import (
    save_robot_deck_attitude,
    get_robot_deck_attitude,
    delete_robot_deck_attitude,
)

from . import ot2, ot3, helpers

"""
if config.feature_flags.enable_ot3_hardware_controller():
    from .ot3.pipette_offset import (
        save_pipette_calibration,
        clear_pipette_offset_calibrations,
        get_pipette_offset,
        delete_pipette_offset_file,
    )
    from .ot3.tip_length import (
        clear_tip_length_calibration,
        create_tip_length_data,
        save_tip_length_calibration,
        tip_lengths_for_pipette,
        load_tip_length_calibration,
        delete_tip_length_calibration,
    )
    from .ot3 import models
    from .ot3.module_offset import (
        save_module_calibration,
        clear_module_offset_calibrations,
        get_module_offset,
        delete_module_offset_file,
        load_all_module_offsets,
    )
else:
    from .ot2.pipette_offset import (
        save_pipette_calibration,
        clear_pipette_offset_calibrations,
        get_pipette_offset,
        delete_pipette_offset_file,
    )
    from .ot2.tip_length import (
        clear_tip_length_calibration,
        create_tip_length_data,
        save_tip_length_calibration,
        tip_lengths_for_pipette,
        load_tip_length_calibration,
        delete_tip_length_calibration,
    )
    from .ot2 import models  # type: ignore[no-redef]
"""

__all__ = [
    "helpers",
    # deck calibration functions
    "save_robot_deck_attitude",
    "get_robot_deck_attitude",
    "delete_robot_deck_attitude",
    "save_robot_belt_attitude",
    "get_robot_belt_attitude",
    "delete_robot_belt_attitude",
    # functions only used in robot server
    "_save_custom_tiprack_definition",
    "get_custom_tiprack_definition_for_tlc",
    "get_all_pipette_offset_calibrations",
    "get_all_tip_length_calibrations",
    # file exports
    "gripper_offset",
    "mark_bad_calibration",
    # Platform specific submodules
    "ot2",
    "ot3",
]
