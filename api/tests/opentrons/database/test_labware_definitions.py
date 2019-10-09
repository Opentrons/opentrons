# TODO: Modify all calls to get a Well to use the `wells` method
# TODO: Test `labware.create` against new schemas
# TODO: Modify calibration file shape to fit new design
import os

import pytest

from opentrons.data_storage import database

file_dir = os.path.abspath(os.path.dirname(__file__))


@pytest.mark.api1_only
def test_labware_create():
    from opentrons import labware
    lw_name = '15-well-plate'
    if lw_name in labware.list():
        database.delete_container(lw_name)
    n_cols = 5
    n_rows = 3
    col_space = 12
    row_space = 18
    diameter = 5
    height = 20
    volume = 3.14 * (diameter / 2.0)**2
    res = labware.create(
        lw_name,
        (n_cols, n_rows),
        (col_space, row_space),
        diameter,
        height,
        volume)
    lw = database.load_container(lw_name)
    database.delete_container(lw_name)

    assert len(lw.wells()) is n_cols * n_rows
    for well in lw.wells():
        name = well.get_name()
        assert res[name].coordinates() == well.coordinates()
        for prop in ['height', 'diameter']:
            assert res[name].properties[prop] == well.properties[prop]
    assert lw.well("B5").coordinates() == (
        (n_cols - 1) * col_space, row_space, 0)
    assert lw.well("C3").coordinates() == (
        2 * col_space, 0, 0)

    assert lw.well(2).get_name() == 'C1'
