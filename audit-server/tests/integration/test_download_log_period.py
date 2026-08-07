import io
import tempfile
import zipfile
from pathlib import Path

import httpx

from ..dev_server import DevServer


async def test_download_log_period_current_period(run_server: DevServer) -> None:
    """Test downloading the current period."""
    async with httpx.AsyncClient() as client:
        # Enable logging
        response = await client.patch(
            f"{run_server.base_url}/audit/internal/loggingEnabled",
            json={
                "data": {
                    "loggingEnabled": True,
                    "accountName": "testAccountName",
                    "legalName": "testLegalName",
                    "reason": "enabled for integration testing",
                }
            },
        )
        response.raise_for_status()

        # Post a message for the user log
        response = await client.post(
            f"{run_server.base_url}/audit/internal/logMessage",
            json={
                "data": {
                    "action": "test action",
                    "accountName": "testAccountName",
                    "legalName": "testLegalName",
                    "message": "testMessage",
                    "reason": "dunno",
                }
            },
        )
        response.raise_for_status()

        response = await client.get(f"{run_server.base_url}/audit/external/logPeriods")
        period_id = response.json()["data"][0]["id"]

        response = await client.get(
            f"{run_server.base_url}/audit/external/logPeriods/{period_id}/download"
        )
        log_zip = response.content

        # the download hands back a one-time deletion key in a response header
        deletion_key = response.headers.get("opentrons-log-period-deletion-key")
        assert deletion_key

        with zipfile.ZipFile(io.BytesIO(log_zip), mode="r") as zf:
            file_list = zf.namelist()
            assert file_list == [
                "log_period.json",
                "signing_key.pem",
                "robot_identity.json",
                "my_cool_protocol_2026-01-01T18_00_00.123Z.json",
            ]


async def test_download_log_period_not_current(run_server: DevServer) -> None:
    """Test downloading a not current log period."""
    async with httpx.AsyncClient() as client:
        # Enable logging
        response = await client.patch(
            f"{run_server.base_url}/audit/internal/loggingEnabled",
            json={
                "data": {
                    "loggingEnabled": True,
                    "accountName": "testAccountName",
                    "legalName": "testLegalName",
                    "reason": "enabled for integration testing",
                }
            },
        )
        response.raise_for_status()

        # Post a message for the user log
        response = await client.post(
            f"{run_server.base_url}/audit/internal/logMessage",
            json={
                "data": {
                    "action": "test action",
                    "accountName": "testAccountName",
                    "legalName": "testLegalName",
                    "message": "testMessage",
                    "reason": "dunno",
                }
            },
        )
        response.raise_for_status()

        # This will rotate the logs
        with tempfile.NamedTemporaryFile() as temp_file:
            temp_file_name = Path(temp_file.name).name
            response = await client.post(
                f"{run_server.base_url}/audit/internal/storeRobotLog",
                files={"file": temp_file.file},
            )
            response.raise_for_status()

        response = await client.get(f"{run_server.base_url}/audit/external/logPeriods")
        period_id = response.json()["data"][0]["id"]

        response = await client.get(
            f"{run_server.base_url}/audit/external/logPeriods/{period_id}/download"
        )
        log_zip = response.content

        # the download hands back a one-time deletion key in a response header
        deletion_key = response.headers.get("opentrons-log-period-deletion-key")
        assert deletion_key

        with zipfile.ZipFile(io.BytesIO(log_zip), mode="r") as zf:
            file_list = zf.namelist()
            assert file_list == [
                "log_period.json",
                "signing_key.pem",
                "robot_identity.json",
                temp_file_name,
            ]
