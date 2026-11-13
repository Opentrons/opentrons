from dataclasses import dataclass

import pytest
from decoy import Decoy

from opentrons.protocol_api.core.common import LabwareCore, ProtocolCore, WellCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap
from opentrons.protocol_api.labware import Labware
from opentrons.protocols.api_support.definitions import MIN_SUPPORTED_VERSION
from opentrons.types import DeckSlotName, Location, MeniscusTrackingTarget, Point


def test_point_from_xyz_attrs() -> None:
    class Original:
        def __init__(self) -> None:
            self.x = 1
            self.y = 2
            self.z = 3

    point = Point.from_xyz_attrs(Original())
    assert point == Point(1, 2, 3)


def test_point_mul() -> None:
    a = Point(1, 2, 3)
    b: float = 2
    assert a * b == Point(2, 4, 6)

    b = 3.1
    assert a * b == Point(3.1, 6.2, 9.3)

    with pytest.raises(TypeError):
        a * a  # type: ignore[operator]


def test_point_rmul() -> None:
    a = Point(1, 2, 3)
    b: float = 2
    assert b * a == Point(2, 4, 6)

    b = 3.1
    assert b * a == Point(3.1, 6.2, 9.3)


@dataclass
class MockedLW:
    labware: Labware
    labware_core: LabwareCore
    well_core: WellCore
    protocol_core: ProtocolCore
    core_map: LoadedCoreMap


@pytest.fixture
def independent_lw(decoy: Decoy) -> MockedLW:
    pc = decoy.mock(cls=ProtocolCore)
    lc = decoy.mock(cls=LabwareCore)
    wc = decoy.mock(cls=WellCore)
    cm = LoadedCoreMap()
    decoy.when(lc.get_well_columns()).then_return([["A1"]])
    decoy.when(lc.get_well_core("A1")).then_return(wc)
    decoy.when(lc.get_display_name()).then_return("minimal labware on deck")
    decoy.when(wc.get_display_name()).then_return("minimal well etc")
    l = Labware(
        core=lc, api_version=MIN_SUPPORTED_VERSION, protocol_core=pc, core_map=cm
    )
    cm.add(lc, l)
    return MockedLW(
        labware=l, labware_core=lc, well_core=wc, protocol_core=pc, core_map=cm
    )


def test_location_repr_labware(independent_lw: MockedLW) -> None:
    """It should represent labware as Labware"""
    loc = Location(point=Point(x=1.1, y=2.1, z=3.5), labware=independent_lw.labware)
    assert (
        f"{loc}"
        == "Location(point=Point(x=1.1, y=2.1, z=3.5), labware=minimal labware on deck, meniscus_tracking=None)"
    )


def test_location_repr_well(independent_lw: MockedLW) -> None:
    """It should represent labware as Well"""
    loc = Location(
        point=Point(x=1, y=2, z=3), labware=independent_lw.labware.wells()[0]
    )
    assert (
        f"{loc}"
        == "Location(point=Point(x=1, y=2, z=3), labware=minimal well etc, meniscus_tracking=None)"
    )


def test_location_repr_slot() -> None:
    """It should represent labware as a slot"""
    loc = Location(point=Point(x=-1, y=2, z=3), labware="1")
    assert (
        f"{loc}"
        == "Location(point=Point(x=-1, y=2, z=3), labware=1, meniscus_tracking=None)"
    )


@pytest.mark.parametrize(
    ("input", "expected_ot2_equivalent", "expected_ot3_equivalent"),
    [
        # Middle slot:
        (DeckSlotName.SLOT_5, DeckSlotName.SLOT_5, DeckSlotName.SLOT_C2),
        (DeckSlotName.SLOT_C2, DeckSlotName.SLOT_5, DeckSlotName.SLOT_C2),
        # Northwest corner:
        (DeckSlotName.SLOT_10, DeckSlotName.SLOT_10, DeckSlotName.SLOT_A1),
        (DeckSlotName.SLOT_A1, DeckSlotName.SLOT_10, DeckSlotName.SLOT_A1),
        # Northeast corner:
        (DeckSlotName.FIXED_TRASH, DeckSlotName.FIXED_TRASH, DeckSlotName.SLOT_A3),
        (DeckSlotName.SLOT_A3, DeckSlotName.FIXED_TRASH, DeckSlotName.SLOT_A3),
    ],
)
def test_deck_slot_name_equivalencies(
    input: DeckSlotName,
    expected_ot2_equivalent: DeckSlotName,
    expected_ot3_equivalent: DeckSlotName,
) -> None:
    assert (
        input.to_ot2_equivalent()
        == input.to_equivalent_for_robot_type("OT-2 Standard")
        == expected_ot2_equivalent
    )
    assert (
        input.to_ot3_equivalent()
        == input.to_equivalent_for_robot_type("OT-3 Standard")
        == expected_ot3_equivalent
    )


@pytest.mark.parametrize(
    ("input", "expected_int"),
    [
        (DeckSlotName.SLOT_5, 5),
        (DeckSlotName.SLOT_C2, 5),
    ],
)
def test_deck_slot_name_as_int(input: DeckSlotName, expected_int: int) -> None:
    assert input.as_int() == expected_int


def test_location_move_preseves_meniscus() -> None:
    """Location.move() should preserve meniscus relativeness."""
    loc = Location(
        point=Point(x=1, y=2, z=3),
        labware=None,
        _meniscus_tracking=MeniscusTrackingTarget.START,
    )
    moved = loc.move(Point(x=1, y=2, z=3))
    assert moved == Location(
        point=Point(x=2, y=4, z=6),
        labware=None,
        _meniscus_tracking=MeniscusTrackingTarget.START,
    )
