""" Tests for the update server state machine in otupdate.buildroot.update
"""
import asyncio
import binascii
import hashlib
import zipfile

import pytest

from otupdate.buildroot import update, config
from otupdate.buildroot.update_session import UpdateSession, Stages


def session_endpoint(token, endpoint):
    return f'/server/update/{token}/{endpoint}'


@pytest.fixture
async def update_session(test_cli):
    resp = await test_cli.post('/server/update/begin')
    body = await resp.json()
    yield body['token']
    await test_cli.post('/server/update/cancel')


async def test_begin(test_cli):
    # Creating a session should work
    resp = await test_cli.post('/server/update/begin')
    body = await resp.json()
    assert resp.status == 201
    assert 'token' in body
    assert test_cli.server.app.get(update.SESSION_VARNAME)
    assert test_cli.server.app[update.SESSION_VARNAME].token\
        == body['token']

    # Creating a session twice shouldn’t
    resp = await test_cli.post('/server/update/begin')
    body = await resp.json()
    assert resp.status == 409
    assert 'message' in body


async def test_cancel(test_cli):
    # cancelling when there’s a session should work great
    resp = await test_cli.post('/server/update/begin')
    assert test_cli.server.app.get(update.SESSION_VARNAME)

    resp = await test_cli.post('/server/update/cancel')
    assert resp.status == 200
    assert test_cli.server.app.get(update.SESSION_VARNAME) is None

    # and so should cancelling when there isn’t one

    resp = await test_cli.post('/server/update/cancel')
    assert resp.status == 200


async def test_commit_fails_wrong_state(test_cli, update_session):
    resp = await test_cli.post(session_endpoint(update_session, 'commit'))
    assert resp.status == 409


async def test_future_chain(otupdate_config, downloaded_update_file, loop):
    conf = config.load_from_path(otupdate_config)
    session = UpdateSession(conf.download_storage_path)
    fut = update._begin_validation(session,
                                   conf,
                                   loop,
                                   downloaded_update_file)
    assert session.stage == Stages.VALIDATING
    assert session.current_task == fut
    last_progress = 0.0
    while not fut.done():
        assert session.state['progress'] >= last_progress
        assert session.state['stage'] == 'validating'
        assert session.stage == Stages.VALIDATING
        last_progress = session.state['progress']
        await asyncio.sleep(0.01)
    await fut
    yield  # This yield needs to be here to let the loop spin
    while session.state['stage'] == session.state['writing']:
        assert session.state['progress'] >= last_progress
        assert session.stage == Stages.VALIDATING
        assert session.state['stage'] == 'writing'
        last_progress = session.state['progress']
        await asyncio.sleep(0.1)
    assert session.state['stage'] == Stages.DONE


@pytest.mark.exclude_rootfs_ext4
async def test_session_catches_validation_fail(otupdate_config,
                                               downloaded_update_file,
                                               loop):
    conf = config.load_from_path(otupdate_config)
    session = UpdateSession(conf.download_storage_path)
    fut = update._begin_validation(
        session,
        conf,
        loop,
        downloaded_update_file)
    await fut
    assert fut.exception()
    yield  # This yield needs to be here to let the loop spin
    assert session.state['stage'] == 'error'
    assert session.stage == Stages.ERROR
    assert 'error' in session.state
    assert 'message' in session.state
    assert session.current_task is None


async def test_update_happypath(test_cli, update_session,
                                downloaded_update_file, loop,
                                testing_partition):
    # Upload
    resp = await test_cli.post(
        session_endpoint(update_session, 'file'),
        data={'ot2-system.zip': open(downloaded_update_file, 'rb')})
    assert resp.status == 201
    body = await resp.json()
    assert body['stage'] == 'validating'
    assert 'progress' in body
    # Wait through validation
    then = loop.time()
    last_progress = 0.0
    while loop.time() - then <= 300:
        status_resp = await test_cli.get(session_endpoint(update_session,
                                                          'status'))
        assert status_resp.status == 200
        status_body = await status_resp.json()
        assert status_body['stage'] != 'error'
        if status_body['stage'] == 'writing':
            break
        assert status_body['stage'] == 'validating'
        assert status_body['progress'] >= last_progress
        last_progress = status_body['progress']
        yield
    assert last_progress > 0.0
    # Wait through write
    then = loop.time()
    last_progress = 0.0
    while loop.time() - then <= 300:
        status_resp = await test_cli.get(session_endpoint(update_session,
                                                          'status'))
        assert status_resp.status == 200
        status_body = await status_resp.json()
        assert status_body['stage'] != 'error'
        if status_body['stage'] == 'done':
            break
        assert status_body['stage'] == 'writing'
        assert status_body['progress'] >= last_progress
        last_progress = status_body['progress']
        yield
    assert last_progress > 0.0
    status_resp = await test_cli.get(session_endpoint(update_session,
                                                      'status'))
    status_body = await status_resp.json()
    assert status_body['stage'] == 'done'
    tp_hasher = hashlib.sha256()
    tp_hasher.update(open(testing_partition, 'rb').read())
    tp_hash = binascii.hexlify(tp_hasher.digest())
    with zipfile.ZipFile(downloaded_update_file, 'r') as zf:
        assert tp_hash == zf.read('rootfs.ext4.hash').strip()


@pytest.mark.exclude_rootfs_ext4
async def test_update_catches_validation_fail(test_cli, update_session,
                                              downloaded_update_file, loop,
                                              testing_partition):
    # Upload
    resp = await test_cli.post(
        session_endpoint(update_session, 'file'),
        data={'ot2-system.zip': open(downloaded_update_file, 'rb')})
    assert resp.status == 201
    body = await resp.json()
    assert body['stage'] == 'validating'
    assert 'progress' in body
    yield
    resp = await test_cli.get(
        session_endpoint(update_session, 'status'))
    body = await resp.json()
    assert body['stage'] == 'error'
    assert body['error'] == 'file-missing'
