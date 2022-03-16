"""Configurations for the Engine."""
from dataclasses import dataclass


@dataclass(frozen=True)
class EngineConfigs:
    """Configurations for Protocol Engine."""

    ignore_pause: bool = False
    use_virtual_modules: bool = False
