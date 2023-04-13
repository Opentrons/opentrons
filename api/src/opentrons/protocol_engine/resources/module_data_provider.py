"""Module data resource provider."""
from opentrons.hardware_control.modules.module_calibration import load_module_calibration_offset
from opentrons.hardware_control.modules.types import ModuleType
from opentrons_shared_data.module import load_definition

from ..types import ModuleModel, ModuleDefinition, ModuleOffsetVector


class ModuleDataProvider:
    """Module data provider."""

    @staticmethod
    def get_definition(model: ModuleModel) -> ModuleDefinition:
        """Get the module definition."""
        data = load_definition(model_or_loadname=model.value, version="3")
        return ModuleDefinition.parse_obj(data)

    @staticmethod
    def get_module_calibration_offset(module_id: str, module_type: ModuleType, slot: int) -> ModuleOffsetVector:
        """Get the module calibration offset"""

        data = load_module_calibration_offset(module_type, module_id, slot)
        return ModuleOffsetVector.parse_obj(data.offset)
