""" opentrons.calibration_storage.get: functions for grabbing calibration

This module has functions that you can import to load robot or
labware calibration from its designated file location.
"""
import itertools
import logging
import json
import typing
from typing_extensions import Literal

from opentrons import config
from opentrons.types import Mount

from . import (
    types as local_types,
    file_operators as io,
    helpers,
    cache as calibration_cache,
)

if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.pipette.dev_types import LabwareUri


log = logging.getLogger(__name__)


def load_tip_length_calibration(
    pip_id: str, definition: "LabwareDefinition"
) -> local_types.TipLengthCalibration:
    """
    Function used to grab the current tip length associated
    with a particular tiprack.

    :param pip_id: pipette you are using
    :param definition: full definition of the tiprack
    """
    labware_hash = helpers.hash_labware_def(definition)
    labware_uri = helpers.uri_from_definition(definition)
    load_name = definition["parameters"]["loadName"]
    return calibration_cache.tip_length_data(pip_id, labware_hash)


def get_all_tip_length_calibrations() -> typing.List[local_types.TipLengthCalibration]:
    """
    A helper function that will list all of the tip length calibrations.

    :return: A list of dictionary objects representing all of the
    tip length calibration files found on the robot.
    """
    return calibration_cache._tip_length_calibrations()


def _get_calibration_source(
    data: typing.Dict[str, typing.Any]
) -> local_types.SourceType:
    if "source" not in data.keys():
        return local_types.SourceType.unknown
    else:
        return local_types.SourceType[data["source"]]


def _get_calibration_status(
    data: typing.Dict[str, typing.Any]
) -> local_types.CalibrationStatus:
    if "status" not in data.keys():
        return local_types.CalibrationStatus()
    else:
        return local_types.CalibrationStatus(**data["status"])


def _get_tip_rack_uri(
    data: typing.Dict[str, typing.Any]
) -> typing.Union["LabwareUri", Literal[""]]:
    if "uri" not in data.keys():
        # We cannot reverse look-up a labware definition using a hash
        # so we must return an empty string if no uri is found.
        return ""
    else:
        return typing.cast("LabwareUri", data["uri"])


def get_robot_deck_attitude() -> typing.Optional[local_types.DeckCalibration]:
    return calibration_cache._deck_calibration()


def get_pipette_offset(
    pip_id: str, mount: Mount
) -> typing.Optional[local_types.PipetteOffsetByPipetteMount]:
    return calibration_cache.pipette_offset_data(pip_id, mount)


def get_all_pipette_offset_calibrations() -> typing.List[
    local_types.PipetteOffsetCalibration
]:
    """
    A helper function that will list all of the pipette offset
    calibrations.

    :return: A list of dictionary objects representing all of the
    pipette offset calibration files found on the robot.
    """
    return calibration_cache._pipette_offset_calibrations()


def get_custom_tiprack_definition_for_tlc(labware_uri: str) -> "LabwareDefinition":
    """
    Return the custom tiprack definition saved in the custom tiprack directory
    during tip length calibration
    """
    custom_tiprack_dir = config.get_custom_tiprack_def_path()
    custom_tiprack_path = custom_tiprack_dir / f"{labware_uri}.json"
    try:
        with open(custom_tiprack_path, "rb") as f:
            return typing.cast(
                "LabwareDefinition",
                json.loads(f.read().decode("utf-8")),
            )
    except FileNotFoundError:
        raise FileNotFoundError(
            f"Custom tiprack {labware_uri} not found in the custom tiprack"
            "directory on the robot. Please recalibrate tip length and "
            "pipette offset with this tiprack before performing calibration "
            "health check."
        )


def get_gripper_calibration_offset(
    gripper_id: str,
) -> typing.Optional[local_types.GripperCalibrationOffset]:
    gripper_dir = config.get_opentrons_path("gripper_calibration_dir")
    offset_path = gripper_dir / f"{gripper_id}.json"
    if offset_path.exists():
        try:
            data = io.read_cal_file(offset_path)
        except json.JSONDecodeError:
            log.error(
                f"Skipping corrupt calibration file (bad json): {str(offset_path)}"
            )
            return None
        assert "offset" in data.keys(), "Not valid gripper calibration data"
        return local_types.GripperCalibrationOffset(
            offset=data["offset"],
            source=_get_calibration_source(data),
            last_modified=data["last_modified"],
            status=_get_calibration_status(data),
        )
    else:
        return None
