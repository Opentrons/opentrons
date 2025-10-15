"""Command models to capture an image with a camera."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING, Tuple, Any

from typing_extensions import Literal, Type
from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema
from opentrons.system.camera import (
    ZOOM_MIN,
    ZOOM_MAX,
    CONTRAST_MIN,
    CONTRAST_MAX,
    SATURATION_MIN,
    SATURATION_MAX,
    BRIGHTNESS_MIN,
    BRIGHTNESS_MAX,
)

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors import (
    StorageLimitReachedError,
    CameraDisabledError,
    CameraSettingsInvalidError,
)
from ..errors.error_occurrence import ErrorOccurrence

from ..resources.file_provider import (
    MAXIMUM_FILE_LIMIT,
    MimeType,
    ImageJpegFileNameMetadata,
)
from ..resources import FileProvider
from ..resources import CameraProvider
from ..resources.camera_provider import ImageParameters
from ..state import update_types

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
        description="Multiplier to use when cropping and scaling a captured Image. Scale is 1.0 to 2.0.",
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
        ...,
        description="File ID for image files output as a result of an image capture action.",
    )


def _converted_image_params(params: CaptureImageParams) -> ImageParameters:
    def _error_response(
        category: str, provided_value: float, range_min: float, range_max: float
    ) -> None:
        raise CameraSettingsInvalidError(
            message=f"Provided {category} of {provided_value} is invalid, must be valued through {range_min} and {range_max}"
        )

    image_parameters = ImageParameters()
    if params.zoom is not None and (params.zoom < ZOOM_MIN or params.zoom > ZOOM_MAX):
        _error_response("zoom", params.zoom, ZOOM_MIN, ZOOM_MAX)
    image_parameters.zoom = params.zoom

    if params.brightness is not None:
        scaled_brightness: int = int(((params.brightness * 256) // 100) - 128) * -1
        if scaled_brightness < BRIGHTNESS_MIN or scaled_brightness > BRIGHTNESS_MAX:
            _error_response("brightness", params.brightness, 0, 100)
        image_parameters.brightness = scaled_brightness
    else:
        image_parameters.brightness = None

    if params.contrast is not None:
        scaled_contrast = (params.contrast / 100) * 2.0
        if scaled_contrast is not None and (
            scaled_contrast < CONTRAST_MIN or scaled_contrast > CONTRAST_MAX
        ):
            _error_response("contrast", params.contrast, 0, 100)
        image_parameters.contrast = scaled_contrast
    else:
        image_parameters.contrast = None

    if params.saturation is not None:
        scaled_saturation = (params.saturation / 100) * 2.0
        if scaled_saturation is not None and (
            scaled_saturation < SATURATION_MIN or scaled_saturation > SATURATION_MAX
        ):
            _error_response("saturation", params.saturation, 0, 100)
        image_parameters.saturation = scaled_saturation
    else:
        image_parameters.saturation = None

    # todo(chb, 2025-10-13): Validate the resolution and that the pan coordinates exist within the image limits
    image_parameters.resolution = params.resolution
    image_parameters.pan = params.pan
    return image_parameters


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

        # todo (chb, 2025-10-13): Implement App image parameter setting pass through when core override parameters not provided.

        if params.fileName is not None:
            # Validate that the file we are about to generate does not put us higher than the limit
            if self._state_view.files.get_filecount() + 1 > MAXIMUM_FILE_LIMIT:
                raise StorageLimitReachedError(
                    message=f"Attempt to write file {params.fileName} exceeds file creation limit of {MAXIMUM_FILE_LIMIT} files."
                )

        # Handle capturing an image with the CameraProvider
        camera_settings = await self._camera_provider.get_camera_settings()
        if camera_settings.camera_enabled is False:
            raise CameraDisabledError(
                "Cannot capture image because Camera is disabled."
            )

        parameters = _converted_image_params(params=params)
        camera_data = await self._camera_provider.capture_image(parameters)

        # Conditionally save file if camera data was returned - in simulation we don't return anything.
        file_id: str | None = None
        if camera_data:
            # Begin interfacing with the file provider
            if params.fileName is not None:
                filename = params.fileName
            else:
                # TODO: determine file name generation behavior and replace this
                file_count = self._state_view.files.get_filecount() + 1
                filename = "TEMPORARY" + str(file_count)

            file_id = await self._file_provider.write_file(
                data=camera_data,
                mime_type=MimeType.IMAGE_JPEG,
                command_metadata=ImageJpegFileNameMetadata(
                    base_filename=filename,
                ),
            )

            state_update.files_added = update_types.FilesAddedUpdate(file_ids=[file_id])

        return SuccessData(
            public=CaptureImageResult(
                fileId=file_id,
            ),
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
