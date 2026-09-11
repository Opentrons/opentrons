"""Dependency functions for use with `fastapi.Depends()`."""

from typing import Annotated

import fastapi

from opentrons.protocol_engine.resources.camera_provider import CameraProvider
from server_utils.fastapi_utils.app_state import (
    AppState,
    get_app_state,
)

from robot_server.camera.provider import CameraProviderWrapper
from robot_server.camera.settings.store import (
    CameraSettingStore,
    get_camera_setting_store,
)
from robot_server.service.pyro_utils.resource_utilities import (
    register_camera_provider_to_pyro_resource,
)


async def get_camera_provider_wrapper(
    camera_settings_store: Annotated[
        CameraSettingStore, fastapi.Depends(get_camera_setting_store)
    ],
) -> CameraProviderWrapper:
    """Return the server's 'CameraProviderWrapper' which provides the engine related callbacks for the CameraProvider."""
    return CameraProviderWrapper(camera_settings_store=camera_settings_store)


async def get_camera_provider(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    camera_provider_wrapper: Annotated[
        CameraProviderWrapper, fastapi.Depends(get_camera_provider_wrapper)
    ],
) -> CameraProvider:
    """Return the engine `CameraProvider` which accepts callbacks from CameraProviderWrapper."""
    camera_provider = CameraProvider(
        camera_settings_callback=camera_provider_wrapper.get_camera_settings,
        image_capture_callback=camera_provider_wrapper.process_image_capture,
        update_live_stream_status=camera_provider_wrapper.update_live_stream_status,
    )
    register_camera_provider_to_pyro_resource(app_state, camera_provider)
    return camera_provider
