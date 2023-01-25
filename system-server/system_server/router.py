"""Application routes."""
from fastapi import APIRouter, Depends
from robot_server.versioning import check_version_header  # type: ignore[import]
from .system import system_router

router = APIRouter()

router.include_router(
    router=system_router,
    tags=["System Control"],
    dependencies=[Depends(check_version_header)],
)
