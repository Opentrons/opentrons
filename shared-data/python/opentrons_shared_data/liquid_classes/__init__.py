"""Types and functions for accessing liquid class definitions."""
import json

from .. import load_shared_data
from .liquid_class_definition import LiquidClassSchemaV1


class LiquidClassDefinitionDoesNotExist(Exception):
    """Specified liquid class definition does not exist."""


# TODO (spp, 2024-10-16): update the path once definitions are added
def load_definition(name: str) -> LiquidClassSchemaV1:
    """Load the specified liquid class' definition as a LiquidClassSchemaV1 object.

    Note: this is an expensive operation and should be called sparingly.
    """
    try:
        return LiquidClassSchemaV1.parse_obj(
            json.loads(load_shared_data(f"liquid-class/fixtures/{name}.json"))
        )
    except FileNotFoundError:
        raise LiquidClassDefinitionDoesNotExist(
            f"No definition found for liquid class '{name}'"
        )
