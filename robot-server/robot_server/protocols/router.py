"""Router for /protocols endpoints."""
from datetime import datetime
from fastapi import APIRouter, Depends, File, UploadFile, status
from typing import List
from typing_extensions import Literal

from opentrons.protocol_runner.pre_analysis import PreAnalyzer, NotPreAnalyzableError

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.task_runner import TaskRunner
from robot_server.service.dependencies import get_unique_id, get_current_time
from robot_server.service.json_api import (
    ResponseModel,
    MultiResponseModel,
    EmptyResponseModel,
)

from .dependencies import (
    get_protocol_store,
    get_analysis_store,
    get_protocol_analyzer,
)
from .protocol_models import Protocol
from .protocol_analyzer import ProtocolAnalyzer
from .response_builder import ResponseBuilder
from .analysis_store import AnalysisStore

from .protocol_store import (
    ProtocolStore,
    ProtocolNotFoundError,
    ProtocolFileInvalidError,
)


class ProtocolNotFound(ErrorDetails):
    """An error returned when a given protocol cannot be found."""

    id: Literal["ProtocolNotFound"] = "ProtocolNotFound"
    title: str = "Protocol Not Found"


class ProtocolFileInvalid(ErrorDetails):
    """An error returned when an uploaded protocol file is invalid."""

    id: Literal["ProtocolFileInvalid"] = "ProtocolFileInvalid"
    title: str = "Protocol File Invalid"


protocols_router = APIRouter()


@protocols_router.post(
    path="/protocols",
    summary="Upload a protocol",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[Protocol, None],
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse[ProtocolFileInvalid]},
    },
)
async def create_protocol(
    files: List[UploadFile] = File(...),
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
    pre_analyzer: PreAnalyzer = Depends(PreAnalyzer),
    protocol_analyzer: ProtocolAnalyzer = Depends(get_protocol_analyzer),
    task_runner: TaskRunner = Depends(TaskRunner),
    protocol_id: str = Depends(get_unique_id, use_cache=False),
    analysis_id: str = Depends(get_unique_id, use_cache=False),
    created_at: datetime = Depends(get_current_time),
) -> ResponseModel[Protocol, None]:
    """Create a new protocol by uploading its files.

    Arguments:
        files: List of uploaded files, from form-data.
        response_builder: Interface to construct response models.
        protocol_store: In-memory database of protocol resources.
        analysis_store: In-memory database of protocol analyses.
        pre_analyzer: Protocol pre-analysis interface.
        protocol_analyzer: Protocol analysis interface.
        task_runner: Background task runner.
        protocol_id: Unique identifier to attach to the protocol resource.
        analysis_id: Unique identifier to attach to the analysis resource.
        created_at: Timestamp to attach to the new resource.
    """
    # todo(mm, 2021-09-16):
    #
    # Different units have different competing ideas about how to represent a protocol's
    # files, which is unnecessarily complex.
    #
    # Python offers no standard *in-memory* file abstraction that suits all our needs:
    #
    # * Protocol files have contents
    # * Protocol files have names
    # * Protocol files can be arranged in a hierarchy
    #
    # For simplicity, then, we should not bother trying to keep things in-memory.
    # We should change this so the pre-analyzer, or something before the
    # pre-analyzer, saves all uploaded files to the filesystem. Then, all downstream
    # units can receive a pathlib.Path pointing to the protocol's enclosing directory.
    try:
        pre_analysis = pre_analyzer.analyze(files)
    except NotPreAnalyzableError as e:
        # todo(mm, 2021-09-14):
        # Not every NotPreAnalyzableError will have been constructed with a message,
        # and str(e) will not include the exception type,
        # so this detail string might be uselessly empty.
        #
        # todo(mm, 2021-09-14): Should this be HTTP 422?
        raise ProtocolFileInvalid(detail=str(e)).as_error(status.HTTP_400_BAD_REQUEST)

    # Pre-analysis may have read files.
    # Reset them so that if protocol_store.create() reads them again,
    # it will correctly start from the beginning.
    for file in files:
        await file.seek(0)

    try:
        protocol_resource = await protocol_store.create(
            protocol_id=protocol_id,
            created_at=created_at,
            files=files,
            pre_analysis=pre_analysis,
        )
    except ProtocolFileInvalidError as e:
        raise ProtocolFileInvalid(detail=str(e)).as_error(status.HTTP_400_BAD_REQUEST)

    task_runner.run(
        protocol_analyzer.analyze,
        protocol_resource=protocol_resource,
        analysis_id=analysis_id,
    )
    analyses = analysis_store.add_pending(
        protocol_id=protocol_id,
        analysis_id=analysis_id,
    )
    data = response_builder.build(resource=protocol_resource, analyses=analyses)

    # todo(mm, 2021-09-14): Do we need to close the UploadFiles in our `files` arg?

    return ResponseModel(data=data, links=None)


@protocols_router.get(
    path="/protocols",
    summary="Get uploaded protocols",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Protocol, None],
)
async def get_protocols(
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> MultiResponseModel[Protocol, None]:
    """Get a list of all currently uploaded protocols.

    Arguments:
        response_builder: Interface to construct response models.
        protocol_store: In-memory database of protocol resources.
        analysis_store: In-memory database of protocol analyses.
    """
    protocol_resources = protocol_store.get_all()
    data = [
        response_builder.build(
            resource=r,
            analyses=analysis_store.get_by_protocol(r.protocol_id),
        )
        for r in protocol_resources
    ]

    return MultiResponseModel(data=data, links=None)


@protocols_router.get(
    path="/protocols/{protocolId}",
    summary="Get an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[Protocol, None],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def get_protocol_by_id(
    protocolId: str,
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> ResponseModel[Protocol, None]:
    """Get an uploaded protocol by ID.

    Arguments:
        protocolId: Protocol identifier to fetch, pulled from URL.
        response_builder: Interface to construct response models.
        protocol_store: In-memory database of protocol resources.
        analysis_store: In-memory database of protocol analyses.
    """
    try:
        resource = protocol_store.get(protocol_id=protocolId)
        analyses = analysis_store.get_by_protocol(protocol_id=protocolId)

    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    data = response_builder.build(resource=resource, analyses=analyses)

    return ResponseModel(data=data, links=None)


@protocols_router.delete(
    path="/protocols/{protocolId}",
    summary="Delete an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=EmptyResponseModel[None],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def delete_protocol_by_id(
    protocolId: str,
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> EmptyResponseModel[None]:
    """Delete an uploaded protocol by ID.

    Arguments:
        protocolId: Protocol identifier to delete, pulled from URL.
        protocol_store: In-memory database of protocol resources.
    """
    try:
        protocol_store.remove(protocol_id=protocolId)

    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return EmptyResponseModel(links=None)
