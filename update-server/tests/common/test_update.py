"""Consolidated update tests for openembedded and buildroot"""

import asyncio
import binascii
import hashlib
import os
import threading
import time
import zipfile
from typing import Callable, Tuple
from unittest.mock import MagicMock

import pytest

from tests.http_client import UpdateServerClient
from tests.openembedded.conftest import (
    mock_partition_manager_valid_switch_,
)

from otupdate.common import config, file_actions, update, update_actions
from otupdate.common.session import Stages, UpdateSession, get_current_session
from otupdate.common.update_actions import Partition, UpdateActionsInterface
from otupdate.openembedded import OT3UpdateActions, RootFSInterface


@pytest.fixture
async def update_session(test_cli: Tuple[UpdateServerClient, str]):
    resp = await test_cli[0].post("/server/update/begin")
    body = resp.json()
    yield body["token"]
    await test_cli[0].post("/server/update/cancel")


def session_endpoint(token, endpoint):
    return f"/server/update/{token}/{endpoint}"


def current_session(test_cli: Tuple[UpdateServerClient, str]):
    return get_current_session(test_cli[0].asgi_app.state)


async def test_begin(test_cli: Tuple[UpdateServerClient, str]):
    # Creating a session with an empty body should work
    resp = await test_cli[0].post("/server/update/begin")
    body = resp.json()
    assert resp.status_code == 201
    assert "token" in body
    assert current_session(test_cli)
    assert current_session(test_cli).token == body["token"]
    assert body["auto_commit_and_restart"] is False

    # Creating a session twice shouldn’t
    resp = await test_cli[0].post("/server/update/begin")
    body = resp.json()
    assert resp.status_code == 409
    assert "message" in body


@pytest.mark.parametrize("auto_commit_and_restart", [True, False, None])
async def test_begin_with_params(
    test_cli: Tuple[UpdateServerClient, str],
    auto_commit_and_restart: bool | None,
) -> None:
    # Creating a session with parameters should reflect those parameters in the response body
    request_body = {}
    if auto_commit_and_restart is not None:
        request_body["auto_commit_and_restart"] = auto_commit_and_restart

    resp = await test_cli[0].post("/server/update/begin", json=request_body)
    body = resp.json()

    assert resp.status_code == 201
    assert "token" in body
    assert body["auto_commit_and_restart"] == (auto_commit_and_restart or False)


async def test_begin_invalid_request(test_cli: Tuple[UpdateServerClient, str]) -> None:
    resp = await test_cli[0].post("/server/update/begin", content="not json")
    body = resp.json()
    assert resp.status_code == 400
    assert body["error"] == "invalid-request"
    assert "message" in body
    assert current_session(test_cli) is None

    resp = await test_cli[0].post(
        "/server/update/begin",
        json={"auto_commit_and_restart": 1},
    )
    body = resp.json()
    assert resp.status_code == 400
    assert body["error"] == "invalid-request"
    assert body["message"] == "auto_commit_and_restart must be a boolean"
    assert current_session(test_cli) is None

    resp = await test_cli[0].post("/server/update/begin", content="null")
    body = resp.json()
    assert resp.status_code == 400
    assert body["error"] == "invalid-request"
    assert body["message"] == "Request body must be a JSON object"
    assert current_session(test_cli) is None


async def test_cancel(test_cli: Tuple[UpdateServerClient, str]):
    # cancelling when there’s a session should work great
    resp = await test_cli[0].post("/server/update/begin")
    assert current_session(test_cli)

    resp = await test_cli[0].post("/server/update/cancel")
    assert resp.status_code == 200
    assert current_session(test_cli) is None

    # and so should cancelling when there isn’t one

    resp = await test_cli[0].post("/server/update/cancel")
    assert resp.status_code == 200


async def _wait_for_thread_event(event: threading.Event, timeout: float = 5) -> None:
    deadline = time.monotonic() + timeout
    while not event.is_set():
        if time.monotonic() > deadline:
            raise AssertionError("timed out waiting for update pipeline")
        await asyncio.sleep(0.01)


def _install_mock_actions(
    test_cli: Tuple[UpdateServerClient, str],
) -> MagicMock:
    actions = MagicMock(spec=update_actions.UpdateActionsInterface)
    actions.validate_update.return_value = "rootfs"
    actions.write_update.return_value = Partition(2, "/dev/null")
    update_actions.install_update_actions(test_cli[0].asgi_app.state, actions)
    return actions


async def test_concurrent_begin_only_one_succeeds(
    test_cli: Tuple[UpdateServerClient, str],
) -> None:
    first, second = await asyncio.gather(
        test_cli[0].post("/server/update/begin"),
        test_cli[0].post("/server/update/begin"),
    )
    statuses = sorted(r.status_code for r in (first, second))
    assert statuses == [201, 409]
    assert current_session(test_cli) is not None


async def test_cancel_during_write_skips_autocommit_and_allows_begin(
    test_cli: Tuple[UpdateServerClient, str],
) -> None:
    write_started = threading.Event()
    actions = _install_mock_actions(test_cli)

    def slow_write(
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int = -1,
        file_size: object = None,
    ) -> Partition:
        write_started.set()
        for i in range(1000):
            progress_callback(i / 1000)
            time.sleep(0.01)
        return Partition(2, "/dev/null")

    actions.write_update.side_effect = slow_write

    begin = await test_cli[0].post(
        "/server/update/begin", json={"auto_commit_and_restart": True}
    )
    assert begin.status_code == 201
    token = begin.json()["token"]

    upload = await test_cli[0].post(
        session_endpoint(token, "file"),
        files={"system-update.zip": ("system-update.zip", b"pretend this is a zip")},
    )
    assert upload.status_code == 201

    await _wait_for_thread_event(write_started)

    cancel = await test_cli[0].post("/server/update/cancel")
    assert cancel.status_code == 200
    assert current_session(test_cli) is None

    actions.commit_update.assert_not_called()
    actions.restart.assert_not_called()

    retry = await test_cli[0].post("/server/update/begin")
    assert retry.status_code == 201
    assert current_session(test_cli) is not None
    assert current_session(test_cli).token == retry.json()["token"]


async def test_cancel_during_validate_does_not_write(
    test_cli: Tuple[UpdateServerClient, str],
) -> None:
    validate_started = threading.Event()
    actions = _install_mock_actions(test_cli)

    def slow_validate(
        filepath: str,
        progress_callback: Callable[[float], None],
        cert_path: object,
    ) -> str:
        validate_started.set()
        for i in range(1000):
            progress_callback(i / 1000)
            time.sleep(0.01)
        return "rootfs"

    actions.validate_update.side_effect = slow_validate

    begin = await test_cli[0].post("/server/update/begin")
    assert begin.status_code == 201
    token = begin.json()["token"]

    upload = await test_cli[0].post(
        session_endpoint(token, "file"),
        files={"system-update.zip": ("system-update.zip", b"pretend this is a zip")},
    )
    assert upload.status_code == 201

    await _wait_for_thread_event(validate_started)

    cancel = await test_cli[0].post("/server/update/cancel")
    assert cancel.status_code == 200
    assert current_session(test_cli) is None
    actions.write_update.assert_not_called()
    actions.commit_update.assert_not_called()
    actions.restart.assert_not_called()


async def test_commit_fails_wrong_state(test_cli, update_session):
    resp = await test_cli[0].post(session_endpoint(update_session, "commit"))
    assert resp.status_code == 409


@pytest.fixture(
    params=[
        (
            0,
            lambda: OT3UpdateActions(
                RootFSInterface(), mock_partition_manager_valid_switch_()
            ),
        ),
    ]
)
def sys_handler(request):
    return request.param


async def test_updater_chain(
    otupdate_config,
    downloaded_update_file_consolidated,
    loop,
    testing_partition,
    sys_handler,
):
    conf = config.load_from_path(otupdate_config)
    session = UpdateSession(
        storage_path=conf.download_storage_path,
        auto_commit_and_restart=False,
    )
    fut = update._begin_validation(
        session,
        conf,
        loop,
        downloaded_update_file_consolidated.pop(sys_handler[0]),
        sys_handler[1](),
    )
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


@pytest.mark.exclude_rootfs_ext4
async def test_session_catches_validation_fail(
    otupdate_config,
    downloaded_update_file_consolidated,
    loop,
    sys_handler,
):
    conf = config.load_from_path(otupdate_config)
    session = UpdateSession(
        storage_path=conf.download_storage_path,
        auto_commit_and_restart=False,
    )
    fut = update._begin_validation(
        session,
        conf,
        loop,
        downloaded_update_file_consolidated.pop(sys_handler[0]),
        sys_handler[1](),
    )
    with pytest.raises(file_actions.FileMissing):
        await fut
    assert session.state["stage"] == "error"
    assert session.stage == Stages.ERROR
    assert "error" in session.state
    assert "message" in session.state


async def test_update_happypath(
    test_cli: Tuple[UpdateServerClient, str],
    update_session,
    downloaded_update_file_consolidated,
    loop,
    testing_partition,
    monkeypatch,
    mock_partition_manager_valid_switch,
    extracted_update_file_consolidated,
):
    updaters = [
        OT3UpdateActions(
            root_FS_intf=RootFSInterface(),
            part_mngr=mock_partition_manager_valid_switch,
        ),
    ]

    # Upload
    if test_cli[1] == "otupdate.openembedded":
        monkeypatch.setattr(
            UpdateActionsInterface, "from_app_state", lambda x: updaters[0]
        )
        resp = await test_cli[0].post(
            session_endpoint(update_session, "file"),
            files={
                os.path.basename(downloaded_update_file_consolidated[0]): open(
                    downloaded_update_file_consolidated[0], "rb"
                )
            },
        )
    elif test_cli[1] == "otupdate.buildroot":
        monkeypatch.setattr(
            UpdateActionsInterface, "from_app_state", lambda x: updaters[1]
        )
        resp = await test_cli[0].post(
            session_endpoint(update_session, "file"),
            files={
                os.path.basename(downloaded_update_file_consolidated[1]): open(
                    downloaded_update_file_consolidated[1], "rb"
                )
            },
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["stage"] == "validating"
    assert "progress" in body
    # Wait through validation
    then = loop.time()
    last_progress = 0.0
    while body["stage"] == "validating":
        assert body["progress"] >= last_progress
        resp = await test_cli[0].get(session_endpoint(update_session, "status"))
        assert resp.status_code == 200
        body = resp.json()

        last_progress = body["progress"]
        assert loop.time() - then <= 300

    if body["stage"] == "writing":
        # Wait through write
        then = loop.time()
        last_progress = 0.0
        while body["stage"] == "writing":
            assert body["progress"] >= last_progress
            resp = await test_cli[0].get(session_endpoint(update_session, "status"))
            assert resp.status_code == 200
            body = resp.json()
            last_progress = body["progress"]
            assert loop.time() - then <= 300

    assert body["stage"] == "done"

    if test_cli[1] == "otupdate.buildroot":
        with zipfile.ZipFile(downloaded_update_file_consolidated[1], "r") as zf:
            tp_hasher = hashlib.sha256()
            fd = open(testing_partition, "rb")
            tp_hasher.update(fd.read())
            tp_hash = binascii.hexlify(tp_hasher.digest())
            assert tp_hash == zf.read("rootfs.ext4.hash").strip()
            fd.close()
    if test_cli[1] == "otupdate.openembedded":
        with zipfile.ZipFile(downloaded_update_file_consolidated[0], "r") as zf:
            tp_hasher = hashlib.sha256()
            fd = open(testing_partition, "rb")
            tp_hasher.update(fd.read())
            tp_hash = binascii.hexlify(tp_hasher.digest())
            assert tp_hash == zf.read("tmp_uncomp_xz_hash_path").strip()
            fd.close()
