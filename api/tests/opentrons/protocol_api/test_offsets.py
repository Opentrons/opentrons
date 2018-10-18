# pylama:ignore=W0612
import tempfile
import os
import json
import time
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

labware.persistent_path = tempfile.mkdtemp("offsets")
path = os.path.join(
    labware.persistent_path, "{}.json".format(minimalLabwareDef["otId"]))


def test_save_calibration(monkeypatch):
    # Test the save calibration file
    assert not os.path.exists(path)
    calibration_point = None

    def mock_set_calibration(self, delta):
        nonlocal calibration_point
        calibration_point = delta

    monkeypatch.setattr(
        labware.Labware,
        'set_calibration', mock_set_calibration)

    test_labware = labware.Labware(minimalLabwareDef, Point(0, 0, 0))

    labware.save_calibration(test_labware, Point(1, 1, 1))
    assert os.path.exists(path)
    assert calibration_point == Point(1, 1, 1)


def test_schema_shape(monkeypatch):
    assert os.path.exists(path)

    def fake_time():
        return 1
    monkeypatch.setattr(time, 'time', fake_time)

    test_labware = labware.Labware(minimalLabwareDef, Point(0, 0, 0))

    labware.save_calibration(test_labware, Point(1, 1, 1))
    expected = {"default": {"offset": [1, 1, 1], "lastModified": 1}}
    with open(path) as f:
        result = json.load(f)
    assert result == expected


def test_load_calibration(monkeypatch):

    calibration_point = None

    def mock_set_calibration(self, delta):
        nonlocal calibration_point
        calibration_point = delta

    monkeypatch.setattr(
        labware.Labware,
        'set_calibration', mock_set_calibration)

    test_labware = labware.Labware(minimalLabwareDef, Point(0, 0, 0))

    labware.save_calibration(test_labware, Point(1, 1, 1))

    # Set without saving to show that load will update with previously saved
    # data
    test_labware.set_calibration(Point(0, 0, 0))

    labware.load_calibration(test_labware)
    assert calibration_point == Point(1, 1, 1)


def test_wells_rebuilt_with_offset():
    test_labware = labware.Labware(minimalLabwareDef, Point(0, 0, 0))
    old_wells = test_labware._wells
    assert test_labware._offset == Point(10, 10, 5)
    assert test_labware._calibrated_offset == Point(10, 10, 5)
    labware.save_calibration(test_labware, Point(2, 2, 2))
    new_wells = test_labware._wells
    assert old_wells[0] != new_wells[0]
    assert test_labware._offset == Point(10, 10, 5)
    assert test_labware._calibrated_offset == Point(12, 12, 7)


def test_clear_calibrations():
    with open(os.path.join(
            labware.persistent_path, '1.json'), 'w') as offset_file:
        test_offset = {
            "default": {
                "offset": [1, 2, 3],
                "lastModified": 1
            },
            "tipLength": 1.2
        }
        json.dump(test_offset, offset_file)

    assert len(os.listdir(labware.persistent_path)) > 0
    labware.clear_calibrations()
    assert len(os.listdir(labware.persistent_path)) == 0
