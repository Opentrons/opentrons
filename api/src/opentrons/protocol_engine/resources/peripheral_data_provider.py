"""Peripheral data resource provider."""

from opentrons_shared_data.peripheral import load_definition

from ..types import (
    PeripheralDefinition,
    PeripheralModel,
)


class PeripheralDataProvider:
    """Peripheral data provider."""

    @staticmethod
    def get_definition(model: PeripheralModel) -> PeripheralDefinition:
        """Get the peripheral definition."""
        data = load_definition(model_or_loadname=model.value, version="1")
        return PeripheralDefinition.model_validate(data)
