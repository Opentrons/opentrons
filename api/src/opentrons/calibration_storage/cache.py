from functools import lru_cache
import os
import json
from functools import lru_cache

from opentrons import config, types

from . import file_operators as io

if config.feature_flags.enable_ot3_hardware_controller():
    from .schemas.ot3 import v1, defaults
else:
    from .schemas.ot2 import v1, defaults


@lru_cache(maxsize=None)
def _tip_length_calibrations():
    tip_length_dir = config.get_tip_length_cal_path()
    tip_length_calibrations = {}
    for file in os.scandir(tip_length_dir):
        breakpoint()
        if file.name == "index.json":
            continue
        if file.is_file() and ".json" in file.name:
            pipette_id = file.name.split(".json")[0]
            tip_length_calibrations[pipette_id] = {}
            all_tip_lengths_for_pipette = io.read_cal_file(file.path)
            for tiprack, data in all_tip_lengths_for_pipette.items():
                tip_length_calibrations[pipette_id][tiprack] = v1.TipLengthSchema(
                    **data
                )
    return tip_length_calibrations


@lru_cache(maxsize=None)
def _deck_calibration() -> v1.DeckCalibrationSchema:
    deck_calibration_dir = config.get_opentrons_path("robot_calibration_dir")
    for file in os.scandir(deck_calibration_dir):
        if file.name == "deck_calibration.json":
            return v1.DeckCalibrationSchema(**io.read_cal_file(file.path))
    # local_types.DeckCalibration(
    #             attitude=data["attitude"],
    #             source=_get_calibration_source(data),
    #             pipette_calibrated_with=data["pipette_calibrated_with"],
    #             tiprack=data["tiprack"],
    #             last_modified=data["last_modified"],
    #             status=_get_calibration_status(data),
    #         )
    return defaults.deck_calibration


@lru_cache(maxsize=None)
def _pipette_offset_calibrations():
    pipette_calibration_dir = config.get_opentrons_path("pipette_calibration_dir")
    pipette_calibration_dict = {}
    for mount in types.MountType:
        pipette_calibration_dict[mount] = {}
        for file in os.scandir(pipette_calibration_dir / mount.value):
            if file.is_file() and ".json" in file.name:
                pipette_id = file.name.split(".json")[0]
                pipette_calibration_dict[pipette_id] = v1.InstrumentOffsetSchema(
                    **io.read_cal_file(file.path)
                )
    return pipette_calibration_dict


@lru_cache(maxsize=None)
def _gripper_offset_calibrations():
    gripper_calibration_dir = config.get_opentrons_path("gripper_calibration_dir")
    gripper_calibration_dict = {}

    for file in os.scandir(gripper_calibration_dir):
        if file.is_file() and ".json" in file.name:
            gripper_id = file.name.split(".json")[0]
            gripper_calibration_dict[gripper_id] = v1.InstrumentOffsetSchema(
                **io.read_cal_file(file.path)
            )
    return gripper_calibration_dict


def tip_length_data(pipette_id: str, labware_hash: str):
    try:
        return _tip_length_calibrations()[pipette_id][labware_hash]
    except KeyError:
        # raise local_types.TipLengthCalNotFound(
        #     f"Tip length of {labware_load_name} has not been "
        #     f"calibrated for this pipette: {pip_id} and cannot"
        #     "be loaded"
        # )
        # all_calibrations.append(
        # 	local_types.TipLengthCalibration(
        # 		tip_length=info["tipLength"],
        # 		pipette=pip,
        # 		tiprack=tiprack,
        # 		last_modified=info["lastModified"],
        # 		source=_get_calibration_source(info),
        # 		status=_get_calibration_status(info),
        # 		uri=_get_tip_rack_uri(info),
        # 	)
        return None


def tip_lengths_for_pipette(pipette_id: str):
    try:
        
        return _tip_length_calibrations()[pipette_id]
    except KeyError:
        return None


def pipette_offset_data(pipette_id: str, mount: types.Mount):
    # TODO(lc-08-01-22) we should eventually pass MountType here.
    if mount == types.Mount.LEFT:
        mount_type = types.MountType.LEFT
    else:
        mount_type = types.MountType.RIGHT
    try:
        return _pipette_offset_calibrations()[mount_type][pipette_id]
    except KeyError:
        return None


def gripper_calibration(gripper_id: str):
    if not config.feature_flags.enable_ot3_hardware_controller():
        raise NotImplementedError("Gripper calibrations are only valid on the OT-3")
    try:
        return _gripper_offset_calibrations()[gripper_id]
    except KeyError:
        return None
