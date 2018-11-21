# pylama:ignore=W0612
import tempfile
import os
import json
import time
from opentrons.protocol_api import labware
from opentrons.types import Point, Location
import pytest

minimalLabwareDef = {
    "metadata": {
        "displayName": "minimal labware"
    },
    "cornerOffsetFromSlot": {
        "x": 10,
        "y": 10,
        "z": 5
    },
    "otId": "minimalLabwareDef",
    "parameters": {
        "isTiprack": True,
        "tipLength": 55.3
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
    },
    "dimensions": {
        "overallLength": 1.0,
        "overallWidth": 2.0,
        "overallHeight": 3.0
    }
}

labware.persistent_path = tempfile.mkdtemp("offsets")
path = os.path.join(
    labware.persistent_path, "{}.json".format(minimalLabwareDef["otId"]))


@pytest.fixture
def clear_calibration(monkeypatch):
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
    yield
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def test_save_calibration(monkeypatch, clear_calibration):
    # Test the save calibration file
    assert not os.path.exists(path)
    calibration_point = None

    def mock_set_calibration(self, delta):
        nonlocal calibration_point
        calibration_point = delta

    monkeypatch.setattr(
        labware.Labware,
        'set_calibration', mock_set_calibration)

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))

    labware.save_calibration(test_labware, Point(1, 1, 1))
    assert os.path.exists(path)
    assert calibration_point == Point(1, 1, 1)


def test_save_tip_length(monkeypatch, clear_calibration):
    assert not os.path.exists(path)

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))
    calibrated_length = 22.0
    labware.save_tip_length(test_labware, calibrated_length)
    assert os.path.exists(path)
    with open(path) as calibration_file:
        data = json.load(calibration_file)
        assert data['tipLength']['length'] == calibrated_length


def test_schema_shape(monkeypatch, clear_calibration):
    def fake_time():
        return 1
    monkeypatch.setattr(time, 'time', fake_time)

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))

    labware.save_calibration(test_labware, Point(1, 1, 1))
    expected = {"default": {"offset": [1, 1, 1], "lastModified": 1}}
    with open(path) as f:
        result = json.load(f)
    assert result == expected


def test_load_calibration(monkeypatch, clear_calibration):

    calibration_point = None

    def mock_set_calibration(self, delta):
        nonlocal calibration_point
        calibration_point = delta

    monkeypatch.setattr(
        labware.Labware,
        'set_calibration', mock_set_calibration)

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))

    test_offset = Point(1, 1, 1)
    test_tip_length = 34.5

    labware.save_calibration(test_labware, test_offset)
    labware.save_tip_length(test_labware, test_tip_length)

    # Set without saving to show that load will update with previously saved
    # data
    test_labware.set_calibration(Point(0, 0, 0))
    test_labware.tip_length = 46.8

    labware.load_calibration(test_labware)
    assert calibration_point == test_offset
    assert test_labware.tip_length == test_tip_length


def test_wells_rebuilt_with_offset():
    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))
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
