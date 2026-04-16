"""Registry for use with a Pyro Daemon client and server to allow serialization of Opentrons Hardware types and classes."""

import datetime
from typing import Dict

import opentrons.config.types
import opentrons.hardware_control.dev_types
import opentrons.hardware_control.instruments.ot3.instrument_calibration
import opentrons.hardware_control.protocols.types
import opentrons.hardware_control.types
import opentrons.types
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    find_enums_in_packages,
    find_pydantic_classes_in_packages,
    find_typed_dict_classes_in_packages,
    register_type_to_serpent,
    serpent_enum_registration,
)


# Estop Overall Status registry
def _estop_overall_status_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.types.EstopOverallStatus:
    return opentrons.hardware_control.types.EstopOverallStatus(
        state=opentrons.hardware_control.types.EstopState(d["state"]),
        left_physical_state=opentrons.hardware_control.types.EstopPhysicalStatus(
            d["left_physical_state"]
        ),
        right_physical_state=opentrons.hardware_control.types.EstopPhysicalStatus(
            d["right_physical_state"]
        ),
    )


def _estop_overall_status_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.types.EstopOverallStatus",
        "state": obj.state.value,
        "left_physical_state": obj.left_physical_state.value,
        "right_physical_state": obj.right_physical_state.value,
    }


# GRIPPER CALIBRATION
# todo(chb, 04-08-2026): This should be consumed into an automated registry process
def _GripperCalibrationOffset_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.instruments.ot3.instrument_calibration.GripperCalibrationOffset:
    modified = (
        None
        if d["last_modified"] is None
        else datetime.datetime.fromisoformat(d["last_modified"])
    )
    markedAt = (
        None
        if d["status_markedAt"] is None
        else datetime.datetime.fromisoformat(d["status_markedAt"])
    )
    status_source = (
        None
        if d["status_source"] is None
        else opentrons.hardware_control.instruments.ot3.instrument_calibration.SourceType(
            d["status_source"]
        )
    )
    return opentrons.hardware_control.instruments.ot3.instrument_calibration.GripperCalibrationOffset(
        offset=opentrons.types.Point(x=d["offset_x"], y=d["offset_y"], z=d["offset_z"]),
        source=opentrons.hardware_control.instruments.ot3.instrument_calibration.SourceType(
            d["source"]
        ),
        status=opentrons.hardware_control.instruments.ot3.instrument_calibration.CalibrationStatus(
            markedBad=(d["status_markedBad"] == "True"),
            source=status_source,
            markedAt=markedAt,
        ),
        last_modified=modified,
    )


def _GripperCalibrationOffset_class_to_dict(obj) -> Dict:  # type: ignore
    if isinstance(obj.last_modified, datetime.datetime):
        modified = obj.last_modified.isoformat()
    else:
        modified = None
    if isinstance(obj.status.markedAt, datetime.datetime):
        markedAt = obj.status.markedAt.isoformat()
    else:
        markedAt = None
    return {
        "__class__": "opentrons.hardware_control.instruments.ot3.instrument_calibration.GripperCalibrationOffset",
        "offset_x": obj.offset.x,
        "offset_y": obj.offset.y,
        "offset_z": obj.offset.z,
        "source": obj.source,
        "status_markedBad": obj.status.markedBad,
        "status_source": obj.status.source,
        "status_markedAt": markedAt,
        "last_modified": modified,
    }


# PIPETTER CALIBRATION
# todo(chb, 04-08-2026): This should be consumed into an automated registry process
def _PipetteOffsetSummary_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.instruments.ot3.instrument_calibration.PipetteOffsetSummary:
    modified = (
        None
        if d["last_modified"] is None
        else datetime.datetime.fromisoformat(d["last_modified"])
    )
    markedAt = (
        None
        if d["status_markedAt"] is None
        else datetime.datetime.fromisoformat(d["status_markedAt"])
    )
    status_source = (
        None
        if d["status_source"] is None
        else opentrons.hardware_control.instruments.ot3.instrument_calibration.SourceType(
            d["status_source"]
        )
    )
    return opentrons.hardware_control.instruments.ot3.instrument_calibration.PipetteOffsetSummary(
        offset=opentrons.types.Point(x=d["offset_x"], y=d["offset_y"], z=d["offset_z"]),
        source=opentrons.hardware_control.instruments.ot3.instrument_calibration.SourceType(
            d["source"]
        ),
        status=opentrons.hardware_control.instruments.ot3.instrument_calibration.CalibrationStatus(
            markedBad=(d["status_markedBad"] == "True"),
            source=status_source,
            markedAt=markedAt,
        ),
        last_modified=modified,
        reasonability_check_failures=[],  # todo(chb: 04-09-2026): These are skipped for integration simplicity, they should be handled by automatic process
    )


def _PipetteOffsetSummary_class_to_dict(obj) -> Dict:  # type: ignore
    if isinstance(obj.last_modified, datetime.datetime):
        modified = obj.last_modified.isoformat()
    else:
        modified = None
    if isinstance(obj.status.markedAt, datetime.datetime):
        markedAt = obj.status.markedAt.isoformat()
    else:
        markedAt = None
    return {
        "__class__": "opentrons.hardware_control.instruments.ot3.instrument_calibration.PipetteOffsetSummary",
        "offset_x": obj.offset.x,
        "offset_y": obj.offset.y,
        "offset_z": obj.offset.z,
        "source": obj.source,
        "status_markedBad": obj.status.markedBad,
        "status_source": obj.status.source,
        "status_markedAt": markedAt,
        "last_modified": modified,
        "reasonability_check_failures": None,  # todo(chb: 04-09-2026): These are skipped for integration simplicity, they should be handled by automatic process
    }


# Robot type registry - of note, this is meant to return a "pure" type
def _robot_type_class_to_dict(obj) -> Dict:  # type: ignore
    return {"__class__": ".".join((obj.__module__, obj.__class__.__name__))}


def _robot_type_dict_to_class(  # type: ignore
    classname, d
) -> type[opentrons.hardware_control.protocols.types.FlexRobotType]:
    return opentrons.hardware_control.protocols.types.FlexRobotType


# Handy function to map all registries for the Hardware controller
def register_hardware_types() -> None:
    """Registers serialize and deserialize behavior for Opentrons Hardware types and classes.
    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    opentrons_types = find_enums_in_packages(
        [
            opentrons.types,
            opentrons.config.types,
            opentrons.hardware_control.types,
            opentrons.hardware_control.dev_types,
        ]
    )

    with serpent_enum_registration():
        for enum_type in opentrons_types:
            OpentronsPyroSerializer.register_enum(enum_type)

    opentrons_pydantic_types = find_pydantic_classes_in_packages(
        [
            opentrons.types,
            opentrons.config.types,
            opentrons.hardware_control.types,
            opentrons.hardware_control.protocols.types,
        ]
    )
    for pydantic_type in opentrons_pydantic_types:
        OpentronsPyroSerializer.register_pydantic_model(pydantic_type)

    opentrons_typed_dicts = find_typed_dict_classes_in_packages(
        [opentrons.hardware_control.dev_types]
    )
    for typed_dict in opentrons_typed_dicts:
        OpentronsPyroSerializer.register_typed_dict(typed_dict)

    OpentronsPyroSerializer.register_unhashable_dicts()

    # Specialized registrations:
    register_type_to_serpent(
        class_type=opentrons.hardware_control.protocols.types.FlexRobotType,
        dict_to_class=_robot_type_dict_to_class,
        class_to_dict=_robot_type_class_to_dict,
    )

    # todo(chb, 04-03-2026): This one should probably be removed and classes like it converted to an appropriate, automated format
    # E-Stop Overall registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.EstopOverallStatus,
        dict_to_class=_estop_overall_status_dict_to_class,
        class_to_dict=_estop_overall_status_class_to_dict,
    )

    # todo(chb: 04-09-2026): These are termporary direct serializations to support the initial robot server intergration, replace with automated solution
    # gripper calibration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.instruments.ot3.instrument_calibration.GripperCalibrationOffset,
        dict_to_class=_GripperCalibrationOffset_dict_to_class,
        class_to_dict=_GripperCalibrationOffset_class_to_dict,
    )

    # pipette calibration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.instruments.ot3.instrument_calibration.PipetteOffsetSummary,
        dict_to_class=_PipetteOffsetSummary_dict_to_class,
        class_to_dict=_PipetteOffsetSummary_class_to_dict,
    )
