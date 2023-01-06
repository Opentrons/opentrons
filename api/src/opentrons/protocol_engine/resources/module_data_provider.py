"""Module data resource provider."""
from opentrons_shared_data.module import load_definition

from ..types import ModuleModel, ModuleDefinition


class ModuleDataProvider:
    """Module data provider."""

    @staticmethod
    def get_definition(model: ModuleModel) -> ModuleDefinition:
        """Get the module definition."""
        data = load_definition(model_or_loadname=model.value, version="3")
        return ModuleDefinition.parse_obj(data)
