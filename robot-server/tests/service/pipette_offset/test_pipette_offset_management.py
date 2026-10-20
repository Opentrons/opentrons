PIPETTE_ID = "123"
MOUNT = "left"
WRONG_MOUNT = "right"


def test_access_pipette_offset_calibration(
    api_client, set_up_pipette_offset_temp_directory, server_temp_directory
):
    resp = api_client.get(
        f"/calibration/pipette_offset?mount={MOUNT}&pipette_id={PIPETTE_ID}"
    )
    assert resp.status_code == 403


def test_delete_pipette_offset_calibration(
    api_client, set_up_pipette_offset_temp_directory
):
    resp = api_client.delete(
        f"/calibration/pipette_offset?pipette_id={PIPETTE_ID}&mount={WRONG_MOUNT}"
    )
    assert resp.status_code == 403
