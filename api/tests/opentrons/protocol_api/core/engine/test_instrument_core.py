"""Test for the ProtocolEngine-based instrument API core."""
import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.protocol_engine import LoadedPipette
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine import InstrumentCore


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def subject(mock_engine_client: EngineClient) -> InstrumentCore:
    """Get a InstrumentCore test subject with its dependencies mocked out."""
    return InstrumentCore(pipette_id="abc123", engine_client=mock_engine_client)


def test_pipette_id(subject: InstrumentCore) -> None:
    """It should have a ProtocolEngine ID."""
    assert subject.pipette_id == "abc123"


def test_get_pipette_name(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should get the pipette's load name."""
    decoy.when(mock_engine_client.state.pipettes.get("abc123")).then_return(
        LoadedPipette.construct(pipetteName=PipetteNameType.P300_SINGLE)  # type: ignore[call-arg]
    )

    result = subject.get_pipette_name()

    assert result == "p300_single"
