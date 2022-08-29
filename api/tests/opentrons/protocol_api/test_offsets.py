import json
import os

import pytest

from opentrons import config
from opentrons_shared_data.pipette.dev_types import LabwareUri
from opentrons.calibration_storage import (
    modify,
    get,
    helpers,
    delete,
    encoder_decoder as ed,
    types as cs_types,
)
from opentrons.protocol_api import labware
from opentrons.protocol_api.core.protocol_api.labware import LabwareImplementation
from opentrons.types import Point, Location
from opentrons.util.helpers import utc_now

MOCK_HASH = "mock_hash"
PIPETTE_ID = "pipette_id"
URI = "custom/minimal_labware_def/1"

minimalLabwareDef = {
    "metadata": {"displayName": "minimal labware"},
    "cornerOffsetFromSlot": {"x": 10, "y": 10, "z": 5},
    "parameters": {
        "isTiprack": True,
        "tipLength": 55.3,
        "tipOverlap": 2.8,
        "loadName": "minimal_labware_def",
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
            "shape": "circular",
        },
        "A2": {
            "depth": 40,
            "totalLiquidVolume": 100,
            "diameter": 30,
            "x": 10,
            "y": 0,
            "z": 0,
            "shape": "circular",
        },
    },
    "dimensions": {"xDimension": 1.0, "yDimension": 2.0, "zDimension": 3.0},
    "namespace": "custom",
    "version": 1,
}


def tlc_path(pip_id):
    return config.get_tip_length_cal_path() / "{}.json".format(pip_id)


def custom_tiprack_path(uri):
    return config.get_custom_tiprack_def_path() / "{}.json".format(uri)


def mock_hash_labware(labware_def):
    return MOCK_HASH


@pytest.fixture
def clear_custom_tiprack_dir():
    try:
        os.remove(custom_tiprack_path(URI))
    except FileNotFoundError:
        pass
    yield
    try:
        os.remove(custom_tiprack_path(URI))
    except FileNotFoundError:
        pass


@pytest.fixture
def clear_tlc_calibration():
    try:
        os.remove(tlc_path(PIPETTE_ID))
    except FileNotFoundError:
        pass
    yield
    try:
        os.remove(tlc_path("index"))
    except FileNotFoundError:
        pass


def test_json_datetime_encoder():
    fake_time = utc_now()
    original = {"mock_hash": {"tipLength": 25.0, "lastModified": fake_time}}

    encoded = json.dumps(original, cls=ed.DateTimeEncoder)
    decoded = json.loads(encoded, cls=ed.DateTimeDecoder)
    assert decoded == original


def test_create_tip_length_calibration_data(monkeypatch, clear_custom_tiprack_dir):

    fake_time = utc_now()

    monkeypatch.setattr(modify, "utc_now", lambda: fake_time)

    monkeypatch.setattr(helpers, "hash_labware_def", mock_hash_labware)

    tip_length = 22.0
    expected_data = {
        MOCK_HASH: {
            "tipLength": tip_length,
            "lastModified": fake_time,
            "source": cs_types.SourceType.user,
            "status": {"markedBad": False},
            "uri": URI,
        }
    }
    assert not os.path.exists(custom_tiprack_path(URI))
    result = modify.create_tip_length_data(minimalLabwareDef, tip_length)  # type: ignore[arg-type]
    assert result == expected_data
    assert os.path.exists(custom_tiprack_path(URI))


def test_save_tip_length_calibration_data(monkeypatch, clear_tlc_calibration):
    assert not os.path.exists(tlc_path(PIPETTE_ID))

    test_data = {MOCK_HASH: {"tipLength": 22.0, "lastModified": 1}}
    modify.save_tip_length_calibration(PIPETTE_ID, test_data)  # type: ignore[arg-type]
    assert os.path.exists(tlc_path(PIPETTE_ID))
    # test an index file is also created
    assert os.path.exists(tlc_path("index"))


def test_add_index_file(monkeypatch, clear_tlc_calibration):
    def get_result():
        with open(tlc_path("index")) as f:
            result = json.load(f)
        return result

    modify._append_to_index_tip_length_file("pip_1", "lw_1")
    assert get_result() == {"lw_1": ["pip_1"]}

    modify._append_to_index_tip_length_file("pip_2", "lw_1")
    assert get_result() == {"lw_1": ["pip_1", "pip_2"]}

    modify._append_to_index_tip_length_file("pip_2", "lw_2")
    assert get_result() == {"lw_1": ["pip_1", "pip_2"], "lw_2": ["pip_2"]}


def test_load_nonexistent_tip_length_calibration_data(
    monkeypatch, clear_tlc_calibration
):
    assert not os.path.exists(tlc_path(PIPETTE_ID))

    # file does not exist (FileNotFoundError)
    with pytest.raises(cs_types.TipLengthCalNotFound):
        get.load_tip_length_calibration(PIPETTE_ID, minimalLabwareDef)  # type: ignore[arg-type]

    # labware hash not in calibration file (KeyError)
    calpath = config.get_tip_length_cal_path()
    with open(calpath / f"{PIPETTE_ID}.json", "w") as offset_file:
        test_offset = {"FAKE_HASH": {"tipLength": 22.0, "lastModified": 1}}
        json.dump(test_offset, offset_file)
    with pytest.raises(cs_types.TipLengthCalNotFound):
        get.load_tip_length_calibration(PIPETTE_ID, minimalLabwareDef)  # type: ignore[arg-type]


def test_load_tip_length_calibration_data(monkeypatch, clear_tlc_calibration):
    assert not os.path.exists(tlc_path(PIPETTE_ID))

    monkeypatch.setattr(helpers, "hash_labware_def", mock_hash_labware)

    tip_length = 22.0
    test_data = modify.create_tip_length_data(minimalLabwareDef, tip_length)  # type: ignore[arg-type]
    modify.save_tip_length_calibration(PIPETTE_ID, test_data)
    result = get.load_tip_length_calibration(PIPETTE_ID, minimalLabwareDef)  # type: ignore[arg-type]
    expected = cs_types.TipLengthCalibration(
        tip_length=tip_length,
        pipette=PIPETTE_ID,
        source=cs_types.SourceType.user,
        status=cs_types.CalibrationStatus(markedBad=False),
        tiprack=MOCK_HASH,
        uri=LabwareUri("custom/minimal_labware_def/1"),
        last_modified=test_data[MOCK_HASH]["lastModified"],
    )
    assert result == expected


def test_clear_tip_length_calibration_data(monkeypatch):
    calpath = config.get_tip_length_cal_path()
    with open(calpath / f"{PIPETTE_ID}.json", "w") as offset_file:
        test_offset = {MOCK_HASH: {"tipLength": 22.0, "lastModified": 1}}
        json.dump(test_offset, offset_file)

    assert len([f for f in os.listdir(calpath) if f.endswith(".json")]) > 0
    delete.clear_tip_length_calibration()
    assert len([f for f in os.listdir(calpath) if f.endswith(".json")]) == 0


def test_wells_rebuilt_with_offset():
    test_labware = labware.Labware(
        implementation=LabwareImplementation(
            minimalLabwareDef, Location(Point(0, 0, 0), "deck")  # type: ignore[arg-type]
        )
    )
    old_wells = test_labware.wells()
    assert test_labware._implementation.get_geometry().offset == Point(10, 10, 5)
    assert test_labware._implementation.get_calibrated_offset() == Point(10, 10, 5)
    test_labware.set_offset(x=2, y=2, z=2)
    new_wells = test_labware.wells()
    assert old_wells[0] != new_wells[0]
    assert test_labware._implementation.get_geometry().offset == Point(10, 10, 5)
    assert test_labware._implementation.get_calibrated_offset() == Point(12, 12, 7)


def test_hash_labware_def():
    def1a = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.00003, 1 / 3]}
    def1aa = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.00003, 1 / 3]}
    def1b = {"metadata": {"a": "blah"}, "importantStuff": [1.1, 0.00003, 1 / 3]}
    def2 = {"metadata": {"a": 123}, "importantStuff": [1.1, 0.000033, 1 / 3]}

    # identity preserved across json serialization+deserialization
    assert helpers.hash_labware_def(def1a) == helpers.hash_labware_def(  # type: ignore[arg-type]
        json.loads(json.dumps(def1a, separators=(",", ":")))
    )
    # 2 instances of same def should match
    assert helpers.hash_labware_def(def1a) == helpers.hash_labware_def(def1aa)  # type: ignore[arg-type]
    # metadata ignored
    assert helpers.hash_labware_def(def1a) == helpers.hash_labware_def(def1b)  # type: ignore[arg-type]
    # different data should not match
    assert helpers.hash_labware_def(def1a) != helpers.hash_labware_def(def2)  # type: ignore[arg-type]
