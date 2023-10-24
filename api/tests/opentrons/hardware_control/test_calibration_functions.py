import importlib
from pathlib import Path

import pytest
import numpy as np

from opentrons import config, calibration_storage

from opentrons.hardware_control import robot_calibration
from opentrons.hardware_control.instruments.ot2 import instrument_calibration
from opentrons.util.helpers import utc_now
from opentrons.types import Mount, Point


def test_migrate_affine_xy_to_attitude():
    affine = [
        [1.0, 2.0, 3.0, 4.0],
        [5.0, 6.0, 7.0, 8.0],
        [9.0, 10.0, 11.0, 12.0],
        [13.0, 14.0, 15.0, 16.0],
    ]

    expected = [[1.0, 2.0, 3.0], [5.0, 6.0, 7.0], [0.0, 0.0, 1.0]]

    result = robot_calibration.migrate_affine_xy_to_attitude(affine)
    assert result == expected


def test_save_calibration(ot_config_tempdir):
    pathway = (
        config.get_opentrons_path("robot_calibration_dir") / "deck_calibration.json"
    )
    pip_id = "fakePip"
    lw_hash = "fakeHash"
    e = ((1, 1, 3), (2, 2, 2), (1, 2, 1))
    a = ((1.1, 3.1, 1.1), (2.1, 2.1, 2.2), (1.1, 2.1, 1.1))
    transform = [[0.975, 0.05, 0.0], [-1.025, 1.05, 0.0], [0.0, 0.0, 1.0]]
    expected = {
        "attitude": transform,
        "pipette_calibrated_with": pip_id,
        "last_modified": None,
        "tiprack": lw_hash,
        "source": "user",
        "status": {"markedBad": False, "markedAt": None, "source": None},
    }
    robot_calibration.save_attitude_matrix(e, a, pip_id, lw_hash)
    data = calibration_storage.file_operators.read_cal_file(pathway)
    data["last_modified"] = None
    assert data == expected


def test_load_calibration(ot_config_tempdir):
    pathway = Path(config.get_opentrons_path("robot_calibration_dir"))

    data = {
        "attitude": [[1, 0, 1], [0, 1, -0.5], [0, 0, 1]],
        "pipette_calibrated_with": "fake",
        "last_modified": utc_now(),
        "tiprack": "hash",
    }
    calibration_storage.file_operators.save_to_file(pathway, "deck_calibration", data)
    obj = robot_calibration.load_attitude_matrix()
    transform = [[1, 0, 1], [0, 1, -0.5], [0, 0, 1]]
    assert np.allclose(obj.attitude, transform)


def test_load_malformed_calibration(ot_config_tempdir):
    pathway = Path(config.get_opentrons_path("robot_calibration_dir"))
    data = {
        "atsadasitude": [[1, 0, 1], [0, 1, -0.5], [0, 0, 1]],
        "last_modified": utc_now(),
        "tiprack": "hash",
        "statu": [1, 2, 3],
    }
    calibration_storage.file_operators.save_to_file(pathway, "deck_calibration", data)
    obj = robot_calibration.load_attitude_matrix()
    assert np.allclose(obj.attitude, [[1, 0, 0], [0, 1, 0], [0, 0, 1]])


def test_load_json(ot_config_tempdir):
    path = config.get_opentrons_path("robot_calibration_dir") / "deck_calibration.json"
    path.write_text("{")
    obj = robot_calibration.load_attitude_matrix()
    assert obj.attitude == [[1, 0, 0], [0, 1, 0], [0, 0, 1]]


def test_load_pipette_offset(ot_config_tempdir):
    pip_id = "fakePip"
    mount = Mount.LEFT
    offset = Point(1, 2, 3)

    calibration_storage.ot2.save_pipette_calibration(
        offset, pip_id, mount, "hash", "opentrons/opentrons_96_tiprack_10ul/1"
    )
    obj = instrument_calibration.load_pipette_offset(pip_id, mount)

    assert np.allclose(obj.offset, offset)


def test_load_bad_pipette_offset(ot_config_tempdir):
    path = config.get_opentrons_path("pipette_calibration_dir") / "left"
    path.mkdir(parents=True, exist_ok=True)
    calpath = path / "fakePip.json"
    calpath.write_text("{")
    obj = instrument_calibration.load_pipette_offset("fakePip", Mount.LEFT)
    assert obj.offset == Point(0, 0, 0)
