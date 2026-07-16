"""Wrapper to provide the callbacks utilized by the Protocol Engine Camera Utility."""

from typing import Annotated

from fastapi import Depends

from opentrons.protocol_engine.resources.camera_provider import (
    CameraError,
    CameraSettings,
    ImageParameters,
)
from opentrons.system import camera
from opentrons_shared_data.robot.types import RobotType

from robot_server.camera.settings.store import (
    CameraSettingStore,
    get_camera_setting_store,
)


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
            cameraEnabled=self._camera_settings_store.get_camera_enabled(),
            liveStreamEnabled=self._camera_settings_store.get_live_stream_enabled(),
            errorRecoveryCameraEnabled=self._camera_settings_store.get_error_recovery_camera_enabled(),
        )

    async def process_image_capture(
        self, robot_type: RobotType, parameters: ImageParameters
    ) -> bytes | CameraError:
        """Process and image capture request for a Camera utilizing a given set of parameters. Returns None if an error occurred."""
        return await camera.image_capture(robot_type=robot_type, parameters=parameters)

    async def update_live_stream_status(
        self,
        robot_type: RobotType,
        stream_status: bool,
        enablement_settings: CameraSettings | None = None,
    ) -> None:
        """Update the Opentrons Live Stream status to toggle the live stream on and off, or adjust
        the camera settings used by the live stream.
        """
        await camera.update_live_stream_status(
            robot_type=robot_type,
            stream_status=stream_status,
            camera_settings=self.get_camera_settings(),
            override_settings=enablement_settings,
        )
