"""Tests for opentrons.protocol_api.core.engine.ModuleCore."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from decoy import Decoy
from typing import Type, Union

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import (
    AbstractModule,
    HeaterShaker,
    MagDeck,
    TempDeck,
    Thermocycler,
)
from opentrons.protocol_engine import DeckSlotLocation
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import ModuleModel, ModuleDefinition
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api.core.engine.module_core import (
    ModuleCore,
    create_module_core,
    ThermocyclerModuleCore,
    MagneticBlockCore,
    MagneticModuleCore,
    TemperatureModuleCore,
    HeaterShakerModuleCore,
)
from opentrons.types import DeckSlotName


@pytest.fixture
def api_version() -> APIVersion:
    """Get mocked api_version."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SynchronousAdapter[AbstractModule]:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SynchronousAdapter[AbstractModule]")  # type: ignore[no-any-return]


@pytest.fixture
def mock_hw_thermocycler(decoy: Decoy) -> Thermocycler:
    """Mock hw Thermocycler."""
    return decoy.mock(cls=Thermocycler)


@pytest.fixture
def mock_hw_mag_deck(decoy: Decoy) -> MagDeck:
    """Mock hw MagDeck."""
    return decoy.mock(cls=MagDeck)


@pytest.fixture
def mock_hw_temp_deck(decoy: Decoy) -> TempDeck:
    """Mock hw TempDeck."""
    return decoy.mock(cls=TempDeck)


@pytest.fixture
def mock_hw_heater_shaker(decoy: Decoy) -> HeaterShaker:
    """Mock hw HeaterShaker."""
    return decoy.mock(cls=HeaterShaker)


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    api_version: APIVersion,
    mock_sync_module_hardware: SynchronousAdapter[AbstractModule],
) -> ModuleCore:
    """Get a ModuleCore test subject."""
    return ModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=api_version,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_api_version(subject: ModuleCore, api_version: APIVersion) -> None:
    """Should return the api_version property."""
    assert subject.api_version == api_version


def test_get_deck_slot(
    decoy: Decoy, subject: ModuleCore, mock_engine_client: EngineClient
) -> None:
    """Should return the deck slot associated to the module id."""
    decoy.when(mock_engine_client.state.modules.get_location("1234")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )

    assert subject.get_deck_slot() == DeckSlotName.SLOT_1


def test_get_model(
    decoy: Decoy, subject: ModuleCore, mock_engine_client: EngineClient
) -> None:
    """It should return the module model."""
    decoy.when(
        mock_engine_client.state.modules.get_connected_model("1234")
    ).then_return(ModuleModel.HEATER_SHAKER_MODULE_V1)

    result = subject.get_model()

    assert result == "heaterShakerModuleV1"


def test_get_serial_number(
    decoy: Decoy, subject: ModuleCore, mock_engine_client: EngineClient
) -> None:
    """It should return a serial number."""
    decoy.when(mock_engine_client.state.modules.get_serial_number("1234")).then_return(
        "abc"
    )

    assert subject.get_serial_number() == "abc"


def test_get_display_name(
    decoy: Decoy, subject: ModuleCore, mock_engine_client: EngineClient
) -> None:
    """It should return the module display name."""
    module_definition = ModuleDefinition.construct(  # type: ignore[call-arg]
        displayName="abra kadabra",
    )
    decoy.when(mock_engine_client.state.modules.get_definition("1234")).then_return(
        module_definition
    )

    assert subject.get_display_name() == "abra kadabra"


@pytest.mark.parametrize(
    "hw_module, expected_module_core",
    [
        (lazy_fixture("mock_hw_thermocycler"), ThermocyclerModuleCore),
        (lazy_fixture("mock_hw_mag_deck"), MagneticModuleCore),
        (lazy_fixture("mock_hw_temp_deck"), TemperatureModuleCore),
        (lazy_fixture("mock_hw_heater_shaker"), HeaterShakerModuleCore),
        (None, MagneticBlockCore),
    ],
)
def test_create_module_core(
    api_version: APIVersion,
    mock_engine_client: EngineClient,
    hw_module: Union[HeaterShaker, MagDeck, TempDeck, Thermocycler, None],
    expected_module_core: Type[ModuleCore],
) -> None:
    """It should get the proper module_core."""
    result = create_module_core(
        module_id="123",
        engine_client=mock_engine_client,
        api_version=api_version,
        sync_module_hardware=hw_module,
    )
    assert isinstance(result, expected_module_core)
