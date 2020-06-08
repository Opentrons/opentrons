"""
opentrons_shared_data.module.dev_types: types requiring typing_extensions
for modules
"""

from typing import Any, Dict, List, Union
from typing_extensions import Literal, TypedDict

SchemaV1 = Literal['1']
SchemaV2 = Literal['2']
SchemaVersions = Union[SchemaV1, SchemaV2]

ModuleSchema = Dict[str, Any]

MagneticModuleType = Literal['magneticModuleType']
TemperatureModuleType = Literal['temperatureModuleType']
ThermocyclerModuleType = Literal['thermocyclerModuleType']

ModuleType = Union[MagneticModuleType,
                   TemperatureModuleType,
                   ThermocyclerModuleType]

MagneticModuleModel = Union[Literal['magneticModuleV1'],
                            Literal['magneticModuleV2']]
TemperatureModuleModel = Union[Literal['temperatureModuleV1'],
                               Literal['temperatureModuleV2']]
ThermocyclerModuleModel = Union[Literal['thermocyclerModuleModel']]
ModuleModel = Union[MagneticModuleModel,
                    TemperatureModuleModel,
                    ThermocyclerModuleModel]

ModuleSlotTransform = TypedDict(
    'ModuleSlotTransform',
    {'labwareOffset': List[List[float]]})

ModuleLabwareOffset = TypedDict(
    'ModuleLabwareOffset', {'x': float, 'y': float, 'z': float})
ModuleDimensions = TypedDict(
    'ModuleDimensions', {
        'bareOverallHeight': float, 'overLabwareHeight': float,
        'lidHeight': float},
    total=False)
ModuleCalibrationPointOffset = TypedDict(
    'ModuleCalibrationPointOffset',
    {'x': float, 'y': float}
)

ModuleDefinitionV2 = TypedDict(
    'ModuleDefinitionV2',
    {
        '$otSharedSchema': Literal['module/schemas/2'],
        'moduleType': ModuleType,
        'model': ModuleModel,
        'labwareOffset': ModuleLabwareOffset,
        'dimensions': ModuleDimensions,
        'calibrationPoint': ModuleCalibrationPointOffset,
        'displayName': str,
        'quirks': List[str],
        'slotTransforms': Dict[str, Dict[str, Dict[str, List[List[float]]]]],
        'compatibleWith': List[ModuleModel],
    }
)

ModuleDefinitionV1 = TypedDict(
    'ModuleDefinitionV1',
    {
        'labwareOffset': ModuleLabwareOffset,
        'dimensions': ModuleDimensions,
        'calibrationPoint': ModuleCalibrationPointOffset,
        'displayName': str,
        'loadName': str,
        'quirks': List[str]
    }
)
