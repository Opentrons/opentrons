"""Module data resource provider."""
from opentrons.protocols.geometry.module_geometry import (
    _load_v2_module_def,
    module_model_from_string,
)
from ..types import ModuleModel, ModuleDefinition


class ModuleDataProvider:
    """Module data provider."""

    @staticmethod
    def get_module_definition(model: ModuleModel) -> ModuleDefinition:
        """Get the module definition."""
        legacy_model = module_model_from_string(model.value)
        return ModuleDefinition.parse_obj(
            _load_v2_module_def(module_model=legacy_model)
        )
