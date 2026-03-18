"""Registry for use with a Pyro Daemon client and server to allow serialization of Opentrons Hardware types and classes."""

import enum
from typing import Any, Dict

import serpent

import opentrons.config.types
import opentrons.hardware_control.types
import opentrons.types
from opentrons.util.pyro.pyro_serialization import (
    find_enums_in_packages,
    register_type_to_serpent,
)


def _serpent_enum_serializer(obj, serializer, stream, level):  # type: ignore
    """Serpent serializer for generic Enum values."""
    serializer._serialize(obj.value, stream, level)


# Opentrons Enum types registry
def _generic_enum_class_to_dict(obj: Any) -> Dict:  # type: ignore
    return {
        "__class__": ".".join((obj.__module__, obj.__class__.__name__)),
        "value": obj.value,
    }


def _generic_enum_dict_to_class(classname: str, d: Any) -> Any:
    module_path, class_name = classname.rsplit(".", 1)
    # Check type imports here, for now we only take from known opentrons modules
    if "opentrons.hardware_control.types" in module_path:
        opentrons_type = getattr(opentrons.hardware_control.types, class_name)
    elif "opentrons.config.types" in module_path:
        opentrons_type = getattr(opentrons.config.types, class_name)
    elif "opentrons.types" in module_path:
        opentrons_type = getattr(opentrons.types, class_name)
    else:
        raise RuntimeError(f"Unsupported module processed in Pyro request: {classname}")
    return opentrons_type(d["value"])


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


# UpdateStatus registry
def _update_status_dict_to_class(  # type: ignore
    classname, d
) -> opentrons.hardware_control.types.UpdateStatus:
    return opentrons.hardware_control.types.UpdateStatus(
        subsystem=opentrons.hardware_control.types.SubSystem(d["subsystem"]),
        state=opentrons.hardware_control.types.UpdateState(d["state"]),
        progress=d["progress"],
    )


def _update_status_class_to_dict(obj) -> Dict:  # type: ignore
    return {
        "__class__": "opentrons.hardware_control.types.UpdateStatus",
        "subsystem": obj.subsystem.value,
        "state": obj.state.value,
        "progress": obj.progress,
    }


# Handy function to map all registries for the Hardware controller
def register_hardware_types() -> None:
    """Registers serialize and deserialize behavior for Opentrons Hardware types and classes.
    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    opentrons_types = find_enums_in_packages(
        [opentrons.types, opentrons.config.types, opentrons.hardware_control.types]
    )
    # Serpent matches by first isinstance() in registry order, so unregister enums first so that
    # types like "Mount" don't automatically become strings/ints, then register the enums after.
    serpent.unregister_class(enum.Enum)  # type: ignore

    for enum_type in opentrons_types:
        register_type_to_serpent(
            class_type=enum_type,
            dict_to_class=_generic_enum_dict_to_class,
            class_to_dict=_generic_enum_class_to_dict,
        )

    serpent.register_class(enum.Enum, _serpent_enum_serializer)  # type: ignore

    # E-Stop Overall registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.EstopOverallStatus,
        dict_to_class=_estop_overall_status_dict_to_class,
        class_to_dict=_estop_overall_status_class_to_dict,
    )

    # UpdateStatus registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.UpdateStatus,
        dict_to_class=_update_status_dict_to_class,
        class_to_dict=_update_status_class_to_dict,
    )
