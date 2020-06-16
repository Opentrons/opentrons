from pathlib import Path

import pytest

from opentrons.protocol_api import labware
from opentrons.types import Point
from opentrons.protocol_api.geometry import Deck


@pytest.fixture
def index_file_dir(tmpdir, monkeypatch):
    monkeypatch.setattr(labware, 'OFFSETS_PATH', Path(tmpdir))
    yield tmpdir


@pytest.fixture
def set_up_index_file(index_file_dir):
    deck = Deck()
    labware_list = [
        'nest_96_wellplate_2ml_deep',
        'corning_384_wellplate_112ul_flat',
        'geb_96_tiprack_1000ul',
        'nest_12_reservoir_15ml',
        'opentrons_96_tiprack_10ul']
    for idx, name in enumerate(labware_list):
        parent = deck.position_for(idx+1)
        definition = labware.get_labware_definition(name)
        lw = labware.Labware(definition, parent)
        labware.save_calibration(lw, Point(0, 0, 0))
        if name == 'opentrons_96_tiprack_10ul':
            labware.save_tip_length(lw, 30)

    return labware_list


@pytest.fixture
def grab_id(set_up_index_file):
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
                'value': 30.0,
                'lastModified': None}},
        'loadName': 'opentrons_96_tiprack_10ul',
        'namespace': 'opentrons',
        'version': 1,
        'parent': calibration_id}

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
