"""Application routes."""
from fastapi import APIRouter, Depends, status

from .constants import V1_TAG
from .errors import LegacyErrorResponse
from .health import health_router
from .protocols import protocols_router
from .runs import runs_router
from .maintenance_runs.router import maintenance_runs_router
from .commands import commands_router
from .modules import modules_router
from .instruments import instruments_router
from .system import system_router
from .versioning import check_version_header
from .service.legacy.routers import legacy_routes
from .service.session.router import router as deprecated_session_router
from .service.pipette_offset.router import router as pip_os_router
from .service.labware.router import router as labware_router
from .service.tip_length.router import router as tl_router
from .service.notifications.router import router as notifications_router
from .subsystems.router import subsystems_router
from .robot.router import robot_router

router = APIRouter()

# Legacy routes
router.include_router(
    router=legacy_routes,
    tags=[V1_TAG],
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": LegacyErrorResponse,
        }
    },
)

router.include_router(
    router=health_router,
    tags=["Health", V1_TAG],
    dependencies=[Depends(check_version_header)],
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": LegacyErrorResponse,
        }
    },
)

router.include_router(
    router=runs_router,
    tags=["Run Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=maintenance_runs_router,
    tags=["Maintenance Run Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=protocols_router,
    tags=["Protocol Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=commands_router,
    tags=["Simple Commands"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=modules_router,
    tags=["Attached Modules"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=instruments_router,
    tags=["Attached instruments"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=deprecated_session_router,
    tags=["Session Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=labware_router,
    tags=["Labware Calibration Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=pip_os_router,
    tags=["Pipette Offset Calibration Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=tl_router,
    tags=["Tip Length Calibration Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=notifications_router,
    tags=["Notification Server Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=system_router,
    tags=["System Control"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=subsystems_router,
    tags=["Subsystem Management"],
    dependencies=[Depends(check_version_header)],
)

router.include_router(
    router=robot_router, tags=["Robot"], dependencies=[Depends(check_version_header)]
)
