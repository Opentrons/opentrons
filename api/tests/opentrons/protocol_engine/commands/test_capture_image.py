"""Test capture image command."""

from typing import Tuple

import mock
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.capture_image import (
    CaptureImageImpl,
    CaptureImageParams,
    CaptureImageResult,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.errors import (
    CameraCaptureError,
    CameraDisabledError,
    CameraSettingsInvalidError,
    FileNameInvalidError,
)
from opentrons.protocol_engine.resources import CameraProvider, FileProvider
from opentrons.protocol_engine.resources.camera_provider import CameraSettings
from opentrons.protocol_engine.resources.file_provider import SPECIAL_CHARACTERS
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import PreconditionTypes
from opentrons.system import camera, ffmpeg
from opentrons.system.camera import RESOLUTION_DEFAULT, ZOOM_DEFAULT, image_capture


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
            errorRecoveryCameraEnabled=False,
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


@pytest.mark.parametrize(
    argnames=[
        "resolution",
        "result_resolution",
        "zoom",
        "result_zoom",
        "pan",
        "result_pan",
        "contrast",
        "result_contrast",
        "brightness",
        "result_brightness",
        "saturation",
        "result_saturation",
    ],
    argvalues=[
        [
            None,
            RESOLUTION_DEFAULT,
            None,
            ZOOM_DEFAULT,
            None,
            None,
            None,
            50,
            None,
            50,
            None,
            50,
        ],
        [
            (320, 240),
            (320, 240),
            1.5,
            1.5,
            (3, 4),
            (3, 4),
            25,
            25,
            10,
            10,
            75,
            75,
        ],
        [
            (320, 240),
            (320, 240),
            2.0,
            2.0,
            (3, 4),
            (3, 4),
            75,
            75,
            99,
            99,
            25,
            25,
        ],
        [
            (7680, 4320),
            (7680, 4320),
            1.0,
            1.0,
            (25, 45),
            (25, 45),
            21,
            21,
            11,
            11,
            59,
            59,
        ],
    ],
)
async def test_capture_image_returns_expected_params(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider_image_capture: CameraProvider,
    resolution: Tuple[int, int] | None,
    zoom: float | None,
    pan: Tuple[int, int] | None,
    contrast: float | None,
    brightness: float | None,
    saturation: float | None,
    result_resolution: Tuple[int, int],
    result_zoom: float,
    result_pan: Tuple[int, int] | None,
    result_contrast: float,
    result_brightness: float,
    result_saturation: float,
) -> None:
    """It should return the successful result of an image capture with valid parameters."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider_image_capture,
    )
    params = CaptureImageParams(
        fileName="coolpic",
        resolution=resolution,
        zoom=zoom,
        pan=pan,
        contrast=contrast,
        brightness=brightness,
        saturation=saturation,
    )
    decoy.when(state_view.files.get_filecount()).then_return(0)

    with mock.patch("os.path.exists", mock.Mock(return_value=True)):
        result = await subject.execute(params=params)
        assert result == SuccessData(
            public=CaptureImageResult(
                fileId=None,
                resolution=result_resolution,
                zoom=result_zoom,
                pan=result_pan,
                contrast=result_contrast,
                brightness=result_brightness,
                saturation=result_saturation,
            ),
            state_update=result.state_update,
        )


async def test_capture_image_result_has_clean_defaults(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider_image_capture: CameraProvider,
) -> None:
    """It should return the successful result of an image capture with all expected defaults."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider_image_capture,
    )
    params = CaptureImageParams(
        fileName="coolpic",
        resolution=None,
        zoom=None,
        pan=None,
        contrast=None,
        brightness=None,
        saturation=None,
    )
    decoy.when(state_view.files.get_filecount()).then_return(0)

    with mock.patch("os.path.exists", mock.Mock(return_value=True)):
        result = await subject.execute(params=params)
        assert result == SuccessData(
            public=CaptureImageResult(
                fileId=None,
                resolution=(1920, 1080),
                zoom=1.0,
                pan=None,
                contrast=50,
                brightness=50,
                saturation=50,
            ),
            state_update=result.state_update,
        )


async def test_raises_filename_error(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider: CameraProvider,
) -> None:
    """It should raise FileNameInvalidError when the capture image command is provided a bad file name."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider,
    )
    for char in SPECIAL_CHARACTERS:
        params = CaptureImageParams(fileName="badname" + char)
        with pytest.raises(FileNameInvalidError):
            await subject.execute(params=params)


@pytest.mark.parametrize(
    argnames=[
        "zoom",
        "contrast",
        "brightness",
        "saturation",
        "resolution",
    ],
    argvalues=[
        [0.9, 1, 1, 1, (1920, 1080)],
        [2.1, 1, 1, 1, (1920, 1080)],
        [1, -1, 1, 1, (1920, 1080)],
        [1, 101, 1, 1, (1920, 1080)],
        [1, 1, -1, 1, (1920, 1080)],
        [1, 1, 101, 1, (1920, 1080)],
        [1, 1, 1, -1, (1920, 1080)],
        [1, 1, 1, 101, (1920, 1080)],
        [1, 1, 1, 1, (0, 0)],
        [1, 1, 1, 1, (10000, 10000)],
    ],
)
async def test_raises_image_parameter_error(
    decoy: Decoy,
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider_image_capture: CameraProvider,
    zoom: float,
    contrast: float,
    brightness: float,
    saturation: float,
    resolution: Tuple[int, int],
) -> None:
    """It should raise CameraSettingsInvalidError when the capture image command is provided bad filter params."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider_image_capture,
    )
    params = CaptureImageParams(
        resolution=resolution,
        zoom=zoom,
        contrast=contrast,
        brightness=brightness,
        saturation=saturation,
    )

    decoy.when(state_view.files.get_filecount()).then_return(0)

    with mock.patch("os.path.exists", mock.Mock(return_value=True)):
        with pytest.raises(CameraSettingsInvalidError):
            await subject.execute(params=params)


async def test_raises_bad_resolution_and_zoom(
    state_view: StateView,
    file_provider: FileProvider,
    camera_provider: CameraProvider,
) -> None:
    """It should raise CameraSettingsInvalidError when the capture image command is provided a bad resolution or zoom, even when the camera callback is unavailable."""
    subject = CaptureImageImpl(
        state_view=state_view,
        file_provider=file_provider,
        camera_provider=camera_provider,
    )

    params = CaptureImageParams(resolution=(319, 239))
    with pytest.raises(CameraSettingsInvalidError):
        await subject.execute(params=params)
    params = CaptureImageParams(resolution=(7681, 4321))
    with pytest.raises(CameraSettingsInvalidError):
        await subject.execute(params=params)

    params = CaptureImageParams(zoom=0.9)
    with pytest.raises(CameraSettingsInvalidError):
        await subject.execute(params=params)
    params = CaptureImageParams(zoom=2.1)
    with pytest.raises(CameraSettingsInvalidError):
        await subject.execute(params=params)
