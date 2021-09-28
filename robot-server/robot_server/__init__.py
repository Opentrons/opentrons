"""Opentrons Robot HTTP API Server.

This server provides the main control interface for an Opentrons robot.
"""

from .app_setup import app

__all__ = [
    "app",
]
