# pylama:ignore=W0612
import json
import os
import time

import pytest
import datetime
from opentrons.protocol_api import labware
from opentrons.types import Point, Location

MOCK_HASH = 'mock_hash'
PIPETTE_ID = 'pipette_id'

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
    return labware.OFFSETS_PATH \
        / '{}.json'.format(calibration_name)


def tlc_path(pip_id):
    return labware.TIP_LENGTH_CALIBRATION_PATH \
        / '{}.json'.format(pip_id)


def mock_hash_labware(labware_def):
    return MOCK_HASH


@pytest.fixture
def clear_calibration(monkeypatch):
    try:
        os.remove(path({MOCK_HASH}))
    except FileNotFoundError:
        pass
    yield
    try:
        os.remove(path(MOCK_HASH))
    except FileNotFoundError:
        pass


@pytest.fixture
def clear_tlc_calibration(monkeypatch):
    try:
        os.remove(tlc_path(PIPETTE_ID))
    except FileNotFoundError:
        pass
    yield
    try:
        os.remove(tlc_path('index'))
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


def test_json_datetime_encoder():
    fake_time = datetime.datetime.utcnow()
    original = {'mock_hash': {'tipLength': 25.0, 'lastModified': fake_time}}

    encoded = json.dumps(original, cls=labware.DateTimeEncoder)
    decoded = json.loads(encoded, cls=labware.DateTimeDecoder)
    assert decoded == original


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


def test_create_tip_length_calibration_data(monkeypatch):

    fake_time = datetime.datetime.utcnow()

    class fake_datetime:
        @classmethod
        def utcnow(cls):
            return fake_time

    monkeypatch.setattr(datetime, 'datetime', fake_datetime)

    monkeypatch.setattr(
        labware,
        '_hash_labware_def', mock_hash_labware)

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))
    tip_length = 22.0
    expected_data = {
        MOCK_HASH: {
            'tipLength': tip_length,
            'lastModified': fake_time
        }
    }
    result = labware.create_tip_length_data(test_labware, tip_length)
    assert result == expected_data


def test_save_tip_length_calibration_data(monkeypatch, clear_tlc_calibration):
    assert not os.path.exists(tlc_path(PIPETTE_ID))

    test_data = {
        MOCK_HASH: {
            'tipLength': 22.0,
            'lastModified': 1
        }
    }
    labware.save_tip_length_calibration(PIPETTE_ID, test_data)
    assert os.path.exists(tlc_path(PIPETTE_ID))
    # test an index file is also created
    assert os.path.exists(tlc_path('index'))


def test_add_index_file(monkeypatch, clear_tlc_calibration):

    def get_result():
        with open(tlc_path('index')) as f:
            result = json.load(f)
        return result

    labware._append_to_index_tip_length_file('pip_1', 'lw_1')
    assert get_result() == {'lw_1': ['pip_1']}

    labware._append_to_index_tip_length_file('pip_2', 'lw_1')
    assert get_result() == {'lw_1': ['pip_1', 'pip_2']}

    labware._append_to_index_tip_length_file('pip_2', 'lw_2')
    assert get_result() == {'lw_1': ['pip_1', 'pip_2'], 'lw_2': ['pip_2']}


def test_load_tip_length_calibration_data(monkeypatch, clear_tlc_calibration):
    assert not os.path.exists(tlc_path(PIPETTE_ID))

    monkeypatch.setattr(
        labware,
        '_hash_labware_def', mock_hash_labware)

    test_labware = labware.Labware(minimalLabwareDef,
                                   Location(Point(0, 0, 0), 'deck'))
    tip_length = 22.0
    test_data = labware.create_tip_length_data(test_labware, tip_length)
    labware.save_tip_length_calibration(PIPETTE_ID, test_data)
    result = labware.load_tip_length_calibration(PIPETTE_ID, test_labware)

    assert result == test_data[MOCK_HASH]


def test_clear_tip_length_calibration_data(monkeypatch):
    calpath = labware.TIP_LENGTH_CALIBRATION_PATH
    with open(calpath/f'{PIPETTE_ID}.json', 'w') as offset_file:
        test_offset = {
            MOCK_HASH: {
                'tip_length': 22.0,
                'lastModified': 1
            }
        }
        json.dump(test_offset, offset_file)

    assert len(os.listdir(calpath)) > 0
    labware.clear_tip_length_calibration()
    assert len(os.listdir(calpath)) == 0


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
    calpath = labware.OFFSETS_PATH
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
