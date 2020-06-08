import json
from unittest.mock import patch

import pytest

from opentrons.config.reset import ResetOptionId


def validate_response_body(body):
    settings_list = body.get('settings')
    assert type(settings_list) == list
    for obj in settings_list:
        assert 'id' in obj, '"id" field not found in settings object'
        assert 'title' in obj, '"title" not found for {}'.format(obj['id'])
        assert 'description' in obj, '"description" not found for {}'.format(
            obj['id'])
        assert 'value' in obj, '"value" not found for {}'.format(obj['id'])
        assert 'restart_required' in obj
    assert 'links' in body
    assert isinstance(body['links'], dict)


async def test_get(async_client):
    resp = await async_client.get('/settings')
    body = await resp.json()
    assert resp.status == 200
    validate_response_body(body)


async def test_set(virtual_smoothie_env, loop, async_client):
    test_id = 'disableHomeOnBoot'

    resp = await async_client.post(
        '/settings', json={"id": test_id, "value": True})
    body = await resp.json()
    assert resp.status == 200
    validate_response_body(body)
    test_setting = list(
        filter(lambda x: x.get('id') == test_id, body.get('settings')))[0]
    assert test_setting.get('value')


async def test_available_resets(async_client):
    resp = await async_client.get('/settings/reset/options')
    body = await resp.json()
    options_list = body.get('options')
    assert resp.status == 200
    assert sorted(['tipProbe', 'labwareCalibration', 'bootScripts'])\
        == sorted([item['id'] for item in options_list])


@pytest.fixture
def mock_reset():
    with patch("opentrons.server.endpoints.settings.reset_util.reset") as m:
        yield m


@pytest.mark.parametrize(argnames="body,called_with",
                         argvalues=[
                             # Empty body
                             [{}, set()],
                             # None true
                             [{
                                 'labwareCalibration': False,
                                 'tipProbe': False,
                                 'bootScripts': False
                             }, set()],
                             # All set
                             [{
                                 'labwareCalibration': True,
                                 'tipProbe': True,
                                 'bootScripts': True
                             }, set(v for v in ResetOptionId)],
                             [{'labwareCalibration': True},
                              {ResetOptionId.labware_calibration}],
                             [{'tipProbe': True},
                              {ResetOptionId.tip_probe}],
                             [{'bootScripts': True},
                              {ResetOptionId.boot_scripts}],
                         ])
async def test_reset_success(async_client, mock_reset, body, called_with):
    cli = async_client
    resp = await cli.post('/settings/reset', json=body)
    body = await resp.json()
    assert resp.status == 200
    assert body == {}
    mock_reset.assert_called_once_with(called_with)


async def test_reset_invalid_option(async_client, mock_reset):
    # Check the inpost validation
    resp = await async_client.post('/settings/reset',
                                   json={'aksgjajhadjasl': False})
    body = await resp.json()
    assert resp.status == 400
    assert 'message' in body
    assert 'aksgjajhadjasl' in body['message']


@pytest.fixture
def mock_pipette_data():
    return {
        'p1': {
            'info': {
                'name': 'p1_name',
                'model': 'p1_model',
            },
            'fields': {
                'pickUpCurrent': {
                    'units': 'mm',
                    'type': 'float',
                    'min': 0.0,
                    'max': 2.0,
                    'default': 1.0,
                    'value': 0.5,
                },
                'quirks': {
                    'dropTipShake': True
                }
            }
        },
        'p2': {
            'info': {
                'name': 'p2_name',
                'model': 'p2_model',
            },
            'fields': {
                'pickUpIncrement': {
                    'units': 'inch',
                    'type': 'int',
                    'min': 0,
                    'max': 2,
                    'default': 1.,
                    'value': 2,
                }
            }
        }
    }


@pytest.fixture
def mock_pipette_config(mock_pipette_data):
    with patch("opentrons.server.endpoints.settings.pc") as p:
        p.known_pipettes.return_value = list(mock_pipette_data.keys())
        p.load_config_dict.side_effect = \
            lambda id: (mock_pipette_data[id]['info'],
                        mock_pipette_data[id]['info']['model'])
        p.list_mutable_configs.side_effect = \
            lambda pipette_id: mock_pipette_data[pipette_id]['fields']
        yield p


async def test_receive_pipette_settings(async_client,
                                        mock_pipette_config,
                                        mock_pipette_data):
    resp = await async_client.get('/settings/pipettes')
    assert resp.status == 200
    assert await resp.json() == mock_pipette_data


async def test_receive_pipette_settings_unknown(async_client,
                                                mock_pipette_config,
                                                mock_pipette_data):
    # Non-existent pipette id and get 404
    resp = await async_client.get('/settings/pipettes/wannabepipette')
    assert resp.status == 404


async def test_receive_pipette_settings_found(async_client,
                                              mock_pipette_config,
                                              mock_pipette_data):
    resp = await async_client.get('/settings/pipettes/p1')
    assert resp.status == 200
    assert await resp.json() == mock_pipette_data['p1']


async def test_modify_pipette_settings_call_override(async_client,
                                                     mock_pipette_config,
                                                     mock_pipette_data):
    pipette_id = 'p1'
    changes = {
        'fields': {
            'pickUpCurrent': {'value': 1},
            'otherField': {'value': True},
            'noneField': {'value': None},
            'otherNoneField': None
        }
    }

    # Check that data is changed and matches the changes specified
    resp = await async_client.patch(
        f'/settings/pipettes/{pipette_id}',
        json=changes)
    mock_pipette_config.override.assert_called_once_with(
        fields={'pickUpCurrent': 1, 'otherField': True,
                'noneField': None, 'otherNoneField': None},
        pipette_id=pipette_id)
    patch_body = await resp.json()
    assert resp.status == 200
    assert patch_body == {'fields': mock_pipette_data[pipette_id]['fields']}


@pytest.mark.parametrize(argnames=["body"],
                         argvalues=[
                             [{}],
                             [{'fields': {}}]
                         ])
async def test_modify_pipette_settings_do_not_call_override(
        async_client, mock_pipette_config, mock_pipette_data, body):
    pipette_id = 'p1'

    resp = await async_client.patch(
        f'/settings/pipettes/{pipette_id}',
        json=body)
    mock_pipette_config.override.assert_not_called()
    patch_body = await resp.json()
    assert resp.status == 200
    assert patch_body == {'fields': mock_pipette_data[pipette_id]['fields']}


async def test_modify_pipette_settings_failure(async_client,
                                               mock_pipette_config):
    test_id = 'p1'

    def mock_override(pipette_id, fields):
        raise ValueError("Failed!")

    mock_pipette_config.override.side_effect = mock_override

    resp = await async_client.patch(
        f'/settings/pipettes/{test_id}',
        json={'fields': {'a': {'value': 1}}})
    mock_pipette_config.override.assert_called_once_with(pipette_id=test_id,
                                                         fields={'a': 1})
    patch_body = await resp.json()
    assert resp.status == 412
    assert patch_body == {'message': "Failed!"}


async def test_set_log_level(mock_config, async_client):
    # Check input sanitization
    hardware = async_client.app['com.opentrons.hardware']
    resp = await async_client.post('/settings/log_level/local', json={})
    assert resp.status == 400
    body = await resp.json()
    assert 'message' in body
    resp = await async_client.post('/settings/log_level/local',
                                   json={'log_level': 'oafajhshda'})
    assert resp.status == 400
    body = await resp.json()
    assert 'message' in body
    conf = hardware.config
    assert conf.log_level != 'ERROR'
    resp = await async_client.post('/settings/log_level/local',
                                   json={'log_level': 'error'})
    assert resp.status == 200
    body = await resp.json()
    assert 'message' in body
    conf = hardware.config
    assert conf.log_level == 'ERROR'


async def test_get_robot_settings(mock_config, async_client):
    resp = await async_client.get('/settings/robot')
    body = await resp.json()
    assert resp.status == 200
    hardware = async_client.app['com.opentrons.hardware']
    conf = hardware.config
    assert json.dumps(conf._asdict()) == json.dumps(body)
