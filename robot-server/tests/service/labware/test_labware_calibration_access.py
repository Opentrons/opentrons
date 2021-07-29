import pytest

from opentrons.calibration_storage import file_operators
from opentrons import config


@pytest.fixture
def grab_id(set_up_index_file_temporary_directory):
    labware_to_access = "opentrons_96_tiprack_10ul"
    uri_to_check = f"opentrons/{labware_to_access}/1"
    offset_path = config.get_opentrons_path("labware_calibration_offsets_dir_v2")
    index_path = offset_path / "index.json"
    index_file = file_operators.read_cal_file(str(index_path))
    calibration_id = ""
    for key, data in index_file["data"].items():
        if data["uri"] == uri_to_check:
            calibration_id = key
    return calibration_id


def test_access_individual_labware(api_client, grab_id):
    calibration_id = grab_id
    expected = {
        "id": calibration_id,
        "calibrationData": {
            "offset": {"value": [0.0, 0.0, 0.0], "lastModified": None},
            "tipLength": {"value": None, "lastModified": None},
        },
        "loadName": "opentrons_96_tiprack_10ul",
        "namespace": "opentrons",
        "version": 1,
        "parent": "",
        "definitionHash": calibration_id,
    }

    resp = api_client.get(f"/labware/calibrations/{calibration_id}")
    assert resp.status_code == 200
    body = resp.json()
    data = body["data"]
    data["calibrationData"]["offset"]["lastModified"] = None
    data["calibrationData"]["tipLength"]["lastModified"] = None
    assert data == expected

    resp = api_client.get("/labware/calibrations/funnyId")
    assert resp.status_code == 404
    body = resp.json()
    assert body == {
        "errors": [
            {
                "id": "UncategorizedError",
                "title": "Resource Not Found",
                "detail": "Resource type 'calibration' with id "
                "'funnyId' was not found",
            }
        ]
    }


def test_delete_individual_labware(api_client, grab_id):
    calibration_id = grab_id
    resp = api_client.delete("/labware/calibrations/funnyId")
    assert resp.status_code == 404
    body = resp.json()
    assert body == {
        "errors": [
            {
                "id": "UncategorizedError",
                "title": "Resource Not Found",
                "detail": "Resource type 'calibration' with id "
                "'funnyId' was not found",
            }
        ]
    }

    resp = api_client.delete(f"/labware/calibrations/{calibration_id}")
    assert resp.status_code == 200
