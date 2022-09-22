import pytest
import json
import mock
from typing import cast

import opentrons.protocol_api as papi
import opentrons.protocols.geometry as papi_geometry

from opentrons.types import Point, Location
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control.types import Axis
from opentrons.hardware_control.modules.magdeck import OFFSET_TO_LABWARE_BOTTOM
from opentrons.hardware_control.modules.types import (
    TemperatureStatus,
    SpeedStatus,
    ThermocyclerModuleModel,
)

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.module_contexts import (
    NoTargetTemperatureSetError,
    CannotPerformModuleAction,
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
    mock_hardware.attached_modules = [mock_module_controller]

    return papi.create_protocol_context(
        api_version=papi.MAX_SUPPORTED_VERSION,
        hardware_api=mock_hardware,
    )


@pytest.fixture
def ctx_with_thermocycler(
    mock_hardware: mock.AsyncMock, mock_module_controller: mock.MagicMock
) -> ProtocolContext:
    """Context fixture with a mock thermocycler."""
    mock_module_controller.model.return_value = "thermocyclerModuleV1"
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


# ________ Temperature Module tests _________


def test_tempdeck(ctx_with_tempdeck, mock_module_controller):
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    assert ctx_with_tempdeck.deck[1] == mod.geometry


def test_tempdeck_target(ctx_with_tempdeck, mock_module_controller):
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    m = mock.PropertyMock(return_value=0x1337)
    type(mock_module_controller).target = m
    assert mod.target == 0x1337


def test_tempdeck_set_temperature(ctx_with_tempdeck, mock_module_controller):
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    mod.set_temperature(20)
    assert "setting temperature" in ",".join(
        cmd.lower() for cmd in ctx_with_tempdeck.commands()
    )
    mock_module_controller.set_temperature.assert_called_once_with(20)


def test_tempdeck_temperature(ctx_with_tempdeck, mock_module_controller):
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    m = mock.PropertyMock(return_value=0xDEAD)
    type(mock_module_controller).temperature = m
    assert mod.temperature == 0xDEAD


def test_tempdeck_deactivate(ctx_with_tempdeck, mock_module_controller):
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    mod.deactivate()
    assert "deactivating temperature" in ",".join(
        cmd.lower() for cmd in ctx_with_tempdeck.commands()
    )
    mock_module_controller.deactivate.assert_called_once()


def test_tempdeck_status(ctx_with_tempdeck, mock_module_controller):
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    m = mock.PropertyMock(return_value="some status")
    type(mock_module_controller).status = m
    assert mod.status == "some status"


# _________ Magnetic Module tests __________


def test_magdeck(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    assert ctx_with_magdeck.deck[1] == mod.geometry


def test_magdeck_status(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    m = mock.PropertyMock(return_value="disengaged")
    type(mock_module_controller).status = m
    assert mod.status == "disengaged"


def test_magdeck_engage_no_height_no_labware(ctx_with_magdeck, mock_module_controller):
    """It should raise an error."""
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    with pytest.raises(ValueError):
        mod.engage()


def test_magdeck_engage_with_height(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    mod.engage(height=2)
    assert "engaging magnetic" in ",".join(
        cmd.lower() for cmd in ctx_with_magdeck.commands()
    )
    mock_module_controller.engage.assert_called_once_with(2)


def test_magdeck_engage_with_height_from_base(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    mod.engage(height_from_base=2)
    mock_module_controller.engage.assert_called_once_with(7)


def test_magdeck_disengage(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    mod.disengage()
    assert "disengaging magnetic" in ",".join(
        cmd.lower() for cmd in ctx_with_magdeck.commands()
    )
    mock_module_controller.deactivate.assert_called_once_with()


def test_magdeck_calibrate(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    mod.calibrate()
    assert "calibrating magnetic" in ",".join(
        cmd.lower() for cmd in ctx_with_magdeck.commands()
    )
    mock_module_controller.calibrate.assert_called_once()


# _________ Thermocycler tests __________


def test_thermocycler(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    assert ctx_with_thermocycler.deck[7] == mod.geometry


def test_thermocycler_lid_status(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    m = mock.PropertyMock(return_value="open")
    type(mock_module_controller).lid_status = m
    assert mod.lid_position == "open"


def test_thermocycler_lid(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    # Open should work if the lid is open (no status change)
    mock_module_controller.open.return_value = "open"
    mod.open_lid()
    assert "opening thermocycler lid" in ",".join(
        cmd.lower() for cmd in ctx_with_thermocycler.commands()
    )
    mock_module_controller.open.assert_called_once()
    assert mod.geometry.lid_status == "open"
    assert mod.geometry.highest_z == 98.0

    mock_module_controller.close.return_value = "closed"
    mod.close_lid()
    assert "closing thermocycler lid" in ",".join(
        cmd.lower() for cmd in ctx_with_thermocycler.commands()
    )
    mock_module_controller.close.assert_called_once()
    assert mod.geometry.lid_status == "closed"
    assert mod.geometry.highest_z == 98.0  # ignore 37.7mm lid for now


def test_thermocycler_set_lid_temperature(
    ctx_with_thermocycler, mock_module_controller
):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    mod.set_lid_temperature(123)
    mock_module_controller.set_lid_temperature.assert_called_once_with(123)


def test_thermocycler_temp_default_ramp_rate(
    ctx_with_thermocycler, mock_module_controller
):
    mod = ctx_with_thermocycler.load_module("thermocycler")

    # Test default ramp rate
    mod.set_block_temperature(20, hold_time_seconds=5.0, hold_time_minutes=1.0)
    assert "setting thermocycler" in ",".join(
        cmd.lower() for cmd in ctx_with_thermocycler.commands()
    )
    mock_module_controller.set_temperature.assert_called_once_with(
        temperature=20,
        hold_time_seconds=5.0,
        hold_time_minutes=1.0,
        ramp_rate=None,
        volume=None,
    )


def test_thermocycler_temp_specific_ramp_rate(
    ctx_with_thermocycler, mock_module_controller
):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    # Test specified ramp rate
    mod.set_block_temperature(41.3, hold_time_seconds=25.5, ramp_rate=2.0)
    assert "setting thermocycler" in ",".join(
        cmd.lower() for cmd in ctx_with_thermocycler.commands()
    )
    mock_module_controller.set_temperature.assert_called_once_with(
        temperature=41.3,
        hold_time_seconds=25.5,
        hold_time_minutes=None,
        ramp_rate=2.0,
        volume=None,
    )


def test_thermocycler_temp_infinite_hold(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    # Test infinite hold and volume
    mod.set_block_temperature(13.2, block_max_volume=123)
    assert "setting thermocycler" in ",".join(
        cmd.lower() for cmd in ctx_with_thermocycler.commands()
    )
    mock_module_controller.set_temperature.assert_called_once_with(
        temperature=13.2,
        hold_time_seconds=None,
        hold_time_minutes=None,
        ramp_rate=None,
        volume=123,
    )


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


def test_thermocycler_profile(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    mod.execute_profile(
        steps=[
            {"temperature": 10, "hold_time_seconds": 30},
            {"temperature": 30, "hold_time_seconds": 90},
        ],
        repetitions=5,
        block_max_volume=123,
    )
    assert "thermocycler starting" in ",".join(
        cmd.lower() for cmd in ctx_with_thermocycler.commands()
    )
    mock_module_controller.cycle_temperatures.assert_called_once_with(
        steps=[
            {"temperature": 10, "hold_time_seconds": 30},
            {"temperature": 30, "hold_time_seconds": 90},
        ],
        repetitions=5,
        volume=123,
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
        mod.flag_unsafe_move(with_tc_labware, without_tc_labware)
    with pytest.raises(RuntimeError, match="Cannot move to labware"):
        mod.flag_unsafe_move(without_tc_labware, with_tc_labware)


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

    mod.flag_unsafe_move(to_loc=labware.wells()[1].top(), is_multichannel=False)

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
        mod.flag_unsafe_move(to_loc=labware.wells()[1].top(), is_multichannel=False)


def test_hs_flag_unsafe_move_skips_non_labware_locations(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
) -> None:
    """Test that purely point locations do not raise error."""
    mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 3)
    assert isinstance(mod, HeaterShakerContext)
    mod._geometry.flag_unsafe_move = mock.MagicMock()  # type: ignore[assignment]

    mod.flag_unsafe_move(
        to_loc=Location(point=Point(1, 2, 3), labware=None), is_multichannel=False
    )
    mod._geometry.flag_unsafe_move.assert_not_called()


def test_heater_shaker_loading(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
) -> None:
    """It should load a heater-shaker in the specified slot."""
    mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 3)
    assert ctx_with_heater_shaker.deck[3] == mod.geometry


def test_heater_shaker_set_target_temperature(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
) -> None:
    """It should issue a hw control command to set validated target temperature."""
    with mock.patch(
        "opentrons.protocol_api.module_contexts.validate_heater_shaker_temperature"
    ) as mock_validator:
        mock_validator.return_value = 10
        hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
        hs_mod.set_target_temperature(celsius=50)  # type: ignore[union-attr]
        mock_validator.assert_called_once_with(celsius=50)
        mock_module_controller.start_set_temperature.assert_called_once_with(celsius=10)


def test_heater_shaker_wait_for_temperature(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should issue a hardware control wait for temperature."""
    mock_target_temp = mock.PropertyMock(return_value=100)
    type(mock_module_controller).target_temperature = mock_target_temp

    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
    hs_mod.wait_for_temperature()  # type: ignore[union-attr]
    mock_module_controller.await_temperature.assert_called_once_with(
        awaiting_temperature=100
    )


def test_heater_shaker_wait_for_temperature_raises(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should raise an error when waiting for temperature when no target is set."""
    mock_target_temp = mock.PropertyMock(return_value=None)
    type(mock_module_controller).target_temperature = mock_target_temp

    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)

    with pytest.raises(NoTargetTemperatureSetError):
        hs_mod.wait_for_temperature()  # type: ignore[union-attr]


def test_heater_shaker_set_and_wait_for_temperature(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should issue a set and wait for the target temperature."""
    mock_target_temp = mock.PropertyMock(return_value=100)
    type(mock_module_controller).target_temperature = mock_target_temp

    with mock.patch(
        "opentrons.protocol_api.module_contexts.validate_heater_shaker_temperature"
    ) as mock_validator:
        mock_validator.return_value = 11
        hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
        hs_mod.set_and_wait_for_temperature(celsius=50)  # type: ignore[union-attr]
        mock_validator.assert_called_once_with(celsius=50)
        mock_module_controller.start_set_temperature.assert_called_once_with(celsius=11)
        mock_module_controller.await_temperature.assert_called_once_with(
            awaiting_temperature=100
        )


def test_heater_shaker_temperature_properties(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should return the correct target and current temperature values."""
    mock_current_temp = mock.PropertyMock(return_value=123.45)
    mock_target_temp = mock.PropertyMock(return_value=234.56)

    type(mock_module_controller).temperature = mock_current_temp
    type(mock_module_controller).target_temperature = mock_target_temp

    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)

    assert isinstance(hs_mod, HeaterShakerContext)
    assert hs_mod.current_temperature == 123.45
    assert hs_mod.target_temperature == 234.56


def test_heater_shaker_speed_properties(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should return the current & target speed values."""
    mock_current_speed = mock.PropertyMock(return_value=12)
    mock_target_speed = mock.PropertyMock(return_value=34)

    type(mock_module_controller).speed = mock_current_speed
    type(mock_module_controller).target_speed = mock_target_speed

    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)

    assert isinstance(hs_mod, HeaterShakerContext)
    assert hs_mod.current_speed == 12
    assert hs_mod.target_speed == 34


def test_heater_shaker_temp_and_speed_status(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should return the heater-shaker's temperature and speed status strings."""
    mock_temp_status = mock.PropertyMock(return_value=TemperatureStatus.HOLDING)
    mock_speed_status = mock.PropertyMock(return_value=SpeedStatus.DECELERATING)

    type(mock_module_controller).temperature_status = mock_temp_status
    type(mock_module_controller).speed_status = mock_speed_status
    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)

    assert isinstance(hs_mod, HeaterShakerContext)
    assert hs_mod.temperature_status == "holding at target"
    assert hs_mod.speed_status == "slowing down"


def test_heater_shaker_latch_status(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should return the heater-shaker's labware latch status string."""
    mock_latch_status = mock.PropertyMock(
        return_value=HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )
    type(mock_module_controller).labware_latch_status = mock_latch_status

    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
    assert hs_mod.labware_latch_status == "idle_closed"  # type: ignore[union-attr]


def test_heater_shaker_set_and_wait_for_shake_speed(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
    mock_pipette_location: mock.MagicMock,
    mock_hardware: mock.AsyncMock,
) -> None:
    """It should issue a blocking set target shake speed."""
    # Mock setup
    mock_latch_status = mock.PropertyMock(
        return_value=HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )
    type(mock_module_controller).labware_latch_status = mock_latch_status

    with mock.patch(
        "opentrons.protocol_api.module_contexts.validate_heater_shaker_speed"
    ) as mock_validator:
        mock_validator.return_value = 10
        hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
        assert isinstance(hs_mod, HeaterShakerContext)
        hs_mod._core.geometry.is_pipette_blocking_shake_movement = mock.MagicMock(  # type: ignore[attr-defined]
            return_value=True
        )

        # Call subject method
        hs_mod.set_and_wait_for_shake_speed(rpm=400)

        # Assert expected calls
        mock_validator.assert_called_once_with(rpm=400)
        hs_mod.geometry.is_pipette_blocking_shake_movement.assert_called_with(  # type: ignore[attr-defined]
            pipette_location=mock_pipette_location
        )
        mock_hardware.home.assert_called_once_with(axes=[Axis.Z, Axis.A])
        mock_module_controller.set_speed.assert_called_once_with(rpm=10)
        assert ctx_with_heater_shaker.location_cache is None


@pytest.mark.parametrize(
    "latch_status",
    [
        HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN,
        HeaterShakerLabwareLatchStatus.UNKNOWN,
        HeaterShakerLabwareLatchStatus.CLOSING,
        HeaterShakerLabwareLatchStatus.IDLE_OPEN,
        HeaterShakerLabwareLatchStatus.OPENING,
    ],
)
def test_heater_shaker_set_and_wait_for_shake_speed_raises(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
    latch_status: HeaterShakerLabwareLatchStatus,
) -> None:
    """It should raise an error while setting speed when labware latch not closed."""
    mock_latch_status = mock.PropertyMock(return_value=latch_status)
    type(mock_module_controller).labware_latch_status = mock_latch_status

    with pytest.raises(CannotPerformModuleAction):
        hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
        hs_mod.set_and_wait_for_shake_speed(rpm=400)  # type: ignore[union-attr]


def test_heater_shaker_open_labware_latch(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
    mock_pipette_location: mock.MagicMock,
    mock_hardware: mock.MagicMock,
) -> None:
    """It should issue a labware latch open command."""
    # Mocks
    mock_speed_status = mock.PropertyMock(return_value=SpeedStatus.IDLE)
    type(mock_module_controller).speed_status = mock_speed_status

    # Get subject
    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
    assert isinstance(hs_mod, HeaterShakerContext)
    hs_mod._core.geometry.is_pipette_blocking_latch_movement = mock.MagicMock(  # type: ignore[attr-defined]
        return_value=True
    )

    # Call subject method
    hs_mod.open_labware_latch()
    # Assert calls
    hs_mod.geometry.is_pipette_blocking_latch_movement.assert_called_with(  # type: ignore[attr-defined]
        pipette_location=mock_pipette_location
    )
    mock_hardware.home.assert_called_once_with(axes=[Axis.Z, Axis.A])
    mock_module_controller.open_labware_latch.assert_called_once()
    assert ctx_with_heater_shaker.location_cache is None


@pytest.mark.parametrize(
    "speed_status",
    [
        SpeedStatus.DECELERATING,
        SpeedStatus.ACCELERATING,
        SpeedStatus.HOLDING,
        SpeedStatus.ERROR,
    ],
)
def test_heater_shaker_open_labware_latch_raises(
    ctx_with_heater_shaker: ProtocolContext,
    mock_module_controller: mock.MagicMock,
    speed_status: SpeedStatus,
) -> None:
    """It should raise when opening latch during a shake."""
    mock_speed_status = mock.PropertyMock(return_value=speed_status)
    type(mock_module_controller).speed_status = mock_speed_status

    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
    with pytest.raises(CannotPerformModuleAction):
        hs_mod.open_labware_latch()  # type: ignore[union-attr]


def test_heater_shaker_close_labware_latch(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should issue a labware latch close command."""
    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)

    hs_mod.close_labware_latch()  # type: ignore[union-attr]
    mock_module_controller.close_labware_latch.assert_called_once()


def test_heater_shaker_deactivate_heater(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should issue a deactivate heater hw control command."""
    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
    hs_mod.deactivate_heater()  # type: ignore[union-attr]
    mock_module_controller.deactivate_heater.assert_called_once()


def test_heater_shaker_deactivate_shaker(
    ctx_with_heater_shaker: ProtocolContext, mock_module_controller: mock.MagicMock
) -> None:
    """It should issue a deactivate shaker hw control command."""
    hs_mod = ctx_with_heater_shaker.load_module("heaterShakerModuleV1", 1)
    hs_mod.deactivate_shaker()  # type: ignore[union-attr]
    mock_module_controller.deactivate_shaker.assert_called_once()


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
