from .ot3 import gripper_offset
from .ot2 import mark_bad_calibration

from .deck_configuration import (
    serialize_deck_configuration,
    deserialize_deck_configuration,
)

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

__all__ = [
    "helpers",
    # deck calibration functions
    "save_robot_deck_attitude",
    "get_robot_deck_attitude",
    "delete_robot_deck_attitude",
    "save_robot_belt_attitude",
    "get_robot_belt_attitude",
    "delete_robot_belt_attitude",
    # deck configuration functions
    "serialize_deck_configuration",
    "deserialize_deck_configuration",
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
