import pytest

PIPETTE_ID = 'pip_1'
MOUNT = 'left'
FAKE_PIPETTE_ID = 'fake'
WRONG_MOUNT = 'right'


def test_access_pipette_offset_calibration(
        api_client, set_up_pipette_offset_temp_directory):
    expected = {
        'offset': [0, 0, 0],
        'pipette': 'pip_1',
        'mount': 'left',
        'tiprack': 'hash',
        'lastModified': None
    }

    resp = api_client.get(
        f'/calibration/pipette_offset?mount={MOUNT}&pipette_id={PIPETTE_ID}')
    assert resp.status_code == 200
    data = resp.json()['data'][0]
    assert data['type'] == 'PipetteOffsetCalibration'
    data['attributes']['lastModified'] = None
    assert data['attributes'] == expected

    resp = api_client.get(
        f'/calibration/pipette_offset?mount={MOUNT}&'
        f'pipette_id={FAKE_PIPETTE_ID}')
    assert resp.status_code == 200
    assert resp.json()['data'] == []


def test_delete_pipette_offset_calibration(
        api_client, set_up_pipette_offset_temp_directory):
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
