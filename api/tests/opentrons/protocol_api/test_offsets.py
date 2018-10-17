import tempfile
import pytest
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

tmpdir = tempfile.mkdtemp("offsets")
labware.persistentPath = tmpdir
testLabware = labware.Labware(minimalLabwareDef, Point(0, 0, 0))
path = os.path.join(labware.persistentPath, "{}.json".format(testLabware._id))
global testPoint


@pytest.fixture
def patch_calibration(monkeypatch):
    def fake_set_calibration(delta: Point):
        global testPoint
        testPoint = delta
    monkeypatch.setattr(testLabware, 'set_calibration', fake_set_calibration)


def test_save_calibration(patch_calibration):
    # Test the save calibration file
    assert not os.path.exists(path)
    labware.save_calibration(testLabware, Point(1, 1, 1))
    assert os.path.exists(path)
    global testPoint
    testPoint == Point(1, 1, 1)


def test_schema_shape(patch_calibration, monkeypatch):
    assert os.path.exists(path)

    def fake_time():
        return 1
    monkeypatch.setattr(time, 'time', fake_time)
    labware.save_calibration(testLabware, Point(1, 1, 1))
    expected = {"default": {"offset": [1, 1, 1], "lastModified": 1}}
    with open(path) as f:
        result = json.load(f)
    assert result == expected


def test_load_calibration(patch_calibration):
    labware.load_calibration(testLabware)
    global testPoint
    testPoint == Point(1, 1, 1)


def test_wells_rebuilt_with_offset():
    old_wells = testLabware._wells
    assert testLabware._offset == Point(10, 10, 5)
    assert testLabware._calibrated_offset == Point(10, 10, 5)
    labware.save_calibration(testLabware, Point(2, 2, 2))
    new_wells = testLabware._wells
    assert old_wells[0] != new_wells[0]
    assert testLabware._offset == Point(10, 10, 5)
    assert testLabware._calibrated_offset == Point(12, 12, 7)
