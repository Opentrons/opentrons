import io
import zipfile

import httpx

from ..dev_server import DevServer


async def test_download_log_period(run_server: DevServer) -> None:
    """Enable logging to the database."""
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
            ]
