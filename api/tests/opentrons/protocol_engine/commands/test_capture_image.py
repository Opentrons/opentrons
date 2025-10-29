"""Test capture image command."""

import pytest
import mock
from decoy import Decoy

from opentrons.system import camera
from opentrons.system import ffmpeg
from opentrons.protocol_engine.resources import FileProvider, CameraProvider
from opentrons.protocol_engine.resources.camera_provider import CameraSettings
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import PreconditionTypes
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.capture_image import (
    CaptureImageParams,
    CaptureImageImpl,
)


from opentrons.protocol_engine.errors import (
    CameraCaptureError,
    CameraDisabledError,
    CameraSettingsInvalidError,
)
from opentrons.system.camera import image_capture


@pytest.fixture(autouse=True)
def mock_ffmpeg_image_capture(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out the opentrons.ffmpeg image byte capture service."""
    monkeypatch.setattr(
        ffmpeg,
        "ffmpeg_capture_image_bytes",
        decoy.mock(func=ffmpeg.ffmpeg_capture_image_bytes),
    )


@pytest.fixture(autouse=True)
def mock_camera_stop_live_stream(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out the opentrons.camera live stream service stopper."""
    monkeypatch.setattr(
        camera,
        "stop_live_stream",
        decoy.mock(func=camera.stop_live_stream),
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
def camera_provider_image_capture() -> CameraProvider:
    """Creates a CameraProvider with image_capture hookups."""
    return CameraProvider(
        camera_settings_callback=None, image_capture_callback=image_capture
    )


@pytest.mark.parametrize(
    argnames=[
        "zoom",
        "contrast",
        "brightness",
        "saturation",
    ],
    argvalues=[
        [3.0, None, None, None],
        [-1.0, None, None, None],
        [None, 101.0, None, None],
        [None, -1.0, None, None],
        [None, None, 101.0, None],
        [None, None, -1.0, None],
        [None, None, None, 101.0],
        [None, None, None, -1.0],
    ],
)
async def test_raises_camera_settings_invalid_error(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider_image_capture: CameraProvider,
    zoom: float | None,
    brightness: int | None,
    contrast: float | None,
    saturation: float | None,
) -> None:
    """It should raise CameraSettingsInvalidError when parameters would exceed limits."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider_image_capture,
    )
    params = CaptureImageParams(
        fileName=None,
        zoom=zoom,
        brightness=brightness,
        contrast=contrast,
        saturation=saturation,
    )
    decoy.when(state_view.files.get_filecount()).then_return(0)

    with mock.patch("os.path.exists", mock.Mock(return_value=True)):
        with pytest.raises(CameraSettingsInvalidError):
            await subject.execute(params=params)


async def test_raises_camera_disabled_error(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider: CameraProvider,
) -> None:
    """It should raise CameraDisabledError when the camera is not enabled in the boolean settings."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider,
    )
    params = CaptureImageParams(fileName=None)
    decoy.when(state_view.files.get_filecount()).then_return(0)
    decoy.when(await camera_provider.get_camera_settings()).then_return(
        CameraSettings(
            cameraEnabled=False,
            liveStreamEnabled=False,
            errorRecoveryEnabled=False,
        )
    )

    with pytest.raises(CameraDisabledError):
        await subject.execute(params=params)


async def test_raises_camera_camera_capture_error(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider_image_capture: CameraProvider,
) -> None:
    """It should raise CameraCaptureError when a camera device doesn't exist."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider_image_capture,
    )
    params = CaptureImageParams(fileName=None)
    decoy.when(state_view.files.get_filecount()).then_return(0)
    # Without decoying the video device this will return an error because the device doesn't exist
    with pytest.raises(CameraCaptureError):
        await subject.execute(params=params)


async def test_capture_image_returns_success(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider_image_capture: CameraProvider,
) -> None:
    """It should return the successful result of an image capture with valid parameters."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider_image_capture,
    )
    params = CaptureImageParams(fileName="coolpic")
    decoy.when(state_view.files.get_filecount()).then_return(0)

    with mock.patch("os.path.exists", mock.Mock(return_value=True)):
        result = await subject.execute(params=params)
        assert isinstance(result, SuccessData)


async def test_ensure_camera_used_precondition_set(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider_image_capture: CameraProvider,
) -> None:
    """It should validate that the isCamerUsed precondition is set after an image is captured."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider_image_capture,
    )
    params = CaptureImageParams(fileName="coolpic")
    decoy.when(state_view.files.get_filecount()).then_return(0)

    with mock.patch("os.path.exists", mock.Mock(return_value=True)):
        result = await subject.execute(params=params)
        assert isinstance(result, SuccessData)
        assert isinstance(
            result.state_update.precondition_update, update_types.PreconditionUpdate
        )
        assert result.state_update.precondition_update.preconditions == {
            PreconditionTypes.IS_CAMERA_USED: True
        }
