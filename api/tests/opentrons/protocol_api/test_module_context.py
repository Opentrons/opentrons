import pytest
import json
import mock

from opentrons.hardware_control.modules.magdeck import OFFSET_TO_LABWARE_BOTTOM
import opentrons.protocol_api as papi
import opentrons.protocols.geometry as papi_geometry
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    ModuleType,
    TemperatureModuleModel,
    MagneticModuleModel,
    ThermocyclerModuleModel,
)
from opentrons.protocol_api import ProtocolContext
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)
from opentrons_shared_data import load_shared_data
from opentrons.types import Point, Location


@pytest.fixture
def mock_hardware() -> mock.MagicMock:
    return mock.MagicMock()


@pytest.fixture
def mock_module_controller() -> mock.MagicMock:
    return mock.MagicMock()


@pytest.fixture
def ctx_with_tempdeck(
    mock_hardware: mock.MagicMock, mock_module_controller: mock.MagicMock
) -> ProtocolContext:
    """Context fixture with a mock temp deck."""
    mock_module_controller.model.return_value = "temperatureModuleV2"

    def find_modules(resolved_model: ModuleModel, resolved_type: ModuleType):
        if (
            resolved_model == TemperatureModuleModel.TEMPERATURE_V1
            and resolved_type == ModuleType.TEMPERATURE
        ):
            return [mock_module_controller], None
        return []

    mock_hardware.find_modules.side_effect = find_modules
    return ProtocolContext(
        implementation=ProtocolContextImplementation(hardware=mock_hardware),
    )


@pytest.fixture
def ctx_with_magdeck(
    mock_hardware: mock.AsyncMock, mock_module_controller: mock.MagicMock
) -> ProtocolContext:
    """Context fixture with a mock mag deck."""
    mock_module_controller.model.return_value = "magneticModuleV1"

    def find_modules(resolved_model: ModuleModel, resolved_type: ModuleType):
        if (
            resolved_model == MagneticModuleModel.MAGNETIC_V1
            and resolved_type == ModuleType.MAGNETIC
        ):
            return [mock_module_controller], None
        return []

    mock_hardware.find_modules.side_effect = find_modules
    return ProtocolContext(
        implementation=ProtocolContextImplementation(hardware=mock_hardware),
    )


@pytest.fixture
def ctx_with_thermocycler(
    mock_hardware: mock.AsyncMock, mock_module_controller: mock.MagicMock
) -> ProtocolContext:
    """Context fixture with a mock thermocycler."""
    mock_module_controller.model.return_value = "thermocyclerModuleV1"

    def find_modules(resolved_model: ModuleModel, resolved_type: ModuleType):
        if (
            resolved_model == ThermocyclerModuleModel.THERMOCYCLER_V1
            and resolved_type == ModuleType.THERMOCYCLER
        ):
            return [mock_module_controller], None
        return []

    mock_hardware.find_modules.side_effect = find_modules
    return ProtocolContext(
        implementation=ProtocolContextImplementation(hardware=mock_hardware),
    )


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
    with pytest.raises(AssertionError):
        assert ctx_with_magdeck.load_module("magdeck")


def test_invalid_slot_module_error(ctx_with_thermocycler):
    ctx_with_thermocycler.home()
    with pytest.raises(AssertionError):
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
    ],
)
def test_load_simulating_module(ctx, loadname, klass, model):
    # Check that a known module will not throw an error if
    # in simulation mode
    ctx.home()
    mod = ctx.load_module(loadname, 7)
    assert isinstance(mod, klass)
    assert mod.geometry.model.value == model
    assert mod._module.model() == model


def test_tempdeck(ctx_with_tempdeck, mock_module_controller):
    mod = ctx_with_tempdeck.load_module("Temperature Module", 1)
    assert ctx_with_tempdeck.deck[1] == mod._geometry


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


def test_magdeck(ctx_with_magdeck, mock_module_controller):
    mod = ctx_with_magdeck.load_module("Magnetic Module", 1)
    assert ctx_with_magdeck.deck[1] == mod._geometry


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


def test_thermocycler(ctx_with_thermocycler, mock_module_controller):
    mod = ctx_with_thermocycler.load_module("thermocycler")
    assert ctx_with_thermocycler.deck[7] == mod._geometry


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
    assert mod._geometry.lid_status == "open"
    assert mod._geometry.highest_z == 98.0

    mock_module_controller.close.return_value = "closed"
    mod.close_lid()
    assert "closing thermocycler lid" in ",".join(
        cmd.lower() for cmd in ctx_with_thermocycler.commands()
    )
    mock_module_controller.close.assert_called_once()
    assert mod._geometry.lid_status == "closed"
    assert mod._geometry.highest_z == 98.0  # ignore 37.7mm lid for now


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
        == lw_offset + mod._geometry.location.point
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
    mod.load_labware.assert_called_once_with("a module", "a label", "ns", 2)


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
    mod._geometry.reset_labware()
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


def test_module_compatibility(get_module_fixture, monkeypatch):
    def load_fixtures(model):
        return get_module_fixture(model.value)

    monkeypatch.setattr(
        papi_geometry.module_geometry, "_load_v2_module_def", load_fixtures
    )

    class DummyEnum:
        def __init__(self, value: str):
            self.value = value

        def __eq__(self, other: "DummyEnum") -> bool:
            return self.value == other.value

    assert not papi_geometry.module_geometry.models_compatible(
        DummyEnum("incompatibleGenerationV1"), DummyEnum("incompatibleGenerationV2")
    )
    assert papi_geometry.module_geometry.models_compatible(
        DummyEnum("incompatibleGenerationV2"), DummyEnum("incompatibleGenerationV2")
    )
    assert papi_geometry.module_geometry.models_compatible(
        DummyEnum("compatibleGenerationV1"), DummyEnum("compatibleGenerationV1")
    )
    assert not papi_geometry.module_geometry.models_compatible(
        DummyEnum("compatibleGenerationV1"), DummyEnum("incompatibleGenerationV1")
    )


def test_thermocycler_semi_plate_configuration(ctx):
    labware_name = "nest_96_wellplate_100ul_pcr_full_skirt"
    mod = ctx.load_module("thermocycler", configuration="semi")
    assert mod._geometry.labware_offset == Point(-23.28, 82.56, 97.8)

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

    with_tc_labware = Location(None, tc_labware)
    without_tc_labware = Location(None, None)

    m = mock.PropertyMock(return_value="closed")
    type(mock_module_controller).lid_status = m

    with pytest.raises(RuntimeError, match="Cannot move to labware"):
        mod.flag_unsafe_move(with_tc_labware, without_tc_labware)
    with pytest.raises(RuntimeError, match="Cannot move to labware"):
        mod.flag_unsafe_move(without_tc_labware, with_tc_labware)
