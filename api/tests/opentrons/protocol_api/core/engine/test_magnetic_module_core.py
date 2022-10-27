"""Test magnetic module core."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import MagDeck

from opentrons.protocol_engine.clients import SyncClient as EngineClient

from opentrons.protocol_api.core.engine.module_core import MagneticModuleCore
from opentrons.protocol_api import MAX_SUPPORTED_VERSION

MagDeckHardware = SynchronousAdapter[MagDeck]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> MagDeck:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="MagDeck")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: MagDeck,
) -> MagneticModuleCore:
    """Get a mock of MagneticModuleCore."""
    return MagneticModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_engage(decoy: Decoy, subject: MagneticModuleCore, mock_engine_client: EngineClient) -> None:
    """Should verify a call to sync client engage method."""
    subject.engage(height_from_base=7.0)

    decoy.verify(mock_engine_client.magnetic_module_engage(module_id="1234", engage_height=7.0))