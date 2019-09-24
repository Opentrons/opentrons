import pytest

from opentrons.legacy_api.containers import load as containers_load
from opentrons.legacy_api.containers.placeable import Container, Deck
from opentrons.legacy_api.instruments import pipette
# TODO: Modify all calls to get a Well to use the `wells` method


@pytest.mark.api1_only
def test_protocol_container_setup(robot):
    plate = containers_load(robot, '96-flat', '1', 'myPlate')
    tiprack = containers_load(robot, 'tiprack-10ul', '5')

    containers_list = robot.get_containers()
    assert len(containers_list) == 3
    assert robot._deck['1']['myPlate'] == plate
    assert robot._deck['5']['tiprack-10ul'] == tiprack

    assert plate in containers_list
    assert tiprack in containers_list


@pytest.mark.api1_only
def test_protocol_head(robot):
    trash = containers_load(robot, 'point', '1', 'myTrash')
    tiprack = containers_load(robot, 'tiprack-10ul', '5')

    p200 = pipette.Pipette(
        robot,
        name='myPipette',
        trash_container=trash,
        tip_racks=[tiprack],
        max_volume=200,
        min_volume=10,  # These are variable
        ul_per_mm=18.0,
        mount='left',
        channels=1
    )
    instruments_list = robot.get_instruments()
    assert instruments_list[0] == ('left', p200)
    instruments_list = robot.get_instruments('myPipette')
    assert instruments_list[0] == ('left', p200)


@pytest.mark.api1_only
def test_deck_setup(robot):
    deck = robot.deck

    pip = pipette.Pipette(
        robot, mount='left', max_volume=300, ul_per_mm=18.0)

    # Check that the fixed trash has loaded on to the pipette
    trash = pip.trash_container
    tiprack = containers_load(robot, 'tiprack-10ul', '5')

    assert isinstance(tiprack, Container)
    assert isinstance(deck, Deck)
    # Check that well location is the same on the robot as the pipette
    assert robot._deck['12']['opentrons_1_trash_1100ml_fixed'][0] == trash
    assert deck.has_container(tiprack)
