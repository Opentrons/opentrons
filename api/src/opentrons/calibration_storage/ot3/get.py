""" opentrons.calibration_storage.get: functions for grabbing calibration

This module has functions that you can import to load robot or
labware calibration from its designated file location.
"""
import logging
import json
import typing

from opentrons import config
from opentrons.types import Mount

from . import cache as calibration_cache

from .. import (
    helpers,
)

if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.pipette.dev_types import LabwareUri

from .schemas import v1


log = logging.getLogger(__name__)


def load_tip_length_calibration(
    pip_id: str, definition: "LabwareDefinition"
) -> v1.TipLengthSchema:
    """
    Function used to grab the current tip length associated
    with a particular tiprack.

    :param pip_id: pipette you are using
    :param definition: full definition of the tiprack
    """
    #TODO(lc 09-19-2022) coordinate with hardware and product to determine
    # if we still need to support custom tipracks/perform tip length calibration.
    labware_hash = helpers.hash_labware_def(definition)
    load_name = definition["parameters"]["loadName"]
    return calibration_cache.tip_length_data(pip_id, labware_hash, load_name)


def get_all_tip_length_calibrations() -> typing.List[v1.TipLengthSchema]:
    """
    A helper function that will list all of the tip length calibrations.

    :return: A list of dictionary objects representing all of the
    tip length calibration files found on the robot.
    """
    #TODO(lc 09-19-2022) coordinate with hardware and product to determine
    # if we still need to support custom tipracks/perform tip length calibration.
    return calibration_cache._tip_length_calibrations()


def get_robot_deck_attitude() -> typing.Optional[v1.DeckCalibrationSchema]:
    """
    Return the currently calibrated robot deck attitude.
    """
    #TODO(lc 09-19-2022) finalize with hardware about whether this can truly be deleted.
    return calibration_cache._deck_calibration()


def get_pipette_offset(
    pip_id: str, mount: Mount
) -> typing.Optional[v1.InstrumentOffsetSchema]:
    """
    Return the requested pipette offset data.
    """
    return calibration_cache.pipette_offset_data(pip_id, mount)


def get_all_pipette_offset_calibrations() -> typing.List[v1.InstrumentOffsetSchema]:
    #TODO actually a dict that needs to be typed
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
    #TODO(lc 09-15-2022) Determine if we actually need this function.
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
) -> typing.Optional[v1.InstrumentOffsetSchema]:
    """
    Return the requested gripper offset data.
    """
    return calibration_cache.gripper_calibration(gripper_id)
