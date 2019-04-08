from math import pi
from opentrons.legacy_api.containers.placeable import Deck, Slot

from tests.opentrons import generate_plate
# TODO: Revise to use new Labware and Well classes
# TODO: Add tests on well accessor methods in Labware


def test_well_from_center():
    deck = Deck()
    slot = Slot()
    plate = generate_plate(
        wells=4,
        cols=2,
        spacing=(10, 10),
        offset=(0, 0),
        radius=5,
        height=20
    )
    deck.add(slot, 'A1', (0, 0, 0))
    slot.add(plate)

    assert plate['B2'].center() == (5, 5, 10)
    assert plate['B2'].from_center(x=0.0, y=0.0, z=2.0) == (5, 5, 30)
    assert plate['B2'].from_center(r=1.0, theta=pi / 2, h=5.0) == (5, 10, 60)
    assert plate['B2'].top()[1] == (5, 5, 20)
    assert plate['B2'].bottom()[1] == (5, 5, 0)
