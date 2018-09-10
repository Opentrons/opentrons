import contextlib
import json
import os
import shutil
import tempfile

from opentrons.server.main import init
from opentrons.data_storage import database as db
from opentrons.robot import robot_configs as rc


def validate_response_body(body):
    settings_list = body.get('settings')
    assert type(settings_list) == list
    for obj in settings_list:
        assert 'id' in obj, '"id" field not found in settings object'
        assert 'title' in obj, '"title" not found for {}'.format(obj['id'])
        assert 'description' in obj, '"description" not found for {}'.format(
            obj['id'])
        assert 'value' in obj, '"value" not found for {}'.format(obj['id'])


async def test_get(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    resp = await cli.get('/settings')
    body = await resp.json()
    assert resp.status == 200
    validate_response_body(body)


async def test_set(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))
    test_id = 'disableHomeOnBoot'

    resp = await cli.post('/settings', json={"id": test_id, "value": True})
    body = await resp.json()
    assert resp.status == 200
    validate_response_body(body)
    test_setting = list(
        filter(lambda x: x.get('id') == test_id, body.get('settings')))[0]
    assert test_setting.get('value')


async def test_available_resets(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    resp = await cli.get('/settings/reset/options')
    body = await resp.json()
    options_list = body.get('options')
    assert resp.status == 200
    for key in ['deckCalibration', 'tipProbe',
                'labwareCalibration', 'bootScripts']:
        for opt in options_list:
            if opt['id'] == key:
                assert 'name' in opt
                assert 'description' in opt
                break
        else:
            raise KeyError(key)


async def execute_reset_tests(cli):
    # Make sure we actually delete the database
    resp = await cli.post('/settings/reset', json={'labwareCalibration': True})
    body = await resp.json()
    assert not os.path.exists(db.database_path)
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

    index = rc.get_config_index()
    robot_settings = index['robotSettingsFile']
    with open(robot_settings, 'r') as f:
        data = json.load(f)
    assert data['tip_length'] == {}

    # Check that we delete the entire deck calibration file
    resp = await cli.post('/settings/reset', json={'deckCalibration': True})
    body = await resp.json()
    assert resp.status == 200
    assert body == {}

    deck_cal = index['deckCalibrationFile']
    assert not os.path.exists(deck_cal)

    # Check that this endpoint is idempotent
    resp = await cli.post('/settings/reset', json={'deckCalibration': True})
    body = await resp.json()
    assert resp.status == 200
    assert body == {}

    # Check the inpost validation
    resp = await cli.post('/settings/reset', json={'aksgjajhadjasl': False})
    body = await resp.json()
    assert resp.status // 100 == 4
    assert 'message' in body
    assert 'aksgjajhadjasl' in body['message']


@contextlib.contextmanager
def restore_db(db_path):
    db_name = os.path.basename(db_path)
    with tempfile.TemporaryDirectory() as tempdir:
        shutil.copy(db_path,
                    os.path.join(tempdir, db_name))
        try:
            yield
        finally:
            shutil.copy(os.path.join(tempdir, db_name),
                        db_path)


async def test_reset(virtual_smoothie_env, loop, test_client):
    app = init(loop)
    cli = await loop.create_task(test_client(app))

    # This test runs each reset individually (except /data/boot.d which won’t
    # work locally) and checks the error handling

    # precondition
    assert os.path.exists(db.database_path)
    with restore_db(db.database_path):
        await execute_reset_tests(cli)
