"""Magnetic Module protocol commands."""

from .disengage import (
    Disengage,
    DisengageCommandType,
    DisengageCreate,
    DisengageParams,
    DisengageResult,
)
from .engage import (
    Engage,
    EngageCommandType,
    EngageCreate,
    EngageParams,
    EngageResult,
)

__all__ = [
    # magneticModule/disengageMagnet
    "Disengage",
    "DisengageCreate",
    "DisengageParams",
    "DisengageResult",
    "DisengageCommandType",
    # magneticModule/engageMagnet
    "Engage",
    "EngageCreate",
    "EngageParams",
    "EngageResult",
    "EngageCommandType",
]
