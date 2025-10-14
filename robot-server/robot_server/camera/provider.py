"""Wrapper to provide the callbacks utilized by the Protocol Engine Camera Utility."""
from typing import Annotated
from fastapi import Depends
from robot_server.camera.settings.store import (
    CameraSettingStore,
    get_camera_setting_store,
)
from opentrons.protocol_engine.resources.camera_provider import (
    CameraSettings,
    ImageParameters,
)
from opentrons.system import camera


class CameraProviderWrapper:
    """Wrapper to provide Camera callbacks to Protocol Engine."""

    def __init__(
        self,
        camera_settings_store: Annotated[
            CameraSettingStore, Depends(get_camera_setting_store)
        ],
    ) -> None:
        """Provides callbacks for Camera utilities and settings for the Protocol Engine's Camera Settings class.

        Params:
            camera_settings_store: Provides access to the Camera Enablement Settings
        """
        self._camera_settings_store = camera_settings_store

    def get_camera_settings(self) -> CameraSettings:
        """Get the Camera Enablement Settings from the Boolean Settings Table."""
        return CameraSettings(
            camera_enabled=self._camera_settings_store.get_camera_enabled(),
            live_stream_enabled=self._camera_settings_store.get_live_stream_enabled(),
            error_recovery_enabled=self._camera_settings_store.get_error_recovery_camera_enabled(),
        )

    async def process_image_capture(self, parameters: ImageParameters) -> bytes | None:
        """Process and image capture request for a Camera utilizing a given set of parameters. Returns None if an error occurred."""
        return await camera.image_capture(parameters=parameters)
