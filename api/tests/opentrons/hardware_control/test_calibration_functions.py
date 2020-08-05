import datetime
import numpy as np

from opentrons import config
from opentrons.calibration_storage import file_operators as io
from opentrons.hardware_control import robot_calibration


def test_save_calibration(ot_config_tempdir):
    pathway = config.get_opentrons_path(
        'robot_calibration_dir') / 'deck_calibration.json'
    pip_id = 'fakePip'
    lw_hash = 'fakeHash'
    e = [(1, 1), (2, 2), (1, 2)]
    a = [(1.1, 1.1), (2.1, 2.1), (1.1, 2.1)]
    transform = [[1.0, 0.0, 0.1], [0.0, 1.0, 0.1], [0.0, 0.0, 1.0]]
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
        'last_modified': datetime.datetime.utcnow(),
        'tiprack': 'hash'
    }
    io.save_to_file(pathway, data)
    obj = robot_calibration.load_attitude_matrix()
    transform = [
        [1, 0, 0, 1], [0, 1, 0, -.5],
        [0, 0, 1, 0], [0, 0, 0, 1]]
    assert np.allclose(obj.attitude, transform)
