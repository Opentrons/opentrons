"""Router for /protocols endpoints."""
from datetime import datetime
from fastapi import APIRouter, Depends, File, UploadFile, status
from typing import List
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.task_runner import TaskRunner
from robot_server.service.dependencies import get_unique_id, get_current_time
from robot_server.service.json_api import (
    ResponseModel,
    MultiResponseModel,
    EmptyResponseModel,
)

from .dependencies import get_protocol_store, get_analysis_store, get_protocol_analyzer
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
    response_model=ResponseModel[Protocol],
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse[ProtocolFileInvalid]},
    },
)
async def create_protocol(
    files: List[UploadFile] = File(...),
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
    protocol_analyzer: ProtocolAnalyzer = Depends(get_protocol_analyzer),
    task_runner: TaskRunner = Depends(TaskRunner),
    protocol_id: str = Depends(get_unique_id, use_cache=False),
    analysis_id: str = Depends(get_unique_id, use_cache=False),
    created_at: datetime = Depends(get_current_time),
) -> ResponseModel[Protocol]:
    """Create a new protocol by uploading its files.

    Arguments:
        files: List of uploaded files, from form-data.
        response_builder: Interface to construct response models.
        protocol_store: In-memory database of protocol resources.
        analysis_store: In-memory database of protocol analyses.
        protocol_analyzer: Protocol analysis interface.
        task_runner: Background task runner.
        protocol_id: Unique identifier to attach to the protocol resource.
        analysis_id: Unique identifier to attach to the analysis resource.
        created_at: Timestamp to attach to the new resource.
    """
    if len(files) > 1:
        raise NotImplementedError("Multi-file protocols not yet supported.")

    try:
        protocol_resource = await protocol_store.create(
            protocol_id=protocol_id,
            created_at=created_at,
            files=files,
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

    return ResponseModel(data=data)


@protocols_router.get(
    path="/protocols",
    summary="Get uploaded protocols",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Protocol],
)
async def get_protocols(
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> MultiResponseModel[Protocol]:
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

    return MultiResponseModel(data=data)


@protocols_router.get(
    path="/protocols/{protocolId}",
    summary="Get an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[Protocol],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def get_protocol_by_id(
    protocolId: str,
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    analysis_store: AnalysisStore = Depends(get_analysis_store),
) -> ResponseModel[Protocol]:
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

    return ResponseModel(data=data)


@protocols_router.delete(
    path="/protocols/{protocolId}",
    summary="Delete an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=EmptyResponseModel,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def delete_protocol_by_id(
    protocolId: str,
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> EmptyResponseModel:
    """Delete an uploaded protocol by ID.

    Arguments:
        protocolId: Protocol identifier to delete, pulled from URL.
        protocol_store: In-memory database of protocol resources.
    """
    try:
        protocol_store.remove(protocol_id=protocolId)

    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return EmptyResponseModel()
