# noqa: D100
from typing import Annotated

import fastapi
import sqlalchemy

from robot_server.persistence.fastapi_dependencies import get_sql_engine
from robot_server.persistence.tables import boolean_setting_table, BooleanSettingKey

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


async def get_camera_setting_store(
    sql_engine: Annotated[sqlalchemy.engine.Engine, fastapi.Depends(get_sql_engine)]
) -> CameraSettingStore:
    """A FastAPI dependency to return the server's CameraSettingStore."""
    # Since the store itself has no state, and no asyncio.Locks or anything,
    # instances are fungible and disposable, and we can use a fresh one for each
    # request instead of having to maintain a global singleton.
    return CameraSettingStore(sql_engine)
