import json
import os

import pytest

from robot_server.aiohttp import endpoints
from opentrons.config import pipette_config
from opentrons import config, types


@pytest.fixture
def restore_restart_required():
    yield
    endpoints.settings._SETTINGS_RESTART_REQUIRED = False


@pytest.fixture
async def attached_pipettes(async_client, request):
    """ Fixture the robot to have attached pipettes

    Mark the node with
    'attach_left_model': model_name for left (default: p300_single_v1)
    'attach_right_model': model_name for right (default: p50_multi_v1)
    'attach_left_id': id for left (default: 'abc123')
    'attach_right_id': id for right (default: 'acbcd123')

    Returns the model by mount style dict of
    {'left': {'name': str, 'model': str, 'id': str}, 'right'...}
    """
    def marker_with_default(marker: str, default: str) -> str:
        return request.node.get_closest_marker(marker) or default
    left_mod = marker_with_default('attach_left_model', 'p300_multi_v1')
    left_name = left_mod.split('_v')[0]
    right_mod = marker_with_default('attach_right_model', 'p50_multi_v1')
    right_name = right_mod.split('_v')[0]
    left_id = marker_with_default('attach_left_id', 'abc123')
    right_id = marker_with_default('attach_right_id', 'abcd123')
    hw = async_client.app['com.opentrons.hardware']
    hw._backend._attached_instruments = {
        types.Mount.RIGHT: {
            'model': right_mod, 'id': right_id, 'name': right_name
        },
        types.Mount.LEFT: {
            'model': left_mod, 'id': left_id, 'name': left_name
            }
    }
    await hw.cache_instruments()
    return {k.name.lower(): v
            for k, v in hw._backend._attached_instruments.items()}


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


@pytest.mark.api1_only
async def execute_reset_tests_v1(async_client):
    # Make sure we actually delete the database
    cli = async_client
    resp = await cli.post('/settings/reset', json={'labwareCalibration': True})
    body = await resp.json()
    assert not os.path.exists(config.CONFIG['labware_database_file'])
    assert resp.status == 200
    assert body == {}

    # Make sure this one is idempotent
    resp = await cli.post('/settings/reset', json={'labwareCalibration': True})
    body = await resp.json()
    assert resp.status == 200
    assert body == {}

    # Check that we properly delete only the tip length key
    resp = await cli.post('/settings/reset', json={'tipProbe': True})
    body = await resp.json()
    assert resp.status == 200
    assert body == {}

    robot_settings = config.CONFIG['robot_settings_file']
    with open(robot_settings, 'r') as f:
        data = json.load(f)
    assert data['tip_length'] == {}

    # Check the inpost validation
    resp = await cli.post('/settings/reset', json={'aksgjajhadjasl': False})
    body = await resp.json()
    assert resp.status // 100 == 4
    assert 'message' in body
    assert 'aksgjajhadjasl' in body['message']


async def execute_reset_tests_v2(async_client):
    cli = async_client
    # Make sure we actually delete the database
    resp = await cli.post('/settings/reset', json={'labwareCalibration': True})
    body = await resp.json()
    assert not os.listdir(config.CONFIG['labware_calibration_offsets_dir_v2'])
    assert resp.status == 200
    assert body == {}

    # Make sure this one is idempotent
    resp = await cli.post('/settings/reset', json={'labwareCalibration': True})
    body = await resp.json()
    assert resp.status == 200
    assert body == {}

    # Check that we properly delete only the tip length key
    resp = await cli.post('/settings/reset', json={'tipProbe': True})
    body = await resp.json()
    assert resp.status == 200
    assert body == {}

    robot_settings = config.CONFIG['robot_settings_file']
    with open(robot_settings, 'r') as f:
        data = json.load(f)
    assert data['instrument_offset']\
        == config.robot_configs.build_fallback_instrument_offset({})

    # Check the inpost validation
    resp = await cli.post('/settings/reset', json={'aksgjajhadjasl': False})
    body = await resp.json()
    assert resp.status // 100 == 4
    assert 'message' in body
    assert 'aksgjajhadjasl' in body['message']


async def test_receive_pipette_settings(async_client, attached_pipettes):

    test_id = attached_pipettes['left']['id']
    resp = await async_client.get('/settings/pipettes')
    body = await resp.json()
    assert test_id in body
    assert body[test_id]['fields'] == pipette_config.list_mutable_configs(
        pipette_id=test_id)


async def test_receive_pipette_settings_one_pipette(
        async_client, attached_pipettes):
    # This will check that sending a known pipette id works,
    # and sending an unknown one does not
    test_id = attached_pipettes['left']['id']
    resp = await async_client.get('/settings/pipettes/{}'.format(test_id))
    body = await resp.json()
    assert body['fields'] == pipette_config.list_mutable_configs(
        pipette_id=test_id)

    # Non-existent pipette id and get 404
    resp = await async_client.get(
        '/settings/pipettes/{}'.format('wannabepipette'))
    assert resp.status == 404


async def test_modify_pipette_settings(async_client, attached_pipettes):
    # This test will check that setting modified pipette configs
    # works as expected
    changes = {
        'fields': {
            'pickUpCurrent': {'value': 1}
        }
    }

    no_changes = {
        'fields': {
            'pickUpCurrent': {'value': 1}
        }
    }

    test_id = attached_pipettes['left']['id']
    # Check data has not been changed yet
    resp = await async_client.get('/settings/pipettes/{}'.format(test_id))
    body = await resp.json()
    assert body['fields']['pickUpCurrent'] == \
        pipette_config.list_mutable_configs(
            pipette_id=test_id)['pickUpCurrent']

    # Check that data is changed and matches the changes specified
    resp = await async_client.patch(
        '/settings/pipettes/{}'.format(test_id),
        json=changes)
    patch_body = await resp.json()
    assert resp.status == 200
    check = await async_client.get('/settings/pipettes/{}'.format(test_id))
    body = await check.json()
    assert body['fields'] == patch_body['fields']

    # Check that None reverts a setting to default
    changes2 = {
        'fields': {
            'pickUpCurrent': None
        }
    }
    resp = await async_client.patch(
        '/settings/pipettes/{}'.format(test_id),
        json=changes2)
    assert resp.status == 200
    check = await async_client.get('/settings/pipettes/{}'.format(test_id))
    body = await check.json()
    assert body['fields']['pickUpCurrent']['value'] == \
        pipette_config.list_mutable_configs(
            pipette_id=test_id)['pickUpCurrent']['default']

    # check no fields returns no changes
    resp = await async_client.patch(
        '/settings/pipettes/{}'.format(test_id),
        json=no_changes)
    body = await resp.json()
    assert body['fields'] == pipette_config.list_mutable_configs(test_id)
    assert resp.status == 200


async def test_incorrect_modify_pipette_settings(
        async_client, attached_pipettes):
    out_of_range = {
        'fields': {
            'pickUpCurrent': {'value': 1000}
        }
    }
    # check over max fails
    resp = await async_client.patch(
        '/settings/pipettes/{}'.format(attached_pipettes['left']['id']),
        json=out_of_range)
    assert resp.status == 412


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
    assert 'message'in body
    conf = await hardware.config
    assert conf.log_level != 'ERROR'
    resp = await async_client.post('/settings/log_level/local',
                                   json={'log_level': 'error'})
    assert resp.status == 200
    body = await resp.json()
    assert 'message' in body
    conf = await hardware.config
    assert conf.log_level == 'ERROR'


async def test_get_robot_settings(mock_config, async_client):
    resp = await async_client.get('/settings/robot')
    body = await resp.json()
    assert resp.status == 200
    hardware = async_client.app['com.opentrons.hardware']
    conf = await hardware.config
    assert json.dumps(conf._asdict()) == json.dumps(body)
