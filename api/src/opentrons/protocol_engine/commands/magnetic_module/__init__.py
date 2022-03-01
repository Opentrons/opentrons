"""Magnetic Module protocol commands."""

from .engage import (
    Engage,
    EngageCreate,
    EngageParams,
    EngageResult,
    EngageCommandType,
)

__all__ = [
    # magneticModule/engageMagnet
    "Engage",
    "EngageCreate",
    "EngageParams",
    "EngageResult",
    "EngageCommandType",
]
