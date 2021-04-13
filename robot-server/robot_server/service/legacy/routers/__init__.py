from fastapi import APIRouter

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
    rpc
)

legacy_routes = APIRouter()

legacy_routes.include_router(router=networking.router, tags=["Networking"])

legacy_routes.include_router(router=control.router, tags=["Control"])

legacy_routes.include_router(router=settings.router, tags=["Settings"])

legacy_routes.include_router(router=deck_calibration.router, tags=["Deck Calibration"])

legacy_routes.include_router(router=modules.router, tags=["Modules"])

legacy_routes.include_router(router=pipettes.router, tags=["Pipettes"])

legacy_routes.include_router(router=motors.router, tags=["Motors"])

legacy_routes.include_router(router=camera.router, tags=["Camera"])

legacy_routes.include_router(router=logs.router, tags=["Logs"])

legacy_routes.include_router(router=rpc.router, tags=["RPC"])

__all__ = ["legacy_routes"]
