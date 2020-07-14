import pytest

from opentrons.protocol_api import labware


@pytest.fixture
def grab_id(set_up_index_file_temporary_directory):
    labware_to_access = 'opentrons_96_tiprack_10ul'
    uri_to_check = f'opentrons/{labware_to_access}/1'

    index_path = labware.OFFSETS_PATH / 'index.json'
    index_file = labware._read_file(str(index_path))
    calibration_id = ''
    for key, data in index_file.items():
        if data['uri'] == uri_to_check:
            calibration_id = key
    return calibration_id


def test_access_individual_labware(api_client, grab_id):
    calibration_id = grab_id
    expected = {
        'calibrationData': {
            'offset': {
                'value': [0.0, 0.0, 0.0],
                'lastModified': None},
            'tipLength': {
                'value': None,
                'lastModified': None}},
        'loadName': 'opentrons_96_tiprack_10ul',
        'namespace': 'opentrons',
        'version': 1,
        'parent': ''}

    resp = api_client.get(f'/labware/calibrations/{calibration_id}')
    assert resp.status_code == 200
    body = resp.json()
    data = body['data']
    assert data['type'] == 'LabwareCalibration'
    assert data['id'] == calibration_id
    data['attributes']['calibrationData']['offset']['lastModified'] = None
    data['attributes']['calibrationData']['tipLength']['lastModified'] = None
    assert data['attributes'] == expected

    resp = api_client.get('/labware/calibrations/funnyId')
    assert resp.status_code == 404
    body = resp.json()
    assert body == {
        'errors': [{
            'status': '404',
            'title': '{calibrationId} does not exist.'}]}


def test_delete_individual_labware(api_client, grab_id):
    calibration_id = grab_id
    resp = api_client.delete('/labware/calibrations/funnyId')
    assert resp.status_code == 404
    body = resp.json()
    assert body == {
        'errors': [{
            'status': '404',
            'title': '{calibrationId} does not exist.'}]}

    resp = api_client.delete(f'/labware/calibrations/{calibration_id}')
    assert resp.status_code == 200
