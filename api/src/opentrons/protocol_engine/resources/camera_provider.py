"""Camera interaction resource provider."""
from typing import Optional, Callable, Awaitable
from pydantic import BaseModel, Field


class CameraSettings(BaseModel):
    """Camera API settings for general enablement and use."""

    camera_enabled: bool = Field(
        ..., description="Enablement status for general camera use."
    )
    live_stream_enabled: bool = Field(
        ..., description="Enablement status for the Opentrons Live Stream service."
    )
    error_recovery_enabled: bool = Field(
        ..., description="Enablement status for camera usage with Error Recovery."
    )


class CameraProvider:
    """Provider class to wrap camera interactions between the server and the engine."""

    def __init__(
        self,
        camera_settings_callback: Optional[
            Callable[[], [CameraSettings]]
        ] = None,
    ) -> None:
        """Initialize the interface callbacks of the Camera Provider within the Protocol Engine.

        Params:
            camera_settings_callback: Callback to query the Camera Enablement settings from the Boolean Settings table.
        """
        self._camera_settings_callback = camera_settings_callback

    async def get_camera_settings(self) -> CameraSettings:
        """Query the Robot Server for the current Camera Enablement settings."""
        if self._camera_settings_callback is not None:
            return await self._camera_settings_callback()
        # If we are in analysis or simulation, return as if the camera is enabled
        return CameraSettings(
            camera_enabled=True, live_stream_enabled=True, error_recovery_enabled=True
        )
