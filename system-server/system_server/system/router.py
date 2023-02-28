"""Router for all /system/ endpoints."""
from fastapi import APIRouter
from system_server.system.register.router import register_router

system_router = APIRouter()

system_router.include_router(router=register_router)
