"""Command models to capture an image with a camera."""
from __future__ import annotations
from typing import Optional, TYPE_CHECKING, Tuple, Any

from typing_extensions import Literal, Type
from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors import  StorageLimitReachedError
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
        description="Optional file name to use when storing the results of an Image Capture, PD only.",
        json_schema_extra=_remove_default,
    )
    zoom: Optional[float] = Field(1.0, description="Multiplier to use when cropping and scaling a captured Image. Scale is 0.0 to 2.0, default is 1.0.")
    pan: Optional[Tuple[int, int]] = Field(None, description="X/Y (pixels) position to pan to for a given zoom. Default is the center of the image.")
    contrast: Optional[float] = Field(0.0, description="The contrast to use when processing an image. Scale is -100% to 100%.")
    brightness: Optional[float] = Field(0.0, description="The brightness to use when processing an image. Scale is -100% to 100%.")
    saturation: Optional[float] = Field(0.0, description="The saturation to use when processing an image. Scale is -100% to 100%.")


class CaptureImageResult(BaseModel):
    """Result data from running an image capture."""

    fileId: Optional[str] = Field(
        ...,
        description="File ID for image files output as a result of an image capture action.",
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

    async def execute(  # noqa: C901
        self, params: CaptureImageParams
    ) -> SuccessData[CaptureImageResult]:
        """Initiate an image capture with a camera."""
        state_update = update_types.StateUpdate()
        
        if (
            params.fileName is not None
        ):
            # Validate that the amount of files we are about to generate does not put us higher than the limit
            if (
                self._state_view.files.get_filecount() + 1 > MAXIMUM_FILE_LIMIT
            ):
                raise StorageLimitReachedError(
                    message=f"Attempt to write file {params.fileName} exceeds file creation limit of {MAXIMUM_FILE_LIMIT} files."
                )
        
        # Handle capturing an image with the CameraUtility
        # TODO: CASEY NOTE - CONVERT ALL THE VALUES FROM PERCENTAGES TO FFMPEG VALUES

        parameters = ImageParameters(
            zoom=params.zoom,
            pan=params.pan,
            contrast= 
        )
        camera_data = self._camera_provider.capture_image()
        

        # Begin interfacing with the file provider
        if params.fileName is not None:
            filename = params.fileName
        else:
            # TODO: determine file name generation behavior
            filename = "TEMPORARY"
            

        file_id = await self._file_provider.write_file(
            data=camera_data,
            mime_type=MimeType.IMAGE_JPEG,
            command_metadata=ImageJpegFileNameMetadata.model_construct(
                base_filename=filename,
            ),
        )

        state_update.files_added = update_types.FilesAddedUpdate(
            file_ids=[file_id]
        )

        return SuccessData(
            public=CaptureImageResult(
                fileIds=file_id,
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
