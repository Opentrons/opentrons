from fastapi import APIRouter, Depends

from robot_server.versioning import check_version_header, set_version_response_headers

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
    dependencies=[Depends(check_version_header)],
)

legacy_routes.include_router(
    router=control.router,
    tags=["Control"],
    dependencies=[Depends(check_version_header)],
)

legacy_routes.include_router(
    router=settings.router,
    tags=["Settings"],
    dependencies=[Depends(check_version_header)],
)

legacy_routes.include_router(
    router=deck_calibration.router,
    tags=["Deck Calibration"],
    dependencies=[Depends(check_version_header)],
)

legacy_routes.include_router(
    router=modules.router,
    tags=["Modules"],
    dependencies=[Depends(check_version_header)],
)

legacy_routes.include_router(
    router=pipettes.router,
    tags=["Pipettes"],
    dependencies=[Depends(check_version_header)],
)

legacy_routes.include_router(
    router=motors.router,
    tags=["Motors"],
    dependencies=[Depends(check_version_header)],
)

legacy_routes.include_router(
    router=camera.router,
    tags=["Camera"],
    dependencies=[Depends(check_version_header)],
)

# logs routes are exempt from version header requirements
legacy_routes.include_router(
    router=logs.router,
    tags=["Logs"],
    dependencies=[Depends(set_version_response_headers)],
)

# RPC websocket route is exempt from version header requirements
legacy_routes.include_router(
    router=rpc.router,
    tags=["RPC"],
)

__all__ = ["legacy_routes"]
