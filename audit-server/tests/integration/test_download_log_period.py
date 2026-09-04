import io
import zipfile

import httpx
from server_utils.audit.audit_server import SubmitSupportingFileMessageData


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

        with zipfile.ZipFile(io.BytesIO(log_zip), mode="r") as zf:
            file_list = zf.namelist()
            assert file_list == [
                "log_period.json",
                "signing_key.pem",
                "robot_identity.json",
                "Flex_Cool_Protocol_2026-01-01T18_00_00.123Z.json",
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

        # post a "robot log" to force log period rotation
        response = await client.post(
            f"{run_server.base_url}/audit/internal/storeRobotLog",
            files={
                "file": ("robotlog.json", io.BytesIO(b"hi"), "application/json"),
                "supporting_info": (
                    "supporting_info.json",
                    io.BytesIO(
                        SubmitSupportingFileMessageData(
                            fileType="runrecord",
                            serverId="123123123",
                            accountName="steve",
                            legalName="Steve",
                            reason=None,
                        )
                        .model_dump_json()
                        .encode("utf-8")
                    ),
                    "application/json",
                ),
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
                "robotlog.json",
            ]
