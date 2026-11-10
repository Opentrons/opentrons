from typing import Type, cast

import mock
import pytest

from opentrons_shared_data.module.types import ModuleDefinitionV3

import opentrons.protocol_api as papi
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


# __________ Testing loading Labware on modules ___________


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
