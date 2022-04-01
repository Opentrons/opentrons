"""Magnetic Module protocol commands."""

from .disengage import (
    Disengage,
    DisengageCreate,
    DisengageParams,
    DisengageResult,
    DisengageCommandType,
)
from .engage import (
    Engage,
    EngageCreate,
    EngageParams,
    EngageResult,
    EngageCommandType,
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
