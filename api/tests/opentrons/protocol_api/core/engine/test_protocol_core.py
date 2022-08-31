"""Test for the ProtocolEngine-based protocol API core."""
import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons.types import Mount, MountType
from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine import commands
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import DeckSlotLocation, DeckSlotName

from opentrons.protocol_api.core.engine import ProtocolCore, InstrumentCore, LabwareCore


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
            pipette_name=PipetteNameType.P300_SINGLE, mount=MountType.LEFT
        )
    ).then_return(commands.LoadPipetteResult(pipetteId="cool-pipette"))

    result = subject.load_instrument(
        instrument_name=PipetteNameType.P300_SINGLE, mount=Mount.LEFT
    )

    assert isinstance(result, InstrumentCore)
    assert result.pipette_id == "cool-pipette"


def test_load_labware(
    decoy: Decoy,
    minimal_labware_def: LabwareDefinition,
    mock_engine_client: EngineClient,
    subject: ProtocolCore,
) -> None:
    """It should issue a LoadLabware command."""
    decoy.when(
        mock_engine_client.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            load_name="some_labware",
            display_name="some_display_name",
            namespace="some_explicit_namespace",
            version=9001,
        )
    ).then_return(
        commands.LoadLabwareResult(
            labwareId="abc123",
            definition=LabwareDefinition.parse_obj(minimal_labware_def),
            offsetId=None,
        )
    )

    result = subject.load_labware(
        load_name="some_labware",
        location="5",
        label="some_display_name",  # maps to optional display name
        namespace="some_explicit_namespace",
        version=9001,
    )

    assert isinstance(result, LabwareCore)
    assert result.labware_id == "abc123"
