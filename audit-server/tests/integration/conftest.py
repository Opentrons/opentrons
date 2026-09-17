from io import BytesIO

import httpx
import pytest

from ..dev_server import DevServer


@pytest.fixture
async def enable_logging(run_server: DevServer) -> None:
    """Enable logging to the database."""
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{run_server.base_url}/audit/internal/loggingEnabled",
            json={
                "data": {
                    "loggingEnabled": True,
                    "accountName": "test",
                    "legalName": "Test",
                    "reason": "enabled for integration testing",
                }
            },
        )
        response.raise_for_status()


@pytest.fixture
async def ensure_inactive_period(run_server: DevServer, enable_logging: None) -> None:
    """Make sure the logs have been rotated at least once."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{run_server.base_url}/audit/internal/storeRobotLog",
            files={"file": BytesIO(b"hello world")},
        )
        response.raise_for_status()
