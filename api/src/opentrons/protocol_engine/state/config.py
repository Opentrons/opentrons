"""Top-level ProtocolEngine configuration options."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    """ProtocolEngine configuration options."""

    ignore_pause: bool = False
    use_virtual_modules: bool = False
    block_on_door_open: bool = False
