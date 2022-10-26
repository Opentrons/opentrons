"""Test temperature module core."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import TempDeck

from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine.module_core import (
    TemperatureModuleCore,
)
from opentrons.protocol_engine.state.module_substates.temperature_module_substate import (
    TemperatureModuleSubState,
    TemperatureModuleId,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION

TempDeckHardware = SynchronousAdapter[TempDeck]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> TempDeckHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="TempDeckHardware")  # type: ignore[no-any-return]


@pytest.fixture
def temp_deck_subject(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: TempDeckHardware,
) -> TemperatureModuleCore:
    """Get a mock of TemperatureModuleCore."""
    return TemperatureModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )


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
    """Should return the target temperature."""
    decoy.when(
        mock_engine_client.state.modules.get_temperature_module_substate("1234")
    ).then_return(
        TemperatureModuleSubState(
            TemperatureModuleId("1234"), plate_target_temperature=38.9
        )
    )

    result = temp_deck_subject.get_target_temperature()

    assert result == 38.9


def test_get_status(
    decoy: Decoy,
    temp_deck_subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should get temp deck status."""
