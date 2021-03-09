import pytest
from decoy import Decoy
from opentrons.protocol_engine import StateView
from opentrons.protocol_engine.state import LabwareData
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocols.geometry.labware_geometry import LabwareGeometry

from opentrons.protocols.implementations.engine.labware_context import \
    LabwareContext
from opentrons.types import Point, DeckSlotName, Location
from opentrons_shared_data.labware.dev_types import LabwareDefinition


@pytest.fixture
def decoy() -> Decoy:
    """Create a decoy fixture."""
    return Decoy()


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Mock state view."""
    return decoy.create_decoy(spec=StateView)


@pytest.fixture
def labware_id() -> str:
    """The labware id fixture."""
    return "labware id"


@pytest.fixture
def labware_data(minimal_labware_def: LabwareDefinition) -> LabwareData:
    """LabwareData fixture."""
    return LabwareData(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
        calibration=(1.2, 3.2, 3.1,),
        definition=minimal_labware_def
    )


@pytest.fixture
def parent() -> Location:
    """Parent location fixture."""
    return Location(Point(x=1, y=5, z=20), "4")


@pytest.fixture
def labware_context(labware_id: str,
                    mock_state_view: StateView,
                    parent: Location) -> LabwareContext:
    """LabwareContext fixture"""
    return LabwareContext(
        labware_id=labware_id,
        state_view=mock_state_view,
        parent=parent
    )


def test_get_uri(
        decoy: Decoy, labware_id: str, mock_state_view: StateView,
        labware_context: LabwareContext) -> None:
    """Should return the labware uri."""
    decoy.when(
        mock_state_view.labware.get_definition_uri(labware_id=labware_id)
    ).then_return("some uri")

    assert labware_context.get_uri() == "some uri"


def test_get_display_name(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext, labware_data: LabwareData
) -> None:
    """Should return the labware's display name."""
    decoy.when(
        mock_state_view.labware.get_labware_data_by_id(labware_id=labware_id)
    ).then_return(labware_data)

    assert labware_context.get_display_name() == "minimal labware on 3"


def test_get_name(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext
) -> None:
    """Should return the labware's name."""
    decoy.when(
        mock_state_view.labware.get_load_name(labware_id=labware_id)
    ).then_return("some name")

    assert labware_context.get_name() == "some name"


def test_set_name(labware_context: LabwareContext) -> None:
    """Should not be implemented."""
    with pytest.raises(NotImplementedError):
        name = "some_name"
        labware_context.set_name(name)


def test_get_definition(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext, labware_data: LabwareData,
        minimal_labware_def: LabwareDefinition
) -> None:
    """Should return the labware's definition."""
    decoy.when(
        mock_state_view.labware.get_labware_data_by_id(labware_id=labware_id)
    ).then_return(labware_data)

    assert labware_context.get_definition() == minimal_labware_def


def test_get_parameters(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext, labware_data: LabwareData,
        minimal_labware_def: LabwareDefinition
) -> None:
    """Should return the labware definition's parameters"""
    decoy.when(
        mock_state_view.labware.get_labware_data_by_id(labware_id=labware_id)
    ).then_return(labware_data)

    assert labware_context.get_parameters() == minimal_labware_def['parameters']


def test_get_quirks(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext
) -> None:
    """Should return the labware quirks."""
    decoy.when(
        mock_state_view.labware.get_quirks(labware_id=labware_id)
    ).then_return(['a', 'b'])

    assert labware_context.get_quirks() == ['a', 'b']


def test_set_calibration(labware_context: LabwareContext) -> None:
    """Should not be implemented."""
    with pytest.raises(NotImplementedError):
        point = Point(1, 2, 3)
        labware_context.set_calibration(point)


def test_get_calibrated_offset(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext
) -> None:
    """Should return the calibrated offset."""
    decoy.when(
        mock_state_view.geometry.get_labware_position(labware_id=labware_id)
    ).then_return(Point(x=1, y=2, z=3))

    assert labware_context.get_calibrated_offset() == Point(x=1, y=2, z=3)


def test_is_tiprack(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext, labware_data: LabwareData,
        minimal_labware_def: LabwareDefinition
) -> None:
    """Should return whether labware is a tiprack"""
    decoy.when(
        mock_state_view.labware.is_tiprack(labware_id=labware_id)
    ).then_return(True)

    assert labware_context.is_tiprack() is True


def test_get_tip_length(
        decoy: Decoy, labware_id: str, mock_state_view:
        StateView, labware_context: LabwareContext, labware_data: LabwareData,
) -> None:
    """Should return the tip length."""
    decoy.when(
        mock_state_view.labware.get_tip_length(labware_id=labware_id)
    ).then_return(22)

    assert labware_context.get_tip_length() == 22


def test_set_tip_length(labware_context: LabwareContext):
    """Should not be implemented."""
    with pytest.raises(NotImplementedError):
        length = 1.2
        labware_context.set_tip_length(length)


def test_reset_tips(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.reset_tips()


def test_get_wells(
        decoy: Decoy, labware_id: str, mock_state_view: StateView,
        labware_context: LabwareContext, labware_data: LabwareData) -> None:
    """Should return the well list."""
    decoy.when(
        mock_state_view.labware.get_labware_data_by_id(labware_id=labware_id)
    ).then_return(labware_data)

    decoy.when(
        mock_state_view.geometry.get_labware_position(labware_id=labware_id)
    ).then_return(Point(x=1, y=2, z=3))

    assert [str(s) for s in labware_context.get_wells()] == \
           ["A1 of minimal labware on 3", "A2 of minimal labware on 3"]


def test_get_wells_by_name(
        decoy: Decoy, labware_id: str, mock_state_view: StateView,
        labware_context: LabwareContext, labware_data: LabwareData) -> None:
    """Should return a mapping of well name to well."""
    decoy.when(
        mock_state_view.labware.get_labware_data_by_id(labware_id=labware_id)
    ).then_return(labware_data)

    decoy.when(
        mock_state_view.geometry.get_labware_position(labware_id=labware_id)
    ).then_return(Point(x=1, y=2, z=3))

    assert {
        name: str(well) for (name, well) in labware_context.get_wells_by_name().items()
           } == {
        "A1": "A1 of minimal labware on 3", "A2": "A2 of minimal labware on 3"
    }


def test_get_geometry(
        decoy: Decoy, labware_id: str, mock_state_view: StateView,
        labware_context: LabwareContext, labware_data: LabwareData) -> None:
    """Should return a geometry object."""
    decoy.when(
        mock_state_view.labware.get_labware_data_by_id(labware_id=labware_id)
    ).then_return(labware_data)

    assert isinstance(labware_context.get_geometry(), LabwareGeometry)


def test_highest_z(
        decoy: Decoy, labware_id: str, mock_state_view: StateView,
        labware_context: LabwareContext) -> None:
    """Should return the highest z."""
    decoy.when(
        mock_state_view.geometry.get_labware_highest_z(labware_id=labware_id)
    ).then_return(312.0)

    assert 312.0 == labware_context.highest_z


def test_separate_calibration(labware_context: LabwareContext) -> None:
    """Should return false."""
    assert labware_context.separate_calibration is False


def test_load_name(
        decoy: Decoy, labware_id: str, mock_state_view: StateView,
        labware_context: LabwareContext
) -> None:
    """Should return the load name."""
    decoy.when(
        mock_state_view.labware.get_load_name(labware_id=labware_id)
    ).then_return("load name")

    assert labware_context.load_name == "load name"


def test_build_wells(
        decoy: Decoy, labware_id: str, mock_state_view: StateView,
        labware_context: LabwareContext, labware_data: LabwareData) -> None:
    """Should return an ordered list of wells."""
    decoy.when(
        mock_state_view.labware.get_labware_data_by_id(labware_id=labware_id)
    ).then_return(labware_data)

    decoy.when(
        mock_state_view.geometry.get_labware_position(labware_id=labware_id)
    ).then_return(Point(x=1, y=2, z=3))

    assert [str(w) for w in labware_context._build_wells()] == \
           ["A1 of minimal labware on 3", "A2 of minimal labware on 3"]
