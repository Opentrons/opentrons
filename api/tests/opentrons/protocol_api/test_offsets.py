# pylama:ignore=W0612
import tempfile
import os
import json
import time
from functools import partial
from opentrons.protocol_api import labware
from opentrons.types import Point

minimalLabwareDef = {
    "cornerOffsetFromSlot": {
        "x": 10,
        "y": 10,
        "z": 5
    },
    "otId": "minimalLabwareDef",
    "parameters": {
        "isTiprack": False,
    },
    "ordering": [["A1"], ["A2"]],
    "wells": {
        "A1": {
          "depth": 40,
          "totalLiquidVolume": 100,
          "diameter": 30,
          "x": 0,
          "y": 0,
          "z": 0,
          "shape": "circular"
        },
        "A2": {
          "depth": 40,
          "totalLiquidVolume": 100,
          "diameter": 30,
          "x": 10,
          "y": 0,
          "z": 0,
          "shape": "circular"
        }
    }
}

tmpdir = tempfile.mkdtemp("offsets")
labware.persistent_path = tmpdir
testLabware = labware.Labware(minimalLabwareDef, Point(0, 0, 0))
path = os.path.join(labware.persistent_path, "{}.json".format(testLabware._id))


def mock_set_calibration(test_point, delta):
    test_point = delta


def test_save_calibration(monkeypatch):
    # Test the save calibration file
    assert not os.path.exists(path)
    calibration_point = None
    monkeypatch.setattr(
        testLabware,
        'set_calibration', partial(mock_set_calibration, calibration_point))
    labware.save_calibration(testLabware, Point(1, 1, 1))
    assert os.path.exists(path)
    calibration_point == Point(1, 1, 1)


def test_schema_shape(monkeypatch):
    assert os.path.exists(path)

    def fake_time():
        return 1
    monkeypatch.setattr(time, 'time', fake_time)
    calibration_point = None
    monkeypatch.setattr(
        testLabware,
        'set_calibration', partial(mock_set_calibration, calibration_point))
    labware.save_calibration(testLabware, Point(1, 1, 1))
    expected = {"default": {"offset": [1, 1, 1], "lastModified": 1}}
    with open(path) as f:
        result = json.load(f)
    assert result == expected


def test_load_calibration(monkeypatch):
    labware.load_calibration(testLabware)
    calibration_point = None
    monkeypatch.setattr(
        testLabware,
        'set_calibration', partial(mock_set_calibration, calibration_point))
    labware.save_calibration(testLabware, Point(1, 1, 1))
    calibration_point == Point(1, 1, 1)


def test_wells_rebuilt_with_offset():
    testLabware2 = labware.Labware(minimalLabwareDef, Point(0, 0, 0))
    old_wells = testLabware._wells
    assert testLabware2._offset == Point(10, 10, 5)
    assert testLabware2._calibrated_offset == Point(10, 10, 5)
    labware.save_calibration(testLabware2, Point(2, 2, 2))
    new_wells = testLabware2._wells
    assert old_wells[0] != new_wells[0]
    assert testLabware2._offset == Point(10, 10, 5)
    assert testLabware2._calibrated_offset == Point(12, 12, 7)
