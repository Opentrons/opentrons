"""Tests for camera /runs/{runId}/camera routes."""
import pytest
from datetime import datetime
from pathlib import Path
import tempfile
from decoy import Decoy

from robot_server.service.json_api import RequestModel

from robot_server.runs.router.camera_router import (
    add_camera_capture_image_settings,
    post_camera_preview_image,
)
from robot_server.runs.run_models import Run
from robot_server.runs.run_orchestrator_store import RunOrchestratorStore
from opentrons.protocol_engine import EngineStatus
from opentrons.protocol_engine.resources.camera_provider import ImageParameters
from robot_server.service.legacy.models.settings import CameraCaptureImageSettings
from opentrons.system import camera


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


async def test_camera_preview_image(
    decoy: Decoy,
    run: Run,
) -> None:
    """Test that we can request a preview image with a collection of image settings based on run specific enablement."""
    with tempfile.NamedTemporaryFile() as conf:
        await post_camera_preview_image(
            request_body=RequestModel(
                data=CameraCaptureImageSettings(
                    cameraId=None,
                    resolution=(720, 1280),
                    zoom=1.5,
                    pan=(0, 0),
                    contrast=25.0,
                    brightness=50.0,
                    saturation=75.0,
                )
            ),
            run=run,
            images_directory=Path(conf.name),
            robot_type="OT-3 Standard",
        )
        decoy.verify(
            await camera.image_capture(
                robot_type="OT-3 Standard",
                parameters=ImageParameters(
                    resolution=(720, 1280),
                    zoom=1.5,
                    pan=(0, 0),
                    contrast=0.5,
                    brightness=0,
                    saturation=1.5,
                ),
            ),
            times=1,
        )
