"""Magnetic Module protocol commands."""

from .engage import (
    Engage,
    EngageCreate,
    EngageParams,
    EngageResult,
    EngageCommandType,
)

from .disengage import (
    Disengage,
    DisengageCreate,
    DisengageParams,
    DisengageResult,
    DisengageCommandType,
)

__all__ = [
    # magneticModule/engageMagnet
    "Engage",
    "EngageCreate",
    "EngageParams",
    "EngageResult",
    "EngageCommandType",
    # magneticModule/disengageMagnet
    "Disengage",
    "DisengageCreate",
    "DisengageParams",
    "DisengageResult",
    "DisengageCommandType",
]
