""" These tests are common for openembedded and buildroot
"""
import asyncio
import binascii
import hashlib
import os
import zipfile

import pytest

from otupdate import openembedded, buildroot
from otupdate.buildroot import update, config, update_actions
from otupdate.common import file_actions
from otupdate.common.session import UpdateSession, Stages
from otupdate.openembedded import Updater
from tests.openembedded.conftest import mock_root_fs_interface, mock_partition_manager_valid_switch


@pytest.fixture
async def update_session(test_cli):
    resp = await test_cli.post("/server/update/begin")
    body = await resp.json()
    yield body["token"]
    await test_cli.post("/server/update/cancel")


def session_endpoint(token, endpoint):
    return f"/server/update/{token}/{endpoint}"


async def test_begin(test_cli):
    # Creating a session should work
    resp = await test_cli.post("/server/update/begin")
    body = await resp.json()
    assert resp.status == 201
    assert "token" in body
    assert test_cli.server.app.get(update.SESSION_VARNAME)
    assert test_cli.server.app[update.SESSION_VARNAME].token == body["token"]

    # Creating a session twice shouldn’t
    resp = await test_cli.post("/server/update/begin")
    body = await resp.json()
    assert resp.status == 409
    assert "message" in body


async def test_cancel(test_cli):
    # cancelling when there’s a session should work great
    resp = await test_cli.post("/server/update/begin")
    assert test_cli.server.app.get(update.SESSION_VARNAME)

    resp = await test_cli.post("/server/update/cancel")
    assert resp.status == 200
    assert test_cli.server.app.get(update.SESSION_VARNAME) is None

    # and so should cancelling when there isn’t one

    resp = await test_cli.post("/server/update/cancel")
    assert resp.status == 200


async def test_commit_fails_wrong_state(test_cli, update_session):
    resp = await test_cli.post(session_endpoint(update_session, "commit"))
    assert resp.status == 409


br_handler = update_actions.OT2UpdateActions()
oe_handler = Updater(
    root_FS_intf=mock_root_fs_interface,
    part_mngr=mock_partition_manager_valid_switch,
)


@pytest.mark.parametrize('sys_handler', [br_handler, oe_handler])
async def test_updater_chain(
        otupdate_config, downloaded_update_file_oe, downloaded_update_file_br, loop, testing_partition, sys_handler,

):
    conf = config.load_from_path(otupdate_config)
    session = UpdateSession(conf.download_storage_path)
    # handler = update_actions.OT2UpdateActions()
    if isinstance(sys_handler, Updater):
        fut = update._begin_validation(session, conf, loop, downloaded_update_file_oe, sys_handler)
    elif isinstance(sys_handler, update_actions.OT2UpdateActions):
        fut = update._begin_validation(session, conf, loop, downloaded_update_file_br, sys_handler)
    assert session.stage == Stages.VALIDATING
    last_progress = 0.0
    while session.stage == Stages.VALIDATING:
        assert session.state["progress"] >= last_progress
        assert session.state["stage"] == "validating"
        assert session.stage == Stages.VALIDATING
        last_progress = session.state["progress"]
        await asyncio.sleep(0.01)
    assert fut.done()
    last_progress = 0.0
    while session.stage == Stages.WRITING:
        assert session.state["progress"] >= last_progress
        last_progress = session.state["progress"]
        await asyncio.sleep(0.1)
    assert session.stage == Stages.DONE, session.error
