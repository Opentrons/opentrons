import httpx
import pytest

from ..dev_server import DevServer


@pytest.fixture
async def enable_logging(run_server: DevServer) -> None:
    """Enable logging to the database."""
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{run_server.base_url}/audit/internal/loggingEnabled",
            json={"data": {"loggingEnabled": True}},
        )
        response.raise_for_status()
