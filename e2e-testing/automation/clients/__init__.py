"""HTTP clients for non-Playwright E2E tests (auth-server, system-server, etc.)."""

from __future__ import annotations

from .auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    USER_PASSWORD,
    USER_USERNAME,
    AccountType,
    AuthClient,
    TokenResponse,
    UserResponse,
)
from .robot import HealthResponse, RobotClient, RunResponse, RunsResponse
from .system import SystemClient
from .update import UpdateClient

__all__ = [
    "ADMIN_PASSWORD",
    "ADMIN_USERNAME",
    "USER_PASSWORD",
    "USER_USERNAME",
    "AccountType",
    "AuthClient",
    "HealthResponse",
    "RobotClient",
    "RunResponse",
    "RunsResponse",
    "SystemClient",
    "TokenResponse",
    "UpdateClient",
    "UserResponse",
]
