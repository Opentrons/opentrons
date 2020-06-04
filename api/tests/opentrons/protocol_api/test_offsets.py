# pylama:ignore=W0612
import json
import os
import time

import pytest
from unittest.mock import patch
from opentrons.protocol_api import labware
from opentrons.types import Point, Location
from opentrons import config

MOCK_HASH = 'mock_hash'

minimalLabwareDef = {
    "metadata": {
        "displayName": "minimal labware"
    },
    "cornerOffsetFromSlot": {
        "x": 10,
        "y": 10,
        "z": 5
    },
    "parameters": {
        "isTiprack": True,
        "tipLength": 55.3,
        "tipOverlap": 2.8,
        "loadName": "minimal_labware_def"
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
        "xDimension": 1.0,
        "yDimension": 2.0,
        "zDimension": 3.0
    },
    "namespace": "opentrons",
    "version": 1
}


def path(calibration_name):
    return config.CONFIG['labware_calibration_offsets_dir_v2']\
        / '{}.json'.format(calibration_name)


def tlc_path(calibration_name):
    return config.CONFIG['tip_length_calibration_dir']\
        / '{}.json'.format(calibration_name)


def mock_hash_labware(labware_def):
    return MOCK_HASH


@pytest.fixture
def clear_calibration(monkeypatch):
    try:
        os.remove(path(MOCK_HASH))
    except FileNotFoundError:
        pass
    yield
    try:
        os.remove(path(MOCK_HASH))
    except FileNotFoundError:
        pass


def test_save_calibration(monkeypatch, clear_calibration):
    # Test the save calibration file
    assert not os.path.exists(path(MOCK_HASH))
    calibration_point = None

    def mock_set_calibration(self, delta):
        nonlocal calibration_point
        calibration_point = delta

    monkeypatch.setattr(
        labware.Labware,
        'set_calibration', mock_set_calibration)

    monkeypatch.setattr(
        labware,
        '_hash_labware_def', mock_hash_labware
    )

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))

    labware.save_calibration(test_labware, Point(1, 1, 1))
    assert os.path.exists(path(MOCK_HASH))
    assert calibration_point == Point(1, 1, 1)


def test_save_tip_length(monkeypatch, clear_calibration):
    assert not os.path.exists(path(MOCK_HASH))

    monkeypatch.setattr(
        labware,
        '_hash_labware_def', mock_hash_labware
    )

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))
    calibrated_length = 22.0
    labware.save_tip_length(test_labware, calibrated_length)
    assert os.path.exists(path(MOCK_HASH))
    with open(path(MOCK_HASH)) as calibration_file:
        data = json.load(calibration_file)
        assert data['tipLength']['length'] == calibrated_length


def test_tip_length_calibration(monkeypatch, clear_calibration):
    with patch("os.environ",
               new={
                   "OT_API_FF_enableTipLengthCalibration": "TRUE"
               }):

        assert not os.path.exists(tlc_path(MOCK_HASH))

        monkeypatch.setattr(
            labware,
            '_hash_labware_def', mock_hash_labware
        )

        test_labware = labware.Labware(minimalLabwareDef,
                                       Location(Point(0, 0, 0), 'deck'))

        # add new tip length data for test_labware
        tip_length_1 = 22.0
        pipette_id = 'PIPETTE_ID_1'
        labware.save_tip_length_calibration(test_labware, tip_length_1,
                                            pipette_id)
        assert os.path.exists(tlc_path(MOCK_HASH))
        with open(tlc_path(MOCK_HASH)) as tip_length_calibration_file:
            data = json.load(tip_length_calibration_file)
            assert len(data) == 1
            assert data[pipette_id]['tipLength'] == tip_length_1
            time_1 = data[pipette_id]['lastModified']

        # update tip length data for same labware: same pipette
        tip_length_2 = 25.0
        labware.save_tip_length_calibration(test_labware, tip_length_2,
                                            pipette_id)
        with open(tlc_path(MOCK_HASH)) as tip_length_calibration_file:
            data = json.load(tip_length_calibration_file)
            assert len(data) == 1
            assert data[pipette_id]['tipLength'] == tip_length_2
            assert data[pipette_id]['lastModified'] > time_1

        # update tip length data for same labware: different pipette
        tip_length_3 = 24.0
        pipette_id_2 = 'PIPETTE_ID_2'
        labware.save_tip_length_calibration(test_labware, tip_length_3,
                                            pipette_id_2)
        with open(tlc_path(MOCK_HASH)) as tip_length_calibration_file:
            data = json.load(tip_length_calibration_file)
            assert len(data) == 2
            assert data[pipette_id_2]['tipLength'] == tip_length_3
            # make sure it did not overwrite previous data

        # clear tip_length calibration
        labware.clear_tip_length_calibration()
        assert not os.path.exists(tlc_path(MOCK_HASH))


def test_schema_shape(monkeypatch, clear_calibration):
    def fake_time():
        return 1
    monkeypatch.setattr(time, 'time', fake_time)

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))

    monkeypatch.setattr(
       labware,
       '_hash_labware_def', mock_hash_labware
    )

    labware.save_calibration(test_labware, Point(1, 1, 1))
    expected = {"default": {"offset": [1, 1, 1], "lastModified": 1}}
    with open(path(MOCK_HASH)) as f:
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

    monkeypatch.setattr(
        labware,
        '_hash_labware_def', mock_hash_labware
    )

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))

    test_offset = Point(1, 1, 1)
    test_tip_length = 31.7

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
    calpath = config.CONFIG['labware_calibration_offsets_dir_v2']
    with open(calpath/'1.json', 'w') as offset_file:
        test_offset = {
            "default": {
                "offset": [1, 2, 3],
                "lastModified": 1
            },
            "tipLength": 1.2
        }
        json.dump(test_offset, offset_file)

    assert len(os.listdir(calpath)) > 0
    labware.clear_calibrations()
    assert len(os.listdir(calpath)) == 0


def test_hash_labware_def():
    def1a = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.00003, 1/3]}
    def1aa = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.00003, 1/3]}
    def1b = {"metadata": {"a": "blah"}, "importantStuff": [1.1, 0.00003, 1/3]}
    def2 = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.000033, 1/3]}

    # identity preserved across json serialization+deserialization
    assert labware._hash_labware_def(def1a) == \
        labware._hash_labware_def(
            json.loads(json.dumps(def1a, separators=(',', ':'))))
    # 2 instances of same def should match
    assert labware._hash_labware_def(def1a) == \
        labware._hash_labware_def(def1aa)
    # metadata ignored
    assert labware._hash_labware_def(def1a) == labware._hash_labware_def(def1b)
    # different data should not match
    assert labware._hash_labware_def(def1a) != labware._hash_labware_def(def2)
