PIPETTE_ID = "123"
LW_HASH = "130e17bb7b2f0c0472dcc01c1ff6f600ca1a6f9f86a90982df56c4bf43776824"
LW_URI = "opentrons/opentrons_96_filtertiprack_200ul/1"
FAKE_PIPETTE_ID = "fake_pip"
WRONG_LW_HASH = "wronghash"


def test_access_tip_length_calibration(api_client, set_up_tip_length_temp_directory):
    resp = api_client.get(
        f"/calibration/tip_length?pipette_id={PIPETTE_ID}&tiprack_hash={LW_HASH}"
    )
    assert resp.status_code == 403


def test_delete_tip_length_calibration(api_client, set_up_tip_length_temp_directory):
    resp = api_client.delete(
        f"/calibration/tip_length?pipette_id={FAKE_PIPETTE_ID}&"
        f"tiprack_uri={WRONG_LW_HASH}"
    )
    assert resp.status_code == 403
