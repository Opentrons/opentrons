"""Tests for camera /runs/{runId}/camera routes."""

import tempfile
from datetime import datetime
from pathlib import Path

import pytest
from decoy import Decoy
from fastapi.responses import FileResponse

from opentrons.protocol_engine import EngineStatus
from server_utils.fastapi_utils.models.json_api.request import RequestModel

from robot_server.runs.router.camera_router import (
    add_camera_capture_image_settings,
    get_camera_capture_image_settings,
    post_camera_preview_image,
)
from robot_server.runs.run_models import Run
from robot_server.runs.run_orchestrator_store import RunOrchestratorStore
from robot_server.service.legacy.models.settings import CameraCaptureImageSettings


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
        logPeriodId=None,
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
        cameraId="ot_system_camera",
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
        await mock_run_orchestrator_store.add_camera_capture_image_settings(
            image_settings
        )
    )

    assert result.content.data == image_settings
    assert result.status_code == 201

    decoy.when(
        await mock_run_orchestrator_store.get_camera_capture_image_settings(
            "ot_system_camera"
        )
    ).then_return(image_settings)

    get_settings_result = await get_camera_capture_image_settings(
        cameraId="ot_system_camera",
        run_orchestrator_store=mock_run_orchestrator_store,
    )

    assert get_settings_result == image_settings


async def test_camera_preview_image(
    decoy: Decoy,
    run: Run,
) -> None:
    """Test that we can request a preview image with a collection of image settings based on run specific enablement."""
    with tempfile.NamedTemporaryFile() as conf:
        response = await post_camera_preview_image(
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
        assert isinstance(response, FileResponse)
