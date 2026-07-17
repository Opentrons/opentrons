"""Registry for use with a Pyro Daemon client and server to allow serialization of Opentrons Hardware types and classes."""

import dataclasses
import datetime
from pathlib import Path
from typing import Any, Dict, get_args

import Pyro5
from numpy import float64

import opentrons_shared_data.errors.codes
import opentrons_shared_data.gripper.gripper_definition
import opentrons_shared_data.pipette.pipette_definition
import opentrons_shared_data.pipette.types

import opentrons.calibration_storage.ot3.models.v1
import opentrons.calibration_storage.types
import opentrons.config.types
import opentrons.drivers.rpi_drivers.types
import opentrons.drivers.types
import opentrons.drivers.vacuum_module.types
import opentrons.hardware_control.dev_types
import opentrons.hardware_control.instruments.ot3.instrument_calibration
import opentrons.hardware_control.modules.module_calibration
import opentrons.hardware_control.modules.types
import opentrons.hardware_control.nozzle_manager
import opentrons.hardware_control.peripherals.types
import opentrons.hardware_control.protocols.types
import opentrons.hardware_control.types
import opentrons.types
from opentrons.calibration_storage.ot3.models.v1 import CalibrationStatus
from opentrons.hardware_control import modules
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    enumerated_error_class_to_dict,
    enumerated_error_dict_to_class,
    find_enums_in_packages,
    find_pydantic_classes_in_packages,
    find_typed_dict_classes_in_packages,
    register_enumerated_errors,
    register_type_to_serpent,
    serpent_enum_registration,
)

Pyro5.config.SERPENT_BYTES_REPR = True  # type: ignore


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
            d["status_source"]["value"]
        )
    )
    return opentrons.hardware_control.instruments.ot3.instrument_calibration.GripperCalibrationOffset(
        offset=opentrons.types.Point(x=d["offset_x"], y=d["offset_y"], z=d["offset_z"]),
        source=opentrons.hardware_control.instruments.ot3.instrument_calibration.SourceType(
            d["source"]["value"]
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
            d["status_source"]["value"]
        )
    )
    return opentrons.hardware_control.instruments.ot3.instrument_calibration.PipetteOffsetSummary(
        offset=opentrons.types.Point(x=d["offset_x"], y=d["offset_y"], z=d["offset_z"]),
        source=opentrons.hardware_control.instruments.ot3.instrument_calibration.SourceType(
            d["source"]["value"]
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


# ModuleCalibrationOffset registration


def _ModuleCalibrationOffset_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.modules.module_calibration.ModuleCalibrationOffset:
    modified = (
        None
        if d["last_modified"] is None
        else datetime.datetime.fromisoformat(d["last_modified"])
    )
    return (
        opentrons.hardware_control.modules.module_calibration.ModuleCalibrationOffset(
            offset=opentrons.types.Point(
                x=d["offset_x"], y=d["offset_y"], z=d["offset_z"]
            ),
            module_id=d["module_id"],
            module=opentrons.hardware_control.modules.types.ModuleType(d["module"]),
            source=opentrons.calibration_storage.types.SourceType(d["source"]),
            status=CalibrationStatus.model_validate(d["status"]),
            slot=d["slot"],
            mount=None
            if d["mount"] is None
            else opentrons.hardware_control.types.OT3Mount(d["mount"]),
            instrument_id=d["instrument_id"],
            last_modified=modified,
        )
    )


def _ModuleCalibrationOffset_class_to_dict(
    obj: opentrons.hardware_control.modules.module_calibration.ModuleCalibrationOffset,
) -> Dict:  # type: ignore
    if isinstance(obj.last_modified, datetime.datetime):
        modified = obj.last_modified.isoformat()
    else:
        modified = None
    return {
        "__class__": "opentrons.hardware_control.modules.module_calibration.ModuleCalibrationOffset",
        "offset_x": obj.offset.x,
        "offset_y": obj.offset.y,
        "offset_z": obj.offset.z,
        "module_id": obj.module_id,
        "module": obj.module.value,
        "source": obj.source.value,
        "status": obj.status.model_dump(mode="json", by_alias=True),
        "slot": obj.slot,
        "mount": None if obj.mount is None else obj.mount.value,
        "instrument_id": obj.instrument_id,
        "last_modified": modified,
    }


# Type Dict registration handlers


def _pipetted_dict_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.dev_types.PipetteDict:
    """Reconstruction handler for PipetteDict TypedDicts."""
    dictionary = d["dictionary"]

    converted_supported_tips: Dict[
        opentrons_shared_data.pipette.types.PipetteTipType,
        opentrons_shared_data.pipette.pipette_definition.SupportedTipsDefinition,
    ] = {}
    for tip in dictionary["supported_tips"].keys():
        converted_supported_tips[
            opentrons_shared_data.pipette.types.PipetteTipType(value=int(tip))
        ] = opentrons_shared_data.pipette.pipette_definition.SupportedTipsDefinition.model_validate(
            dictionary["supported_tips"][tip]
        )

    converted_available_volume_modes: Dict[
        opentrons_shared_data.pipette.types.LiquidClasses,
        opentrons_shared_data.pipette.pipette_definition.PipetteLiquidPropertiesDefinition,
    ] = {}

    for liquid_class, props in dictionary["available_volume_modes"].items():
        liquid_class_enum = opentrons_shared_data.pipette.types.LiquidClasses(
            int(liquid_class)
        )
        props["supportedTips"] = {
            f"t{key}": value for key, value in props["supportedTips"].items()
        }
        prop_model = opentrons_shared_data.pipette.pipette_definition.PipetteLiquidPropertiesDefinition.model_validate(
            props
        )
        converted_available_volume_modes[liquid_class_enum] = prop_model

    return opentrons.hardware_control.dev_types.PipetteDict(
        display_name=str(dictionary["display_name"]),
        name=dictionary["name"],
        model=opentrons_shared_data.pipette.types.PipetteModel(dictionary["model"]),
        back_compat_names=dictionary["back_compat_names"],
        pipette_id=str(dictionary["pipette_id"]),
        min_volume=float(dictionary["min_volume"]),
        max_volume=float(dictionary["max_volume"]),
        channels=dictionary["channels"],
        aspirate_flow_rate=float(dictionary["aspirate_flow_rate"]),
        dispense_flow_rate=float(dictionary["dispense_flow_rate"]),
        blow_out_flow_rate=float(dictionary["blow_out_flow_rate"]),
        aspirate_speed=float(dictionary["aspirate_speed"]),
        dispense_speed=float(dictionary["dispense_speed"]),
        blow_out_speed=float(dictionary["blow_out_speed"]),
        current_volume=float(dictionary["current_volume"]),
        tip_length=float(dictionary["tip_length"]),
        working_volume=float(dictionary["working_volume"]),
        tip_overlap=dictionary["tip_overlap"],
        versioned_tip_overlap=dictionary["versioned_tip_overlap"],
        available_volume=float(dictionary["available_volume"]),
        return_tip_height=float(dictionary["return_tip_height"]),
        default_aspirate_flow_rates=dictionary["default_aspirate_flow_rates"],
        default_dispense_flow_rates=dictionary["default_dispense_flow_rates"],
        default_blow_out_flow_rates=dictionary["default_blow_out_flow_rates"],
        default_aspirate_speeds=dictionary["default_aspirate_speeds"],
        default_dispense_speeds=dictionary["default_dispense_speeds"],
        default_blow_out_speeds=dictionary["default_blow_out_speeds"],
        ready_to_aspirate=bool(dictionary["ready_to_aspirate"]),
        has_tip=bool(dictionary["has_tip"]),
        default_push_out_volume=None
        if dictionary["default_push_out_volume"] is None
        else float(dictionary["default_push_out_volume"]),
        supported_tips=converted_supported_tips,
        pipette_bounding_box_offsets=opentrons_shared_data.pipette.pipette_definition.PipetteBoundingBoxOffsetDefinition.model_validate(
            dictionary["pipette_bounding_box_offsets"]
        ),
        current_nozzle_map=opentrons.hardware_control.nozzle_manager.NozzleMap.model_validate(
            dictionary["current_nozzle_map"]
        ),
        lld_settings=None
        if dictionary["lld_settings"] is None
        else dictionary["lld_settings"],
        plunger_positions=dictionary["plunger_positions"],
        shaft_ul_per_mm=float(dictionary["shaft_ul_per_mm"]),
        available_sensors=opentrons_shared_data.pipette.pipette_definition.AvailableSensorDefinition.model_validate(
            dictionary["available_sensors"]
        ),
        volume_mode=opentrons_shared_data.pipette.types.LiquidClasses(
            dictionary["volume_mode"]
        ),
        available_volume_modes=converted_available_volume_modes,
    )


def _typed_dict_dict_to_class(classname, d) -> Any:  # type: ignore
    """This is a unique serializaiton handler that can be expanded to support TypedDicts that need reconstruction."""
    if d["typed_dict_name"] == "opentrons.hardware_control.dev_types.PipetteDict":
        return _pipetted_dict_dict_to_class(classname, d)
    else:
        raise ValueError(
            f"No registration handler available for classname: {classname}"
        )


# numpy float serialization
def _numpy_float_class_to_dict(obj) -> Dict:  # type: ignore
    return {"__class__": "numpy.float64", "value": float(obj)}


def _numpy_float_dict_to_class(classname, d) -> float64:  # type: ignore
    return float64(d["value"])


def _point_to_dict(point: opentrons.types.Point) -> Dict:  # type: ignore
    return {
        "x": point.x,
        "y": point.y,
        "z": point.z,
    }


def _dict_to_point(point_dict: Dict) -> opentrons.types.Point:  # type: ignore
    x_data = point_dict["x"]
    y_data = point_dict["y"]
    z_data = point_dict["z"]
    if isinstance(x_data, dict):
        x_data = x_data["value"]
    if isinstance(y_data, dict):
        y_data = y_data["value"]
    if isinstance(z_data, dict):
        z_data = z_data["value"]
    return opentrons.types.Point(x=float(x_data), y=float(y_data), z=float(z_data))


# Point type serialization
def _point_class_to_dict(obj) -> Dict:  # type: ignore
    _point_dict = _point_to_dict(obj)
    _point_dict["__class__"] = ".".join((obj.__module__, obj.__class__.__name__))
    return _point_dict


def _point_dict_to_class(classname, d) -> opentrons.types.Point:  # type: ignore
    return _dict_to_point(d)


def _ot3_transforms_class_to_dict(
    obj: opentrons.hardware_control.ot3_calibration.OT3Transforms,
) -> Dict:  # type: ignore
    transform_dict = dataclasses.asdict(obj)
    transform_dict["deck_calibration"]["source"] = obj.deck_calibration.source.value
    transform_dict["deck_calibration"]["status"] = {
        "markedBad": obj.deck_calibration.status.markedBad,
        "source": obj.deck_calibration.status.source.value
        if obj.deck_calibration.status.source is not None
        else None,
        "markedAt": obj.deck_calibration.status.markedAt.isoformat()
        if obj.deck_calibration.status.markedAt is not None
        else None,
    }
    transform_dict["deck_calibration"]["last_modified"] = (
        obj.deck_calibration.last_modified.isoformat()
        if obj.deck_calibration.last_modified is not None
        else None
    )

    transform_dict["carriage_offset"] = _point_to_dict(obj.carriage_offset)
    transform_dict["left_mount_offset"] = _point_to_dict(obj.left_mount_offset)
    transform_dict["right_mount_offset"] = _point_to_dict(obj.right_mount_offset)
    transform_dict["gripper_mount_offset"] = _point_to_dict(obj.gripper_mount_offset)
    transform_dict["__class__"] = (
        "opentrons.hardware_control.ot3_calibration.OT3Transforms"
    )
    return transform_dict


def _ot3_transforms_dict_to_class(
    classname: str, d: Any
) -> opentrons.hardware_control.ot3_calibration.OT3Transforms:
    status_source = d["deck_calibration"]["status"]["source"]
    status_marked_at = d["deck_calibration"]["status"]["markedAt"]
    last_modified = d["deck_calibration"]["last_modified"]
    return opentrons.hardware_control.ot3_calibration.OT3Transforms(
        deck_calibration=opentrons.hardware_control.robot_calibration.DeckCalibration(
            attitude=d["deck_calibration"]["attitude"],
            source=opentrons.calibration_storage.types.SourceType(
                d["deck_calibration"]["source"]
            ),
            status=opentrons.calibration_storage.types.CalibrationStatus(
                markedBad=d["deck_calibration"]["status"]["markedBad"],
                source=None
                if status_source is None
                else opentrons.calibration_storage.types.SourceType(status_source)
                if status_source is not None
                else None,
                markedAt=datetime.datetime.fromisoformat(status_marked_at)
                if status_marked_at is not None
                else None,
            ),
            belt_attitude=d["deck_calibration"]["belt_attitude"],
            last_modified=datetime.datetime.fromisoformat(last_modified)
            if last_modified is not None
            else None,
            pipette_calibrated_with=d["deck_calibration"]["pipette_calibrated_with"],
            tiprack=d["deck_calibration"]["tiprack"],
        ),
        carriage_offset=_dict_to_point(d["carriage_offset"]),
        left_mount_offset=_dict_to_point(d["left_mount_offset"]),
        right_mount_offset=_dict_to_point(d["right_mount_offset"]),
        gripper_mount_offset=_dict_to_point(d["gripper_mount_offset"]),
    )


# todo(chb, 2026-04-21): Do we want to change how notifications are serialized? Pydantic maybe?
# DoorStateNotification serializers
def _door_notif_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.types.DoorStateNotification",
        "event": obj.event,
        "new_state": obj.new_state,
        "module_serial": obj.module_serial,
    }


def _door_notif_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.types.DoorStateNotification:
    return opentrons.hardware_control.types.DoorStateNotification(
        event=opentrons.hardware_control.types.HardwareEventType(d["event"]["value"]),  # type: ignore
        new_state=opentrons.hardware_control.types.DoorState(d["new_state"]["value"]),
        module_serial=d["module_serial"],
    )


# EstopStateNotification serializers
def _estop_notif_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.types.EstopStateNotification",
        "event": obj.event,
        "old_state": obj.old_state,
        "new_state": obj.new_state,
    }


def _estop_notif_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.types.EstopStateNotification:
    return opentrons.hardware_control.types.EstopStateNotification(
        event=opentrons.hardware_control.types.HardwareEventType(d["event"]["value"]),  # type: ignore
        old_state=opentrons.hardware_control.types.EstopState(d["new_state"]["value"]),
        new_state=opentrons.hardware_control.types.EstopState(d["new_state"]["value"]),
    )


# ErrorMessageNotification serializers
def _error_notif_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.types.ErrorMessageNotification",
        "event": obj.event,
        "message": obj.message,
    }


def _error_notif_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.types.ErrorMessageNotification:
    return opentrons.hardware_control.types.ErrorMessageNotification(
        event=opentrons.hardware_control.types.HardwareEventType(d["event"]["value"]),  # type: ignore
        message=d["message"],
    )


def _module_model_reconstructor(
    module_str: str,
) -> modules.types.ModuleModel:
    for model in get_args(modules.types.ModuleModel):
        try:
            return model[module_str]  # type: ignore
        except Exception:
            pass
    raise ValueError(
        f"Cannot determine module model during deserialization for: {module_str}"
    )


# AsynchronousModuleErrorNotification serializers
def _async_mod_error_notif_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.types.AsynchronousModuleErrorNotification",
        "event": obj.event,
        "exception": enumerated_error_class_to_dict(obj.exception),
        "module_serial": obj.module_serial,
        "module_model": obj.module_model.name,
        "port": obj.port,
    }


def _async_mod_error_notif_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.types.AsynchronousModuleErrorNotification:
    return opentrons.hardware_control.types.AsynchronousModuleErrorNotification(
        event=opentrons.hardware_control.types.HardwareEventType(d["event"]["value"]),  # type: ignore
        exception=enumerated_error_dict_to_class(
            class_name="opentrons.hardware_control.types.EnumeratedError",
            d=d["exception"],
        ),
        module_serial=d["module_serial"],
        module_model=_module_model_reconstructor(d["module_model"]),
        port=d["port"],
    )


# ModuleDisconnectedNotification serializers
def _mod_disconnect_notif_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.types.ModuleDisconnectedNotification",
        "event": obj.event,
        "module_serial": obj.module_serial,
        "module_model": obj.module_model.name,
        "port": obj.port,
    }


def _mod_disconnect_notif_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.types.ModuleDisconnectedNotification:
    return opentrons.hardware_control.types.ModuleDisconnectedNotification(
        event=opentrons.hardware_control.types.HardwareEventType(d["event"]["value"]),  # type: ignore
        module_serial=d["module_serial"],
        module_model=_module_model_reconstructor(d["module_model"]),
        port=d["port"],
    )


# Robot type registry - of note, this is meant to return a "pure" type
def _robot_type_class_to_dict(obj) -> Dict:  # type: ignore
    return {"__class__": ".".join((obj.__module__, obj.__class__.__name__))}


def _robot_type_dict_to_class(  # type: ignore
    classname, d
) -> type[opentrons.hardware_control.protocols.types.FlexRobotType]:
    return opentrons.hardware_control.protocols.types.FlexRobotType


# USBPort registry - serialization and deserialization for the USBPort dataclass
def _usb_port_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.drivers.rpi_drivers.types.USBPort",
        "name": obj.name,
        "port_number": obj.port_number,
        "port_group": obj.port_group,
        "hub": obj.hub,
        "hub_port": obj.hub_port,
        "device_path": obj.device_path,
    }


def _usb_port_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.drivers.rpi_drivers.types.USBPort:
    return opentrons.drivers.rpi_drivers.types.USBPort(
        name=d["name"],
        port_number=int(d["port_number"]),
        port_group=d["port_group"],
        hub=d["hub"],
        hub_port=int(d["hub_port"]) if d["hub_port"] is not None else None,
        device_path=d["device_path"],
    )


# Pathlib Path registry
def _path_class_to_dict(obj) -> Dict:  # type: ignore
    return {"__class__": "pathlib.Path", "path_str": str(obj)}


def _path_dict_to_class(  # type: ignore
    classname, d
) -> Path:
    return Path(d["path_str"])


# BundledFirmware registry
def _bundled_fw_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.modules.types.BundledFirmware",
        "version": obj.version,
        "path_str": str(obj.path),
    }


def _bundled_fw_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.modules.types.BundledFirmware:
    return opentrons.hardware_control.modules.types.BundledFirmware(
        version=d["version"], path=Path(d["path_str"])
    )


# ABSMeasurementConfig registry
def _ABSMeasurementConfig_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.drivers.types.ABSMeasurementConfig",
        "measure_mode": obj.measure_mode.value,
        "sample_wavelengths": obj.sample_wavelengths,
        "reference_wavelength": obj.reference_wavelength,
    }


def _ABSMeasurementConfig_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.drivers.types.ABSMeasurementConfig:
    return opentrons.drivers.types.ABSMeasurementConfig(
        measure_mode=opentrons.drivers.types.ABSMeasurementMode(d["measure_mode"]),
        sample_wavelengths=d["sample_wavelengths"],
        reference_wavelength=d["reference_wavelength"],
    )


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
            opentrons_shared_data.pipette.pipette_definition,
            opentrons_shared_data.pipette.types,
            opentrons_shared_data.errors.codes,
            opentrons.hardware_control.peripherals.types,
            opentrons_shared_data.gripper.gripper_definition,
            opentrons.calibration_storage.types,
            opentrons.drivers.types,
            opentrons.hardware_control.modules.types,
            opentrons.drivers.vacuum_module.types,
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
            opentrons_shared_data.pipette.pipette_definition,
            opentrons.hardware_control.nozzle_manager,
            opentrons_shared_data.gripper.gripper_definition,
            opentrons.calibration_storage.ot3.models.v1,
            opentrons.hardware_control.nozzle_manager,
        ]
    )
    for pydantic_type in opentrons_pydantic_types:
        OpentronsPyroSerializer.register_pydantic_model(pydantic_type)

    opentrons_typed_dicts = find_typed_dict_classes_in_packages(
        [opentrons.hardware_control.dev_types]
    )
    for typed_dict in opentrons_typed_dicts:
        OpentronsPyroSerializer.register_typed_dict(typed_dict)

    OpentronsPyroSerializer.register_dicts_with_non_builtin_keys()

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

    # todo(chb: 04-09-2026): These are direct serializations to support the initial robot server intergration, replace with automated solution where appropriate
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

    # OT3 Transforms
    register_type_to_serpent(
        class_type=opentrons.hardware_control.ot3_calibration.OT3Transforms,
        dict_to_class=_ot3_transforms_dict_to_class,
        class_to_dict=_ot3_transforms_class_to_dict,
    )

    # numpy registration
    register_type_to_serpent(
        class_type=float64,
        dict_to_class=_numpy_float_dict_to_class,
        class_to_dict=_numpy_float_class_to_dict,
    )

    # point registration
    register_type_to_serpent(
        class_type=opentrons.types.Point,
        dict_to_class=_point_dict_to_class,
        class_to_dict=_point_class_to_dict,
    )

    # DoorStateNotification registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.DoorStateNotification,
        dict_to_class=_door_notif_dict_to_class,
        class_to_dict=_door_notif_class_to_dict,
    )

    # EstopStateNotification registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.EstopStateNotification,
        dict_to_class=_estop_notif_dict_to_class,
        class_to_dict=_estop_notif_class_to_dict,
    )

    # ErrorMessageNotification registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.ErrorMessageNotification,
        dict_to_class=_error_notif_dict_to_class,
        class_to_dict=_error_notif_class_to_dict,
    )

    # AsynchronousModuleErrorNotification registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.AsynchronousModuleErrorNotification,
        dict_to_class=_async_mod_error_notif_dict_to_class,
        class_to_dict=_async_mod_error_notif_class_to_dict,
    )

    # ModuleDisconnectedNotification registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.ModuleDisconnectedNotification,
        dict_to_class=_mod_disconnect_notif_dict_to_class,
        class_to_dict=_mod_disconnect_notif_class_to_dict,
    )

    # USBPort registration
    register_type_to_serpent(
        class_type=opentrons.drivers.rpi_drivers.types.USBPort,
        dict_to_class=_usb_port_dict_to_class,
        class_to_dict=_usb_port_class_to_dict,
    )

    # pathlib Path registration
    register_type_to_serpent(
        class_type=Path,
        dict_to_class=_path_dict_to_class,
        class_to_dict=_path_class_to_dict,
    )

    # BundledFirmware registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.modules.types.BundledFirmware,
        dict_to_class=_bundled_fw_dict_to_class,
        class_to_dict=_bundled_fw_class_to_dict,
    )

    # ModuleCalibrationOffset registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.modules.module_calibration.ModuleCalibrationOffset,
        dict_to_class=_ModuleCalibrationOffset_dict_to_class,
        class_to_dict=_ModuleCalibrationOffset_class_to_dict,
    )

    # ABSMeasurementConfig registration
    register_type_to_serpent(
        class_type=opentrons.drivers.types.ABSMeasurementConfig,
        dict_to_class=_ABSMeasurementConfig_dict_to_class,
        class_to_dict=_ABSMeasurementConfig_class_to_dict,
    )

    # Dataclass generic registration
    # todo(chb, 07-08-2026): This should probably be changed to automatically detect our pyro compatible dataclasses once the cross-layer classes all have `to_pyro` and `from_pyro` methods
    # todo(chb, 07-08-2026): Once the others all contain to and from methods the above restrigries can be removed
    opentrons_dataclass_types = [
        opentrons.drivers.vacuum_module.types.VacuumState,
        opentrons.drivers.vacuum_module.types.PumpState,
    ]

    for dataclass_type in opentrons_dataclass_types:
        register_type_to_serpent(
            class_type=dataclass_type,
            dict_to_class=dataclass_type.from_pyro_dict,  # type: ignore
            class_to_dict=dataclass_type.to_pyro_dict,  # type: ignore
        )

    # handle Typed Dicts for the hardware controller
    OpentronsPyroSerializer.register_opentrons_typed_dicts(_typed_dict_dict_to_class)

    # Error serialization
    OpentronsPyroSerializer.register_basic_error(
        opentrons.hardware_control.types.FailedTipStateCheck
    )
    register_enumerated_errors()
