"""Test for the ProtocolEngine-based protocol API core."""
import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import Mount, MountType
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.clients import SyncClient as EngineClient

from opentrons.protocol_api.core.engine import ProtocolCore, InstrumentCore


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def subject(mock_engine_client: EngineClient) -> ProtocolCore:
    """Get a ProtocolCore test subject with its dependencies mocked out."""
    return ProtocolCore(engine_client=mock_engine_client)


def test_load_instrument(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: ProtocolCore,
) -> None:
    """It should issue a LoadPipette command."""
    decoy.when(
        mock_engine_client.load_pipette(
            pipette_name=PipetteName.P300_SINGLE, mount=MountType.LEFT
        )
    ).then_return(commands.LoadPipetteResult(pipetteId="cool-pipette"))

    result = subject.load_instrument(
        instrument_name=PipetteName.P300_SINGLE, mount=Mount.LEFT
    )

    assert isinstance(result, InstrumentCore)
    assert result.pipette_id == "cool-pipette"
