"""Test for the ProtocolEngine-based well API core."""
import pytest
from decoy import Decoy

from opentrons_shared_data.labware.labware_definition import WellDefinition

from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_api.core.engine import WellCore


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def api_version() -> APIVersion:
    """Get an API version to apply to the interface."""
    return MAX_SUPPORTED_VERSION


def test_name(mock_engine_client: EngineClient) -> None:
    """It should have a name and labware ID."""
    subject = WellCore(
        name="Gene", labware_id="Wilder", engine_client=mock_engine_client
    )

    assert subject.get_name() == "Gene"
    assert subject.labware_id == "Wilder"


def test_max_volume(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should have a max volume."""
    decoy.when(
        mock_engine_client.state.labware.get_well_definition(
            labware_id="labware-id", well_name="well-name"
        )
    ).then_return(
        WellDefinition.construct(totalLiquidVolume=101)  # type: ignore[call-arg]
    )

    subject = WellCore(
        name="well-name", labware_id="labware-id", engine_client=mock_engine_client
    )

    assert subject.get_max_volume() == 101
