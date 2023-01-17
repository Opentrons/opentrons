import typing

from opentrons import config
from opentrons.types import Mount, Point

from . import types as local_types
from .ot3 import ot3_gripper_offset, ot3_models
from .ot2 import mark_bad_calibration, ot2_models

if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition

# TODO these functions are only used in robot server. We should think about moving them and/or
# abstracting it away from a robot specific function. We should also check if the tip rack
# definition information is still needed.
from .ot2.tip_length import (
    get_custom_tiprack_definition_for_tlc,
    get_all_tip_length_calibrations,
    _save_custom_tiprack_definition,
)
from .ot2.pipette_offset import get_all_pipette_offset_calibrations


DeckCalibrationType = typing.Union[
    ot2_models.v1.DeckCalibrationModel,
    ot3_models.v1.DeckCalibrationModel,
]


PipetteCalibrationType = typing.Union[
    ot2_models.v1.InstrumentOffsetModel,
    ot3_models.v1.InstrumentOffsetModel,
]


TipLengthCalibrationType = typing.Union[
    ot2_models.v1.TipLengthModel,
    ot3_models.v1.TipLengthModel,
]

CalibrationStatusType = typing.Union[
    ot2_models.v1.CalibrationStatus,
    ot3_models.v1.CalibrationStatus,
]


def save_robot_deck_attitude(
    transform: local_types.AttitudeMatrix,
    pipette_id: typing.Optional[str],
    source: local_types.SourceType = local_types.SourceType.user,
    lw_hash: typing.Optional[str] = None,
    calibration_status: typing.Optional[CalibrationStatusType] = None,
) -> None:
    # add can't save file error for pipette id
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_save_robot_deck_attitude

        ot3_save_robot_deck_attitude(transform, pipette_id, calibration_status, source)
    else:
        from .ot2 import ot2_save_robot_deck_attitude

        ot2_save_robot_deck_attitude(transform, pipette_id, lw_hash, source, calibration_status)


def get_robot_deck_attitude() -> typing.Optional[DeckCalibrationType]:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_get_robot_deck_attitude

        return ot3_get_robot_deck_attitude()
    else:
        from .ot2 import ot2_get_robot_deck_attitude

        return ot2_get_robot_deck_attitude()


def delete_robot_deck_attitude() -> None:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_delete_robot_deck_attitude

        ot3_delete_robot_deck_attitude()
    else:
        from .ot2 import ot2_delete_robot_deck_attitude

        ot2_delete_robot_deck_attitude()


def save_pipette_calibration(
    offset: Point,
    pipette_id: typing.Optional[str],
    mount: Mount,
    tiprack_hash: str = "",
    tiprack_uri: str = "",
    calibration_status: typing.Optional[CalibrationStatusType] = None
) -> None:
    # check pip id and tiprack info here
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_save_pipette_calibration

        ot3_save_pipette_calibration(offset, pipette_id, mount, calibration_status)
    else:
        from .ot2 import ot2_save_pipette_calibration

        ot2_save_pipette_calibration(
            offset, pipette_id, mount, tiprack_hash, tiprack_uri, calibration_status
        )


def get_pipette_offset(
    pipette_id: typing.Optional[str], mount: Mount
) -> typing.Optional[PipetteCalibrationType]:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_get_pipette_offset

        return ot3_get_pipette_offset(pipette_id, mount)
    else:
        from .ot2 import ot2_get_pipette_offset

        return ot2_get_pipette_offset(pipette_id, mount)


def clear_pipette_offset_calibrations() -> None:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_clear_pipette_offset_calibrations

        ot3_clear_pipette_offset_calibrations()
    else:
        from .ot2 import ot2_clear_pipette_offset_calibrations

        ot2_clear_pipette_offset_calibrations()


def delete_pipette_offset_file(pipette_id: typing.Optional[str], mount: Mount) -> None:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_delete_pipette_offset_file

        ot3_delete_pipette_offset_file(pipette_id, mount)
    else:
        from .ot2 import ot2_delete_pipette_offset_file

        ot2_delete_pipette_offset_file(pipette_id, mount)


def create_tip_length_data(
    definition: "LabwareDefinition",
    length: float,
) -> typing.Mapping[str, TipLengthCalibrationType]:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_create_tip_length_data

        return ot3_create_tip_length_data(definition, length)
    else:
        from .ot2 import ot2_create_tip_length_data

        return ot2_create_tip_length_data(definition, length)


def save_tip_length_calibration(
    pipette_id: str, tip_length_cal: typing.Mapping[str, TipLengthCalibrationType]
) -> None:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_save_tip_length_calibration

        ot3_save_tip_length_calibration(pipette_id, typing.cast(typing.Mapping[str, ot3_models.v1.TipLengthModel], tip_length_cal))
    else:
        from .ot2 import ot2_save_tip_length_calibration

        ot2_save_tip_length_calibration(pipette_id, typing.cast(typing.Mapping[str, ot2_models.v1.TipLengthModel], tip_length_cal))


def delete_tip_length_calibration(tiprack: str, pipette_id: str) -> None:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_delete_tip_length_calibration

        return ot3_delete_tip_length_calibration(tiprack, pipette_id)
    else:
        from .ot2 import ot2_delete_tip_length_calibration

        return ot2_delete_tip_length_calibration(tiprack, pipette_id)


def clear_tip_length_calibration() -> None:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_clear_tip_length_calibration

        return ot3_clear_tip_length_calibration()
    else:
        from .ot2 import ot2_clear_tip_length_calibration

        return ot2_clear_tip_length_calibration()


def tip_lengths_for_pipette(
    pipette_id: typing.Optional[str],
) -> typing.Mapping[str, TipLengthCalibrationType]:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_tip_lengths_for_pipette

        return ot3_tip_lengths_for_pipette(pipette_id)
    else:
        from .ot2 import ot2_tip_lengths_for_pipette

        return ot2_tip_lengths_for_pipette(pipette_id)


def load_tip_length_calibration(
    pip_id: typing.Optional[str], definition: "LabwareDefinition"
) -> TipLengthCalibrationType:
    if config.feature_flags.enable_ot3_hardware_controller():
        from .ot3 import ot3_load_tip_length_calibration

        return ot3_load_tip_length_calibration(pip_id, definition)
    else:
        from .ot2 import ot2_load_tip_length_calibration

        return ot2_load_tip_length_calibration(pip_id, definition)


__all__ = [
    # deck calibration functions
    "save_robot_deck_attitude",
    "get_robot_deck_attitude",
    "delete_robot_deck_attitude",
    # pipette calibration functions
    "save_pipette_calibration",
    "get_pipette_offset",
    "clear_pipette_offset_calibrations",
    "delete_pipette_offset_file",
    # tip length calibration functions
    "clear_tip_length_calibration",
    "create_tip_length_data",
    "save_tip_length_calibration",
    "tip_lengths_for_pipette",
    "delete_tip_length_calibration",
    "load_tip_length_calibration",
    # functions only used in robot server
    "_save_custom_tiprack_definition",
    "get_custom_tiprack_definition_for_tlc",
    "get_all_pipette_offset_calibrations",
    "get_all_tip_length_calibrations",
    # file exports
    "ot3_gripper_offset",
    "mark_bad_calibration",
]
