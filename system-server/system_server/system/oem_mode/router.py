"""Router for /system/register endpoint."""

import os
import re
from pathlib import Path
from textwrap import dedent
from typing import Annotated

import filetype  # type: ignore[import-untyped]
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from .models import EnableOEMMode
from .oem_settings_store import (
    OEMSettingsStore,
    get_oem_settings_store,
)
from system_server.persistence import get_persistence_directory

# A regex to sanitize names of uploaded files.
#
# This is to avoid:
# - Path traversal, e.g. if someone uploads a file named "../../foo.png".
# - Shell injection and other parsing issues. See oem_settings_store.write_oem_settings().
FILENAME_REGEX = re.compile(r"[^a-zA-Z0-9-_.]")


oem_mode_router = APIRouter()


@oem_mode_router.put(
    "/system/oem_mode/enable",
    summary="Enable or disable OEM Mode",
    description=dedent(
        """\
        Enable or disable OEM Mode.

        Currently, this endpoint does not *completely* enable OEM mode, so it should not
        be used directly. Use `POST /settings` instead. This may change in the future.
        """
        # To elaborate on the description above:
        # The part of OEM mode that this endpoint doesn't do is telling the ODD to avoid
        # branded language in its UX copy. That's currently done by the ODD querying
        # the OEM mode status in robot-server's `GET /settings`, which in turn is set
        # via robot-server's `POST /settings`. Ideally, system-server would have a pair
        # of PUT+GET endpoints serving as the single source of truth, and either
        # robot-server's `/settings` endpoints would proxy to them, or we'd outright
        # delete OEM mode from `/settings`.
    ),
    responses={
        status.HTTP_200_OK: {"message": "OEM Mode changed successfully."},
        status.HTTP_400_BAD_REQUEST: {"message": "OEM Mode did not change."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "message": "OEM Mode unhandled exception."
        },
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("alter OEM mode")),
    ],
)
async def enable_oem_mode_endpoint(
    response: Response,
    enableRequest: EnableOEMMode,
    oem_settings_store: Annotated[OEMSettingsStore, Depends(get_oem_settings_store)],
) -> Response:
    """Router for /system/oem_mode/enable endpoint."""
    enable = enableRequest.enable
    oem_settings = oem_settings_store.read()
    try:
        oem_settings.oem_mode_enabled = enable
        success = oem_settings_store.write(oem_settings)
        response.status_code = (
            status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    return response


@oem_mode_router.post(
    "/system/oem_mode/upload_splash",
    summary="Upload an image for the boot up splash screen",
    description="Upload an image for the boot up splash screen",
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
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("set boot splash")),
    ],
)
async def upload_splash_image(
    response: Response,
    oem_settings_store: Annotated[OEMSettingsStore, Depends(get_oem_settings_store)],
    persistence_directory: Annotated[Path, Depends(get_persistence_directory)],
    file: UploadFile = File(...),
) -> Response:
    """Router for /system/oem_mode/upload_splash endpoint."""
    oem_settings = oem_settings_store.read()

    # Make sure oem mode is enabled before this request
    if not oem_settings.oem_mode_enabled:
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
        if oem_settings.oem_mode_splash_custom:
            os.unlink(oem_settings.oem_mode_splash_custom)

        # sanitize the filename
        # todo(mm, 2026-02-24): Could we simplify this by just storing to some hard-coded path?
        sanitized_filename = FILENAME_REGEX.sub("_", file.filename)
        filename = f"{Path(sanitized_filename).stem}.{content_type}"

        # file is valid, save to final location
        filepath = f"{persistence_directory}/{filename}"
        with open(filepath, "wb+") as f:
            f.write(file.file.read())

        # store the file location
        oem_settings.oem_mode_splash_custom = filepath
        success = oem_settings_store.write(oem_settings)
        response.status_code = (
            status.HTTP_201_CREATED if success else status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    return response
