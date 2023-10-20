import logging
import os
import shutil
from enum import Enum
from pathlib import Path
from typing import NamedTuple, Dict, Set

from opentrons.config import IS_ROBOT, feature_flags as ff
from opentrons.calibration_storage import (
    delete_robot_deck_attitude,
    gripper_offset,
)

if ff.enable_ot3_hardware_controller():
    from opentrons.calibration_storage.ot3.pipette_offset import (
        clear_pipette_offset_calibrations,
    )
    from opentrons.calibration_storage.ot3.tip_length import (
        clear_tip_length_calibration,
    )
else:
    from opentrons.calibration_storage.ot2.pipette_offset import (
        clear_pipette_offset_calibrations,
    )
    from opentrons.calibration_storage.ot2.tip_length import (
        clear_tip_length_calibration,
    )


DATA_BOOT_D = Path("/data/boot.d")
AUTHORIZED_KEYS = Path(os.path.expanduser("~/.ssh/authorized_keys"))

log = logging.getLogger(__name__)


class UnrecognizedOption(Exception):
    pass


class CommonResetOption(NamedTuple):
    name: str
    description: str


class ResetOptionId(str, Enum):
    """The available reset options"""

    boot_scripts = "bootScripts"
    deck_calibration = "deckCalibration"
    pipette_offset = "pipetteOffsetCalibrations"
    gripper_offset = "gripperOffsetCalibrations"
    tip_length_calibrations = "tipLengthCalibrations"
    runs_history = "runsHistory"
    on_device_display = "onDeviceDisplay"
    module_calibration = "moduleCalibration"
    authorized_keys = "authorizedKeys"


_OT_2_RESET_OPTIONS = [
    ResetOptionId.boot_scripts,
    ResetOptionId.deck_calibration,
    ResetOptionId.pipette_offset,
    ResetOptionId.tip_length_calibrations,
    ResetOptionId.runs_history,
    ResetOptionId.authorized_keys,
]
_FLEX_RESET_OPTIONS = [
    ResetOptionId.boot_scripts,
    ResetOptionId.pipette_offset,
    ResetOptionId.gripper_offset,
    ResetOptionId.runs_history,
    ResetOptionId.on_device_display,
    ResetOptionId.module_calibration,
    ResetOptionId.authorized_keys,
]

_settings_reset_options = {
    ResetOptionId.boot_scripts: CommonResetOption(
        name="Boot Scripts", description="Clear custom boot scripts"
    ),
    ResetOptionId.deck_calibration: CommonResetOption(
        name="Deck Calibration",
        description="Clear deck calibration (will also clear pipette offset)",
    ),
    ResetOptionId.pipette_offset: CommonResetOption(
        name="Pipette Offset Calibrations",
        description="Clear pipette offset calibrations",
    ),
    ResetOptionId.gripper_offset: CommonResetOption(
        name="Gripper Offset Calibrations",
        description="Clear gripper offset calibrations",
    ),
    ResetOptionId.tip_length_calibrations: CommonResetOption(
        name="Tip Length Calibrations",
        description="Clear tip length calibrations (will also clear pipette offset)",
    ),
    # TODO(mm, 2022-05-23): runs_history and on_device_display are robot-server things,
    # and are not concepts known to this package (the `opentrons` library).
    # This option is defined here only as a convenience for robot-server.
    # Find a way to split things up and define this in robot-server instead.
    ResetOptionId.runs_history: CommonResetOption(
        name="Clear Runs History",
        description="Erase this device's stored history of protocols and runs.",
    ),
    ResetOptionId.on_device_display: CommonResetOption(
        name="On-Device Display Configuration",
        description="Clear the configuration of the on-device display (touchscreen)",
    ),
    ResetOptionId.module_calibration: CommonResetOption(
        name="Module Calibrations", description="Clear module offset calibrations"
    ),
    ResetOptionId.authorized_keys: CommonResetOption(
        name="SSH Authorized Keys", description="Clear the ssh authorized keys"
    ),
}


def reset_options(robot_type: str) -> Dict[ResetOptionId, CommonResetOption]:
    reset_options_for_robot_type = (
        _OT_2_RESET_OPTIONS if robot_type == "OT-2 Standard" else _FLEX_RESET_OPTIONS
    )
    return {
        key: _settings_reset_options[key]
        for key in _settings_reset_options
        if key in reset_options_for_robot_type
    }


def reset(options: Set[ResetOptionId]) -> None:
    """
    Execute a reset of the requested parts of the user configuration.

    :param options: the parts to reset
    """
    log.info("Reset requested for %s", options)

    if ResetOptionId.boot_scripts in options:
        reset_boot_scripts()

    if ResetOptionId.deck_calibration in options:
        reset_deck_calibration()

    if ResetOptionId.pipette_offset in options:
        reset_pipette_offset()

    if ResetOptionId.tip_length_calibrations in options:
        reset_tip_length_calibrations()

    if ResetOptionId.gripper_offset in options:
        reset_gripper_offset()

    if ResetOptionId.module_calibration in options:
        reset_module_calibration()

    if ResetOptionId.authorized_keys in options:
        reset_authorized_keys()


def reset_boot_scripts() -> None:
    if IS_ROBOT:
        if os.path.exists(DATA_BOOT_D):
            shutil.rmtree(DATA_BOOT_D)
    else:
        log.debug(f"Not on pi, not removing {DATA_BOOT_D}")


# (lc 09-15-2022) Choosing to import both ot2 and ot3 delete modules
# rather than type ignore an import_module command using importlib.
def reset_deck_calibration() -> None:
    delete_robot_deck_attitude()
    clear_pipette_offset_calibrations()


def reset_pipette_offset() -> None:
    clear_pipette_offset_calibrations()


def reset_gripper_offset() -> None:
    gripper_offset.clear_gripper_calibration_offsets()


def reset_tip_length_calibrations() -> None:
    clear_tip_length_calibration()
    clear_pipette_offset_calibrations()


def reset_module_calibration() -> None:
    try:
        from opentrons.calibration_storage.ot3.module_offset import (
            clear_module_offset_calibrations,
        )

        clear_module_offset_calibrations()
    except ImportError:
        log.warning("Tried to clear module offset calibrations on an OT-2")


def reset_authorized_keys() -> None:
    if IS_ROBOT and os.path.exists(AUTHORIZED_KEYS):
        with open(AUTHORIZED_KEYS, "w") as fh:
            fh.write("")
