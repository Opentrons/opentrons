"""Registry for use with a Pyro Daemon client and server to allow serialization of Opentrons Hardware types and classes."""
import enum
from Pyro5.api import register_class_to_dict, register_dict_to_class
import serpent
from typing import Any, Dict
import opentrons.hardware_control.types
import opentrons.config.types
import opentrons.types

def _serpent_enum_serializer(obj, serializer, stream, level):
    """Serpent serializer for generic Enum values."""
    serializer._serialize(obj.value, stream, level)

# Opentrons Enum types registry
def _generic_enum_class_to_dict(obj: Any) -> Dict:
    return {
        "__class__": '.'.join((obj.__module__, obj.__class__.__name__)),
        "value": obj.value
    }

def _generic_enum_dict_to_class(classname:str, d: Any):
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
def _estop_overall_status_dict_to_class(classname, d):
    return opentrons.hardware_control.types.EstopOverallStatus(
        state=d["state"],
        left_physical_state=d["left_physical_state"],
        right_physical_state=d["right_physical_state"]
    )
def _estop_overall_status_class_to_dict(obj):
    return {
        "__class__": "opentrons.hardware_control.types.EstopOverallStatus",
        "state": obj.state,
        "left_physical_state": obj.left_physical_state,
        "right_physical_state": obj.right_physical_state
    }

# UpdateStatus registry
def _update_status_dict_to_class(classname, d):
    return opentrons.hardware_control.types.UpdateStatus(
        subsystem=d["subsystem"],
        state=d["state"],
        progress=d["progress"]
    )
def _update_status_class_to_dict(obj):
    return {
        "__class__": "opentrons.hardware_control.types.UpdateStatus",
        "subsystem": obj.subsystem,
        "state": obj.state,
        "progress": obj.progress
    }


# Handy function to map all registries for the Hardware controller
def register_hardware_types():
    """Registers serialize and deserialize behavior for Opentrons Hardware types and classes.
    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    opentrons_enum_types = [
        opentrons.types.Mount,
        opentrons.config.types.GantryLoad,
        opentrons.hardware_control.types.OT3Mount,
        opentrons.hardware_control.types.DoorState,
        opentrons.hardware_control.types.Axis,
        opentrons.hardware_control.types.SubSystem,
        opentrons.hardware_control.types.UpdateState
    ]

    # Serpent matches by first isinstance() in registry order, so unregister enums first so that
    # types like "Mount" don't automatically become strings/ints, then register the enums after.
    serpent.unregister_class(enum.Enum)

    for enum_type in opentrons_enum_types:
        classpath = '.'.join((enum_type.__module__, enum_type.__qualname__))
        register_dict_to_class(classpath, _generic_enum_dict_to_class)
        register_class_to_dict(enum_type, _generic_enum_class_to_dict)
    
    serpent.register_class(enum.Enum, _serpent_enum_serializer)

    # E-Stop Overall registration
    register_dict_to_class("opentrons.hardware_control.types.EstopOverallStatus", _estop_overall_status_dict_to_class)
    register_class_to_dict(opentrons.hardware_control.types.EstopOverallStatus, _estop_overall_status_class_to_dict)

    # UpdateStatus registration
    register_dict_to_class("opentrons.hardware_control.types.UpdateStatus", _update_status_dict_to_class)
    register_class_to_dict(opentrons.hardware_control.types.UpdateStatus, _update_status_class_to_dict)
    


