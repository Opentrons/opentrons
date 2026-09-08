import io
import tempfile

import httpx

from server_utils.audit.audit_server import SubmitSupportingFileMessageData

from ..dev_server import DevServer


async def test_store_robot_logs(run_server: DevServer) -> None:
    """It should store the robot log."""
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
        supporting_info = io.BytesIO(
            SubmitSupportingFileMessageData(
                fileType="runrecord",
                serverId="123123123",
                accountName="steve",
                legalName="Steve",
                reason=None,
            )
            .model_dump_json()
            .encode("utf-8")
        )
        with tempfile.NamedTemporaryFile() as temp_file:
            response = await client.post(
                f"{run_server.base_url}/audit/internal/storeRobotLog",
                files={"file": temp_file.file, "supporting_info": supporting_info},
            )
            response.raise_for_status()
            assert response.json()["data"]["loggingEnabled"]
