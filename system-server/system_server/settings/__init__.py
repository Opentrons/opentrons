"""system_server.settings: Provides an interface to get server settings."""

from .settings import (
    SystemServerSettings,
    get_settings,
)

__all__ = ["get_settings", "SystemServerSettings"]
