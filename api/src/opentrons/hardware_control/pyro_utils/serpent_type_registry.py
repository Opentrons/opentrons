"""Registry for use with a Pyro Daemon client and server to allow serialization of Opentrons Hardware types and classes."""

from typing import Dict

import opentrons.config.types
import opentrons.hardware_control.types
import opentrons.hardware_control.dev_types
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


# Handy function to map all registries for the Hardware controller
def register_hardware_types() -> None:
    """Registers serialize and deserialize behavior for Opentrons Hardware types and classes.
    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    opentrons_types = find_enums_in_packages(
        [opentrons.types, opentrons.config.types, opentrons.hardware_control.types, opentrons.hardware_control.dev_types]
    )

    with serpent_enum_registration():
        for enum_type in opentrons_types:
            OpentronsPyroSerializer.register_enum(enum_type)

    opentrons_pydantic_types = find_pydantic_classes_in_packages(
        [opentrons.types, opentrons.config.types, opentrons.hardware_control.types]
    )
    for pydantic_type in opentrons_pydantic_types:
        OpentronsPyroSerializer.register_pydantic_model(pydantic_type)

    opentrons_typed_dicts = find_typed_dict_classes_in_packages(
        [opentrons.hardware_control.dev_types]
    )
    for typed_dict in opentrons_typed_dicts:
        OpentronsPyroSerializer.register_typed_dict(typed_dict)

    OpentronsPyroSerializer.register_unhashable_dicts()


    # E-Stop Overall registration
    register_type_to_serpent(
        class_type=opentrons.hardware_control.types.EstopOverallStatus,
        dict_to_class=_estop_overall_status_dict_to_class,
        class_to_dict=_estop_overall_status_class_to_dict,
    )
