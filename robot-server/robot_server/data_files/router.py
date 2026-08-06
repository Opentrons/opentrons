"""Router for /dataFiles endpoints."""

from datetime import datetime
from pathlib import Path
from textwrap import dedent
from typing import Annotated, Final, Literal, Optional, Union

from fastapi import Depends, File, Form, Query, Response, UploadFile, status
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from opentrons.protocol_reader import FileHasher, FileReaderWriter
from opentrons_shared_data.data_files import DataFileInfo, DataFileSource, MimeType
from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    MultiBodyMeta,
    PydanticResponse,
    SimpleBody,
    SimpleEmptyBody,
    SimpleMultiBody,
)

from ..protocols.dependencies import (
    get_file_hasher,
    get_file_reader_writer,
    get_protocol_store,
)
from ..service.dependencies import get_current_time, get_unique_id
from .data_files_store import DataFilesStore
from .dependencies import (
    get_data_file_auto_deleter,
    get_data_files_directory,
    get_data_files_store,
)
from .file_auto_deleter import DataFileAutoDeleter
from .models import (
    DataFile,
    DataFileMetadataResponse,
    FileIdNotFound,
    FileIdNotFoundError,
    FileInUseError,
    FileNotFound,
    ImageFileMetadata,
    NoImagesFound,
)
from .zip_utils import (
    build_run_zip_filename,
    collect_existing_run_images,
    create_zip_for_download,
)
from robot_server.errors.error_responses import ErrorBody, ErrorDetails
from robot_server.persistence.fastapi_dependencies import (
    get_persistence_directory_root,
)
from robot_server.protocols.protocol_store import ProtocolStore
from robot_server.runs.dependencies import get_run_data_manager, get_run_store
from robot_server.runs.router.base_router import RunNotFound
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_store import RunStore
from robot_server.service.legacy.routers.camera import DEFAULT_CAMERA_ID
from robot_server.service.notifications.publishers import (
    DataFilePublisher,
    get_data_file_publisher,
)

datafiles_router = LightRouter()

_DEFAULT_IMAGE_METADATA_LIST_LENGTH: Final = 99
_DEFAULT_IMAGE_METADATA_CURSOR: Final = 0


class MultipleDataFileSources(ErrorDetails):
    """An error returned when multiple data file sources are specified in one request."""

    id: Literal["MultipleDataFileSources"] = "MultipleDataFileSources"
    title: str = "Multiple sources found for data files"


class NoDataFileSourceProvided(ErrorDetails):
    """An error returned when no data file sources are specified in the request."""

    id: Literal["NoDataFileSourceProvided"] = "NoDataFileSourceProvided"
    title: str = "No data file source provided"


class UnexpectedFileFormat(ErrorDetails):
    """An error returned when specified file is not in expected format."""

    id: Literal["UnexpectedFileFormat"] = "UnexpectedFileFormat"
    title: str = "Unexpected file format"


class DataFileInUse(ErrorDetails):
    """And error returned when attempting to delete a file that is still in use."""

    id: Literal["DataFileInUse"] = "DataFileInUse"
    title: str = "Data file is in use"


@PydanticResponse.wrap_route(
    datafiles_router.post,
    path="/dataFiles",
    summary="Upload a data file",
    description=dedent("""
        Upload data file(s) to your device.
        """),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[DataFile]},
        status.HTTP_201_CREATED: {"model": SimpleBody[DataFile]},
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorBody[
                Union[
                    MultipleDataFileSources,
                    NoDataFileSourceProvided,
                    UnexpectedFileFormat,
                ]
            ]
        },
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[FileNotFound]},
    },
    dependencies=[
        Depends(require_scopes(Scope.RUN_DATA_WRITE)),
        Depends(get_audit_logger("upload data file")),
    ],
)
async def upload_data_file(
    data_files_directory: Annotated[Path, Depends(get_data_files_directory)],
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    data_file_auto_deleter: Annotated[
        DataFileAutoDeleter, Depends(get_data_file_auto_deleter)
    ],
    file_reader_writer: Annotated[FileReaderWriter, Depends(get_file_reader_writer)],
    file_hasher: Annotated[FileHasher, Depends(get_file_hasher)],
    file_id: Annotated[str, Depends(get_unique_id, use_cache=False)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    file: Annotated[
        Optional[UploadFile], File(description="Data file to upload")
    ] = None,
    file_path: Annotated[
        Optional[str],
        Form(
            description="Absolute path to a file on the robot.",
            alias="filePath",
        ),
    ] = None,
) -> PydanticResponse[SimpleBody[DataFile]]:
    """Save the uploaded data file to persistent storage and update database."""
    if all([file, file_path]):
        raise MultipleDataFileSources(
            detail="Can accept either a file or a file path, not both."
        ).as_error(status.HTTP_422_UNPROCESSABLE_ENTITY)
    if file is None and file_path is None:
        raise NoDataFileSourceProvided(
            detail="You must provide either a file or a file_path in the request."
        ).as_error(status.HTTP_422_UNPROCESSABLE_ENTITY)
    try:
        [buffered_file] = await file_reader_writer.read(files=[file or Path(file_path)])  # type: ignore[arg-type, list-item]
    except FileNotFoundError as e:
        raise FileNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e
    # TODO (spp, 2024-06-18): probably also validate CSV file *contents*
    if not buffered_file.name.endswith(".csv"):
        raise UnexpectedFileFormat(detail="Only CSV file format is accepted.").as_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    file_hash = await file_hasher.hash([buffered_file])
    existing_file_info = data_files_store.get_file_info_by_hash(file_hash)
    if existing_file_info:
        return await PydanticResponse.create(
            content=SimpleBody.model_construct(
                data=DataFile.model_construct(
                    id=existing_file_info.id,
                    name=existing_file_info.name,
                    createdAt=existing_file_info.created_at,
                    source=DataFileSource.UPLOADED,
                )
            ),
            status_code=status.HTTP_200_OK,
        )

    await data_file_auto_deleter.make_room_for_new_file()
    await file_reader_writer.write(
        directory=data_files_directory / file_id, files=[buffered_file]
    )
    file_info = DataFileInfo(
        id=file_id,
        name=buffered_file.name,
        file_hash=file_hash,
        created_at=created_at,
        mime_type=MimeType.TEXT_CSV,
        path=f"{data_files_directory}/{file_id}/{buffered_file.name}",
        generated=False,
        stored=True,
    )
    await data_files_store.insert(file_info)
    return await PydanticResponse.create(
        content=SimpleBody.model_construct(
            data=DataFile.model_construct(
                id=file_info.id,
                name=file_info.name,
                createdAt=created_at,
                source=DataFileSource.UPLOADED,
            )
        ),
        status_code=status.HTTP_201_CREATED,
    )


@PydanticResponse.wrap_route(
    datafiles_router.get,
    path="/dataFiles/{dataFileId}",
    summary="Get information about a data file",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[DataFile]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[FileIdNotFound]},
    },
)
async def get_data_file_info_by_id(
    dataFileId: str,
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
) -> PydanticResponse[SimpleBody[DataFile]]:
    """Get data file info by ID.

    Args:
        dataFileId: Data file identifier to fetch.
        data_files_store: In-memory database of data file resources.
    """
    try:
        resource = data_files_store.get(dataFileId)
    except FileIdNotFoundError as e:
        raise FileIdNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    source = DataFileSource.GENERATED if resource.generated else DataFileSource.UPLOADED

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(
            data=DataFile.model_construct(
                id=resource.id,
                name=resource.name,
                createdAt=resource.created_at,
                source=source,
            )
        ),
        status_code=status.HTTP_200_OK,
    )


@datafiles_router.get(
    path="/dataFiles/{dataFileId}/download",
    summary="Get a data file",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorBody[Union[FileIdNotFound, FileNotFound]]
        },
    },
)
async def get_data_file(
    dataFileId: str,
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    file_reader_writer: Annotated[FileReaderWriter, Depends(get_file_reader_writer)],
) -> Response:
    """Get the requested data file by id."""
    try:
        data_file_info = data_files_store.get(dataFileId)
    except FileIdNotFoundError as e:
        raise FileIdNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    file_path = Path(data_file_info.path)
    if data_file_info.mime_type == MimeType.IMAGE_JPEG:
        if not file_path.exists():
            raise FileNotFound(
                detail=f"Image file '{data_file_info.name}' not found"
            ).as_error(status.HTTP_404_NOT_FOUND)

        return FileResponse(
            path=file_path,
            media_type="image/jpeg",
            filename=data_file_info.name,
        )
    else:
        try:
            [buffered_file] = await file_reader_writer.read(files=[file_path])
        except FileNotFoundError as e:
            raise FileNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

        return Response(
            content=buffered_file.contents.decode("utf-8"),
            media_type="text/plain",
        )


@PydanticResponse.wrap_route(
    datafiles_router.get,
    path="/dataFiles",
    summary="Get a list of all data files stored on the robot server",
    responses={status.HTTP_200_OK: {"model": SimpleMultiBody[str]}},
)
async def get_all_data_files(
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
) -> PydanticResponse[SimpleMultiBody[DataFile]]:
    """Get a list of all data files stored on the robot server.

    Args:
        data_files_store: In-memory database of data file resources.
    """
    data_files = data_files_store.sql_get_all_from_engine()

    meta = MultiBodyMeta(cursor=0, totalLength=len(data_files))

    return await PydanticResponse.create(
        content=SimpleMultiBody.model_construct(
            data=[
                DataFile.model_construct(
                    id=data_file_info.id,
                    name=data_file_info.name,
                    createdAt=data_file_info.created_at,
                    source=(
                        DataFileSource.GENERATED
                        if data_file_info.generated
                        else DataFileSource.UPLOADED
                    ),
                )
                for data_file_info in data_files
            ],
            meta=meta,
        ),
    )


@PydanticResponse.wrap_route(
    datafiles_router.delete,
    path="/dataFiles/{dataFileId}",
    summary="Delete a data file from persistent storage",
    responses={
        status.HTTP_200_OK: {"model": SimpleEmptyBody},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[FileIdNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[DataFileInUse]},
    },
    dependencies=[
        Depends(require_scopes(Scope.RUN_DATA_WRITE)),
        Depends(get_audit_logger("delete data file")),
    ],
)
async def delete_file_by_id(
    dataFileId: str,
    data_files_store: DataFilesStore = Depends(get_data_files_store),
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete an uploaded or generated data file by ID.

    Arguments:
        dataFileId: ID of the data file to delete, pulled from URL.
        data_files_store: Store for data files database access.
    """
    try:
        data_files_store.remove_stored(file_id=dataFileId)
    except FileIdNotFoundError as e:
        raise FileIdNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e
    except FileInUseError as e:
        raise DataFileInUse(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e

    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    datafiles_router.get,
    path="/dataFiles/{runId}/all",
    summary="Get metadata for all data files associated with a run",
    description="""
        Get metadata for all data files associated with a specific run.

        Metadata includes the related command id when applicable.
    """,
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[DataFileMetadataResponse]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def get_data_files_by_run_id(
    runId: str,
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
) -> PydanticResponse[SimpleMultiBody[DataFileMetadataResponse]]:
    """Get all data files associated with a run.

    Args:
        runId: The unique identifier of the run to query for data files.
        data_files_store: Store for accessing data file information from the database.
        run_data_manager: Current and historical run data management.
    """
    try:
        run_data_manager.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    data_files_info = data_files_store.get_data_files_by_run_id(runId)
    response_data = []

    for file_info in data_files_info.input_files:
        response_data.append(
            DataFileMetadataResponse(
                id=file_info.id,
                filename=file_info.name,
                stored=file_info.stored,
                generated=file_info.generated,
                mimeType=file_info.mime_type,
            )
        )

    for file_info in data_files_info.output_files:
        response_data.append(
            DataFileMetadataResponse(
                id=file_info.id,
                filename=file_info.name,
                stored=file_info.stored,
                generated=file_info.generated,
                mimeType=file_info.mime_type,
            )
        )

    return await PydanticResponse.create(
        content=SimpleMultiBody.model_construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=len(response_data)),
        ),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    datafiles_router.get,
    path="/dataFiles/{runId}/images",
    summary="Get a list of image-specific metadata for all camera image files associated with a given run.",
    description=dedent("""
        Get a list of image-specific metadata for camera image files associated with a given run.
        "\n\n"
        The camera image file metadata are returned in order from newest to oldest.
        "\n\n"
        If the run contains no camera image file metadata or the run does not exist, an empty
        list is returned.
        "\n\n"
        This endpoint returns camera image file metadata. Use `GET /runs/{runId}/images/{fileName}`
         to get a specific camera image file.
        """),
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[ImageFileMetadata]},
    },
)
async def get_run_image_metadata(
    runId: str,
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    pageLength: Annotated[
        int,
        Query(
            description="The maximum number of camera image file metadata in the list to return.",
        ),
    ] = _DEFAULT_IMAGE_METADATA_LIST_LENGTH,
    cursor: Annotated[
        Optional[int],
        Query(
            description=(
                "The starting index of the desired first image metadata in the list."
                " If unspecified, starts from the most recent camera image file metadata."
            ),
        ),
    ] = _DEFAULT_IMAGE_METADATA_CURSOR,
) -> PydanticResponse[SimpleMultiBody[ImageFileMetadata]]:
    """Get paginated metadata for camera-captured images associated with a run.

    Returns metadata for image files captured during a protocol run, ordered from
    newest to oldest. Supports pagination through cursor-based navigation.

    Args:
        runId: The unique identifier of the run to query for images.
        data_files_store: Store for accessing data file information from the database.
        pageLength: Maximum number of image metadata entries to return (default: 99).
        cursor: Starting index for pagination; 0-based offset into the result set.
                Defaults to 0 (most recent images first).
    """
    offset = max(0, cursor) if cursor else 0

    info_slice = data_files_store.get_files_info_by_run_mime_type(
        run_id=runId, mime_type=MimeType.IMAGE_JPEG, limit=pageLength, offset=offset
    )

    data = [
        ImageFileMetadata.model_construct(
            id=file.id,
            filename=file.name,
            cameraId=DEFAULT_CAMERA_ID,
            commandId=file.command_info.command_id,
            prevCommandId=file.command_info.prev_command_id,
            createdAt=file.created_at,
        )
        for file in info_slice.file_info
    ]

    effective_cursor = cursor if cursor is not None else 0
    effective_cursor = min(effective_cursor, max(0, info_slice.total_length))

    meta = MultiBodyMeta(totalLength=info_slice.total_length, cursor=effective_cursor)

    return await PydanticResponse.create(
        content=SimpleMultiBody.model_construct(data=data, meta=meta),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    datafiles_router.delete,
    path="/dataFiles/{runId}/images",
    summary="Delete all camera images for a run",
    description=dedent("""
        Delete all camera image files associated with a run from both the database
        and filesystem storage.

        This operation cannot be undone.
        """),
    responses={
        status.HTTP_200_OK: {"model": SimpleEmptyBody},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
    dependencies=[
        Depends(require_scopes(Scope.RUN_DATA_WRITE)),
        Depends(get_audit_logger("delete images for run")),
    ],
)
async def delete_run_images(
    runId: str,
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    data_file_publisher: Annotated[DataFilePublisher, Depends(get_data_file_publisher)],
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete all camera images for a run.

    Arguments:
        runId: The run ID whose images should be deleted.
        data_files_store: Store for data files database access.
        run_data_manager: Current and historical run data management.
        data_file_publisher: The data file MQTT event publisher.
    """
    try:
        run_data_manager.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    data_files_store.remove_all_by_run_id(runId)
    data_file_publisher.publish_run_images(runId)

    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=status.HTTP_200_OK,
    )


@datafiles_router.get(
    path="/dataFiles/{runId}/images/download",
    summary="Download all camera images for a run as a zip file",
    description=dedent("""
        Download all camera image files associated with a run as a single zip archive.

        The zip file will contain all JPEG images captured during the protocol run.
        """),
    responses={
        status.HTTP_200_OK: {
            "content": {"application/zip": {}},
            "description": "A zip file containing all camera images for the run",
        },
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[NoImagesFound]},
    },
)
async def download_run_images(
    runId: str,
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    run_store: Annotated[RunStore, Depends(get_run_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
    persistence_directory_root: Annotated[
        Path, Depends(get_persistence_directory_root)
    ],
) -> FileResponse:
    """Download all camera images for a run as a zip file.

    Arguments:
        runId: The run ID associated with the camera image files.
        data_files_store: Store for data files database access.
        run_store: Store for run data management.
        protocol_store: Store for protocol storage access.
        persistence_directory_root: Persistence directory used for zip staging.
    """
    existing_files = collect_existing_run_images(runId, data_files_store)

    if not existing_files:
        raise NoImagesFound(
            detail=f"No accessible images found for run '{runId}'"
        ).as_error(status.HTTP_404_NOT_FOUND)

    run = run_store.get(runId)
    zip_filename = build_run_zip_filename(
        run=run,
        protocol_store=protocol_store,
        fallback_filename=f"{runId}_images.zip",
    )
    zip_path, cleanup = await create_zip_for_download(
        existing_files, persistence_directory_root
    )

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=zip_filename,
        background=BackgroundTask(cleanup),
    )
