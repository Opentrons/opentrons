"""Router for /system/register endpoint."""

import re
import os
import filetype  # type: ignore[import-untyped]
from fastapi import (
    APIRouter,
    Depends,
    status,
    Response,
    UploadFile,
    File,
    HTTPException,
)
from pathlib import Path

from .models import EnableOEMMode
from ...settings import SystemServerSettings, get_settings, save_settings


# regex to sanitize the filename
FILENAME_REGEX = re.compile(r"[^a-zA-Z0-9-.]")


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


@oem_mode_router.post(
    "/system/oem_mode/upload_splash",
    summary="Upload an image to be used as the boot up splash screen.",
    responses={
        status.HTTP_201_CREATED: {"message": "OEM Mode splash screen uploaded"},
        status.HTTP_400_BAD_REQUEST: {"message": "OEM Mode splash screen not set"},
        status.HTTP_413_REQUEST_ENTITY_TOO_LARGE: {
            "message": "File is larger than 5mb"
        },
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: {"message": "Invalid file type"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "message": "OEM Mode splash unhandled exception."
        },
    },
)
async def upload_splash_image(
    response: Response,
    file: UploadFile = File(...),
    settings: SystemServerSettings = Depends(get_settings),
) -> Response:
    """Router for /system/oem_mode/upload_splash endpoint."""
    # Make sure oem mode is enabled before this request
    if not settings.oem_mode_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="OEM Mode needs to be enabled to upload splash image.",
        )

    # Get the file info
    file_info = filetype.guess(file.file)
    if file_info is None or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unable to determine file type",
        )

    # Only accept PNG files
    accepted_file_types = ["image/png", "png"]
    content_type = file_info.extension.lower()
    if (
        file.content_type not in accepted_file_types
        or content_type not in accepted_file_types
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type",
        )

    file_size = 0
    for chunk in file.file:
        file_size += len(chunk)
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File is larger than 5mb.",
            )

    # TODO: Validate image dimensions

    # return the pointer back to the starting point so that the next read starts from the starting point
    await file.seek(0)

    try:
        # Remove the old image if exists
        if settings.oem_mode_splash_custom:
            os.unlink(settings.oem_mode_splash_custom)

        # sanitize the filename
        sanatized_filename = FILENAME_REGEX.sub("_", file.filename)
        filename = f"{Path(sanatized_filename).stem}.{content_type}"

        # file is valid, save to final location
        filepath = f"{settings.persistence_directory}/{filename}"
        with open(filepath, "wb+") as f:
            f.write(file.file.read())

        # store the file location to settings and save the dotenv
        settings.oem_mode_splash_custom = filepath
        success = save_settings(settings)
        response.status_code = (
            status.HTTP_201_CREATED if success else status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    return response
