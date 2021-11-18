"""Runs router."""
from fastapi import APIRouter

from .base_router import base_router
from .commands_router import commands_router
from .actions_router import actions_router

runs_router = APIRouter()

runs_router.include_router(base_router)
runs_router.include_router(commands_router)
runs_router.include_router(actions_router)

__all__ = ["runs_router"]
