"""Router for all /system/ endpoints."""
from fastapi import APIRouter
from .register.router import register_router
from .authorize.router import authorize_router
from .connected.router import connected_router

system_router = APIRouter()

system_router.include_router(router=register_router)

system_router.include_router(router=authorize_router)

system_router.include_router(router=connected_router)
