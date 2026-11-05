import os
import tempfile
from pathlib import Path

import pytest
from decoy import Decoy
from fastapi.responses import FileResponse
from mock import patch

from opentrons.system import camera
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.camera.settings.store import CameraSettingStore
from robot_server.runs.run_data_manager import (
    RunDataManager,
    RunOrchestratorStore,
    RunStore,
)
from robot_server.service.legacy.models.settings import CameraCaptureImageSettings
from robot_server.service.legacy.routers.camera import (
    add_camera_capture_image_settings,
    post_camera_preview_image,
)


@pytest.fixture
def mock_take_picture():
    with patch(
        "robot_server.service.legacy.routers.camera.camera.take_picture",
        spec=camera.take_picture,
    ) as m:
        yield m


@pytest.fixture(autouse=True)
def mock_camera_configuration_filepath(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out the camera stream configuration data query."""
    monkeypatch.setattr(
        camera,
        "get_stream_configuration_filepath",
        decoy.mock(func=camera.get_stream_configuration_filepath),
    )


@pytest.fixture(autouse=True)
def mock_camera_live_stream_compatible(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock the robot supports live stream logics."""
    monkeypatch.setattr(
        camera,
        "robot_supports_livestream",
        decoy.mock(func=camera.robot_supports_livestream),
    )


@pytest.fixture(autouse=True)
def mock_camera_restart_live_stream(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out the opentrons.camera live stream service restarter."""
    monkeypatch.setattr(
        camera,
        "restart_live_stream",
        decoy.mock(func=camera.restart_live_stream),
    )


@pytest.fixture
def mock_set_adv_setting():
    with patch(
        "robot_server.service.legacy.routers.settings.advanced_settings.set_adv_setting"
    ) as p:
        yield p


@pytest.fixture()
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore interface."""
    return decoy.mock(cls=RunStore)


@pytest.fixture()
def mock_run_orchestrator_store(decoy: Decoy) -> RunOrchestratorStore:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=RunOrchestratorStore)


@pytest.fixture()
def mock_run_data_manager(decoy: Decoy) -> RunDataManager:
    """Get a mock EngineStore interface."""
    return decoy.mock(cls=RunDataManager)


@pytest.fixture
def mock_camera_setting_store(decoy: Decoy) -> CameraSettingStore:
    """Get a mock CameraSettingStore."""
    return decoy.mock(cls=CameraSettingStore)


def test_camera_exception(mock_take_picture, api_client):
    """
    Test that we return a HTTP 500 error during the legacy camera
    endpoint exception case.
    """

    async def raise_it(filename, loop=None):
        raise camera.CameraException("No", "sorry")

    mock_take_picture.side_effect = raise_it

    res = api_client.post("/camera/picture")
    assert res.status_code == 500


def test_camera_success(mock_take_picture, api_client):
    """
    Test that we return the contents of the file we direct camera to write
    image to.
    """
    state = {}

    async def fake_picture(filename, loop=None):
        # Save the filename
        state["filename"] = filename
        # Write some junk to the file
        with open(filename, "wb") as f:
            f.write(b"test image")

    mock_take_picture.side_effect = fake_picture

    res = api_client.post("/camera/picture")
    assert res.status_code == 200
    assert res.content == b"test image"
    # Make sure the tempfile was deleted
    assert os.path.exists(state["filename"]) is False


async def test_camera_get(api_client_camera_overrides):
    """
    Test that we can GET and POST the robots camera enablement status.
    """
    get_res = api_client_camera_overrides.get("/camera")
    assert get_res.json() == {
        "cameraEnabled": True,
        "liveStreamEnabled": True,
        "errorRecoveryCameraEnabled": True,
    }


async def test_camera_stream_enable(api_client_camera_overrides, decoy: Decoy):
    """
    Test that we can GET the Opentrons Live Stream enablement status.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"BOOT_ID=BANANAS\n"
            b"STATUS=ON\n"
            b"SOURCE=ABC\n"
            b"RESOLUTION=10x20\n"
            b"FRAMERATE=1\n"
            b"BITRATE=2000K\n"
        )
        conf.flush()
        conf.seek(0)

        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        get_stream = api_client_camera_overrides.get("/camera/stream")
        assert get_stream.json() == {
            "enabled": True,
            "hls": "/hls/stream.m3u",
            "rtmp": "/live/stream",
        }


async def test_camera_stream_settings_flex(api_client_camera_overrides, decoy: Decoy):
    """
    Test that we can GET and POST settings to the Opentrons Live Stream.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"BOOT_ID=BANANAS\n"
            b"STATUS=OFF\n"
            b"SOURCE=ABC\n"
            b"RESOLUTION=10x20\n"
            b"FRAMERATE=1\n"
            b"BITRATE=2000K\n"
        )
        conf.flush()
        conf.seek(0)
        decoy.when(camera.robot_supports_livestream("OT-3 Standard")).then_return(True)
        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        post_settings = api_client_camera_overrides.post(
            "/camera/stream/settings",
            json={
                "data": {
                    "source": "cookie-monster",
                    "resolution": {"height": 10, "width": 20},
                    "framerate": 10,
                    "bitrate_k": 2000,
                }
            },
        )
        assert post_settings.json() == {
            "errorCode": "4000",
            "message": "No video device found with device path: cookie-monster",
        }

        # Of note, the handler automatically cleans up input sources to include quotations
        post_settings = api_client_camera_overrides.post(
            "/camera/stream/settings",
            json={
                "data": {
                    "source": "NONE",
                    "resolution": {"height": 10, "width": 20},
                    "framerate": 10,
                    "bitrate_k": 2000,
                }
            },
        )
        get_settings = api_client_camera_overrides.get("/camera/stream/settings")
        assert get_settings.json() == {
            "source": '"NONE"',
            "resolution": {"height": 10, "width": 20},
            "framerate": 10,
            "bitrate_k": 2000,
        }


async def test_camera_stream_settings_ot2(api_client_camera_overrides, decoy: Decoy):
    """
    Test that we can GET and POST settings to the Opentrons Live Stream.
    """
    with tempfile.NamedTemporaryFile() as conf:
        conf.write(
            b"BOOT_ID=BANANAS\n"
            b"STATUS=OFF\n"
            b"SOURCE=ABC\n"
            b"RESOLUTION=10x20\n"
            b"FRAMERATE=1\n"
            b"BITRATE=2000K\n"
        )
        conf.flush()
        conf.seek(0)
        decoy.when(camera.robot_supports_livestream("OT-2 Standard")).then_return(False)
        decoy.when(camera.get_stream_configuration_filepath()).then_return(
            Path(conf.name)
        )
        post_settings = api_client_camera_overrides.post(
            "/camera/stream/settings",
            json={
                "data": {
                    "source": "cookie-monster",
                    "resolution": {"height": 10, "width": 20},
                    "framerate": 10,
                    "bitrate_k": 2000,
                }
            },
        )
        assert post_settings.json() == {
            "errorCode": "4000",
            "message": "Opentrons Live Stream service is not available on OT-2.",
        }


async def test_camera_preview_image(
    decoy: Decoy,
    mock_camera_setting_store: CameraSettingStore,
    mock_run_data_manager: RunDataManager,
):
    """Test that we can send a POST request for a preview image with a collection of image settings."""
    with tempfile.NamedTemporaryFile() as conf:
        decoy.when(mock_run_data_manager.current_run_id).then_return(None)
        decoy.when(mock_camera_setting_store.get_camera_enabled()).then_return(True)
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
            camera_settings_store=mock_camera_setting_store,
            run_data_manager=mock_run_data_manager,
            images_directory=Path(conf.name),
            robot_type="OT-3 Standard",
        )
        assert isinstance(response, FileResponse)


async def test_camera_add_capture_image_settings(
    decoy: Decoy,
    mock_camera_setting_store: CameraSettingStore,
):
    """Test that we add global image capture settings."""
    decoy.when(
        mock_camera_setting_store.get_camera_capture_image_settings()
    ).then_return(
        CameraCaptureImageSettings(
            cameraId=None,
            resolution=(720, 1280),
            zoom=1.5,
            pan=(0, 0),
            contrast=25.0,
            brightness=50.0,
            saturation=75.0,
        )
    )
    response = await add_camera_capture_image_settings(
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
        camera_settings_store=mock_camera_setting_store,
    )
    assert isinstance(response, CameraCaptureImageSettings)
