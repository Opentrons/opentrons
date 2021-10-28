""" Tests for the update server state machine in otupdate.buildroot.update
"""
import asyncio
import binascii
import hashlib
import zipfile

import pytest

from otupdate.buildroot import update, config, update_actions
from otupdate.common import file_actions
from otupdate.common.session import UpdateSession, Stages


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


async def test_updater_chain(otupdate_config, downloaded_update_file,
                            loop, testing_partition):
    conf = config.load_from_path(otupdate_config)
    session = UpdateSession(conf.download_storage_path)
    handler = update_actions.OT2UpdateActions()
    fut = update._begin_validation(session,
                                   conf,
                                   loop,
                                   downloaded_update_file,
                                   handler)
    assert session.stage == Stages.VALIDATING
    last_progress = 0.0
    while session.stage == Stages.VALIDATING:
        assert session.state['progress'] >= last_progress
        assert session.state['stage'] == 'validating'
        assert session.stage == Stages.VALIDATING
        last_progress = session.state['progress']
        await asyncio.sleep(0.01)
    assert fut.done()
    last_progress = 0.0
    while session.stage == Stages.WRITING:
        assert session.state['progress'] >= last_progress
        last_progress = session.state['progress']
        await asyncio.sleep(0.1)
    assert session.stage == Stages.DONE, session.error


@pytest.mark.exclude_rootfs_ext4
async def test_session_catches_validation_fail(otupdate_config,
                                               downloaded_update_file,
                                               loop):
    conf = config.load_from_path(otupdate_config)
    session = UpdateSession(conf.download_storage_path)
    handler = update_actions.OT2UpdateActions()
    fut = update._begin_validation(
        session,
        conf,
        loop,
        downloaded_update_file,
        handler)
    with pytest.raises(file_actions.FileMissing):
        await fut
    assert session.state['stage'] == 'error'
    assert session.stage == Stages.ERROR
    assert 'error' in session.state
    assert 'message' in session.state


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
    while body['stage'] == 'validating':
        assert body['progress'] >= last_progress
        resp = await test_cli.get(session_endpoint(update_session,
                                                   'status'))
        assert resp.status == 200
        body = await resp.json()

        last_progress = body['progress']
        assert loop.time() - then <= 300

    if body['stage'] == 'writing':
        # Wait through write
        then = loop.time()
        last_progress = 0.0
        while body['stage'] == 'writing':
            assert body['progress'] >= last_progress
            resp = await test_cli.get(session_endpoint(update_session,
                                                       'status'))
            assert resp.status == 200
            body = await resp.json()
            last_progress = body['progress']
            assert loop.time() - then <= 300

    assert body['stage'] == 'done'

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
    while body['stage'] == 'validating':
        resp = await test_cli.get(
            session_endpoint(update_session, 'status'))
        body = await resp.json()
    assert body['stage'] == 'error'
    assert body['error'] == 'File Missing'
