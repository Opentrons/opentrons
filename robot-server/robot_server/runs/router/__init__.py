"""Runs router."""

from server_utils.fastapi_utils.light_router import LightRouter

from .actions_router import actions_router
from .base_router import base_router
from .camera_router import camera_router
from .command_annotations_router import command_annotations_router
from .commands_router import commands_router
from .error_recovery_policy_router import error_recovery_policy_router
from .file_download_router import file_download_router
from .labware_router import labware_router

runs_router = LightRouter()

runs_router.include_router(base_router)
runs_router.include_router(commands_router)
runs_router.include_router(command_annotations_router)
runs_router.include_router(actions_router)
runs_router.include_router(labware_router)
runs_router.include_router(camera_router)
runs_router.include_router(error_recovery_policy_router)
runs_router.include_router(file_download_router)

__all__ = ["runs_router"]
