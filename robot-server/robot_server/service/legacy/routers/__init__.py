from fastapi import APIRouter, Depends

from robot_server.versioning import verify_version

from . import (
    networking,
    control,
    settings,
    deck_calibration,
    modules,
    pipettes,
    motors,
    camera,
    logs,
    rpc,
)

legacy_routes = APIRouter()

legacy_routes.include_router(
    router=networking.router,
    tags=["Networking"],
    dependencies=[Depends(verify_version)],
)

legacy_routes.include_router(
    router=control.router,
    tags=["Control"],
    dependencies=[Depends(verify_version)],
)

legacy_routes.include_router(
    router=settings.router,
    tags=["Settings"],
    dependencies=[Depends(verify_version)],
)

legacy_routes.include_router(
    router=deck_calibration.router,
    tags=["Deck Calibration"],
    dependencies=[Depends(verify_version)],
)

legacy_routes.include_router(
    router=modules.router,
    tags=["Modules"],
    dependencies=[Depends(verify_version)],
)

legacy_routes.include_router(
    router=pipettes.router,
    tags=["Pipettes"],
    dependencies=[Depends(verify_version)],
)

legacy_routes.include_router(
    router=motors.router,
    tags=["Motors"],
    dependencies=[Depends(verify_version)],
)

legacy_routes.include_router(
    router=camera.router,
    tags=["Camera"],
    dependencies=[Depends(verify_version)],
)

# logs routes are exempt from version header requirements
legacy_routes.include_router(
    router=logs.router,
    tags=["Logs"],
)

# RPC websocket route is exempt from version header requirements
legacy_routes.include_router(
    router=rpc.router,
    tags=["RPC"],
)

__all__ = ["legacy_routes"]
