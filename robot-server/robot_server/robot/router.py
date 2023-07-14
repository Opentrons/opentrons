"""Router for /robot endpoints."""
from fastapi import APIRouter

from .control.router import control_router

robot_router = APIRouter()

robot_router.include_router(router=control_router)
