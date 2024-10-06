import pytest
from decoy import Decoy
from typing import Union, Optional

from opentrons.types import (
    DeckLocation,
    Mount,
    Point,
    Location,
    DeckSlotName,
    AxisType,
    StringAxisMap,
    AxisMapType,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api.core.common import ProtocolCore, RobotCore
from opentrons.protocol_api import RobotContext, ModuleContext, MAX_SUPPORTED_VERSION
from opentrons.protocol_api.deck import Deck


@pytest.fixture
def mock_core(decoy: Decoy) -> RobotCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=RobotCore)


@pytest.fixture
def api_version() -> APIVersion:
    """Get the API version to test at."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def mock_deck(decoy: Decoy) -> Deck:
    deck = decoy.mock(cls=Deck)
    decoy.when(deck.get_slot_center(DeckSlotName.SLOT_D1)).then_return(Point(3, 3, 3))
    return deck


@pytest.fixture
def mock_protocol(decoy: Decoy, mock_deck: Deck, mock_core: RobotCore) -> ProtocolCore:
    """Get a mock protocol implementation core without a 96 channel attached."""
    protocol_core = decoy.mock(cls=ProtocolCore)
    decoy.when(protocol_core.robot_type).then_return("OT-3 Standard")
    decoy.when(protocol_core.load_robot()).then_return(mock_core)
    decoy.when(protocol_core._deck).then_return(mock_deck)
    return protocol_core


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_core: RobotCore,
    mock_protocol: ProtocolCore,
    api_version: APIVersion,
) -> RobotContext:
    """Get a RobotContext test subject with its dependencies mocked out."""
    decoy.when(mock_core.get_pipette_type_from_engine(Mount.LEFT)).then_return(None)
    return RobotContext(
        core=mock_core, api_version=api_version, protocol_core=mock_protocol
    )


@pytest.mark.parametrize(
    argnames=["mount", "destination", "speed"],
    argvalues=[
        ("left", Location(point=Point(1, 2, 3), labware=None), None),
        (Mount.RIGHT, Location(point=Point(1, 2, 3), labware=None), 100),
    ],
)
def test_move_to(
    decoy: Decoy,
    subject: RobotContext,
    mount: Union[str, Mount],
    destination: Location,
    speed: Optional[float],
) -> None:
    subject.move_to(mount, destination, speed)
    if mount == "left":
        mount = Mount.LEFT
    decoy.verify(subject._core.move_to(mount, destination, speed))


@pytest.mark.parametrize(
    argnames=[
        "axis_map",
        "critical_point",
        "expected_axis_map",
        "expected_critical_point",
        "speed",
    ],
    argvalues=[
        (
            {"x": 100, "Y": 50, "z_g": 80},
            {"x": 5, "Y": 5, "z_g": 5},
            {AxisType.X: 100, AxisType.Y: 50, AxisType.Z_G: 80},
            {AxisType.X: 5, AxisType.Y: 5, AxisType.Z_G: 5},
            None,
        ),
        (
            {"x": 5, "Y": 5},
            {"x": 5, "Y": 5},
            {AxisType.X: 5, AxisType.Y: 5},
            {AxisType.X: 5, AxisType.Y: 5},
            None,
        ),
    ],
)
def test_move_axes_to(
    decoy: Decoy,
    subject: RobotContext,
    axis_map: Union[StringAxisMap, AxisMapType],
    critical_point: Union[StringAxisMap, AxisMapType],
    expected_axis_map: AxisMapType,
    expected_critical_point: AxisMapType,
    speed: Optional[float],
) -> None:
    subject.move_axes_to(axis_map, critical_point, speed)
    decoy.verify(
        subject._core.move_axes_to(expected_axis_map, expected_critical_point, speed)
    )


@pytest.mark.parametrize(
    argnames=["axis_map", "converted_map", "speed"],
    argvalues=[
        (
            {"x": 10, "Y": 10, "z_g": 10},
            {AxisType.X: 10, AxisType.Y: 10, AxisType.Z_G: 10},
            None,
        ),
        ({AxisType.P_L: 10}, {AxisType.P_L: 10}, 5),
    ],
)
def test_move_axes_relative(
    decoy: Decoy,
    subject: RobotContext,
    axis_map: Union[StringAxisMap, AxisMapType],
    converted_map: AxisMapType,
    speed: Optional[float],
) -> None:
    subject.move_axes_relative(axis_map, speed)
    decoy.verify(subject._core.move_axes_relative(converted_map, speed))


@pytest.mark.parametrize(
    argnames=["mount", "location_to_move", "expected_axis_map"],
    argvalues=[
        (
            "left",
            Location(point=Point(1, 2, 3), labware=None),
            {AxisType.Z_L: 3, AxisType.X: 1, AxisType.Y: 2},
        ),
        (Mount.RIGHT, "D1", {AxisType.Z_R: 3, AxisType.X: 3, AxisType.Y: 3}),
        (
            Mount.EXTENSION,
            Location(point=Point(1, 2, 3), labware=None),
            {AxisType.Z_G: 3, AxisType.X: 1, AxisType.Y: 2},
        ),
    ],
)
def test_get_axes_coordinates_for(
    subject: RobotContext,
    mount: Union[Mount, str],
    location_to_move: Union[Location, ModuleContext, DeckLocation],
    expected_axis_map: AxisMapType,
) -> None:
    res = subject.axis_coordinates_for(mount, location_to_move)
    assert res == expected_axis_map
