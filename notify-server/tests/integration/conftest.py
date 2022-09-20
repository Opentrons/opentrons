"""Integration test fixtures."""

import json
from asyncio import Task
from os import environ
import asyncio
from typing import AsyncGenerator

import pytest

from notify_server.settings import Settings


@pytest.fixture(scope="session")
def integration_environment() -> None:
    """Set up the settings environment."""
    # Set up the publisher and server addresses.
    environ["OT_NOTIFY_SERVER_publisher_address"] = json.dumps(
        {"scheme": "tcp", "host": "127.0.0.1", "port": 5555}
    )
    environ["OT_NOTIFY_SERVER_subscriber_address"] = json.dumps(
        {"scheme": "tcp", "host": "127.0.0.1", "port": 5556}
    )
    # Set production to false
    environ["OT_NOTIFY_SERVER_production"] = "false"


@pytest.fixture(scope="session")
def settings(integration_environment: None) -> Settings:
    """Create Settings."""
    return Settings()


@pytest.fixture
async def server_fixture(integration_environment: None) -> AsyncGenerator[Task, None]:
    """Server fixture."""
    from notify_server.main import run

    running_event = asyncio.Event()
    task = asyncio.create_task(run(running_event))
    await asyncio.wait_for(running_event.wait(), 12)
    yield task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
