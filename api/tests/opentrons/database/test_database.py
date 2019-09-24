import pytest

from opentrons.legacy_api.containers import load as containers_load
from opentrons.legacy_api.containers.placeable import Well, Container
from opentrons.data_storage import database
from opentrons.util.vector import Vector
# TODO: Modify all calls to get a Well to use the `wells` method
# TODO: Revise for new data (top-center) and add json-schema check


@pytest.mark.xfail
def test_container_from_container_load(robot):
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    actual = plate._coordinates
    expected = Vector(14.34, 11.24, 10.50)
    assert plate.get_type() == '96-flat'
    assert actual == expected


@pytest.mark.api1_only
def test_well_from_container_load(robot):
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    assert plate[3].top()[1] == Vector(3.20, 3.20, 10.50)
    assert plate[3].properties == {'depth': 10.5,
                                   'total-liquid-volume': 400,
                                   'diameter': 6.4,
                                   'height': 10.5,
                                   'width': 6.4,
                                   'length': 6.4}


@pytest.mark.xfail
def test_container_parse(robot):
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    expected = {'x': 14.34, 'y': 11.24, 'z': 10.50}
    assert database._parse_container_obj(plate) == expected


@pytest.mark.xfail
def test_load_persisted_container(robot):
    plate = database.load_container("96-flat")
    assert isinstance(plate, Container)
    assert isinstance(plate, Container)
    assert all([isinstance(w, Well) for w in plate])

    offset_x = 11.24
    offset_y = 14.34
    width = 85.48
    well_a1 = (offset_y, width - offset_x, 0)
    well_d6 = (offset_y + 45, width - (offset_x + 27), 0)
    assert plate[0].coordinates() == well_a1
    assert plate['D6'].coordinates() == well_d6


@pytest.mark.api1_only
def test_invalid_container_name(robot):
    error_type = ValueError
    with pytest.raises(error_type):
        database.load_container("fake_container")
