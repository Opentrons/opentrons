import logging

from starlette import status as http_status_codes
from fastapi import APIRouter
from robot_server.service.protocol import models as route_models

log = logging.getLogger(__name__)


router = APIRouter()


@router.post("/protocols",
             description="Create a protocol",
             response_model_exclude_unset=True,
             response_model=route_models.UploadedProtocol,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol():
    pass


@router.get("/protocols",
            description="Get all protocols",
            response_model_exclude_unset=True,
            response_model=route_models.UploadedProtocol)
async def get_protocols():
    pass


@router.get("/protocols/{protocol_id}",
            description="Get a protocol",
            response_model_exclude_unset=True,
            response_model=route_models.UploadedProtocol)
async def get_protocol():
    pass


@router.delete("/protocols/{protocol_id}",
               description="Delete a protocol",
               response_model_exclude_unset=True,
               response_model=route_models.UploadedProtocol)
async def delete_protocol(protocol_id):
    pass


@router.post("/protocols/{protocol_id}",
             description="Add a file to protocol",
             response_model_exclude_unset=True,
             response_model=route_models.UploadedProtocol,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol_file(protocol_id):
    pass


@router.put("/protocols/{protocol_id}",
            description="Update a file in a protocol",
            response_model_exclude_unset=True,
            response_model=route_models.UploadedProtocol)
async def update_protocol(protocol_id):
    pass
