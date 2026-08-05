"""Registry for use with a Pyro Daemon client and server to allow serialization of Opentrons Hardware types and classes."""

from pathlib import Path
from typing import Any, Dict

import Pyro5
from numpy import float64

import opentrons_hardware.firmware_bindings.messages.message_definitions
import opentrons_shared_data.errors.codes
import opentrons_shared_data.gripper.gripper_definition
import opentrons_shared_data.pipette.pipette_definition
import opentrons_shared_data.pipette.types

import opentrons.calibration_storage.ot3.models.v1
import opentrons.calibration_storage.types
import opentrons.config.types
import opentrons.drivers.asyncio.communication.errors
import opentrons.drivers.flex_stacker.errors
import opentrons.drivers.flex_stacker.types
import opentrons.drivers.rpi_drivers.types
import opentrons.drivers.types
import opentrons.drivers.utils
import opentrons.drivers.vacuum_module.errors
import opentrons.drivers.vacuum_module.types
import opentrons.hardware_control.dev_types
import opentrons.hardware_control.instruments.ot3.instrument_calibration
import opentrons.hardware_control.modules.errors
import opentrons.hardware_control.modules.module_calibration
import opentrons.hardware_control.modules.thermocycler
import opentrons.hardware_control.modules.types
import opentrons.hardware_control.nozzle_manager
import opentrons.hardware_control.peripherals.types
import opentrons.hardware_control.protocols.types
import opentrons.hardware_control.types
import opentrons.hardware_control.util
import opentrons.types
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    find_basic_errors_in_packages,
    find_enums_in_packages,
    find_opentrons_classes_in_packages,
    find_pydantic_classes_in_packages,
    find_typed_dict_classes_in_packages,
    register_enumerated_errors,
    register_type_to_serpent,
    serpent_enum_registration,
)

Pyro5.config.SERPENT_BYTES_REPR = True  # type: ignore

# Hardware package lists

HARDWARE_ENUM_PACKAGES = [
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
    opentrons.drivers.flex_stacker.types,
    opentrons.hardware_control.util,
]

HARDWARE_PYDANTIC_PACKAGES = [
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

HARDWARE_CLASS_PACKAGES = [
    opentrons.drivers.vacuum_module.types,
    opentrons.drivers.types,
    opentrons.hardware_control.modules.module_calibration,
    opentrons.hardware_control.modules.types,
    opentrons.drivers.rpi_drivers.types,
    opentrons.hardware_control.types,
    opentrons.types,
    opentrons.hardware_control.ot3_calibration,
    opentrons.hardware_control.instruments.ot3.instrument_calibration,
    opentrons.drivers.flex_stacker.types,
    opentrons_hardware.firmware_bindings.messages.message_definitions,
]

HARDWARE_ERROR_PACKAGES = [
    opentrons.hardware_control.types,
    opentrons.hardware_control.modules.errors,
    opentrons.hardware_control.modules.thermocycler,
    opentrons.drivers.asyncio.communication.errors,
    opentrons.drivers.flex_stacker.errors,
    opentrons.drivers.vacuum_module.errors,
    opentrons.drivers.utils,
]

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


# Robot type registry - of note, this is meant to return a "pure" type
def _robot_type_class_to_dict(obj) -> Dict:  # type: ignore
    return {"__class__": ".".join((obj.__module__, obj.__class__.__name__))}


def _robot_type_dict_to_class(  # type: ignore
    classname, d
) -> type[opentrons.hardware_control.protocols.types.FlexRobotType]:
    return opentrons.hardware_control.protocols.types.FlexRobotType


# Pathlib Path registry
def _path_class_to_dict(obj) -> Dict:  # type: ignore
    return {"__class__": "pathlib.Path", "path_str": str(obj)}


def _path_dict_to_class(  # type: ignore
    classname, d
) -> Path:
    return Path(d["path_str"])


# Handy function to map all registries for the Hardware controller
def register_hardware_types() -> None:
    """Registers serialize and deserialize behavior for Opentrons Hardware types and classes.
    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    opentrons_types = find_enums_in_packages(HARDWARE_ENUM_PACKAGES)

    with serpent_enum_registration():
        for enum_type in opentrons_types:
            OpentronsPyroSerializer.register_enum(enum_type)

    opentrons_pydantic_types = find_pydantic_classes_in_packages(
        HARDWARE_PYDANTIC_PACKAGES
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

    # numpy registration
    register_type_to_serpent(
        class_type=float64,
        dict_to_class=_numpy_float_dict_to_class,
        class_to_dict=_numpy_float_class_to_dict,
    )

    # pathlib Path registration
    register_type_to_serpent(
        class_type=Path,
        dict_to_class=_path_dict_to_class,
        class_to_dict=_path_class_to_dict,
    )

    # Dataclass generic registration
    opentrons_class_types = find_opentrons_classes_in_packages(HARDWARE_CLASS_PACKAGES)
    for class_type in opentrons_class_types:
        OpentronsPyroSerializer.register_class(class_type)

    # handle Typed Dicts for the hardware controller
    OpentronsPyroSerializer.register_opentrons_typed_dicts(_typed_dict_dict_to_class)

    # Error serialization
    opentrons_error_types = find_basic_errors_in_packages(HARDWARE_ERROR_PACKAGES)
    for error_type in opentrons_error_types:
        OpentronsPyroSerializer.register_basic_error(error_type)
    register_enumerated_errors()
