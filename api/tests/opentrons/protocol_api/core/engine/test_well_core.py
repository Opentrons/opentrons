"""Test for the ProtocolEngine-based well API core."""
import pytest
from decoy import Decoy

from opentrons_shared_data.labware.labware_definition import WellDefinition

from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import APIVersionError
from opentrons.types import Point

from opentrons.protocol_api.core.engine import WellCore


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def api_version() -> APIVersion:
    """Get an API version to apply to the interface."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def well_definition() -> WellDefinition:
    """Get a partial WellDefinition value object."""
    return WellDefinition.construct()  # type: ignore[call-arg]


@pytest.fixture
def subject(
    decoy: Decoy, mock_engine_client: EngineClient, well_definition: WellDefinition
) -> WellCore:
    """Get a WellCore test subject with mocked dependencies."""
    decoy.when(
        mock_engine_client.state.labware.get_well_definition(
            labware_id="labware-id", well_name="well-name"
        )
    ).then_return(well_definition)

    return WellCore(
        name="well-name",
        labware_id="labware-id",
        engine_client=mock_engine_client,
    )


def test_name(subject: WellCore) -> None:
    """It should have a name and labware ID."""
    assert subject.get_name() == "well-name"
    assert subject.labware_id == "labware-id"


def test_display_name(
    decoy: Decoy, mock_engine_client: EngineClient, subject: WellCore
) -> None:
    """It should have a display name."""
    decoy.when(
        mock_engine_client.state.labware.get_display_name("labware-id")
    ).then_return("Cool Labware")

    assert subject.get_display_name() == "well-name of Cool Labware"


@pytest.mark.parametrize(
    "well_definition",
    [WellDefinition.construct(totalLiquidVolume=101)],  # type: ignore[call-arg]
)
def test_max_volume(subject: WellCore) -> None:
    """It should have a max volume."""
    assert subject.get_max_volume() == 101


def test_get_top(
    decoy: Decoy, mock_engine_client: EngineClient, subject: WellCore
) -> None:
    """It should get a well top."""
    decoy.when(
        mock_engine_client.state.geometry.get_well_position(
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=42)
            ),
        )
    ).then_return(Point(1, 2, 3))

    assert subject.get_top(z_offset=42.0) == Point(1, 2, 3)


def test_get_bottom(
    decoy: Decoy, mock_engine_client: EngineClient, subject: WellCore
) -> None:
    """It should get a well bottom."""
    decoy.when(
        mock_engine_client.state.geometry.get_well_position(
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=42)
            ),
        )
    ).then_return(Point(1, 2, 3))

    assert subject.get_bottom(z_offset=42.0) == Point(1, 2, 3)


def test_get_center(
    decoy: Decoy, mock_engine_client: EngineClient, subject: WellCore
) -> None:
    """It should get a well center."""
    decoy.when(
        mock_engine_client.state.geometry.get_well_height(
            labware_id="labware-id", well_name="well-name"
        )
    ).then_return(42.0)

    decoy.when(
        mock_engine_client.state.geometry.get_well_position(
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=21)
            ),
        )
    ).then_return(Point(1, 2, 3))

    assert subject.get_center() == Point(1, 2, 3)


def test_has_tip(
    decoy: Decoy, mock_engine_client: EngineClient, subject: WellCore
) -> None:
    """It should get whether a clean tip is present."""
    decoy.when(
        mock_engine_client.state.tips.has_clean_tip(
            labware_id="labware-id", well_name="well-name"
        )
    ).then_return(True)

    assert subject.has_tip() is True


def test_set_has_tip(subject: WellCore) -> None:
    """Trying to set the has tip state should raise an error."""
    with pytest.raises(APIVersionError):
        subject.set_has_tip(True)
