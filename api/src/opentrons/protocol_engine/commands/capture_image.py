"""Command models to capture an image with a camera."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional, Tuple

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from typing_extensions import Literal, Type

from opentrons_shared_data.data_files import MimeType

from ..errors import (
    CameraDisabledError,
    CameraSettingsInvalidError,
    FileNameInvalidError,
)
from ..errors.error_occurrence import ErrorOccurrence
from ..resources import CameraProvider, FileProvider
from ..resources.camera_provider import ImageParameters
from ..resources.file_provider import (
    SPECIAL_CHARACTERS,
    ImageCaptureCmdFileNameMetadata,
)
from ..state import update_types
from ..types import PreconditionTypes
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from opentrons.system.camera import (
    BRIGHTNESS_DEFAULT,
    CONTRAST_DEFAULT,
    RESOLUTION_DEFAULT,
    RESOLUTION_MAX,
    RESOLUTION_MIN,
    SATURATION_DEFAULT,
    ZOOM_DEFAULT,
    ZOOM_MAX,
    ZOOM_MIN,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


CaptureImageCommandType = Literal["captureImage"]


class CaptureImageParams(BaseModel):
    """Input parameters for an image capture."""

    fileName: str | SkipJsonSchema[None] = Field(
        None,
        description="Optional file name to use when storing the results of an Image Capture.",
        json_schema_extra=_remove_default,
    )
    resolution: Optional[Tuple[int, int]] = Field(
        None,
        description="Width by height resolution in pixels for the image to be captured with.",
    )
    zoom: Optional[float] = Field(
        None,
        description="Multiplier to use when cropping and scaling a captured image. Scale is 1.0 to 2.0.",
    )
    pan: Optional[Tuple[int, int]] = Field(
        None,
        description="X/Y (pixels) position to pan to for a given zoom. Default is the center of the image.",
    )
    contrast: Optional[float] = Field(
        None,
        description="The contrast to use when processing an image. Scale is 0% to 100%.",
    )
    brightness: Optional[float] = Field(
        None,
        description="The brightness to use when processing an image. Scale is 0% to 100%.",
    )
    saturation: Optional[float] = Field(
        None,
        description="The saturation to use when processing an image. Scale is 0% to 100%.",
    )


class CaptureImageResult(BaseModel):
    """Result data from running an image capture."""

    fileId: Optional[str] = Field(
        None,
        description="File ID for image files output as a result of an image capture action.",
    )
    resolution: Tuple[int, int] = Field(
        ...,
        description="Width by height resolution in pixels the image was captured with.",
    )
    zoom: float = Field(
        ...,
        description="Multiplier used when cropping and scaling the captured image. Scale is 1.0 to 2.0.",
    )
    pan: Optional[Tuple[int, int]] = Field(
        None,
        description="X/Y (pixels) position panned to.",
    )
    contrast: float = Field(
        ...,
        description="The contrast used when processing the image. Scale is 0% to 100%.",
    )
    brightness: float = Field(
        ...,
        description="The brightness used when processing the image. Scale is 0% to 100%.",
    )
    saturation: float = Field(
        ...,
        description="The saturation used when processing the image. Scale is 0% to 100%.",
    )


def _converted_image_params(params: CaptureImageParams) -> ImageParameters:
    return ImageParameters(
        resolution=params.resolution,
        zoom=params.zoom,
        pan=params.pan,
        contrast=(
            (params.contrast / 100) * 2.0 if params.contrast is not None else None
        ),
        brightness=(
            int(((params.brightness * 256) // 100) - 128) * -1
            if params.brightness is not None
            else None
        ),
        saturation=(
            (params.saturation / 100) * 2.0 if params.saturation is not None else None
        ),
    )


def _revert_image_parameters(
    file_id: Optional[str], image_params: ImageParameters
) -> CaptureImageResult:
    contrast = (
        image_params.contrast if image_params.contrast is not None else CONTRAST_DEFAULT
    )
    brightness = (
        image_params.brightness
        if image_params.brightness is not None
        else BRIGHTNESS_DEFAULT
    )
    saturation = (
        image_params.saturation
        if image_params.saturation is not None
        else SATURATION_DEFAULT
    )

    return CaptureImageResult(
        fileId=file_id,
        resolution=image_params.resolution
        if image_params.resolution is not None
        else RESOLUTION_DEFAULT,
        zoom=image_params.zoom if image_params.zoom is not None else ZOOM_DEFAULT,
        pan=image_params.pan,
        contrast=(contrast / 2) * 100.0,
        brightness=round((((brightness * -1) + 128) * 100) / 256),
        saturation=(saturation / 2) * 100.0,
    )


def _validate_image_params(params: CaptureImageParams) -> None:
    # Validate the filename param provided to fail analysis
    if params.fileName is not None and set(SPECIAL_CHARACTERS).intersection(
        set(params.fileName)
    ):
        raise FileNameInvalidError(
            message=f"Capture image filename cannot contain character(s): {SPECIAL_CHARACTERS.intersection(set(params.fileName))}"
        )

    # Validate the image filter parameters
    if params.zoom is not None and (params.zoom < ZOOM_MIN or params.zoom > ZOOM_MAX):
        raise CameraSettingsInvalidError(
            message="Capture image zoom must be a valid value from 1.0X to 2.0X zoom."
        )
    if params.resolution is not None and (
        params.resolution[0] < RESOLUTION_MIN[0]
        or params.resolution[1] < RESOLUTION_MIN[1]
        or params.resolution[0] > RESOLUTION_MAX[0]
        or params.resolution[1] > RESOLUTION_MAX[1]
    ):
        raise CameraSettingsInvalidError(
            message="Capture image resolution must be a valid resolution from 240p through 8K resolutuon."
        )
    if params.brightness is not None and (
        params.brightness < 0 or params.brightness > 100
    ):
        raise CameraSettingsInvalidError(
            message="Capture image brightness must be a percentage from 0% to 100%."
        )
    if params.contrast is not None and (params.contrast < 0 or params.contrast > 100):
        raise CameraSettingsInvalidError(
            message="Capture image contrast must be a percentage from 0% to 100%."
        )
    if params.saturation is not None and (
        params.saturation < 0 or params.saturation > 100
    ):
        raise CameraSettingsInvalidError(
            message="Capture image saturation must be a percentage from 0% to 100%."
        )


class CaptureImageImpl(
    AbstractCommandImpl[CaptureImageParams, SuccessData[CaptureImageResult]]
):
    """Execution implementation of an image capture."""

    def __init__(
        self,
        state_view: StateView,
        file_provider: FileProvider,
        camera_provider: CameraProvider,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._file_provider = file_provider
        self._camera_provider = camera_provider

    async def execute(
        self, params: CaptureImageParams
    ) -> SuccessData[CaptureImageResult]:
        """Initiate an image capture with a camera."""
        state_update = update_types.StateUpdate()
        state_update.precondition_update = update_types.PreconditionUpdate(
            {PreconditionTypes.IS_CAMERA_USED: True}
        )

        # Validate that the provided parameters are all acceptable. We do this here and in system/camera.py to ensure analysis fails properly.
        _validate_image_params(params)

        # Handle capturing an image with the CameraProvider - Engine camera settings take priority
        camera_settings = await self._camera_provider.get_camera_settings()
        engine_camera_settings = self._state_view.camera.get_enablement_settings()
        if (
            engine_camera_settings is None and camera_settings.cameraEnabled is False
        ) or (
            engine_camera_settings is not None
            and engine_camera_settings.cameraEnabled is False
        ):
            raise CameraDisabledError(
                "Cannot capture image because Camera is disabled."
            )

        parameters = _converted_image_params(params=params)
        camera_data = await self._camera_provider.capture_image(
            self._state_view.config.robot_type, parameters
        )

        # Conditionally save file if camera data was returned - in simulation we don't return anything.
        file_id: str | None = None
        if camera_data:
            this_cmd_id = self._state_view.commands.get_running_command_id()
            prev_cmd = self._state_view.commands.get_most_recently_finalized_command()
            prev_cmd_id = prev_cmd.command.id if prev_cmd is not None else None

            file_info = await self._file_provider.write_file(
                data=camera_data,
                mime_type=MimeType.IMAGE_JPEG,
                command_metadata=ImageCaptureCmdFileNameMetadata(
                    step_number=len(self._state_view.commands.get_all()),
                    command_timestamp=datetime.now(),
                    base_filename=params.fileName,
                    command_id=this_cmd_id or "",
                    prev_command_id=prev_cmd_id or "",
                ),
            )
            file_id = file_info.id
            state_update.files_added = update_types.FilesAddedUpdate(file_ids=[file_id])

        result = _revert_image_parameters(file_id=file_id, image_params=parameters)

        return SuccessData(
            public=result,
            state_update=state_update,
        )


class CaptureImage(
    BaseCommand[CaptureImageParams, CaptureImageResult, ErrorOccurrence]
):
    """A command to execute an Absorbance Reader measurement."""

    commandType: CaptureImageCommandType = "captureImage"
    params: CaptureImageParams
    result: Optional[CaptureImageResult] = None

    _ImplementationCls: Type[CaptureImageImpl] = CaptureImageImpl


class CaptureImageCreate(BaseCommandCreate[CaptureImageParams]):
    """A request to execute an Absorbance Reader measurement."""

    commandType: CaptureImageCommandType = "captureImage"
    params: CaptureImageParams

    _CommandCls: Type[CaptureImage] = CaptureImage
