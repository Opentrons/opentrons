import json
from typing import cast

import mock
import pytest

import opentrons.protocol_api as papi
import opentrons.protocols.geometry as papi_geometry

from opentrons.types import Point, Location
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import modules as hw_modules
from opentrons.hardware_control.modules.magdeck import OFFSET_TO_LABWARE_BOTTOM
from opentrons.hardware_control.modules.types import (
    SpeedStatus,
    ThermocyclerModuleModel,
)

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
)

from opentrons.protocols.geometry.module_geometry import (
    PipetteMovementRestrictedByHeaterShakerError,
)

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.module.dev_types import ModuleDefinitionV3


@pytest.fixture
def mock_hardware() -> mock.MagicMock:
    return mock.MagicMock()


@pytest.fixture
def mock_module_controller() -> mock.MagicMock:
    return mock.MagicMock()


@pytest.fixture
def mock_pipette_location() -> mock.MagicMock:
    return mock.MagicMock(return_value=Location(point=Point(1, 2, 3), labware=None))


@pytest.fixture
def ctx_with_tempdeck(
    mock_hardware: mock.MagicMock, mock_module_controller: mock.MagicMock
) -> ProtocolContext:
    """Context fixture with a mock temp deck."""
    mock_module_controller.model.return_value = "temperatureModuleV2"
    mock_module_controller.mock_add_spec(hw_modules.TempDeck)
    mock_hardware.attached_modules = [mock_module_controller]

    return papi.create_protocol_context(
        api_version=papi.MAX_SUPPORTED_VERSION,
        hardware_api=mock_hardware,
    )


@pytest.fixture
def ctx_with_magdeck(
    mock_hardware: mock.AsyncMock, mock_module_controller: mock.MagicMock
) -> ProtocolContext:
    """Context fixture with a mock mag deck."""
    mock_module_controller.model.return_value = "magneticModuleV1"
    mock_module_controller.mock_add_spec(hw_modules.MagDeck)
    mock_hardware.attached_modules = [mock_module_controller]

    return papi.create_protocol_context(
        api_version=papi.MAX_SUPPORTED_VERSION,
        hardware_api=mock_hardware,
    )


@pytest.fixture
async def ctx_with_thermocycler(
    mock_hardware: mock.AsyncMock, mock_module_controller: mock.MagicMock
) -> ProtocolContext:
    """Context fixture with a mock thermocycler."""
    mock_module_controller.model.return_value = "thermocyclerModuleV1"
    mock_module_controller.mock_add_spec(hw_modules.Thermocycler)
    mock_hardware.attached_modules = [mock_module_controller]

    return papi.create_protocol_context(
        api_version=papi.MAX_SUPPORTED_VERSION,
        hardware_api=mock_hardware,
    )


@pytest.fixture
def ctx_with_heater_shaker(
    mock_hardware: mock.AsyncMock,
    mock_module_controller: mock.MagicMock,
    mock_pipette_location: mock.MagicMock,
) -> ProtocolContext:
    """Context fixture with a mock heater-shaker."""
    mock_module_controller.model.return_value = "heaterShakerModuleV1"
    mock_module_controller.mock_add_spec(hw_modules.HeaterShaker)
    mock_hardware.attached_modules = [mock_module_controller]

    ctx = papi.create_protocol_context(
        api_version=papi.MAX_SUPPORTED_VERSION,
        hardware_api=mock_hardware,
    )
    ctx.location_cache = mock_pipette_location
    return ctx


# ______ load_module tests _______


def test_load_module(ctx_with_tempdeck):
    ctx_with_tempdeck.home()
    mod = ctx_with_tempdeck.load_module("tempdeck", 1)
    assert isinstance(mod, papi.TemperatureModuleContext)


def test_load_module_default_slot(ctx_with_thermocycler):
    ctx_with_thermocycler.home()
    mod = ctx_with_thermocycler.load_module("thermocycler")
    assert isinstance(mod, papi.ThermocyclerContext)


def test_no_slot_module_error(ctx_with_magdeck):
    ctx_with_magdeck.home()
    with pytest.raises(ValueError):
        assert ctx_with_magdeck.load_module("magdeck")


def test_invalid_slot_module_error(ctx_with_thermocycler):
    ctx_with_thermocycler.home()
    with pytest.raises(ValueError):
        assert ctx_with_thermocycler.load_module("thermocycler", 1)


def test_bad_slot_module_error(ctx_with_tempdeck):
    ctx_with_tempdeck.home()
    with pytest.raises(ValueError):
        assert ctx_with_tempdeck.load_module("thermocycler", 42)


def test_incorrect_module_error(ctx_with_tempdeck):
    ctx_with_tempdeck.home()
    with pytest.raises(ValueError):
        assert ctx_with_tempdeck.load_module("the cool module", 1)


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
def test_load_simulating_module(ctx, loadname, klass, model):
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
    assert mod._module.model() == model


# _________ Magnetic Module tests __________


def test_magdeck(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    assert ctx_with_magdeck.deck[1] == mod.geometry


# _________ Thermocycler tests __________


def test_thermocycler(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    assert ctx_with_thermocycler.deck[7] == mod.geometry


def test_thermocycler_lid_status(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    m = mock.PropertyMock(return_value="open")
    type(mock_module_controller).lid_status = m
    assert mod.lid_position == "open"


def test_thermocycler_profile_invalid_repetitions(
    ctx_with_thermocycler, mock_module_controller
):
    mod = ctx_with_thermocycler.load_module("thermocycler")

    with pytest.raises(ValueError, match="positive integer"):
        mod.execute_profile(
            steps=[
                {"temperature": 10, "hold_time_seconds": 30},
                {"temperature": 30, "hold_time_seconds": 90},
            ],
            repetitions=-1,
        )


def test_thermocycler_profile_no_temperature(
    ctx_with_thermocycler, mock_module_controller
):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    with pytest.raises(ValueError, match="temperature must be defined"):
        mod.execute_profile(
            steps=[
                {"temperature": 10, "hold_time_seconds": 30},
                {"hold_time_seconds": 90},
            ],
            repetitions=5,
        )


def test_thermocycler_profile_no_hold(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    with pytest.raises(
        ValueError, match="either hold_time_minutes or hold_time_seconds"
    ):
        mod.execute_profile(
            steps=[{"temperature": 10, "hold_time_seconds": 30}, {"temperature": 30}],
            repetitions=5,
        )


def test_thermocycler_semi_plate_configuration(ctx):
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


def test_thermocycler_flag_unsafe_move(ctx_with_thermocycler, mock_module_controller):
    """Flag unsafe should raise if the lid is open and source or target is
    the labware on thermocycler."""
    mod = ctx_with_thermocycler.load_module("thermocycler", configuration="semi")
    labware_name = "nest_96_wellplate_100ul_pcr_full_skirt"
    tc_labware = mod.load_labware(labware_name)

    with_tc_labware = Location(None, tc_labware)  # type: ignore[arg-type]
    without_tc_labware = Location(None, None)  # type: ignore[arg-type]

    m = mock.PropertyMock(return_value="closed")
    type(mock_module_controller).lid_status = m

    with pytest.raises(RuntimeError, match="Cannot move to labware"):
        mod._core.flag_unsafe_move(with_tc_labware, without_tc_labware)
    with pytest.raises(RuntimeError, match="Cannot move to labware"):
        mod._core.flag_unsafe_move(without_tc_labware, with_tc_labware)


# __________ Heater Shaker tests __________


@pytest.mark.parametrize(
    argnames=["labware_name", "is_tiprack"],
    argvalues=[("geb_96_tiprack_1000ul", True), ("biorad_384_wellplate_50ul", False)],
)
def test_heater_shaker_unsafe_move_flagger(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
    labware_name: str,
    is_tiprack: bool,
) -> None:
    """It should call unsafe movement flagger with correct args."""
    mock_speed_status = mock.PropertyMock(return_value=SpeedStatus.DECELERATING)
    mock_latch_status = mock.PropertyMock(
        return_value=HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )
    type(mock_module_controller).speed_status = mock_speed_status
    type(mock_module_controller).labware_latch_status = mock_latch_status

    mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 3)
    assert isinstance(mod, HeaterShakerContext)

    labware = ctx_with_heater_shaker.load_labware(labware_name, 5)

    mod._core.geometry.flag_unsafe_move = mock.MagicMock()  # type: ignore[attr-defined]

    mod._core.flag_unsafe_move(to_loc=labware.wells()[1].top(), is_multichannel=False)  # type: ignore[attr-defined]

    mod._core.geometry.flag_unsafe_move.assert_called_once_with(  # type: ignore[attr-defined]
        to_slot=5,
        is_tiprack=is_tiprack,
        is_using_multichannel=False,
        is_labware_latch_closed=True,
        is_plate_shaking=True,
    )


def test_hs_flag_unsafe_move_raises(
    ctx_with_heater_shaker: ProtocolContext,
) -> None:
    """Test unsafe move raises underlying error."""

    def raiser(*args, **kwargs):
        raise PipetteMovementRestrictedByHeaterShakerError("uh oh")

    mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 3)
    labware = ctx_with_heater_shaker.load_labware("geb_96_tiprack_1000ul", 5)

    assert isinstance(mod, HeaterShakerContext)
    mod._core.geometry.flag_unsafe_move = mock.MagicMock(side_effect=raiser)  # type: ignore[attr-defined]

    with pytest.raises(PipetteMovementRestrictedByHeaterShakerError, match="uh oh"):
        mod._core.flag_unsafe_move(to_loc=labware.wells()[1].top(), is_multichannel=False)  # type: ignore[attr-defined]


def test_hs_flag_unsafe_move_skips_non_labware_locations(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
) -> None:
    """Test that purely point locations do not raise error."""
    mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 3)
    assert isinstance(mod, HeaterShakerContext)
    mod._core.geometry.flag_unsafe_move = mock.MagicMock()  # type: ignore[attr-defined]

    mod._core.flag_unsafe_move(  # type: ignore[attr-defined]
        to_loc=Location(point=Point(1, 2, 3), labware=None), is_multichannel=False
    )
    mod._core.geometry.flag_unsafe_move.assert_not_called()  # type: ignore[attr-defined]


def test_heater_shaker_loading(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
) -> None:
    """It should load a heater-shaker in the specified slot."""
    mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 3)
    assert ctx_with_heater_shaker.deck[3] == mod.geometry


# __________ Testing loading Labware on modules ___________


def test_module_load_labware(ctx_with_tempdeck):
    labware_name = "corning_96_wellplate_360ul_flat"
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_def = json.loads(
        load_shared_data(f"labware/definitions/2/{labware_name}/1.json")
    )
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    assert mod.labware is None
    lw = mod.load_labware(labware_name)
    lw_offset = Point(
        labware_def["cornerOffsetFromSlot"]["x"],
        labware_def["cornerOffsetFromSlot"]["y"],
        labware_def["cornerOffsetFromSlot"]["z"],
    )
    assert (
        lw._implementation.get_geometry().offset
        == lw_offset + mod.geometry.location.point
    )
    assert lw.name == labware_name


def test_module_load_labware_with_label(ctx_with_tempdeck):
    labware_name = "corning_96_wellplate_360ul_flat"
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    lw = mod.load_labware(labware_name, label="my cool labware")
    assert lw.name == "my cool labware"


def test_module_load_invalid_labware(ctx_with_tempdeck):
    labware_name = "corning_96_wellplate_360ul_flat"
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    # wrong version number
    with pytest.raises(FileNotFoundError):
        mod.load_labware(labware_name, namespace="opentrons", version=100)
    # wrong namespace
    with pytest.raises(FileNotFoundError):
        mod.load_labware(labware_name, namespace="fake namespace", version=1)
    # valid info
    assert mod.load_labware(labware_name, namespace="opentrons", version=1)


def test_deprecated_module_load_labware_by_name(ctx_with_tempdeck):
    """It should call load labware"""
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    mod.load_labware = mock.MagicMock()
    mod.load_labware_by_name(
        name="a module", namespace="ns", label="a label", version=2
    )
    mod.load_labware.assert_called_once_with(
        name="a module", label="a label", namespace="ns", version=2
    )


async def test_magdeck_gen1_labware_props(ctx):
    # TODO Ian 2019-05-29 load fixtures, not real defs
    labware_name = "biorad_96_wellplate_200ul_pcr"
    labware_def = json.loads(
        load_shared_data(f"labware/definitions/2/{labware_name}/1.json")
    )
    mod = ctx.load_module("magdeck", 1)
    assert mod.labware is None
    mod.engage(height=45)
    assert mod._module.current_height == 45
    with pytest.raises(ValueError):
        mod.engage(height=45.1)  # max engage height for gen1 is 45 mm
    mod.load_labware(labware_name)
    mod.engage()
    lw_offset = labware_def["parameters"]["magneticModuleEngageHeight"]
    assert await mod._module._driver.get_plate_height() == lw_offset
    mod.disengage()
    mod.engage(offset=2)
    assert await mod._module._driver.get_plate_height() == lw_offset + 2
    mod.disengage()
    mod.engage(height=3)
    assert await mod._module._driver.get_plate_height() == 3
    mod.geometry.reset_labware()
    labware_name = "corning_96_wellplate_360ul_flat"
    mod.load_labware(labware_name)
    with pytest.raises(ValueError):
        mod.engage()
    with pytest.raises(ValueError):
        mod.engage(offset=1)
    mod.engage(height=2)
    assert await mod._module._driver.get_plate_height() == 2
    mod.engage(height=0)
    assert await mod._module._driver.get_plate_height() == 0
    mod.engage(height_from_base=2)
    assert (
        await mod._module._driver.get_plate_height()
        == 2 + OFFSET_TO_LABWARE_BOTTOM[mod._module.model()]
    )


def test_magdeck_gen2_labware_props(ctx):
    mod = ctx.load_module("magnetic module gen2", 1)
    mod.engage(height=25)
    assert mod._module.current_height == 25
    with pytest.raises(ValueError):
        mod.engage(height=25.1)  # max engage height for gen2 is 25 mm
    mod.engage(height=0)
    assert mod._module.current_height == 0


def test_module_compatibility():
    assert (
        papi_geometry.module_geometry.models_compatible(
            requested_model=ThermocyclerModuleModel.THERMOCYCLER_V1,
            candidate_definition=cast(
                ModuleDefinitionV3, {"model": "thermocyclerModuleV1"}
            ),
        )
        is True
    )

    assert (
        papi_geometry.module_geometry.models_compatible(
            requested_model=ThermocyclerModuleModel.THERMOCYCLER_V2,
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
        papi_geometry.module_geometry.models_compatible(
            requested_model=ThermocyclerModuleModel.THERMOCYCLER_V1,
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
