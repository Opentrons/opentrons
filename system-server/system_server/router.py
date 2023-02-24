"""Application routes."""
from fastapi import APIRouter
from system_server.system.router import system_router

router = APIRouter()

router.include_router(
    router=system_router,
    tags=["System"],
)
