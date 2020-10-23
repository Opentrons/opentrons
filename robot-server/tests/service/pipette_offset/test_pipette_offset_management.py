PIPETTE_ID = 'pip_1'
MOUNT = 'left'
FAKE_PIPETTE_ID = 'fake'
WRONG_MOUNT = 'right'


def test_access_pipette_offset_calibration(
        api_client, set_up_pipette_offset_temp_directory,
        apiclient_enable_calibration_overhaul, server_temp_directory):
    expected = {
        'offset': [0, 0, 0],
        'pipette': 'pip_1',
        'mount': 'left',
        'tiprack': 'hash',
        'lastModified': None,
        'source': 'user',
        'tiprackUri': 'uri',
        'status': {
            'markedAt': None, 'markedBad': False, 'source': None}
    }
    # Note, status should only have markedBad key, but according
    # to this thread https://github.com/samuelcolvin/pydantic/issues/1223
    # it's not easy to specify in the model itself

    resp = api_client.get(
        f'/calibration/pipette_offset?mount={MOUNT}&pipette_id={PIPETTE_ID}')
    assert resp.status_code == 200
    data = resp.json()['data'][0]
    data['lastModified'] = None
    assert data == expected

    resp = api_client.get(
        f'/calibration/pipette_offset?mount={MOUNT}&'
        f'pipette_id={FAKE_PIPETTE_ID}')
    assert resp.status_code == 200
    assert resp.json()['data'] == []


def test_delete_pipette_offset_calibration(
        api_client, set_up_pipette_offset_temp_directory,
        apiclient_enable_calibration_overhaul):
    resp = api_client.delete(
        f'/calibration/pipette_offset?pipette_id={PIPETTE_ID}&'
        f'mount={WRONG_MOUNT}')
    assert resp.status_code == 404
    body = resp.json()
    assert body == {
        'errors': [{
            'status': '404',
            'title': 'Resource Not Found',
            'detail': "Resource type 'PipetteOffsetCalibration' with id "
                      "'pip_1&right' was not found"
        }]}

    resp = api_client.delete(
        f'/calibration/pipette_offset?pipette_id={PIPETTE_ID}&'
        f'mount={MOUNT}')
    assert resp.status_code == 200
