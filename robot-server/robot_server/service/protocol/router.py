import logging

from starlette import status as http_status_codes
from fastapi import APIRouter, UploadFile, File, Depends
from robot_server.service.protocol import models as route_models
from robot_server.service.dependencies import get_protocol_manager

log = logging.getLogger(__name__)


router = APIRouter()


@router.post("/protocols",
             description="Create a protocol",
             response_model_exclude_unset=True,
             response_model=route_models.ProtocolResponse,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol(protocol_file: UploadFile = File(...),
                          protocol_manager=Depends(get_protocol_manager)):
    pass


@router.get("/protocols",
            description="Get all protocols",
            response_model_exclude_unset=True,
            response_model=route_models.MultiProtocolResponse)
async def get_protocols(protocol_manager=Depends(get_protocol_manager)):
    pass


@router.get("/protocols/{protocol_id}",
            description="Get a protocol",
            response_model_exclude_unset=True,
            response_model=route_models.ProtocolResponse)
async def get_protocol(protocol_id,
                       protocol_manager=Depends(get_protocol_manager)):
    pass


@router.delete("/protocols/{protocol_id}",
               description="Delete a protocol",
               response_model_exclude_unset=True,
               response_model=route_models.ProtocolResponse)
async def delete_protocol(protocol_id,
                          protocol_manager=Depends(get_protocol_manager)):
    pass


@router.post("/protocols/{protocol_id}",
             description="Add a file to protocol",
             response_model_exclude_unset=True,
             response_model=route_models.ProtocolResponse,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol_file(protocol_id,
                               file: UploadFile = File(...),
                               protocol_manager=Depends(get_protocol_manager)):
    pass
