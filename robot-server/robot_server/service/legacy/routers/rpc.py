from fastapi import APIRouter, Depends, WebSocket

from robot_server.service.legacy.rpc import RPCServer, get_rpc_server

router = APIRouter()


@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    rpc_server: RPCServer = Depends(get_rpc_server),
):
    await websocket.accept()
    await rpc_server.handle_new_connection(websocket)
