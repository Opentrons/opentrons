"""Module data resource provider."""
from typing import cast
from opentrons_shared_data.module import load_definition
from opentrons_shared_data.module.dev_types import ModuleModel as ModuleModelStr

from ..types import ModuleModel, ModuleDefinition


class ModuleDataProvider:
    """Module data provider."""

    @staticmethod
    def get_definition(model: ModuleModel) -> ModuleDefinition:
        """Get the module definition."""
        model_name = cast(ModuleModelStr, model.value)
        data = load_definition(model_or_loadname=model_name, version="3")
        return ModuleDefinition.parse_obj(data)
