"""Router for /protocols endpoints."""
from fastapi import APIRouter, Depends, File, UploadFile, status
from typing import List
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.json_api import ResponseModel, MultiResponseModel

from .models import ProtocolResource
from .store import ProtocolStore, ProtocolStoreKeyError


class ProtocolNotFound(ErrorDetails):
    """An error returned when a given protocol cannot be found."""

    id: Literal["ProtocolNotFound"] = "ProtocolNotFound"
    title: str = "Protocol Not Found"


protocols_router = APIRouter()


@protocols_router.get(
    path="/protocols",
    summary="Get uploaded protocols",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[ProtocolResource],
)
async def get_protocols(
    protocol_store: ProtocolStore = Depends(ProtocolStore),
) -> MultiResponseModel[ProtocolResource]:
    """Get a list of all currently uploaded protocols."""
    return MultiResponseModel(data=protocol_store.get_all_protocols())


@protocols_router.post(
    path="/protocols",
    summary="Uploaded protocol",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[ProtocolResource],
)
async def create_protocol(
    files: List[UploadFile] = File(...),
    protocol_store: ProtocolStore = Depends(ProtocolStore),
) -> ResponseModel[ProtocolResource]:
    """Create a new protocol by uploading its files."""
    data = protocol_store.add_protocol(files=files)
    return ResponseModel(data=data)


@protocols_router.get(
    path="/protocols/{protocol_id}",
    summary="Get an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[ProtocolResource],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def get_protocol_by_id(
    protocol_id: str,
    protocol_store: ProtocolStore = Depends(ProtocolStore),
) -> ResponseModel[ProtocolResource]:
    """Get an uploaded protocol by ID."""
    try:
        data = protocol_store.get_protocol(id=protocol_id)

    except ProtocolStoreKeyError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=data)


@protocols_router.delete(
    path="/protocols/{protocol_id}",
    summary="Delete an uploaded protocol",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[ProtocolResource],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
    },
)
async def delete_protocol_by_id(
    protocol_id: str,
    protocol_store: ProtocolStore = Depends(ProtocolStore),
) -> ResponseModel[ProtocolResource]:
    """Delete an uploaded protocol by ID."""
    try:
        data = protocol_store.remove_protocol(id=protocol_id)

    except ProtocolStoreKeyError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=data)
