"""Test engine task core."""

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.clients import SyncClient as EngineClient


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


def test_get_created_at_timestamp(
    decoy: Decoy, mock_engine_client: EngineClient
) -> None:
    """It should get the created at timestamp from the engine."""
    task_id = "some-id"
    decoy.when(mock_engine_client.state.tasks.get(task_id)).then_return(
        matchers.Anything()
    )


def test_is_done(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get whether the task is done from the engine."""
    task_id = "some-id"
    decoy.when(mock_engine_client.state.tasks.get_finished(task_id)).then_return(
        matchers.Anything()
    )


def test_is_started(decoy: Decoy, mock_engine_client: EngineClient) -> None:
    """It should get whether the task is started from the engine."""
    task_id = "some-id"
    decoy.when(mock_engine_client.state.tasks.get_current(task_id)).then_return(
        matchers.Anything()
    )


def test_get_finished_at_timestamp(
    decoy: Decoy, mock_engine_client: EngineClient
) -> None:
    """It should get the finished at timestamp from the engine."""
    task_id = "some-id"
    decoy.when(mock_engine_client.state.tasks.get_finished(task_id)).then_return(
        matchers.Anything()
    )
