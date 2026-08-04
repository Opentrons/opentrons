import tempfile

import httpx

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

        with tempfile.NamedTemporaryFile() as temp_file:
            response = await client.post(
                f"{run_server.base_url}/audit/internal/storeRobotLog",
                files={"file": temp_file.file},
            )
            response.raise_for_status()
            assert response.json()["data"]["loggingEnabled"]
