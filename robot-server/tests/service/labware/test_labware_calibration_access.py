def test_access_individual_labware(api_client):
    resp = api_client.get("/labware/calibrations/funnyId")
    assert resp.status_code == 404
    body = resp.json()
    assert body == {
        "errors": [
            {
                "id": "UncategorizedError",
                "title": "Resource Not Found",
                "detail": "Resource type 'calibration' with id 'funnyId' was not found",
            }
        ]
    }


def test_delete_individual_labware(api_client):
    resp = api_client.delete("/labware/calibrations/funnyId")
    assert resp.status_code == 404
    body = resp.json()
    assert body == {
        "errors": [
            {
                "id": "UncategorizedError",
                "title": "Resource Not Found",
                "detail": "Resource type 'calibration' with id 'funnyId' was not found",
            }
        ]
    }
