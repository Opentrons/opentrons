"""Module data resource provider."""
from opentrons_shared_data.module.dev_types import ModuleDefinitionV2
from opentrons.protocols.geometry.module_geometry import (
    _load_v2_module_def,
    module_model_from_string,
)
from ..types import ModuleModels


class ModuleDataProvider:
    """Module data provider."""

    @staticmethod
    async def get_module_definition(
        model: ModuleModels
    ) -> ModuleDefinitionV2:
        """Get the module definition."""
        legacy_model = module_model_from_string(model.value)
        # legacy_module_type = resolve_module_type(legacy_model)
        return _load_v2_module_def(module_model=legacy_model)
