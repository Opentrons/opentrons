# noqa: D100
from typing import Annotated

import fastapi
import sqlalchemy

from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.persistence.tables import (
    boolean_setting_table,
    BooleanSettingKey,
    camera_capture_image_settings_table,
)
from robot_server.service.legacy.models.settings import CameraCaptureImageSettings

# All camera behavior is disabled by default
_CAMERA_ENABLED_DEFAULT = False
_LIVE_STREAM_ENABLED_DEFAULT = False
_CAMERA_ERROR_RECOVERY_ENABLED_DEFAULT = False


class CameraSettingStore:
    """Persistently stores settings related to camera enablement."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        self._sql_engine = sql_engine

    def _query_settings_table(self, setting: BooleanSettingKey) -> bool | None:
        with self._sql_engine.begin() as transaction:
            result: bool | None = transaction.execute(
                sqlalchemy.select(boolean_setting_table.c.value).where(
                    boolean_setting_table.c.key == setting
                )
            ).scalar_one_or_none()
        return result

    def get_camera_enabled(self) -> bool:
        """Get the value of the "camera enabled" setting."""
        result = self._query_settings_table(BooleanSettingKey.ENABLE_CAMERA)
        return result if result is not None else _CAMERA_ENABLED_DEFAULT

    def get_live_stream_enabled(self) -> bool:
        """Get the value of the "live stream enabled" setting."""
        result = self._query_settings_table(BooleanSettingKey.ENABLE_LIVE_STREAM)
        return result if result is not None else _LIVE_STREAM_ENABLED_DEFAULT

    def get_error_recovery_camera_enabled(self) -> bool:
        """Get the value of the "error recovery camera enabled" setting."""
        result = self._query_settings_table(
            BooleanSettingKey.ENABLE_ERROR_RECOVERY_CAMERA
        )
        return result if result is not None else _CAMERA_ERROR_RECOVERY_ENABLED_DEFAULT

    def get_camera_capture_image_settings(self) -> CameraCaptureImageSettings:
        """Get the values store in the camera capture image settings table."""
        with self._sql_engine.begin() as transaction:
            camera_id = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "camera_id"
                )
            ).scalar_one_or_none()
            resolution_x = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "resolution_x"
                )
            ).scalar_one_or_none()
            resolution_y = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "resolution_x"
                )
            ).scalar_one_or_none()
            if resolution_x is not None and resolution_y is not None:
                resolution = (resolution_x, resolution_y)
            else:
                resolution = None
            zoom = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "zoom"
                )
            ).scalar_one_or_none()
            pan_x = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "pan_x"
                )
            ).scalar_one_or_none()
            pan_y = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "pan_x"
                )
            ).scalar_one_or_none()
            if pan_x is not None and pan_y is not None:
                pan = (pan_x, pan_y)
            else:
                pan = None
            contrast = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "contrast"
                )
            ).scalar_one_or_none()
            brightness = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "brightness"
                )
            ).scalar_one_or_none()
            saturation = transaction.execute(
                sqlalchemy.select(camera_capture_image_settings_table.c.value).where(
                    camera_capture_image_settings_table.c.key == "saturation"
                )
            ).scalar_one_or_none()
        return CameraCaptureImageSettings(
            cameraId=camera_id,
            resolution=resolution,
            zoom=zoom,
            pan=pan,
            contrast=contrast,
            brightness=brightness,
            saturation=saturation,
        )

    def _set_enablement_status(
        self, setting: BooleanSettingKey, is_enabled: bool | None
    ) -> None:
        """Set the value of the "error recovery enabled" setting.

        `None` means revert to the default.
        """
        with self._sql_engine.begin() as transaction:
            transaction.execute(
                sqlalchemy.delete(boolean_setting_table).where(
                    boolean_setting_table.c.key == setting
                )
            )
            if is_enabled is not None:
                transaction.execute(
                    sqlalchemy.insert(boolean_setting_table).values(
                        key=setting,
                        value=is_enabled,
                    )
                )

    def set_camera_enable(self, is_enabled: bool | None) -> None:
        """Sets the enablement status of the Camera."""
        self._set_enablement_status(BooleanSettingKey.ENABLE_CAMERA, is_enabled)

    def set_live_stream_enable(self, is_enabled: bool | None) -> None:
        """Sets the enablement status of the Live Stream."""
        self._set_enablement_status(BooleanSettingKey.ENABLE_LIVE_STREAM, is_enabled)

    def set_error_recovery_camera_enable(self, is_enabled: bool | None) -> None:
        """Sets the enablement status of the Camera involving Error Recovery."""
        self._set_enablement_status(
            BooleanSettingKey.ENABLE_ERROR_RECOVERY_CAMERA, is_enabled
        )

    def set_camera_capture_image_settings(
        self, settings: CameraCaptureImageSettings
    ) -> None:
        """Set the value of the global "camera capture image" settings.

        `None` means revert to the system default.
        """
        with self._sql_engine.begin() as transaction:
            # Camera ID
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "camera_id"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="camera_id",
                    value=settings.cameraId,
                )
            )
            # Resolution
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "resolution_x"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="resolution_x",
                    value=settings.resolution[0]
                    if settings.resolution is not None
                    else None,
                )
            )
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "resolution_y"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="resolution_y",
                    value=settings.resolution[1]
                    if settings.resolution is not None
                    else None,
                )
            )
            # Zoom
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "zoom"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="zoom",
                    value=settings.zoom,
                )
            )
            # Pan
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "pan_x"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="pan_x",
                    value=settings.pan[0] if settings.pan is not None else None,
                )
            )
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "pan_y"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="pan_y",
                    value=settings.pan[1] if settings.pan is not None else None,
                )
            )
            # Contrast
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "contrast"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="contrast",
                    value=settings.contrast,
                )
            )
            # Brightness
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "brightness"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="brightness",
                    value=settings.brightness,
                )
            )
            # Saturation
            transaction.execute(
                sqlalchemy.delete(camera_capture_image_settings_table).where(
                    camera_capture_image_settings_table.c.key == "saturation"
                )
            )
            transaction.execute(
                sqlalchemy.insert(camera_capture_image_settings_table).values(
                    key="saturation",
                    value=settings.saturation,
                )
            )


async def get_camera_setting_store(
    sql_engine: Annotated[sqlalchemy.engine.Engine, fastapi.Depends(get_sql_engine)]
) -> CameraSettingStore:
    """A FastAPI dependency to return the server's CameraSettingStore."""
    # Since the store itself has no state, and no asyncio.Locks or anything,
    # instances are fungible and disposable, and we can use a fresh one for each
    # request instead of having to maintain a global singleton.
    return CameraSettingStore(sql_engine)
