"""Registry for use with a Pyro Daemon client and server to allow serialization of Robot-Server types and classes."""

import opentrons.types
from opentrons.util.pyro.pyro_serialization import (
    OpentronsPyroSerializer,
    find_enums_in_packages,
    find_pydantic_classes_in_packages,
    find_typed_dict_classes_in_packages,
    register_type_to_serpent,
    serpent_enum_registration,
)


def register_robot_server_types() -> None:
    """Registers serialize and deserialize behavior for Robot-Server types and classes.

    Pyro serializes our dataclasses into dicts, but doesn't convert them back to their native types automatically.
    """
    return None
