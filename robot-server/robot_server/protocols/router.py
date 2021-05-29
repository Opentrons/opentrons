"""Router for /protocols endpoints."""
from datetime import datetime
from fastapi import APIRouter, Depends, File, UploadFile, status
from typing import List
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.dependencies import get_unique_id, get_current_time
from robot_server.service.json_api import (
    ResponseModel,
    MultiResponseModel,
    EmptyResponseModel,
)

from .dependencies import get_protocol_store
from .protocol_models import Protocol
from .protocol_store import ProtocolStore, ProtocolNotFoundError
from .response_builder import ResponseBuilder


class ProtocolNotFound(ErrorDetails):
    """An error returned when a given protocol cannot be found."""

    id: Literal["ProtocolNotFound"] = "ProtocolNotFound"
    title: str = "Protocol Not Found"


protocols_router = APIRouter()


@protocols_router.get(
    path="/protocols",
    summary="Get uploaded protocols",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Protocol],
)
async def get_protocols(
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> MultiResponseModel[Protocol]:
    """Get a list of all currently uploaded protocols."""
    protocol_entries = protocol_store.get_all()
    data = [response_builder.build(e) for e in protocol_entries]

    return MultiResponseModel(data=data)


@protocols_router.post(
    path="/protocols",
    summary="Uploaded protocol",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[Protocol],
)
async def create_protocol(
    files: List[UploadFile] = File(...),
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    protocol_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
) -> ResponseModel[Protocol]:
    """Create a new protocol by uploading its files."""
    if len(files) > 1:
        raise NotImplementedError("Multi-file protocols not yet supported.")
    elif files[0].filename.endswith(".py"):
        raise NotImplementedError("Python protocols not yet supported")

    protocol_entry = await protocol_store.create(
        protocol_id=protocol_id,
        created_at=created_at,
        files=files,
    )
    data = response_builder.build(protocol_entry)

    return ResponseModel(data=data)


@protocols_router.get(
    path="/protocols/{protocol_id}",
    summary="Get an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[Protocol],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def get_protocol_by_id(
    protocol_id: str,
    response_builder: ResponseBuilder = Depends(ResponseBuilder),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> ResponseModel[Protocol]:
    """Get an uploaded protocol by ID."""
    try:
        protocol_entry = protocol_store.get(protocol_id=protocol_id)

    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    data = response_builder.build(protocol_entry)

    return ResponseModel(data=data)


@protocols_router.delete(
    path="/protocols/{protocol_id}",
    summary="Delete an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=EmptyResponseModel,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def delete_protocol_by_id(
    protocol_id: str,
    protocol_store: ProtocolStore = Depends(get_protocol_store),
) -> EmptyResponseModel:
    """Delete an uploaded protocol by ID."""
    try:
        protocol_store.remove(protocol_id=protocol_id)

    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return EmptyResponseModel()
