import numpy as np

from opentrons import config
from opentrons.calibration_storage import file_operators as io
from opentrons.hardware_control import robot_calibration
from opentrons.util.helpers import utc_now


def test_migrate_affine_xy_to_attitude():
    affine = [[1.0, 2.0, 3.0, 4.0],
              [5.0, 6.0, 7.0, 8.0],
              [9.0, 10.0, 11.0, 12.0],
              [13.0, 14.0, 15.0, 16.0]]

    expected = [[1.0, 2.0, 3.0],
                [5.0, 6.0, 7.0],
                [0.0, 0.0, 1.0]]

    result = robot_calibration.migrate_affine_xy_to_attitude(affine)
    assert result == expected


def test_save_calibration(ot_config_tempdir):
    pathway = config.get_opentrons_path(
        'robot_calibration_dir') / 'deck_calibration.json'
    pip_id = 'fakePip'
    lw_hash = 'fakeHash'
    e = ((1, 1, 3), (2, 2, 2), (1, 2, 1))
    a = ((1.1, 3.1, 1.1), (2.1, 2.1, 2.2), (1.1, 2.1, 1.1))
    transform = [[0.975, 0.05, 0.0], [-1.025, 1.05, 0.0], [0.0, 0.0, 1.0]]
    expected = {
        'attitude': transform,
        'pipette_calibrated_with': pip_id,
        'last_modified': None,
        'tiprack': lw_hash
    }
    robot_calibration.save_attitude_matrix(e, a, pip_id, lw_hash)
    data = io.read_cal_file(pathway)
    data['last_modified'] = None
    assert data == expected


def test_load_calibration(ot_config_tempdir):
    pathway = config.get_opentrons_path(
        'robot_calibration_dir') / 'deck_calibration.json'
    data = {
        'attitude': [[1, 0, 1], [0, 1, -.5], [0, 0, 1]],
        'pipette_calibrated_with': 'fake',
        'last_modified': utc_now(),
        'tiprack': 'hash'
    }
    io.save_to_file(pathway, data)
    obj = robot_calibration.load_attitude_matrix()
    transform = [[1, 0, 1], [0, 1, -.5], [0, 0, 1]]
    assert np.allclose(obj.attitude, transform)
