from functools import lru_cache
from multiprocessing.connection import Pipe
import os
import json
from functools import lru_cache
from pydantic import ValidationError
from typing import Dict, cast, Optional

from opentrons import config, types


from .. import file_operators as io
from ..types import PipetteId, TiprackHash, GripperId, TipLengthCalNotFound

from .schemas import v1, defaults


TipLengthCalibrations = Dict[PipetteId, Dict[TiprackHash, v1.TipLengthSchema]]
PipetteCalibrations = Dict[types.MountType, Dict[PipetteId, v1.InstrumentOffsetSchema]]
GripperCalibrations = Dict[GripperId, v1.InstrumentOffsetSchema]


@lru_cache(maxsize=None)
def _tip_length_calibrations() -> TipLengthCalibrations:
    tip_length_dir = config.get_tip_length_cal_path()
    tip_length_calibrations: TipLengthCalibrations = {}
    for file in os.scandir(tip_length_dir):
        if file.name == "index.json":
            continue
        if file.is_file() and ".json" in file.name:
            pipette_id = cast(PipetteId, file.name.split(".json")[0])
            tip_length_calibrations[pipette_id] = {}
            all_tip_lengths_for_pipette = io.read_cal_file(file.path)
            for tiprack, data in all_tip_lengths_for_pipette.items():
                try:
                    tip_length_calibrations[pipette_id][
                        cast(TiprackHash, tiprack)
                    ] = v1.TipLengthSchema(**data)
                except (json.JSONDecodeError, ValidationError):
                    pass
    return tip_length_calibrations


@lru_cache(maxsize=None)
def _deck_calibration() -> Optional[v1.DeckCalibrationSchema]:
    deck_calibration_dir = config.get_opentrons_path("robot_calibration_dir")
    for file in os.scandir(deck_calibration_dir):
        if file.name == "deck_calibration.json":
            try:
                return v1.DeckCalibrationSchema(**io.read_cal_file(file.path))
            except (json.JSONDecodeError, ValidationError):
                pass
    return None


@lru_cache(maxsize=None)
def _pipette_offset_calibrations() -> PipetteCalibrations:
    pipette_calibration_dir = config.get_opentrons_path("pipette_calibration_dir")
    pipette_calibration_dict: PipetteCalibrations = {}
    for mount in types.MountType:
        pipette_calibration_dict[mount] = {}
        mount_dir = pipette_calibration_dir / mount.value
        if not mount_dir.exists():
            continue
        for file in os.scandir(mount_dir):
            if file.is_file() and ".json" in file.name:
                pipette_id = cast(PipetteId, file.name.split(".json")[0])
                try:
                    pipette_calibration_dict[mount][
                        pipette_id
                    ] = v1.InstrumentOffsetSchema(**io.read_cal_file(file.path))
                except (json.JSONDecodeError, ValidationError):
                    pass

    return pipette_calibration_dict


@lru_cache(maxsize=None)
def _gripper_offset_calibrations() -> GripperCalibrations:
    gripper_calibration_dir = config.get_opentrons_path("gripper_calibration_dir")
    gripper_calibration_dict: GripperCalibrations = {}

    for file in os.scandir(gripper_calibration_dir):
        if file.is_file() and ".json" in file.name:
            gripper_id = cast(GripperId, file.name.split(".json")[0])
            try:
                gripper_calibration_dict[gripper_id] = v1.InstrumentOffsetSchema(
                    **io.read_cal_file(file.path)
                )
            except (json.JSONDecodeError, ValidationError):
                pass
    return gripper_calibration_dict


def tip_length_data(
    pipette_id: PipetteId, labware_hash: TiprackHash, labware_load_name: str
) -> v1.TipLengthSchema:
    """
    Grab tip length data from cache based on pipette id and labware hash.
    """
    try:
        return _tip_length_calibrations()[pipette_id][labware_hash]
    except KeyError:
        raise TipLengthCalNotFound(
            f"Tip length of {labware_load_name} has not been "
            f"calibrated for this pipette: {pipette_id} and cannot"
            "be loaded"
        )


def tip_lengths_for_pipette(
    pipette_id: PipetteId,
) -> Dict[TiprackHash, v1.TipLengthSchema]:
    try:
        return _tip_length_calibrations()[pipette_id]
    except KeyError:
        return {}


def pipette_offset_data(
    pipette_id: PipetteId, mount: types.Mount
) -> Optional[v1.InstrumentOffsetSchema]:
    # TODO(lc-08-01-22) we should eventually pass MountType here.
    if mount == types.Mount.LEFT:
        mount_type = types.MountType.LEFT
    else:
        mount_type = types.MountType.RIGHT
    try:
        return _pipette_offset_calibrations()[mount_type][pipette_id]
    except KeyError:
        return None


def gripper_calibration(gripper_id: GripperId) -> Optional[v1.InstrumentOffsetSchema]:
    if not config.feature_flags.enable_ot3_hardware_controller():
        raise NotImplementedError("Gripper calibrations are only valid on the OT-3")
    try:
        return _gripper_offset_calibrations()[gripper_id]
    except KeyError:
        return None
