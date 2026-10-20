"""Router for all /system/ endpoints."""

from fastapi import APIRouter

from .authorize.router import authorize_router
from .connected.router import connected_router
from .oem_mode.router import oem_mode_router
from .register.router import register_router
from system_server.logs import logs_router

system_router = APIRouter()

system_router.include_router(router=register_router)

system_router.include_router(router=authorize_router)

system_router.include_router(router=connected_router)

system_router.include_router(router=oem_mode_router)

system_router.include_router(router=logs_router)
