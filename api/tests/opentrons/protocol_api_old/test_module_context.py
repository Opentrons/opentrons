from typing import Type, cast

import mock
import pytest

from opentrons_shared_data.labware import load_definition as load_labware_definition
from opentrons_shared_data.module.types import ModuleDefinitionV3

import opentrons.protocol_api as papi
from opentrons.hardware_control.modules.magdeck import OFFSET_TO_LABWARE_BOTTOM
from opentrons.hardware_control.modules.types import (
    ThermocyclerModuleModel,
)
from opentrons.protocol_api.core.legacy.module_geometry import (
    models_compatible,
)
from opentrons.protocol_api.protocol_context import ProtocolContext
from opentrons.types import Location, Point


@pytest.fixture
def mock_hardware() -> mock.MagicMock:
    mock_hardware = mock.MagicMock()
    del mock_hardware._proxy
    return mock_hardware


@pytest.fixture
def mock_module_controller() -> mock.MagicMock:
    return mock.MagicMock()


@pytest.fixture
def mock_pipette_location() -> mock.MagicMock:
    return mock.MagicMock(return_value=Location(point=Point(1, 2, 3), labware=None))


# ______ load_module tests _______


# TODO(mm, 2023-04-28): This test uses mod.geometry, which was always a quasi-implementation-detail
# and was removed in PAPIv2.14. We should make sure this logic is adequately covered elsewhere
# in a way that doesn't depend on mod.geometry, and then delete this test.
@pytest.mark.apiv2_non_pe_only
@pytest.mark.parametrize(
    "loadname,klass,model",
    [
        ("tempdeck", papi.TemperatureModuleContext, "temperatureModuleV1"),
        ("temperature module", papi.TemperatureModuleContext, "temperatureModuleV1"),
        (
            "temperature module gen2",
            papi.TemperatureModuleContext,
            "temperatureModuleV2",
        ),
        ("magdeck", papi.MagneticModuleContext, "magneticModuleV1"),
        ("magnetic module", papi.MagneticModuleContext, "magneticModuleV1"),
        ("magnetic module gen2", papi.MagneticModuleContext, "magneticModuleV2"),
        ("thermocycler", papi.ThermocyclerContext, "thermocyclerModuleV1"),
        ("thermocycler module", papi.ThermocyclerContext, "thermocyclerModuleV1"),
        ("thermocycler module gen2", papi.ThermocyclerContext, "thermocyclerModuleV2"),
        ("heaterShakerModuleV1", papi.HeaterShakerContext, "heaterShakerModuleV1"),
    ],
)
def test_load_simulating_module(
    ctx: ProtocolContext, loadname: str, klass: Type[papi.ProtocolContext], model: str
) -> None:
    """Check that a known module will not throw an error if in simulation mode.

    Note: This is basically an integration test that checks that a module can be
          loaded correctly. So it checks the `load_module` function all the way through
          module instance creation, which includes fetching module definition, loading
          geometry and finding attached modules or creating simulated module in order to
          finally build an instance of the specified module.
    """
    ctx.home()
    mod = ctx.load_module(loadname, 7)
    assert isinstance(mod, klass)
    assert mod.geometry.model.value == model
    assert mod._core._sync_module_hardware.model() == model


# _________ Thermocycler tests __________


@pytest.mark.apiv2_non_pe_only  # Semi plate configuration removed in PAPIv2.14.
def test_thermocycler_semi_plate_configuration(ctx: papi.ProtocolContext) -> None:
    labware_name = "nest_96_wellplate_100ul_pcr_full_skirt"
    mod = ctx.load_module("thermocycler", configuration="semi")
    assert mod.geometry.labware_offset == Point(-23.28, 82.56, 97.8)

    tc_labware = mod.load_labware(labware_name)

    other_labware = ctx.load_labware(labware_name, 2)
    without_first_two_cols = other_labware.wells()[16::]
    for tc_well, other_well in zip(tc_labware.wells(), without_first_two_cols):
        tc_well_name = tc_well.display_name.split()[0]
        other_well_name = other_well.display_name.split()[0]
        assert tc_well_name == other_well_name


# __________ Testing loading Labware on modules ___________


@pytest.mark.apiv2_non_pe_only  # engage(height=...) param was removed in PAPIv2.14.
async def test_magdeck_gen1_labware_props(ctx: papi.ProtocolContext) -> None:
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_name = "biorad_96_wellplate_200ul_pcr"
    labware_def = load_labware_definition(labware_name, 1)
    mod = ctx.load_module("magdeck", 1)
    assert mod.labware is None
    assert isinstance(mod, papi.MagneticModuleContext)
    mod.engage(height=45)
    assert mod._core._sync_module_hardware.current_height == 45  # type: ignore[attr-defined]
    with pytest.raises(ValueError):
        mod.engage(height=45.1)  # max engage height for gen1 is 45 mm
    mod.load_labware(labware_name)
    mod.engage()
    if "magneticModuleEngageHeight" not in labware_def["parameters"]:
        assert False
    lw_offset = labware_def["parameters"]["magneticModuleEngageHeight"]
    assert await mod._core._sync_module_hardware._driver.get_plate_height() == lw_offset  # type: ignore[attr-defined]
    mod.disengage()
    mod.engage(offset=2)
    assert (
        await mod._core._sync_module_hardware._driver.get_plate_height()  # type: ignore[attr-defined]
        == lw_offset + 2
    )
    mod.disengage()
    mod.engage(height=3)
    assert await mod._core._sync_module_hardware._driver.get_plate_height() == 3  # type: ignore[attr-defined]
    mod.geometry.reset_labware()
    labware_name = "corning_96_wellplate_360ul_flat"
    mod.load_labware(labware_name)
    with pytest.raises(ValueError):
        mod.engage()
    with pytest.raises(ValueError):
        mod.engage(offset=1)
    mod.engage(height=2)
    assert await mod._core._sync_module_hardware._driver.get_plate_height() == 2  # type: ignore[attr-defined]
    mod.engage(height=0)
    assert await mod._core._sync_module_hardware._driver.get_plate_height() == 0  # type: ignore[attr-defined]
    mod.engage(height_from_base=2)
    assert (
        await mod._core._sync_module_hardware._driver.get_plate_height()  # type: ignore[attr-defined]
        == 2 + OFFSET_TO_LABWARE_BOTTOM[mod._core._sync_module_hardware.model()]  # type: ignore[attr-defined]
    )


@pytest.mark.apiv2_non_pe_only  # engage(height=...) param was removed in PAPIv2.14.
def test_magdeck_gen2_labware_props(ctx: papi.ProtocolContext) -> None:
    mod = ctx.load_module("magnetic module gen2", 1)
    assert isinstance(mod, papi.MagneticModuleContext)
    mod.engage(height=25)
    assert mod._core._sync_module_hardware.current_height == 25  # type: ignore[attr-defined]
    with pytest.raises(ValueError):
        mod.engage(height=25.1)  # max engage height for gen2 is 25 mm
    mod.engage(height=0)
    assert mod._core._sync_module_hardware.current_height == 0  # type: ignore[attr-defined]


def test_module_compatibility() -> None:
    assert (
        models_compatible(
            requested_model=ThermocyclerModuleModel["THERMOCYCLER_V1"],
            candidate_definition=cast(
                ModuleDefinitionV3, {"model": "thermocyclerModuleV1"}
            ),
        )
        is True
    )

    assert (
        models_compatible(
            requested_model=ThermocyclerModuleModel["THERMOCYCLER_V2"],
            candidate_definition=cast(
                ModuleDefinitionV3,
                {
                    "model": "thermocyclerModuleV1",
                    "compatibleWith": ["thermocyclerModuleV2"],
                },
            ),
        )
        is True
    )

    assert (
        models_compatible(
            requested_model=ThermocyclerModuleModel["THERMOCYCLER_V1"],
            candidate_definition=cast(
                ModuleDefinitionV3,
                {
                    "model": "thermocyclerModuleV2",
                    "compatibleWith": [],
                },
            ),
        )
        is False
    )
