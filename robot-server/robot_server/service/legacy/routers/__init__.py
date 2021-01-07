from fastapi import APIRouter, Depends

from . import health, networking, control, settings, deck_calibration, \
    modules, pipettes, motors, camera, logs, rpc
from ...dependencies import verify_hardware, check_version_header

legacy_routes = APIRouter()

legacy_routes.include_router(router=health.router,
                             tags=["Health"],
                             dependencies=[Depends(verify_hardware),
                                           Depends(check_version_header)])
legacy_routes.include_router(router=networking.router,
                             tags=["Networking"],
                             dependencies=[Depends(check_version_header)])
legacy_routes.include_router(router=control.router,
                             tags=["Control"],
                             dependencies=[Depends(verify_hardware),
                                           Depends(check_version_header)])
legacy_routes.include_router(router=settings.router,
                             tags=["Settings"],
                             dependencies=[Depends(verify_hardware),
                                           Depends(check_version_header)])
legacy_routes.include_router(router=deck_calibration.router,
                             tags=["Deck Calibration"],
                             dependencies=[Depends(verify_hardware),
                                           Depends(check_version_header)])
legacy_routes.include_router(router=modules.router,
                             tags=["Modules"],
                             dependencies=[Depends(verify_hardware),
                                           Depends(check_version_header)])
legacy_routes.include_router(router=pipettes.router,
                             tags=["Pipettes"],
                             dependencies=[Depends(verify_hardware),
                                           Depends(check_version_header)])
legacy_routes.include_router(router=motors.router,
                             tags=["Motors"],
                             dependencies=[Depends(verify_hardware),
                                           Depends(check_version_header)])
legacy_routes.include_router(router=camera.router,
                             tags=["Camera"],
                             dependencies=[Depends(check_version_header)])
legacy_routes.include_router(router=logs.router,
                             tags=["Logs"])
legacy_routes.include_router(router=rpc.router,
                             tags=["RPC"],
                             dependencies=[Depends(verify_hardware)])
