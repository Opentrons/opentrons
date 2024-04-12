"""Router for /system/register endpoint."""

from fastapi import APIRouter, Depends, status, Response
from .models import EnableOEMMode
from ...settings import SystemServerSettings, get_settings, save_settings


oem_mode_router = APIRouter()


@oem_mode_router.put(
    "/system/oem_mode/enable",
    summary="Enable or Disable OEM Mode for this robot.",
    responses={
        status.HTTP_200_OK: {"message": "OEM Mode changed successfully."},
        status.HTTP_400_BAD_REQUEST: {"message": "OEM Mode did not changed."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "message": "OEM Mode unhandled exception."
        },
    },
)
async def enable_oem_mode_endpoint(
    response: Response,
    enableRequest: EnableOEMMode,
    settings: SystemServerSettings = Depends(get_settings),
) -> Response:
    """Router for /system/oem_mode/enable endpoint."""
    enable = enableRequest.enable
    try:
        settings.oem_mode_enabled = enable
        success = save_settings(settings)
        response.status_code = (
            status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    return response
