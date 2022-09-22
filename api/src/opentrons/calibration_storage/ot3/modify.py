""" opentrons.calibration_storage.modify: functions for modifying
calibration storage

This module has functions that you can import to save robot or
labware calibration to its designated file location.
"""
import typing
import json

from opentrons import config
from opentrons.types import Mount, Point
from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.util.helpers import utc_now

from . import cache as calibration_cache

from .. import (
    file_operators as io,
    types as local_types,
    helpers
)

from .schemas import v1


if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition


def create_tip_length_data(
    definition: "LabwareDefinition",
    length: float,
    cal_status: typing.Optional[local_types.CalibrationStatus] = None,
) -> v1.TipLengthSchema:
    """
    Function to correctly format tip length data.

    :param definition: full labware definition
    :param length: the tip length to save
    """
    #TODO(lc 09-19-2022) coordinate with hardware and product to determine
    # if we still need to support custom tipracks/perform tip length calibration.
    labware_hash = helpers.hash_labware_def(definition)
    labware_uri = helpers.uri_from_definition(definition)

    tip_length_data = v1.TipLengthSchema(
        tipLength=length,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status or v1.CalibrationStatus(),
        uri=labware_uri,
    )

    if not definition.get("namespace") == OPENTRONS_NAMESPACE:
        _save_custom_tiprack_definition(labware_uri, definition)

    data = {labware_hash: tip_length_data}
    return data


def _save_custom_tiprack_definition(
    labware_uri: str,
    definition: "LabwareDefinition",
) -> None:
    #TODO(lc 09-19-2022) coordinate with hardware and product to determine
    # if we still need to support custom tipracks/perform tip length calibration.
    namespace, load_name, version = labware_uri.split("/")
    custom_tr_dir_path = config.get_custom_tiprack_def_path()
    custom_namespace_dir = custom_tr_dir_path / f"{namespace}/{load_name}"
    custom_namespace_dir.mkdir(parents=True, exist_ok=True)

    custom_tr_def_path = custom_namespace_dir / f"{version}.json"
    io.save_to_file(custom_tr_def_path, definition)


def save_tip_length_calibration(
    pip_id: str, tip_length_cal: v1.TipLengthSchema
) -> None:
    """
    Function used to save tip length calibration to file.

    :param pip_id: pipette id to associate with this tip length
    :param tip_length_cal: results of the data created using
           :meth:`create_tip_length_data`
    """
    #TODO(lc 09-19-2022) coordinate with hardware and product to determine
    # if we still need to support custom tipracks/perform tip length calibration.
    tip_length_dir_path = config.get_tip_length_cal_path()
    tip_length_dir_path.mkdir(parents=True, exist_ok=True)
    pip_tip_length_path = tip_length_dir_path / f"{pip_id}.json"

    all_tip_lengths = calibration_cache.tip_lengths_for_pipette(pip_id)

    all_tip_lengths.update(tip_length_cal)

    # This is a workaround since pydantic doesn't have a nice way to
    # add encoders when converting to a dict.
    dict_of_tip_lengths = {}
    for key, item in all_tip_lengths.items():
        dict_of_tip_lengths[key] = json.loads(item.json())
    io.save_to_file(pip_tip_length_path, dict_of_tip_lengths)
    calibration_cache._tip_length_calibrations.cache_clear()


def save_robot_deck_attitude(
    transform: local_types.AttitudeMatrix,
    pip_id: typing.Optional[str],
    source: typing.Optional[local_types.SourceType] = None,
    cal_status: typing.Optional[v1.CalibrationStatus] = None,
) -> None:
    #TODO(lc 09-19-2022) finalize with hardware about whether this can truly be deleted.
    robot_dir = config.get_opentrons_path("robot_calibration_dir")
    robot_dir.mkdir(parents=True, exist_ok=True)
    gantry_path = robot_dir / "deck_calibration.json"

    gantry_calibration = v1.DeckCalibrationSchema(
        attitude=transform,
        pipetteCalibratedWith=pip_id,
        lastModified=utc_now(),
        source=source or local_types.SourceType.user,
        status=cal_status or v1.CalibrationStatus(),
    )
    io.save_to_file(gantry_path, gantry_calibration)
    calibration_cache._deck_calibration.cache_clear()


def save_pipette_calibration(
    offset: Point,
    pip_id: str,
    mount: Mount,
    cal_status: typing.Optional[local_types.CalibrationStatus] = None,
) -> None:
    pip_dir = config.get_opentrons_path("pipette_calibration_dir") / mount.name.lower()
    pip_dir.mkdir(parents=True, exist_ok=True)

    offset_path = pip_dir / f"{pip_id}.json"

    pipette_calibration = v1.InstrumentOffsetSchema(
        offset=offset,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status or v1.CalibrationStatus(),
    )
    io.save_to_file(offset_path, pipette_calibration)
    calibration_cache._pipette_offset_calibrations.cache_clear()


def save_gripper_calibration(
    offset: Point,
    gripper_id: str,
    cal_status: typing.Optional[local_types.CalibrationStatus] = None,
) -> None:
    gripper_dir = config.get_opentrons_path("gripper_calibration_dir")
    gripper_dir.mkdir(parents=True, exist_ok=True)
    gripper_path = gripper_dir / f"{gripper_id}.json"

    gripper_calibration = v1.InstrumentOffsetSchema(
        offset=offset,
        lastModified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status or v1.CalibrationStatus(),
    )
    io.save_to_file(gripper_path, gripper_calibration)
    calibration_cache._gripper_offset_calibrations.cache_clear()
