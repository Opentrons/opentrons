"""opentrons_shared_data.peripheral: functions and types for peripheral defs."""

import json
from pathlib import Path
from typing import Union, cast

from ..load import load_shared_data
from .types import PeripheralDefinitionV1, PeripheralModel, SchemaVersions


class PeripheralNotFoundError(KeyError):
    """A subtype of KeyError for when a request perhipheral defintion could not be found."""

    def __init__(self, version: str, model_or_loadname: str) -> None:
        """Build an error."""
        super().__init__(model_or_loadname)
        self.requested_version = version
        self.requested_peripheral = model_or_loadname

    def __str__(self) -> str:
        """String representation."""
        return f"No such version {self.requested_version} peripheral {self.requested_peripheral}"

    def __repr__(self) -> str:
        """Formatted representation for printing."""
        return (
            f"{self.__class__.__name__}: {self.requested_peripheral} "
            f"at version {self.requested_version}"
        )


def load_definition(
    version: SchemaVersions,
    model_or_loadname: Union[str, PeripheralModel],
) -> Union[PeripheralDefinitionV1]:
    """Load a definition file for a peripheral."""
    path = Path(f"peripheral/definitions/{version}/{model_or_loadname}.json")
    data = json.loads(load_shared_data(path))
    try:
        data = load_shared_data(path)
    except KeyError:
        raise PeripheralNotFoundError(version, model_or_loadname)
    return cast(PeripheralDefinitionV1, json.loads(data))
