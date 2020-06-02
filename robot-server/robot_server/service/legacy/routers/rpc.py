from fastapi import Depends, APIRouter
from starlette.websockets import WebSocket

from robot_server.service.dependencies import get_rpc_server
from robot_server.service.legacy.rpc import RPCServer


router = APIRouter()


@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket,
                             rpc_server: RPCServer = Depends(get_rpc_server)):
    await websocket.accept()
    await rpc_server.handle_new_connection(websocket)
