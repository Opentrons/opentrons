"""Test for the ProtocolEngine-based instrument API core."""
import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.protocol_engine import (
    DeckPoint,
    LoadedPipette,
    WellLocation,
    WellOffset,
    WellOrigin,
)
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine import InstrumentCore, WellCore
from opentrons.types import Location, Point


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


def test_move_to_well(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    well_core = WellCore(
        name="well-name",
        labware_id="labware-id",
        engine_client=mock_engine_client,
    )

    decoy.when(
        mock_engine_client.state.geometry.get_relative_well_location(
            labware_id="labware-id",
            well_name="well-name",
            absolute_point=Point(1, 2, 3),
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)))

    subject.move_to(
        location=location,
        well_core=well_core,
        force_direct=False,
        minimum_z_height=None,
        speed=None,
    )

    decoy.verify(
        mock_engine_client.move_to_well(
            pipette_id="abc123",
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
        ),
        times=1,
    )


def test_move_to_coordinates(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    subject.move_to(
        location=location,
        well_core=None,
        force_direct=True,
        minimum_z_height=42.0,
        speed=None,
    )

    decoy.verify(
        mock_engine_client.move_to_coordinates(
            pipette_id="abc123",
            coordinates=DeckPoint(x=1, y=2, z=3),
            minimum_z_height=42.0,
            force_direct=True,
        ),
        times=1,
    )
