import pytest
from typing import Union
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from opentrons.types import Location, Point
from opentrons.hardware_control.modules.types import ModuleType, MagneticModuleModel
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.geometry.module_geometry import (
    load_module_from_definition,
    ModuleGeometry,
)
from opentrons_shared_data.module.dev_types import (
    ModuleDefinitionV3,
    ModuleDefinitionV1,
)


@pytest.fixture
def v1_mag_module_schema_v3_definition() -> ModuleDefinitionV3:
    """A Gen1 Magnetic Module's schemaV3 definition fixture."""
    return {
        "$otSharedSchema": "module/schemas/3",
        "moduleType": "magneticModuleType",
        "model": "magneticModuleV1",
        "labwareOffset": {"x": 11.0, "y": 22.0, "z": 33.0},
        "dimensions": {
            "bareOverallHeight": 123,
            "overLabwareHeight": 234,
            "xDimension": 345,
            "yDimension": 456,
        },
        "calibrationPoint": {"x": 111, "y": 222, "z": 333},
        "displayName": "Sample Module",
        "quirks": [],
        "slotTransforms": {},
        "compatibleWith": ["someSimilarModule"],
        "cornerOffsetFromSlot": {"x": 111, "y": 222, "z": 333},
        "twoDimensionalRendering": {},
    }


@pytest.fixture
def v1_mag_module_schema_v1_definition() -> ModuleDefinitionV1:
    """A Gen1 Magnetic Module's schemaV1 definition fixture."""
    return {
        "labwareOffset": {"x": 11.0, "y": 22.0, "z": 33.0},
        "dimensions": {"bareOverallHeight": 123, "overLabwareHeight": 321},
        "calibrationPoint": {"x": 44.0, "y": 55.0},
        "displayName": "Sample Old Module",
        "loadName": "magdeck",
        "quirks": [],
    }


@pytest.mark.parametrize(
    argnames=["api_version", "module_definition", "expected_geometry"],
    argvalues=[
        (
            APIVersion.from_string("2.3"),
            lazy_fixture("v1_mag_module_schema_v3_definition"),
            ModuleGeometry(
                parent=Location(Point(0, 0, 0), labware=None),
                api_level=APIVersion.from_string("2.3"),
                offset=Point(11, 22, 33),
                overall_height=123,
                height_over_labware=234,
                model=MagneticModuleModel.MAGNETIC_V1,
                module_type=ModuleType.MAGNETIC,
                display_name="Sample Module",
            ),
        ),
        (
            APIVersion.from_string("2.2"),
            lazy_fixture("v1_mag_module_schema_v1_definition"),
            ModuleGeometry(
                parent=Location(Point(0, 0, 0), labware=None),
                api_level=APIVersion.from_string("2.2"),
                offset=Point(11.0, 22.0, 33.0),
                overall_height=123,
                height_over_labware=321,
                model=MagneticModuleModel.MAGNETIC_V1,
                module_type=ModuleType.MAGNETIC,
                display_name="Sample Old Module",
            ),
        ),
    ],
)
def test_load_module_from_definition(
    api_version: APIVersion,
    module_definition: Union[ModuleDefinitionV1, ModuleDefinitionV3],
    expected_geometry: ModuleGeometry,
) -> None:
    """It should load an API-version-specific module from its definition."""
    load_result = load_module_from_definition(
        definition=module_definition,
        parent=Location(point=Point(0, 0, 0), labware=None),
        api_level=api_version,
    )
    assert load_result.api_version == expected_geometry.api_version
    assert load_result.parent == expected_geometry.parent
    assert load_result.module_type == expected_geometry.module_type
    assert load_result.model == expected_geometry.model
    assert load_result.labware_offset == expected_geometry.labware_offset
    assert load_result.highest_z == expected_geometry.highest_z


def test_load_module_from_definition_raises(v1_mag_module_schema_v3_definition) -> None:
    """It raises when an invalid definition is passed."""
    v1_mag_module_schema_v3_definition.update({"moduleType": "blahblahModuleType"})

    with pytest.raises(RuntimeError):
        load_module_from_definition(
            definition=v1_mag_module_schema_v3_definition,
            parent=Location(point=Point(0, 0, 0), labware=None),
            api_level=APIVersion.from_string("2.5"),
        )
