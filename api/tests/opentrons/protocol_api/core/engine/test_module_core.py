"""Tests for opentrons.protocol_api.core.engine.ModuleCore."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine.module_core import (
    ModuleCore,
    TemperatureModuleCore,
)
from opentrons.protocol_api.core.engine.labware import LabwareCore
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.types import APIVersion
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.state.module_substates.temperature_module_substate import (
    TemperatureModuleSubState,
    TemperatureModuleId,
)


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
        sync_module_hardware=mock_sync_module_hardware,
    )


@pytest.fixture
def temp_deck_subject(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SynchronousAdapter[AbstractModule],
) -> TemperatureModuleCore:
    """Get a mock of TemperatureModuleCore."""
    return TemperatureModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=APIVersion(2, 13),
        sync_module_hardware=mock_sync_module_hardware,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_api_version(
    decoy: Decoy, subject: ModuleCore, api_version: APIVersion
) -> None:
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


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_add_labware_core(
    decoy: Decoy, subject: ModuleCore, api_version: APIVersion
) -> None:
    """Should return a Labware object."""
    labware_core = decoy.mock(cls=LabwareCore)
    result = subject.add_labware_core(labware_core=labware_core)

    assert result.api_version == api_version


# <editor-fold desc="temp deck tests">
def test_set_target_temperature(
    decoy: Decoy,
    temp_deck_subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should verify EngineClient call to set_target_temperature."""
    temp_deck_subject.set_target_temperature(38.9)

    decoy.verify(
        mock_engine_client.temperature_set_target_temperature(
            module_id="1234", celsius=38.9
        )
    )


def test_wait_for_target_temperature(
    decoy: Decoy,
    temp_deck_subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should verify EngineClient call to wait_for_target_temperature."""
    temp_deck_subject.wait_for_target_temperature()

    decoy.verify(
        mock_engine_client.temperature_wait_for_target_temperature(
            module_id="1234", celsius=None
        )
    )


def test_deactivate(
    decoy: Decoy,
    temp_deck_subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should verify EngineClient call to deactivate temp module."""
    temp_deck_subject.deactivate()

    decoy.verify(mock_engine_client.temperature_deactivate(module_id="1234"))


def test_get_target_temperature(
    decoy: Decoy,
    temp_deck_subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should return the current temperature."""
    decoy.when(
        mock_engine_client.state.modules.get_temperature_module_substate("1234")
    ).then_return(
        TemperatureModuleSubState(
            TemperatureModuleId("1234"), plate_target_temperature=38.9
        )
    )

    result = temp_deck_subject.get_target_temperature()

    assert result == 38.9


# </editor-fold>
