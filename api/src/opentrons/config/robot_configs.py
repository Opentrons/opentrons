import json
import logging
import os
from pathlib import Path

from typing import Any, Dict, List, Union, Optional, cast
from typing_extensions import Literal

from . import CONFIG, defaults_ot3, defaults_ot2
from .feature_flags import enable_ot3_hardware_controller
from opentrons.hardware_control.types import BoardRevision
from .types import CurrentDict, RobotConfig, AxisDict, OT3Config

log = logging.getLogger(__name__)


def current_for_revision(
    current_dict: CurrentDict, revision: BoardRevision
) -> AxisDict:
    if revision == BoardRevision.UNKNOWN:
        return current_dict.get("2.1", current_dict["default"])
    elif revision.real_name() in current_dict:
        return current_dict[revision.real_name()]  # type: ignore
    else:
        return current_dict["default"]


def build_config(robot_settings: Dict[str, Any]) -> Union[RobotConfig, OT3Config]:
    default_robot_model: Union[Literal["OT-3 Standard"], Literal["OT-2 Standard"]] = (
        "OT-3 Standard" if enable_ot3_hardware_controller() else "OT-2 Standard"
    )
    robot_model = robot_settings.get("model", default_robot_model)
    if robot_model == "OT-3 Standard":
        return build_config_ot3(robot_settings)
    else:
        return build_config_ot2(robot_settings)


def build_config_ot2(robot_settings: Dict[str, Any]) -> RobotConfig:
    return defaults_ot2.build_with_defaults(robot_settings)


def build_config_ot3(robot_settings: Dict[str, Any]) -> OT3Config:
    return defaults_ot3.build_with_defaults(robot_settings)


def config_to_save(config: Union[RobotConfig, OT3Config]) -> Dict[str, Any]:
    if config.model == "OT-2 Standard":
        return defaults_ot2.serialize(config)
    else:
        return defaults_ot3.serialize(config)


def _load_file() -> Dict[str, Any]:
    settings_file = CONFIG["robot_settings_file"]
    log.debug("Loading robot settings from {}".format(settings_file))
    return _load_json(settings_file) or {}


def load() -> Union[RobotConfig, OT3Config]:
    return build_config(_load_file())


def load_ot2() -> RobotConfig:
    return build_config_ot2(_load_file())


def load_ot3() -> OT3Config:
    return build_config_ot3(_load_file())


def save_robot_settings(
    config: Union[RobotConfig, OT3Config],
    rs_filename: Optional[str] = None,
    tag: Optional[str] = None,
) -> Dict[str, Any]:
    config_dict = config_to_save(config)

    # Save everything else in a different file
    filename = rs_filename or CONFIG["robot_settings_file"]
    if tag:
        root, ext = os.path.splitext(filename)
        filename = "{}-{}{}".format(root, tag, ext)
    _save_json(config_dict, filename=filename)

    return config_dict


def backup_configuration(
    config: Union[RobotConfig, OT3Config], tag: Optional[str] = None
) -> None:
    import time

    if not tag:
        tag = str(int(time.time() * 1000))
    save_robot_settings(config, tag=tag)


def get_legacy_gantry_calibration() -> Optional[List[List[float]]]:
    """
    Returns the legacy gantry calibration if exists.

    This should happen only if the new deck calibration file does not exist.
    The legacy calibration should then be migrated to the new format.
    """
    gantry_cal = _load_json(CONFIG["deck_calibration_file"])
    if "gantry_calibration" in gantry_cal:
        return gantry_cal["gantry_calibration"]  # type: ignore[no-any-return]
    else:
        return None


def clear() -> None:
    _clear_file(CONFIG["robot_settings_file"])


def _clear_file(filename: Union[str, Path]) -> None:
    log.debug("Deleting {}".format(filename))
    if os.path.exists(filename):
        os.remove(filename)


# TODO: move to util (write a default load, save JSON function)
def _load_json(filename: Union[str, Path]) -> Dict[str, Any]:
    try:
        with open(filename, "r") as file:
            res = json.load(file)
    except FileNotFoundError:
        log.warning("{0} not found. Loading defaults".format(filename))
        res = {}
    except json.decoder.JSONDecodeError:
        log.warning("{0} is corrupt. Loading defaults".format(filename))
        res = {}
    return cast(Dict[str, Any], res)


def _save_json(data: Dict[str, Any], filename: Union[str, Path]) -> None:
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as file:
            json.dump(data, file, sort_keys=True, indent=4)
            file.flush()
            os.fsync(file.fileno())
    except OSError:
        log.exception("Write failed with exception:")


def default_deck_calibration() -> List[List[float]]:
    if enable_ot3_hardware_controller():
        return defaults_ot3.DEFAULT_DECK_TRANSFORM
    else:
        return defaults_ot2.DEFAULT_DECK_CALIBRATION_V2


def default_pipette_offset() -> List[float]:
    if enable_ot3_hardware_controller():
        return defaults_ot3.DEFAULT_PIPETTE_OFFSET
    else:
        return defaults_ot2.DEFAULT_PIPETTE_OFFSET
