"""Camera interaction resource provider."""

import logging
from typing import Awaitable, Callable, Optional, Tuple

from pydantic import BaseModel, Field

from opentrons_shared_data.robot.types import RobotType

from ..errors import CameraCaptureError, CameraSettingsInvalidError

log = logging.getLogger(__name__)


class CameraError(BaseModel):
    """Generic base class for Camera errors that occur on entities handled through the Camera Provider."""

    message: str = Field(..., description="Description of error content.")
    code: str | None = Field(
        ..., description="Return code, if any, that was paired with the error."
    )


class CameraSettings(BaseModel):
    """Camera API settings for general enablement and use."""

    cameraEnabled: bool = Field(
        ..., description="Enablement status for general camera use."
    )
    liveStreamEnabled: bool = Field(
        ..., description="Enablement status for the Opentrons Live Stream service."
    )
    errorRecoveryCameraEnabled: bool = Field(
        ..., description="Enablement status for camera usage with Error Recovery."
    )


class ImageParameters(BaseModel):
    """Parameters for an Image Capture to determine filters. These are the inputs as expected by FFMPEG."""

    resolution: Optional[Tuple[int, int]] = Field(
        None,
        description="Width by height resolution in pixels for the image to be captured with.",
    )
    zoom: Optional[float] = Field(
        None,
        description="Multiplier to use when cropping and scaling a captured image.",
    )
    pan: Optional[Tuple[int, int]] = Field(
        None,
        description="Position to pan to for a given zoom. Format is X and Y coordinates (in pixels) to the bottom left of a frame.",
    )
    contrast: Optional[float] = Field(
        None, description="The contrast to use when processing an image."
    )
    brightness: Optional[int] = Field(
        None, description="The brightness to use when processing an image."
    )
    saturation: Optional[float] = Field(
        None, description="The saturation to use when processing an image."
    )


class CameraProvider:
    """Provider class to wrap camera interactions between the server and the engine."""

    def __init__(
        self,
        camera_settings_callback: Optional[Callable[[], CameraSettings]] = None,
        image_capture_callback: Optional[
            Callable[[RobotType, ImageParameters], Awaitable[bytes | CameraError]]
        ] = None,
    ) -> None:
        """Initialize the interface callbacks of the Camera Provider within the Protocol Engine.

        Params:
            camera_settings_callback: Callback to query the Camera Enablement settings from the Boolean Settings table.
            image_capture_callback: Callback to process an image capture request and return a bytestream of image data in response.
        """
        self._camera_settings_callback = camera_settings_callback
        self._image_capture_callback = image_capture_callback

    async def get_camera_settings(self) -> CameraSettings:
        """Query the Robot Server for the current Camera Enablement settings."""
        if self._camera_settings_callback is not None:
            return self._camera_settings_callback()
        # If we are in analysis or simulation, return as if the camera is enabled
        return CameraSettings(
            cameraEnabled=True, liveStreamEnabled=True, errorRecoveryCameraEnabled=True
        )

    async def capture_image(
        self, robot_type: RobotType, parameters: ImageParameters
    ) -> bytes | None:
        """Process through the Camera Executor on robot server an image capture request with a given set of filters.

        Returns a bytesteam of image data upon success. Raises an error if an error occurred during capture.
        Conditionally returns None if an image capture callback does not exist (simulation).
        """
        if self._image_capture_callback is not None:
            capture_result = await self._image_capture_callback(robot_type, parameters)
            if not isinstance(capture_result, CameraError):
                return capture_result
            else:
                if capture_result.code == "IMAGE_SETTINGS":
                    raise CameraSettingsInvalidError(message=capture_result.message)
                elif capture_result.code is not None:
                    error_str = f"Camera capture has failed to return an image with return code {capture_result.code}: {capture_result.message}"
                else:
                    error_str = f"Camera capture has failed with exception: {capture_result.message}"
                raise CameraCaptureError(message=error_str)
        # Return None if the image capture callback is unavailable (simulation)
        return None
