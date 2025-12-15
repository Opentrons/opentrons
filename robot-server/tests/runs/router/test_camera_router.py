"""Tests for camera /runs/{runId}/camera routes."""
import pytest
from datetime import datetime
from decoy import Decoy

from robot_server.service.json_api import RequestModel

from robot_server.runs.router.camera_router import add_camera_capture_image_settings

from robot_server.service.legacy.models.settings import (
    CameraCaptureImageSettings,
)

from robot_server.runs.run_models import Run
from robot_server.runs.run_orchestrator_store import RunOrchestratorStore
from opentrons.protocol_engine import EngineStatus


@pytest.fixture()
def run() -> Run:
    """Get a fixture Run response data."""
    return Run(
        id="run-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.IDLE,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        modules=[],
        labwareOffsets=[],
        protocolId=None,
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )


@pytest.fixture
def mock_run_orchestrator_store(
    decoy: Decoy,
) -> RunOrchestratorStore:
    """Get a mock EngineStore."""
    mock = decoy.mock(cls=RunOrchestratorStore)
    decoy.when(mock.current_run_id).then_return("run-id")
    return mock


async def test_camera_settings(
    decoy: Decoy,
    run: Run,
    mock_run_orchestrator_store: RunOrchestratorStore,
) -> None:
    """It should be able to modify the capture image settings for a run."""
    image_settings = CameraCaptureImageSettings(
        cameraId="cool_cam",
        resolution=(1, 2),
        zoom=1.5,
        pan=(3, 4),
        contrast=75,
        brightness=55,
        saturation=25,
    )

    result = await add_camera_capture_image_settings(
        request_body=RequestModel(data=image_settings),
        run_orchestrator_store=mock_run_orchestrator_store,
        run=run,
    )

    decoy.verify(
        mock_run_orchestrator_store.add_camera_capture_image_settings(image_settings)
    )

    assert result.content.data == image_settings
    assert result.status_code == 201
