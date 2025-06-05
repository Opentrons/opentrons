"""Types and functions for accessing liquid class definitions."""
from pathlib import Path
from .. import load_shared_data, get_shared_data_root
from .liquid_class_definition import LiquidClassSchemaV1


DEFAULT_SCHEMA_VERSION = 1
DEFAULT_LC_VERSION = 1


class LiquidClassDefinitionDoesNotExist(Exception):
    """Specified liquid class definition does not exist."""


def load_definition(
    name: str,
    version: int = DEFAULT_LC_VERSION,
    schema_version: int = DEFAULT_SCHEMA_VERSION,
) -> LiquidClassSchemaV1:
    """Load the specified liquid class' definition as a LiquidClassSchemaV1 object.

    Note: this is an expensive operation and should be called sparingly.
    """
    try:
        return LiquidClassSchemaV1.model_validate_json(
            load_shared_data(
                f"liquid-class/definitions/{schema_version}/{name}/{version}.json"
            )
        )
    except FileNotFoundError:
        raise LiquidClassDefinitionDoesNotExist(
            f"No definition found for liquid class '{name}' version {version}"
        )


def definition_exists(
    name: str,
    version: int = DEFAULT_LC_VERSION,
) -> bool:
    """Return whether a definition exists for the specified liquid class name.."""
    return Path(
        get_shared_data_root()
        / f"liquid-class/definitions/{DEFAULT_SCHEMA_VERSION}/{name}/{version}.json"
    ).exists()
