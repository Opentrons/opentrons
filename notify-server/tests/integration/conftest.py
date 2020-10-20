"""Integration test fixtures."""

import json
from os import environ
import asyncio
from typing import AsyncGenerator

import pytest


@pytest.fixture(scope="session")
def integration_environment() -> None:
    """Set up the settings environment."""
    # Set up the publisher and server addresses.
    environ['OT_NOTIFY_SERVER_publisher_address'] =\
        json.dumps({"scheme": "ipc", "path": "/tmp/ot2_ns_pub"})
    environ['OT_NOTIFY_SERVER_subscriber_address'] =\
        json.dumps({"scheme": "ipc", "path": "/tmp/ot2_ns_sub"})
    # Set production to false
    environ['OT_NOTIFY_SERVER_production'] = "false"


@pytest.fixture
async def server_fixture(integration_environment: None) -> AsyncGenerator:
    """Server fixture."""
    from notify_server.main import run
    task = asyncio.create_task(run())
    yield task
    task.cancel()
