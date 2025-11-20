"""Types and functions for accessing liquid class definitions."""
from pathlib import Path
from typing import overload, Literal
from .. import load_shared_data, get_shared_data_root
from .liquid_class_definition import (
    LiquidClassSchemaV1,
    LiquidClassSchemaV2,
    LiquidClassSchema,
)


DEFAULT_SCHEMA_VERSION = 1
DEFAULT_LC_VERSION = 1


class LiquidClassDefinitionDoesNotExist(Exception):
    """Specified liquid class definition does not exist."""


@overload
def load_definition(
    name: str, version: int = 1, schema_version: Literal[1] = 1
) -> LiquidClassSchemaV1:
    ...


@overload
def load_definition(
    name: str, version: int, schema_version: Literal[2]
) -> LiquidClassSchemaV2:
    ...


def load_definition(
    name: str,
    version: int = DEFAULT_LC_VERSION,
    schema_version: int = DEFAULT_SCHEMA_VERSION,
) -> LiquidClassSchema:
    """Load the specified liquid class' definition as a LiquidClassSchemaV1 object.

    Note: this is an expensive operation and should be called sparingly.
    """
    try:
        if schema_version == 1:
            return LiquidClassSchemaV1.model_validate_json(
                load_shared_data(
                    f"liquid-class/definitions/{schema_version}/{name}/{version}.json"
                )
            )
        elif schema_version == 2:
            return LiquidClassSchemaV2.model_validate_json(
                load_shared_data(
                    f"liquid-class/definitions/{schema_version}/{name}/{version}.json"
                )
            )
        else:
            raise LiquidClassDefinitionDoesNotExist(
                f"Invalid schema version {schema_version} for liquid class"
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
