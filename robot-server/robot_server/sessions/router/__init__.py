"""Sessions router."""
from fastapi import APIRouter

from .base_router import base_router
from .commands_router import commands_router
from .actions_router import actions_router

sessions_router = APIRouter()

sessions_router.include_router(base_router)
sessions_router.include_router(commands_router)
sessions_router.include_router(actions_router)

__all__ = ["sessions_router"]
