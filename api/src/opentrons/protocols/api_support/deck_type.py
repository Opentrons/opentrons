from typing import Sequence, Dict, Optional, Any

from opentrons_shared_data.robot.types import RobotType
from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.errors.exceptions import EnumeratedError

from opentrons.config import feature_flags

from opentrons.protocol_reader.protocol_source import (
    ProtocolConfig,
    PythonProtocolConfig,
    JsonProtocolConfig,
)
from opentrons.protocols.api_support.types import APIVersion


# TODO(mm, 2023-05-10): Deduplicate these constants with
# opentrons.protocol_engine.types.DeckType and consider moving to shared-data.
SHORT_TRASH_DECK = "ot2_short_trash"
STANDARD_OT2_DECK = "ot2_standard"
STANDARD_OT3_DECK = "ot3_standard"


LOAD_FIXED_TRASH_GATE_VERSION_PYTHON = APIVersion(2, 15)
LOAD_FIXED_TRASH_GATE_VERSION_JSON = 7


class NoTrashDefinedError(EnumeratedError):
    """
    Error raised when a protocol attempts to automatically access a trash bin without one being loaded.
    """

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a ProtocolEngineError."""
        super().__init__(
            code=ErrorCodes.GENERAL_ERROR,
            message=message,
            detail=detail,
            wrapping=wrapping,
        )


def should_load_fixed_trash_labware_for_python_protocol(
    api_version: APIVersion,
) -> bool:
    """Whether to automatically load the fixed trash as a labware for a Python protocol at protocol start."""
    return api_version <= LOAD_FIXED_TRASH_GATE_VERSION_PYTHON


def should_load_fixed_trash_area_for_python_protocol(
    api_version: APIVersion, robot_type: RobotType
) -> bool:
    """Whether to automatically load the fixed trash addressable area for OT-2 protocols on 2.16 and above."""
    return (
        api_version > LOAD_FIXED_TRASH_GATE_VERSION_PYTHON
        and robot_type == "OT-2 Standard"
    )


def should_load_fixed_trash(protocol_config: ProtocolConfig) -> bool:
    """Decide whether to automatically load fixed trash labware on the deck based on version."""
    load_fixed_trash = False
    if isinstance(protocol_config, PythonProtocolConfig):
        return should_load_fixed_trash_labware_for_python_protocol(
            protocol_config.api_version
        )
    # TODO(jbl 2023-10-27), when schema v8 is out, use a new deck version field to support fixed trash protocols
    elif isinstance(protocol_config, JsonProtocolConfig):
        load_fixed_trash = (
            protocol_config.schema_version <= LOAD_FIXED_TRASH_GATE_VERSION_JSON
        )

    return load_fixed_trash


def guess_from_global_config() -> str:
    """Return the deck type that the host device physically has.

    This only makes sense when the software is running on a real robot.

    When simulating or analyzing a protocol, especially off-robot, don't use this, because it may
    not match the protocol's declared robot type. Use `for_analysis` instead.
    """
    if feature_flags.enable_ot3_hardware_controller():
        return STANDARD_OT3_DECK
    elif feature_flags.short_fixed_trash():
        return SHORT_TRASH_DECK
    else:
        return STANDARD_OT2_DECK


def for_simulation(robot_type: RobotType) -> str:
    """Return the deck type that should be used for simulating and analyzing a protocol.

    Params:
        robot_type: The robot type that the protocol is meant to run on.
    """
    if robot_type == "OT-2 Standard":
        # OT-2 protocols don't have a way of defining whether they're meant to run on a short-trash
        # or standard deck. So when we're simulating an OT-2 protocol, we need to make an
        # arbitrary choice for which deck type to use.
        return STANDARD_OT2_DECK
    elif robot_type == "OT-3 Standard":
        # OT-3s currently only have a single deck type.
        return STANDARD_OT3_DECK
