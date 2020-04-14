from fastapi import APIRouter

from . import health, networking, control, settings, deck_calibration, \
    modules, pipettes, motors, camera, logs, rpc

routes = APIRouter()


routes.include_router(router=health.router, tags=["Health"])
routes.include_router(router=networking.router, tags=["Networking"])
routes.include_router(router=control.router, tags=["Control"])
routes.include_router(router=settings.router, tags=["Settings"])
routes.include_router(router=deck_calibration.router,
                      tags=["Deck Calibration"])
routes.include_router(router=modules.router, tags=["Modules"])
routes.include_router(router=pipettes.router, tags=["Pipettes"])
routes.include_router(router=motors.router, tags=["Motors"])
routes.include_router(router=camera.router, tags=["Camera"])
routes.include_router(router=logs.router, tags=["Logs"])
routes.include_router(router=rpc.router, tags=["RPC"])
