""" opentrons.calibration_storage.modify: functions for modifying
calibration storage

This module has functions that you can import to save robot or
labware calibration to its designated file location.
"""
import typing
from dataclasses import asdict

from opentrons import config
from opentrons.types import Mount, Point
from opentrons.protocols.api_support.constants import OPENTRONS_NAMESPACE
from opentrons.util.helpers import utc_now

from . import cache as calibration_cache

from .. import (
    file_operators as io,
    types as local_types,
)

from .schemas import v1


if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition


def save_robot_deck_attitude(
    transform: local_types.AttitudeMatrix,
    pip_id: typing.Optional[str],
    source: typing.Optional[local_types.SourceType] = None,
    cal_status: typing.Optional[local_types.CalibrationStatus] = None,
) -> None:
    robot_dir = config.get_opentrons_path("robot_calibration_dir")
    robot_dir.mkdir(parents=True, exist_ok=True)
    gantry_path = robot_dir / "deck_calibration.json"

    gantry_calibration = v1.DeckCalibrationSchema(
        attitude=transform,
        pipette_calibrated_with=pip_id,
        last_modified=utc_now(),
        source=source or local_types.SourceType.user,
        status=cal_status or v1.CalibrationStatus()
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
        last_modified=utc_now(),
        source=local_types.SourceType.user,
        status=cal_status or v1.CalibrationStatus()
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
        last_modified=utc_now(),
        source=local_types.SourceType.user,
        status = cal_status or local_types.CalibrationStatus()
    )
    io.save_to_file(gripper_path, gripper_calibration)
    calibration_cache._gripper_offset_calibrations.cache_clear()
