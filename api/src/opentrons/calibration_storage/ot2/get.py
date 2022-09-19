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

from . import cache as calibration_cache

from .. import (
    types as local_types,
    file_operators as io,
    helpers,
)

if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.pipette.dev_types import LabwareUri

from .schemas import v1


log = logging.getLogger(__name__)


def load_tip_length_calibration(
    pip_id: str, definition: "LabwareDefinition"
) -> v1.TipLengthCalibration:
    """
    Function used to grab the current tip length associated
    with a particular tiprack.

    :param pip_id: pipette you are using
    :param definition: full definition of the tiprack
    """
    labware_hash = helpers.hash_labware_def(definition)
    load_name = definition["parameters"]["loadName"]
    # We should eventually use the pydantic model directly for the http endpoints that
    # return calibration data
    tip_length_schema = calibration_cache.tip_length_data(pip_id, labware_hash, load_name)
    return v1.TipLengthCalibration(
        tip_length=tip_length_schema.tipLength,
        source=tip_length_schema.source,
        status=tip_length_schema.status,
        pipette=tip_length_schema.pipette,
        tiprack=tip_length_schema.tiprack,
        last_modified=tip_length_schema.lastModified,
        uri=tip_length_schema.uri,
        )


def get_all_tip_length_calibrations() -> typing.List[v1.TipLengthCalibration]:
    """
    A helper function that will list all of the tip length calibrations.

    :return: A list of dictionary objects representing all of the
    tip length calibration files found on the robot.
    """
    return calibration_cache._tip_length_calibrations()


def get_robot_deck_attitude() -> typing.Optional[v1.DeckCalibrationSchema]:
    return calibration_cache._deck_calibration()


def get_pipette_offset(
    pip_id: str, mount: Mount
) -> typing.Optional[v1.InstrumentOffsetSchema]:
    return calibration_cache.pipette_offset_data(pip_id, mount)


def get_all_pipette_offset_calibrations() -> typing.List[
    v1.InstrumentOffsetSchema
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
