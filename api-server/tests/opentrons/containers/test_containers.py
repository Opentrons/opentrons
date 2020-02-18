import math
from unittest import mock

import pytest

import opentrons.protocol_api.labware as new_labware

from opentrons.legacy_api.containers import (
    load as containers_load,
    list as containers_list,
    load_new_labware as new_load
)
from opentrons.legacy_api.containers.placeable import (
    Container,
    Well,
    Deck,
    Slot,
    unpack_location)
from tests.opentrons import generate_plate
# TODO: Modify all calls to get a Well to use the `wells` method
# TODO: remove `unpack_location` calls
# TODO: revise `share` logic
# TODO: remove `generate_plate` and use JS generated data
# TODO: Modify calls that expect Deck and Slot to be Placeables


def test_load_same_slot_force(robot):
    container_name = '96-flat'
    slot = '1'
    containers_load(robot, container_name, slot)
    # 2018-1-30 Incremented number of containers based on fixed trash
    assert len(robot.get_containers()) == 2

    with pytest.raises(RuntimeWarning):
        containers_load(robot, container_name, slot)
    with pytest.raises(RuntimeWarning):
        containers_load(robot, container_name, slot)
    with pytest.raises(RuntimeWarning):
        containers_load(robot, container_name, slot)
    with pytest.raises(RuntimeWarning):
        containers_load(robot, container_name, slot)
    with pytest.raises(RuntimeWarning):
        containers_load(robot, container_name, slot)

    containers_load(
        robot, container_name, slot, 'custom-name', share=True)
    assert len(robot.get_containers()) == 3

    containers_load(
        robot, 'trough-12row', slot, share=True)
    assert len(robot.get_containers()) == 4


def test_load_legacy_slot_names(robot):
    slots_old = [
        'A1', 'B1', 'C1',
        'A2', 'B2', 'C2',
        'A3', 'B3', 'C3',
        'A4', 'B4', 'C4'
    ]
    slots_new = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '10', '11', '12'
    ]
    import warnings
    warnings.filterwarnings('ignore')

    # Only check up to the non fixed-trash slots
    def test_slot_name(slot_name, expected_name):
        robot.reset()
        p = containers_load(robot, '96-flat', slot_name)
        slot_name = p.get_parent().get_name()
        assert slot_name == expected_name

    for i in range(len(slots_old) - 1):
        test_slot_name(slots_new[i], slots_new[i])
        test_slot_name(int(slots_new[i]), slots_new[i])
        test_slot_name(slots_old[i], slots_new[i])

    warnings.filterwarnings('default')


def test_new_slot_names():
    trough = 'usascientific_12_reservoir_22ml'
    plate = 'corning_96_wellplate_360ul_flat'
    tuberack = 'opentrons_6_tuberack_falcon_50ml_conical'

    cont = new_load(trough)
    assert isinstance(cont, Container)
    cont = new_load(plate)
    assert isinstance(cont, Container)
    cont = new_load(tuberack)
    assert isinstance(cont, Container)


def test_load_new_trough():
    trough = 'usascientific_12_reservoir_22ml'
    cont = new_load(trough)
    assert cont.size() == (0, 0, 0)
    assert cont.wells('A1')._coordinates \
        == (13.94, 42.9 + 31.4475, 2.29)


def test_new_container_versioning(
        get_labware_fixture, monkeypatch, labware):
    fixt = get_labware_fixture('fixture_12_trough_v2')
    get_def_mock = mock.Mock()
    get_def_mock.return_value = fixt
    monkeypatch.setattr(
        new_labware, 'get_labware_definition', get_def_mock)
    loaded = labware.load('fixture_12_trough_v2', 2, version=2)
    assert loaded.get_name() == fixt['parameters']['loadName']


def test_load_fixed_trash(robot):
    assert robot.fixed_trash[0]._coordinates == (
        82.84, 80, 82)


def test_containers_list():
    res = containers_list()
    assert res


def test_bad_unpack_containers():
    with pytest.raises(ValueError):
        unpack_location(1)


def test_iterate_without_parent():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    with pytest.raises(Exception):
        next(c)


def test_back_container_getitem():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    with pytest.raises(TypeError):
        c.__getitem__((1, 1))


def test_iterator():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    res = [well.coordinates() for well in c]
    expected = [(0, 0, 0), (5, 0, 0), (0, 5, 0), (5, 5, 0)]
    assert res == expected


def test_next():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)
    well = c['A1']
    expected = c.get_child_by_name('B1')

    assert next(well) == expected


def test_int_index():
    c = generate_plate(4, 2, (5, 5), (0, 0), 5)

    assert c[3] == c.get_child_by_name('B2')
    assert c[1] == c.get_child_by_name('B1')


def test_named_well():
    deck = Deck()
    slot = Slot()
    c = Container()
    deck.add(slot, 'A1', (0, 0, 0))
    red = Well(properties={'radius': 5})
    blue = Well(properties={'radius': 5})
    c.add(red, "Red", (0, 0, 0))
    c.add(blue, "Blue", (10, 0, 0))
    slot.add(c)

    assert deck['A1'][0]['Red'] == red


def test_generate_plate():
    c = generate_plate(
        wells=96,
        cols=8,
        spacing=(10, 15),
        offset=(5, 15),
        radius=5
    )

    assert c['A1'].coordinates() == (5, 15, 0)
    assert c['B2'].coordinates() == (15, 30, 0)


def test_coordinates():
    deck = Deck()
    slot = Slot()
    plate = generate_plate(
        wells=96,
        cols=8,
        spacing=(10, 15),
        offset=(5, 15),
        radius=5
    )
    deck.add(slot, 'B2', (100, 200, 0))
    slot.add(plate)

    assert plate['A1'].coordinates(deck) == (105, 215, 0)


def test_get_name():
    deck = Deck()
    slot = Slot()
    c = Container()
    deck.add(slot, 'A1', (0, 0, 0))
    red = Well(properties={'radius': 5})
    blue = Well(properties={'radius': 5})
    c.add(red, "Red", (0, 0, 0))
    c.add(blue, "Blue", (10, 0, 0))
    slot.add(c)

    assert red.get_name() == 'Red'


def test_well_from_center():
    deck = Deck()
    slot = Slot()
    plate = generate_plate(
        wells=4,
        cols=2,
        spacing=(10, 10),
        offset=(0, 0),
        radius=5
    )
    deck.add(slot, 'A1', (0, 0, 0))
    slot.add(plate)

    assert plate['B2'].center() == (5, 5, 0)
    assert plate['B2'].from_center(x=0.0, y=0.0, z=0.0) == (5, 5, 0)
    assert plate['B2'].from_center(r=1.0, theta=math.pi / 2, h=0.0)\
        == (5.0, 10.0, 0.0)
