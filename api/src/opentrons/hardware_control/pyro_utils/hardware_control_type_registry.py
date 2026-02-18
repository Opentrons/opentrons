"""Registry for use with a Pyro Daemon client and server to allow serialization of Opentrons Hardware types and classes."""
import enum
from Pyro5.api import register_class_to_dict, register_dict_to_class
import serpent
import opentrons.hardware_control.types


def _serpent_enum_serializer(obj, serializer, stream, level):
    """Serpent serializer for generic Enum values."""
    serializer._serialize(obj.value, stream, level)


def register_hardware_types():
    """Registers serialize and deserialize behavior for Opentrons Hardware types and classes.
    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    def _estop_overall_status_dict_to_class(classname, d):
        return opentrons.hardware_control.types.EstopOverallStatus(
            state=d["state"],
            left_physical_state=d["left_physical_state"],
            right_physical_state=d["right_physical_state"]
        )
    register_dict_to_class("opentrons.hardware_control.types.EstopOverallStatus", _estop_overall_status_dict_to_class)

    def _ot3_mount_dict_to_class(classname, d):
        return opentrons.hardware_control.types.OT3Mount(d["value"])
    register_dict_to_class("opentrons.hardware_control.types.OT3Mount", _ot3_mount_dict_to_class)

    def _ot3_mount_class_to_dict(obj):
        return {
            "__class__": "opentrons.hardware_control.types.OT3Mount",
            "value": obj.value
        }

    # Serpent matches by first isinstance() in registry order, so unregister enums first so that
    # types like "Mount" don't automatically become strings/ints, then register the enums after.
    serpent.unregister_class(enum.Enum)
    register_class_to_dict(opentrons.hardware_control.types.OT3Mount, _ot3_mount_class_to_dict)
    serpent.register_class(enum.Enum, _serpent_enum_serializer)
