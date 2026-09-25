"""Tests for POST /server/update/{session}/file.

test_update.py covers this endpoint as part of a full update run, but those
tests are currently skipped, so these cover the multipart handling on its own.
"""

import asyncio
import hashlib
import os
from typing import Tuple
from unittest.mock import MagicMock

import pytest

from tests.http_client import UpdateServerClient

from otupdate.common import update_actions
from otupdate.common.config import get_config


@pytest.fixture
def mock_update_actions(
    test_cli: Tuple[UpdateServerClient, str],
) -> MagicMock:
    """Install update actions that don't touch any real hardware."""
    actions = MagicMock(spec=update_actions.UpdateActionsInterface)
    actions.validate_update.return_value = "rootfs"
    update_actions.install_update_actions(test_cli[0].asgi_app.state, actions)
    return actions


@pytest.fixture
async def update_session(test_cli: Tuple[UpdateServerClient, str]) -> str:
    response = await test_cli[0].post("/server/update/begin")
    return str(response.json()["token"])


def _download_dir(test_cli: Tuple[UpdateServerClient, str]) -> str:
    return get_config(test_cli[0].asgi_app.state).download_storage_path


async def test_upload_streams_file_to_download_dir(
    test_cli: Tuple[UpdateServerClient, str],
    update_session: str,
    mock_update_actions: MagicMock,
) -> None:
    """The accepted part is written to disk byte for byte, and others are dropped."""
    # Big enough to span many chunks of the incoming request body.
    payload = os.urandom(5 * 1024 * 1024)

    response = await test_cli[0].post(
        f"/server/update/{update_session}/file",
        files={
            "not-an-update.zip": ("not-an-update.zip", b"decoy"),
            "system-update.zip": ("system-update.zip", payload),
        },
    )

    assert response.status_code == 201

    download_dir = _download_dir(test_cli)
    assert os.listdir(download_dir) == ["system-update.zip"]
    with open(os.path.join(download_dir, "system-update.zip"), "rb") as f:
        assert hashlib.md5(f.read()).hexdigest() == hashlib.md5(payload).hexdigest()


async def test_upload_starts_validation_in_the_background(
    test_cli: Tuple[UpdateServerClient, str],
    update_session: str,
    mock_update_actions: MagicMock,
) -> None:
    """Validation is kicked off after the response, and reported by the status endpoint."""
    response = await test_cli[0].post(
        f"/server/update/{update_session}/file",
        files={"system-update.zip": ("system-update.zip", b"pretend this is a zip")},
    )
    assert response.status_code == 201
    # the response should eagerly change the stage
    assert response.json()["stage"] == "validating"

    await asyncio.sleep(0.05)

    status = await test_cli[0].get(f"/server/update/{update_session}/status")
    assert status.status_code == 200
    assert status.json()["stage"] in ("validating", "writing", "done")
    assert mock_update_actions.validate_update.called


async def test_upload_without_a_recognized_field(
    test_cli: Tuple[UpdateServerClient, str],
    update_session: str,
    mock_update_actions: MagicMock,
) -> None:
    response = await test_cli[0].post(
        f"/server/update/{update_session}/file",
        files={"not-an-update.zip": ("not-an-update.zip", b"decoy")},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "no-file-name"


async def test_upload_twice_in_one_session(
    test_cli: Tuple[UpdateServerClient, str],
    update_session: str,
    mock_update_actions: MagicMock,
) -> None:
    first = await test_cli[0].post(
        f"/server/update/{update_session}/file",
        files={"system-update.zip": ("system-update.zip", b"pretend this is a zip")},
    )
    assert first.status_code == 201

    second = await test_cli[0].post(
        f"/server/update/{update_session}/file",
        files={"system-update.zip": ("system-update.zip", b"pretend this is a zip")},
    )
    assert second.status_code == 409
    assert second.json()["error"] == "file-already-uploaded"


async def test_upload_to_an_unknown_session(
    test_cli: Tuple[UpdateServerClient, str],
    update_session: str,
    mock_update_actions: MagicMock,
) -> None:
    response = await test_cli[0].post(
        "/server/update/not-a-real-token/file",
        files={"system-update.zip": ("system-update.zip", b"pretend this is a zip")},
    )

    assert response.status_code == 404
    assert response.json()["error"] == "bad-token"
