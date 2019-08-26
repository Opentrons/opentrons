import asyncio
import contextlib
import os
from unittest import mock
import pytest

import otupdate.balena
import otupdate.buildroot
import otupdate.migration
from otupdate.migration import dbus_actions


def patch_file_actions(
        monkeypatch, state_partition, data_partition, unused_sysroot,
        resin_data_dir, boot_dev):

    @contextlib.contextmanager
    def patched_mount_state():
        yield state_partition

    @contextlib.contextmanager
    def patched_mount_data():
        yield data_partition

    monkeypatch.setattr(
        otupdate.migration.file_actions, 'mount_state_partition',
        patched_mount_state)
    monkeypatch.setattr(
        otupdate.migration.file_actions, 'mount_data_partition',
        patched_mount_data)
    monkeypatch.setattr(
        otupdate.migration.file_actions, 'find_inactive_sysroot',
        lambda: unused_sysroot)
    monkeypatch.setattr(
        otupdate.migration.constants, 'DATA_DIR_NAME',
        resin_data_dir)
    monkeypatch.setattr(
        otupdate.migration.file_actions, 'DATA_DIR_NAME',
        resin_data_dir)
    monkeypatch.setattr(
        otupdate.migration.constants, 'BOOT_PARTITION_NAME',
        boot_dev)

    restart = mock.Mock()
    set_mounted = mock.Mock()

    monkeypatch.setattr(dbus_actions,
                        'set_mounted', set_mounted)
    monkeypatch.setattr(dbus_actions,
                        'restart', restart)

    def fake_proc_cmdline():
        return b'root=/dev/mmcblk0p2'

    monkeypatch.setattr(
        otupdate.migration.file_actions,
        '_get_proc_cmdline', fake_proc_cmdline)

    def fake_write_file(infile, outfile, progress_callback,
                        chunk_size=1024, file_size=None):
        progress_callback(1.0)

    monkeypatch.setattr(
        otupdate.migration.endpoints, 'write_file', fake_write_file)


@pytest.fixture
async def otupdate_test_client(aiohttp_client, loop, monkeypatch,
                               resin_data_dir, state_partition, data_partition,
                               unused_sysroot, boot_dev):

    patch_file_actions(monkeypatch, state_partition, data_partition,
                       unused_sysroot, resin_data_dir, boot_dev)
    app = otupdate.balena.get_app(api_package=None,
                                  update_package=None,
                                  smoothie_version='not available',
                                  loop=loop, test=False,
                                  with_migration=True)
    return await loop.create_task(aiohttp_client(app))


def migration_endpoint(endpoint):
    return f'/server/update/migration/{endpoint}'


def session_endpoint(token, endpoint):
    return migration_endpoint(f'{token}/{endpoint}')


@pytest.fixture
async def update_session(otupdate_test_client):
    resp = await otupdate_test_client.post(migration_endpoint('begin'))
    body = await resp.json()
    yield body['token']
    await otupdate_test_client.post(migration_endpoint('cancel'))


async def test_begin(otupdate_test_client):
    # Creating a session should work
    resp = await otupdate_test_client.post(migration_endpoint('begin'))
    body = await resp.json()
    assert resp.status == 201
    assert 'token' in body
    session = otupdate_test_client.server.app.get(
        otupdate.migration.endpoints.SESSION_VARNAME)
    assert session
    assert session.token == body['token']

    # Creating a session twice shouldn’t
    resp = await otupdate_test_client.post(migration_endpoint('begin'))
    body = await resp.json()
    assert resp.status == 409
    assert 'message' in body


async def test_cancel(otupdate_test_client):
    # cancelling when there’s a session should work great
    resp = await otupdate_test_client.post(migration_endpoint('begin'))
    assert otupdate_test_client.server.app.get(
        otupdate.migration.endpoints.SESSION_VARNAME)

    resp = await otupdate_test_client.post(migration_endpoint('cancel'))
    assert resp.status == 200
    assert otupdate_test_client.server.app.get(
        otupdate.migration.endpoints.SESSION_VARNAME) is None

    # and so should cancelling when there isn’t one

    resp = await otupdate_test_client.post(migration_endpoint('cancel'))
    assert resp.status == 200


async def test_commit_fails_wrong_state(otupdate_test_client, update_session):
    resp = await otupdate_test_client.post(session_endpoint(
        update_session, 'commit'))
    assert resp.status == 409


async def test_migration_future_chain(
        downloaded_update_file, loop, monkeypatch,
        state_partition, data_partition, resin_data_dir,
        unused_sysroot, boot_dev):

    patch_file_actions(monkeypatch, state_partition, data_partition,
                       unused_sysroot, resin_data_dir, boot_dev)

    dl_path = os.path.dirname(downloaded_update_file)
    session = otupdate.buildroot.update_session.UpdateSession(
        os.path.join(dl_path, 'downloads'))
    fut = otupdate.migration.endpoints._begin_validation(
        session, loop, downloaded_update_file, 'my-robot-name')
    assert session.stage == otupdate.buildroot.update_session.Stages.VALIDATING
    last_progress = 0.0
    while not fut.done():
        assert session.state['progress'] >= last_progress
        assert session.state['stage'] == 'validating'
        assert session.stage\
            == otupdate.buildroot.update_session.Stages.VALIDATING
        last_progress = session.state['progress']
        await asyncio.sleep(0.01)
    await fut
    await asyncio.sleep(0.1)
    while session.state['stage'] == 'writing':
        assert session.state['progress'] >= last_progress
        assert session.stage\
            == otupdate.buildroot.update_session.Stages.VALIDATING
        last_progress = session.state['progress']
        await asyncio.sleep(0.1)
    assert session.state['stage']\
        == 'done'


@pytest.mark.exclude_boot_vfat
async def test_session_catches_validation_fail(downloaded_update_file,
                                               loop):
    dl_dir = os.path.dirname(downloaded_update_file)
    session = otupdate.buildroot.update_session.UpdateSession(
        os.path.join(dl_dir, 'downloads'))
    fut = otupdate.migration.endpoints._begin_validation(
        session,
        loop,
        downloaded_update_file,
        'my-robot')
    with pytest.raises(otupdate.buildroot.file_actions.FileMissing):
        await fut

    await asyncio.sleep(0.1)
    assert session.state['stage'] == 'error'
    assert session.stage == otupdate.buildroot.update_session.Stages.ERROR
    assert 'error' in session.state
    assert 'message' in session.state


async def test_migration_happypath(otupdate_test_client, update_session,
                                   downloaded_update_file, loop,
                                   unused_sysroot):
    # Upload
    resp = await otupdate_test_client.post(
        session_endpoint(update_session, 'file'),
        data={'ot2-system.zip': open(downloaded_update_file, 'rb')})
    assert resp.status == 201
    body = await resp.json()
    assert body['stage'] == 'validating'
    assert 'progress' in body
    # Wait through validation
    then = loop.time()
    while loop.time() - then <= 300:
        status_resp = await otupdate_test_client.get(
            session_endpoint(update_session, 'status'))
        assert status_resp.status == 200
        status_body = await status_resp.json()
        if status_body['stage'] not in ('writing', 'validating'):
            break

    assert status_body['stage'] == 'done'


@pytest.mark.exclude_boot_vfat
async def test_update_catches_validation_fail(otupdate_test_client,
                                              update_session,
                                              downloaded_update_file, loop):
    # Upload
    resp = await otupdate_test_client.post(
        session_endpoint(update_session, 'file'),
        data={'ot2-system.zip': open(downloaded_update_file, 'rb')})
    assert resp.status == 201
    body = await resp.json()
    assert body['stage'] == 'validating'
    assert 'progress' in body
    await asyncio.sleep(0.1)
    resp = await otupdate_test_client.get(
        session_endpoint(update_session, 'status'))
    body = await resp.json()
    assert body['stage'] == 'error'
    assert body['error'] == 'File Missing'
