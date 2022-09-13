"""Test for the ProtocolEngine-based instrument API core."""
import inspect
import pytest
from decoy import Decoy

from opentrons.types import Location, Point

from opentrons.protocol_api.labware import Well

from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine import (
    InstrumentCore,
    location_parser as mock_location_parser,
)


@pytest.fixture(autouse=True)
def _mock_location_parser_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_location_parser, inspect.isfunction):
        monkeypatch.setattr(mock_location_parser, name, decoy.mock(func=func))


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def subject(mock_engine_client: EngineClient) -> InstrumentCore:
    """Get a ProtocolCore test subject with its dependencies mocked out."""
    return InstrumentCore(pipette_id="abc", engine_client=mock_engine_client)


def test_move_to_well(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: InstrumentCore,
) -> None:
    """It should issue a MoveToWell command."""
    mock_well = decoy.mock(cls=Well)

    decoy.when(
        mock_location_parser.resolve_move_to_well_args(
            Location(point=Point(x=4, y=5, z=6), labware=mock_well)
        )
    ).then_return(
        (
            "123",
            "my-cool-well",
            WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=1, y=2, z=3)),
        )
    )

    subject.move_to(
        location=Location(point=Point(x=4, y=5, z=6), labware=mock_well),
        force_direct=False,
        minimum_z_height=None,
        speed=None,
    )

    decoy.verify(
        mock_engine_client.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="my-cool-well",
            well_location=WellLocation(
                origin=WellOrigin.BOTTOM, offset=WellOffset(x=1, y=2, z=3)
            ),
        )
    )
