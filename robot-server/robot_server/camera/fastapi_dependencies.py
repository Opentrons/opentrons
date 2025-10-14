"""Dependency functions for use with `fastapi.Depends()`."""
from typing import Annotated

import fastapi

from robot_server.camera.provider import CameraProviderWrapper
from robot_server.camera.settings.store import (
    CameraSettingStore,
    get_camera_setting_store,
)
from opentrons.protocol_engine.resources.camera_provider import CameraProvider


async def get_camera_provider_wrapper(
    camera_settings_store: Annotated[
        CameraSettingStore, fastapi.Depends(get_camera_setting_store)
    ]
) -> CameraProviderWrapper:
    """Return the server's 'CameraProviderWrapper' which provides the engine related callbacks for the CameraProvider."""
    return CameraProviderWrapper(camera_settings_store=camera_settings_store)


async def get_camera_provider(
    camera_provider_wrapper: Annotated[
        CameraProviderWrapper, fastapi.Depends(get_camera_provider_wrapper)
    ],
) -> CameraProvider:
    """Return the engine `CameraProvider` which accepts callbacks from CameraProviderWrapper."""
    return CameraProvider(
        camera_settings_callback=camera_provider_wrapper.get_camera_settings,
    )
