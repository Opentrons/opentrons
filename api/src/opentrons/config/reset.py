import logging
import os
import shutil
from enum import Enum
from pathlib import Path
from typing import NamedTuple, Dict, Set

from opentrons.config import IS_ROBOT
from opentrons.calibration_storage import delete

DATA_BOOT_D = Path("/data/boot.d")

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
    tip_length_calibrations = "tipLengthCalibrations"
    runs_history = "runsHistory"


_settings_reset_options = {
    ResetOptionId.boot_scripts: CommonResetOption(
        name="Boot Scripts", description="Clear custom boot scripts"
    ),
    ResetOptionId.deck_calibration: CommonResetOption(
        name="Deck Calibration",
        description="Clear deck calibration (will also clear pipette " "offset)",
    ),
    ResetOptionId.pipette_offset: CommonResetOption(
        name="Pipette Offset Calibrations",
        description="Clear pipette offset calibrations",
    ),
    ResetOptionId.tip_length_calibrations: CommonResetOption(
        name="Tip Length Calibrations",
        description="Clear tip length calibrations (will also clear " "pipette offset)",
    ),
    # TODO(mm, 2022-05-23): Run and protocol history is a robot-server thing,
    # and is not a concept known to this package (the `opentrons` library).
    # This option is defined here only as a convenience for robot-server.
    # Find a way to split thing up and define this in robot-server instead.
    ResetOptionId.runs_history: CommonResetOption(
        name="Clear Runs History",
        description="Erase this device's stored history of protocols and runs.",
    ),
}


def reset_options() -> Dict[ResetOptionId, CommonResetOption]:
    return _settings_reset_options


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


def reset_boot_scripts() -> None:
    if IS_ROBOT:
        if os.path.exists(DATA_BOOT_D):
            shutil.rmtree(DATA_BOOT_D)
    else:
        log.debug(f"Not on pi, not removing {DATA_BOOT_D}")


def reset_deck_calibration() -> None:
    delete.delete_robot_deck_attitude()
    delete.clear_pipette_offset_calibrations()


def reset_pipette_offset() -> None:
    delete.clear_pipette_offset_calibrations()


def reset_tip_length_calibrations() -> None:
    delete.clear_tip_length_calibration()
    delete.clear_pipette_offset_calibrations()
